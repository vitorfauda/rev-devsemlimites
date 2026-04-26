import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle2, Circle, PlayCircle, Lock } from 'lucide-react';
import {
  supabase,
  COURSE_VIDEOS_BUCKET,
  type Course,
  type CourseLesson,
  type CourseModule,
} from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Badge, Card, Section, Button } from '@/components/ui';
import { LoaderRing } from '@/components/LoaderRing';
import { toast } from 'sonner';

type ModuleWithLessons = CourseModule & { lessons: CourseLesson[] };

export default function CursoView() {
  const { slug } = useParams<{ slug: string }>();
  const { reseller } = useAuth();

  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<ModuleWithLessons[]>([]);
  const [progress, setProgress] = useState<Record<string, { completed_at: string | null; last_position_seconds: number }>>({});
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const positionSaveTimer = useRef<number | null>(null);

  // Carrega curso + módulos + aulas + progresso
  useEffect(() => {
    if (!slug) return;
    let active = true;

    (async () => {
      setLoading(true);

      const { data: c } = await supabase.from('courses').select('*').eq('slug', slug).maybeSingle();
      if (!c || !active) {
        setCourse(null);
        setLoading(false);
        return;
      }
      setCourse(c as Course);

      const { data: mods } = await supabase
        .from('course_modules')
        .select('*')
        .eq('course_id', c.id)
        .order('sort_order', { ascending: true });

      const moduleIds = (mods || []).map((m) => m.id);

      const { data: lessons } = moduleIds.length
        ? await supabase
            .from('course_lessons')
            .select('*')
            .in('module_id', moduleIds)
            .order('sort_order', { ascending: true })
        : { data: [] as CourseLesson[] };

      const lessonsByMod: Record<string, CourseLesson[]> = {};
      (lessons || []).forEach((l) => {
        (lessonsByMod[l.module_id] ||= []).push(l as CourseLesson);
      });

      const enriched: ModuleWithLessons[] = (mods || []).map((m) => ({
        ...(m as CourseModule),
        lessons: lessonsByMod[m.id] || [],
      }));

      if (!active) return;
      setModules(enriched);

      // Primeira aula = ativa
      const firstLesson = enriched.flatMap((m) => m.lessons)[0];
      setActiveLessonId(firstLesson?.id ?? null);

      // Progresso
      if (reseller && lessons && lessons.length > 0) {
        const { data: prog } = await supabase
          .from('course_progress')
          .select('lesson_id, completed_at, last_position_seconds')
          .eq('reseller_id', reseller.id)
          .in('lesson_id', lessons.map((l) => l.id));

        const map: typeof progress = {};
        (prog || []).forEach((p: { lesson_id: string; completed_at: string | null; last_position_seconds: number }) => {
          map[p.lesson_id] = {
            completed_at: p.completed_at,
            last_position_seconds: p.last_position_seconds || 0,
          };
        });
        if (active) setProgress(map);
      }

      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [slug, reseller]);

  const allLessons = useMemo(() => modules.flatMap((m) => m.lessons), [modules]);
  const activeLesson = allLessons.find((l) => l.id === activeLessonId) || null;
  const totalLessons = allLessons.length;
  const completedLessons = Object.values(progress).filter((p) => !!p.completed_at).length;

  // Resolve signed URL quando troca de aula
  useEffect(() => {
    if (!activeLesson?.video_path) {
      setSignedUrl(null);
      return;
    }
    let cancel = false;
    setVideoLoading(true);
    (async () => {
      const { data, error } = await supabase.storage
        .from(COURSE_VIDEOS_BUCKET)
        .createSignedUrl(activeLesson.video_path!, 60 * 60); // 1h
      if (cancel) return;
      if (error || !data?.signedUrl) {
        setSignedUrl(null);
        toast.error('Não consegui carregar o vídeo');
      } else {
        setSignedUrl(data.signedUrl);
      }
      setVideoLoading(false);
    })();
    return () => {
      cancel = true;
    };
  }, [activeLesson?.id, activeLesson?.video_path]);

  // Restaura última posição quando o vídeo carrega
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !activeLesson) return;
    const last = progress[activeLesson.id]?.last_position_seconds || 0;
    const onLoaded = () => {
      if (last > 5 && last < (v.duration || Infinity) - 5) {
        v.currentTime = last;
      }
    };
    v.addEventListener('loadedmetadata', onLoaded);
    return () => v.removeEventListener('loadedmetadata', onLoaded);
  }, [signedUrl, activeLesson?.id]);

  const saveProgress = async (lessonId: string, payload: { completed_at?: string | null; last_position_seconds?: number }) => {
    if (!reseller) return;
    const merged = {
      reseller_id: reseller.id,
      lesson_id: lessonId,
      completed_at: payload.completed_at !== undefined ? payload.completed_at : progress[lessonId]?.completed_at ?? null,
      last_position_seconds: Math.floor(
        payload.last_position_seconds !== undefined ? payload.last_position_seconds : progress[lessonId]?.last_position_seconds || 0,
      ),
    };
    const { error } = await supabase.from('course_progress').upsert(merged, { onConflict: 'reseller_id,lesson_id' });
    if (!error) {
      setProgress((p) => ({
        ...p,
        [lessonId]: { completed_at: merged.completed_at, last_position_seconds: merged.last_position_seconds },
      }));
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current || !activeLesson) return;
    const t = videoRef.current.currentTime;
    if (positionSaveTimer.current) window.clearTimeout(positionSaveTimer.current);
    positionSaveTimer.current = window.setTimeout(() => {
      saveProgress(activeLesson.id, { last_position_seconds: t });
    }, 1500);
  };

  const handleEnded = () => {
    if (!activeLesson) return;
    saveProgress(activeLesson.id, { completed_at: new Date().toISOString() });
    toast.success('Aula concluída');
  };

  const toggleComplete = () => {
    if (!activeLesson) return;
    const isDone = !!progress[activeLesson.id]?.completed_at;
    saveProgress(activeLesson.id, { completed_at: isDone ? null : new Date().toISOString() });
  };

  if (loading) {
    return (
      <Section>
        <div className="flex items-center justify-center py-20">
          <LoaderRing />
        </div>
      </Section>
    );
  }

  if (!course) {
    return <Navigate to="/cursos" replace />;
  }

  return (
    <Section className="max-w-[1400px]">
      <Link to="/cursos" className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] mb-4">
        <ChevronLeft size={14} /> Cursos
      </Link>

      <div className="grid lg:grid-cols-[1fr_360px] gap-5">
        {/* Player + descrição */}
        <div>
          <Card className="overflow-hidden">
            <div className="aspect-video bg-black relative">
              {videoLoading ? (
                <div className="absolute inset-0 grid place-items-center">
                  <LoaderRing />
                </div>
              ) : signedUrl ? (
                <video
                  key={signedUrl}
                  ref={videoRef}
                  src={signedUrl}
                  controls
                  controlsList="nodownload"
                  className="w-full h-full"
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={handleEnded}
                  playsInline
                />
              ) : (
                <div className="absolute inset-0 grid place-items-center text-[var(--color-text-dim)] text-xs">
                  {activeLesson ? 'Vídeo ainda não foi enviado pra esta aula' : 'Selecione uma aula'}
                </div>
              )}
            </div>
          </Card>

          <div className="mt-5">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <div className="text-[11px] uppercase tracking-widest text-[var(--color-text-dim)] mb-1">{course.title}</div>
                <h1 className="text-xl font-semibold tracking-tight">{activeLesson?.title || '—'}</h1>
              </div>
              {activeLesson && (
                <Button onClick={toggleComplete} variant="secondary" size="sm">
                  {progress[activeLesson.id]?.completed_at ? (
                    <>
                      <CheckCircle2 size={13} className="text-emerald-400" /> Concluída
                    </>
                  ) : (
                    <>
                      <Circle size={13} /> Marcar como concluída
                    </>
                  )}
                </Button>
              )}
            </div>
            {activeLesson?.description && (
              <p className="text-sm text-[var(--color-text-muted)] whitespace-pre-line leading-relaxed mt-3">
                {activeLesson.description}
              </p>
            )}
          </div>
        </div>

        {/* Sidebar de módulos */}
        <Card className="p-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] overflow-y-auto">
          <div className="mb-4">
            <div className="text-sm font-medium mb-1">Conteúdo do curso</div>
            <div className="text-[11px] text-[var(--color-text-dim)]">
              {completedLessons} de {totalLessons} aulas concluídas
            </div>
            <div className="mt-2 h-1 rounded-full bg-[var(--color-surface-2)] overflow-hidden">
              <div
                className="h-full bg-[var(--color-primary)]"
                style={{ width: `${totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0}%` }}
              />
            </div>
          </div>

          <div className="space-y-4">
            {modules.length === 0 && (
              <div className="text-xs text-[var(--color-text-dim)] text-center py-6">
                Nenhum módulo cadastrado ainda
              </div>
            )}
            {modules.map((m, mi) => (
              <div key={m.id}>
                <div className="text-[11px] uppercase tracking-widest text-[var(--color-text-dim)] mb-1.5">
                  Módulo {mi + 1} · {m.title}
                </div>
                <div className="space-y-0.5">
                  {m.lessons.length === 0 && (
                    <div className="text-[11px] text-[var(--color-text-dim)] px-2 py-1.5">Sem aulas</div>
                  )}
                  {m.lessons.map((l, li) => {
                    const done = !!progress[l.id]?.completed_at;
                    const isActive = l.id === activeLessonId;
                    return (
                      <button
                        key={l.id}
                        onClick={() => setActiveLessonId(l.id)}
                        className={
                          'w-full text-left flex items-start gap-2 px-2 py-2 rounded-md text-sm transition-colors ' +
                          (isActive
                            ? 'bg-[var(--color-surface-2)] text-[var(--color-text)]'
                            : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]/50 hover:text-[var(--color-text)]')
                        }
                      >
                        <div className="mt-0.5 shrink-0">
                          {done ? (
                            <CheckCircle2 size={14} className="text-emerald-400" />
                          ) : isActive ? (
                            <PlayCircle size={14} className="text-[var(--color-primary)]" />
                          ) : !l.video_path ? (
                            <Lock size={14} className="text-[var(--color-text-dim)]" />
                          ) : (
                            <Circle size={14} />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-medium leading-tight line-clamp-2">
                            {li + 1}. {l.title}
                          </div>
                          {l.duration_seconds > 0 && (
                            <div className="text-[10px] text-[var(--color-text-dim)] mt-0.5">
                              {formatDuration(l.duration_seconds)}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {!course.published && (
            <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
              <Badge tone="warning">Curso em rascunho</Badge>
            </div>
          )}
        </Card>
      </div>
    </Section>
  );
}

function formatDuration(seconds: number): string {
  if (!seconds) return '';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
