import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Navigate, Link } from 'react-router-dom';
import {
  Plus, Trash2, GripVertical, Save, Upload, FilmIcon, ChevronDown, ChevronRight,
  Eye, EyeOff, Image as ImageIcon, ExternalLink, Loader2, ChevronLeft,
} from 'lucide-react';
import {
  supabase,
  COURSE_VIDEOS_BUCKET,
  COURSE_THUMBS_BUCKET,
  type Course,
  type CourseLesson,
  type CourseModule,
} from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Badge, Button, Card, Field, PageHeader, Section, inputClass } from '@/components/ui';
import { LoaderRing } from '@/components/LoaderRing';
import { toast } from 'sonner';

type ModuleWithLessons = CourseModule & { lessons: CourseLesson[] };

export default function AdminCursos() {
  const { isAdmin, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [activeModules, setActiveModules] = useState<ModuleWithLessons[]>([]);
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  const reload = async (selectId?: string | null) => {
    setLoading(true);
    const { data: cs } = await supabase
      .from('courses')
      .select('*')
      .order('sort_order', { ascending: true });
    const list = (cs || []) as Course[];
    setCourses(list);
    const next = selectId ?? activeCourseId ?? list[0]?.id ?? null;
    setActiveCourseId(next);
    if (next) await loadCourseDetail(next);
    setLoading(false);
  };

  const loadCourseDetail = async (courseId: string) => {
    const { data: mods } = await supabase
      .from('course_modules')
      .select('*')
      .eq('course_id', courseId)
      .order('sort_order', { ascending: true });

    const moduleIds = (mods || []).map((m) => m.id);
    const { data: lessons } = moduleIds.length
      ? await supabase
          .from('course_lessons')
          .select('*')
          .in('module_id', moduleIds)
          .order('sort_order', { ascending: true })
      : { data: [] as CourseLesson[] };

    const byMod: Record<string, CourseLesson[]> = {};
    (lessons || []).forEach((l) => ((byMod[l.module_id] ||= []).push(l as CourseLesson)));
    const enriched: ModuleWithLessons[] = (mods || []).map((m) => ({
      ...(m as CourseModule),
      lessons: byMod[m.id] || [],
    }));
    setActiveModules(enriched);
  };

  useEffect(() => {
    if (isAdmin) reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  if (authLoading) {
    return (
      <Section>
        <div className="flex items-center justify-center py-20">
          <LoaderRing />
        </div>
      </Section>
    );
  }

  if (!isAdmin) return <Navigate to="/cursos" replace />;

  const activeCourse = courses.find((c) => c.id === activeCourseId) || null;

  // ==== Curso ====
  const createCourse = async () => {
    setSaving(true);
    const baseSlug = `curso-${Date.now().toString(36)}`;
    const { data, error } = await supabase
      .from('courses')
      .insert({
        slug: baseSlug,
        title: 'Novo curso',
        description: '',
        sort_order: courses.length,
        published: false,
      })
      .select('*')
      .maybeSingle();
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Curso criado');
    await reload(data?.id || null);
  };

  const updateCourse = async (patch: Partial<Course>): Promise<void> => {
    if (!activeCourse) return;
    const { error } = await supabase.from('courses').update(patch).eq('id', activeCourse.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setCourses((cs) => cs.map((c) => (c.id === activeCourse.id ? { ...c, ...patch } : c)));
  };

  const deleteCourse = async (): Promise<void> => {
    if (!activeCourse) return;
    if (!confirm(`Excluir o curso "${activeCourse.title}" e tudo dentro? Essa ação não pode ser desfeita.`)) return;
    const { error } = await supabase.from('courses').delete().eq('id', activeCourse.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Curso excluído');
    await reload(null);
  };

  // ==== Módulo ====
  const createModule = async (): Promise<void> => {
    if (!activeCourse) return;
    const { error } = await supabase.from('course_modules').insert({
      course_id: activeCourse.id,
      title: 'Novo módulo',
      sort_order: activeModules.length,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    await loadCourseDetail(activeCourse.id);
  };

  const updateModule = async (id: string, patch: Partial<CourseModule>): Promise<void> => {
    const { error } = await supabase.from('course_modules').update(patch).eq('id', id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setActiveModules((ms) => ms.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  };

  const deleteModule = async (id: string): Promise<void> => {
    if (!confirm('Excluir o módulo e suas aulas?')) return;
    const { error } = await supabase.from('course_modules').delete().eq('id', id);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (activeCourse) await loadCourseDetail(activeCourse.id);
  };

  // ==== Aula ====
  const createLesson = async (moduleId: string): Promise<void> => {
    const mod = activeModules.find((m) => m.id === moduleId);
    if (!mod) return;
    const { error } = await supabase.from('course_lessons').insert({
      module_id: moduleId,
      title: 'Nova aula',
      sort_order: mod.lessons.length,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    if (activeCourse) await loadCourseDetail(activeCourse.id);
    setOpenModules((o) => ({ ...o, [moduleId]: true }));
  };

  const updateLesson = async (id: string, patch: Partial<CourseLesson>): Promise<void> => {
    const { error } = await supabase.from('course_lessons').update(patch).eq('id', id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setActiveModules((ms) =>
      ms.map((m) => ({ ...m, lessons: m.lessons.map((l) => (l.id === id ? { ...l, ...patch } : l)) })),
    );
  };

  const deleteLesson = async (id: string): Promise<void> => {
    if (!confirm('Excluir a aula?')) return;
    const { error } = await supabase.from('course_lessons').delete().eq('id', id);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (activeCourse) await loadCourseDetail(activeCourse.id);
  };

  return (
    <Section className="max-w-[1400px]">
      <Link to="/cursos" className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] mb-4">
        <ChevronLeft size={14} /> Cursos
      </Link>

      <PageHeader
        title="Gerenciar cursos"
        description="Crie cursos, organize módulos, faça upload das aulas"
        actions={
          <Button onClick={createCourse} size="sm" disabled={saving}>
            <Plus size={13} /> Novo curso
          </Button>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <LoaderRing />
        </div>
      ) : (
        <div className="grid lg:grid-cols-[280px_1fr] gap-5">
          {/* Lista de cursos */}
          <Card className="p-2 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] overflow-y-auto">
            {courses.length === 0 ? (
              <div className="text-xs text-[var(--color-text-dim)] text-center py-6">
                Nenhum curso ainda
              </div>
            ) : (
              courses.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setActiveCourseId(c.id);
                    loadCourseDetail(c.id);
                  }}
                  className={
                    'w-full text-left flex items-start gap-2 px-2 py-2 rounded-md text-sm transition-colors ' +
                    (c.id === activeCourseId
                      ? 'bg-[var(--color-surface-2)] text-[var(--color-text)]'
                      : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]/50 hover:text-[var(--color-text)]')
                  }
                >
                  <div className="size-8 rounded-md bg-[var(--color-surface-2)] border border-[var(--color-border)] grid place-items-center shrink-0 overflow-hidden">
                    {c.thumbnail_url ? (
                      <img src={c.thumbnail_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <FilmIcon size={13} className="text-[var(--color-text-dim)]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium truncate">{c.title || '—'}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {c.published ? (
                        <Badge tone="success">Publicado</Badge>
                      ) : (
                        <Badge tone="warning">Rascunho</Badge>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </Card>

          {/* Edição */}
          <div>
            {!activeCourse ? (
              <Card className="p-12 text-center">
                <div className="text-sm font-medium mb-1">Selecione ou crie um curso</div>
                <p className="text-xs text-[var(--color-text-muted)]">Use o botão "Novo curso" no topo.</p>
              </Card>
            ) : (
              <CourseEditor
                key={activeCourse.id}
                course={activeCourse}
                modules={activeModules}
                openModules={openModules}
                setOpenModules={setOpenModules}
                onUpdateCourse={updateCourse}
                onDeleteCourse={deleteCourse}
                onCreateModule={createModule}
                onUpdateModule={updateModule}
                onDeleteModule={deleteModule}
                onCreateLesson={createLesson}
                onUpdateLesson={updateLesson}
                onDeleteLesson={deleteLesson}
                onReloadDetail={() => loadCourseDetail(activeCourse.id)}
              />
            )}
          </div>
        </div>
      )}
    </Section>
  );
}

// ============================================================================

function CourseEditor({
  course,
  modules,
  openModules,
  setOpenModules,
  onUpdateCourse,
  onDeleteCourse,
  onCreateModule,
  onUpdateModule,
  onDeleteModule,
  onCreateLesson,
  onUpdateLesson,
  onDeleteLesson,
  onReloadDetail,
}: {
  course: Course;
  modules: ModuleWithLessons[];
  openModules: Record<string, boolean>;
  setOpenModules: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  onUpdateCourse: (p: Partial<Course>) => Promise<void>;
  onDeleteCourse: () => Promise<void>;
  onCreateModule: () => Promise<void>;
  onUpdateModule: (id: string, p: Partial<CourseModule>) => Promise<void>;
  onDeleteModule: (id: string) => Promise<void>;
  onCreateLesson: (moduleId: string) => Promise<void>;
  onUpdateLesson: (id: string, p: Partial<CourseLesson>) => Promise<void>;
  onDeleteLesson: (id: string) => Promise<void>;
  onReloadDetail: () => Promise<void>;
}) {
  const [title, setTitle] = useState(course.title);
  const [slug, setSlug] = useState(course.slug);
  const [description, setDescription] = useState(course.description || '');
  const [thumbUploading, setThumbUploading] = useState(false);
  const thumbRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setTitle(course.title);
    setSlug(course.slug);
    setDescription(course.description || '');
  }, [course.id, course.title, course.slug, course.description]);

  const saveBasics = async () => {
    await onUpdateCourse({ title, slug: slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-'), description });
    toast.success('Salvo');
  };

  const handleThumbUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setThumbUploading(true);
    const ext = f.name.split('.').pop() || 'jpg';
    const path = `${course.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from(COURSE_THUMBS_BUCKET).upload(path, f, {
      cacheControl: '3600',
      upsert: true,
      contentType: f.type,
    });
    if (error) {
      toast.error(error.message);
      setThumbUploading(false);
      return;
    }
    const { data } = supabase.storage.from(COURSE_THUMBS_BUCKET).getPublicUrl(path);
    await onUpdateCourse({ thumbnail_url: data.publicUrl });
    toast.success('Capa atualizada');
    setThumbUploading(false);
    e.target.value = '';
  };

  return (
    <div className="space-y-5">
      {/* Capa + meta */}
      <Card className="p-5">
        <div className="grid md:grid-cols-[200px_1fr] gap-5">
          <div>
            <div className="aspect-video rounded-md bg-[var(--color-surface-2)] border border-[var(--color-border)] overflow-hidden grid place-items-center mb-2">
              {course.thumbnail_url ? (
                <img src={course.thumbnail_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon size={20} className="text-[var(--color-text-dim)]" />
              )}
            </div>
            <input ref={thumbRef} type="file" accept="image/*" onChange={handleThumbUpload} className="hidden" />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => thumbRef.current?.click()}
              disabled={thumbUploading}
              className="w-full"
            >
              {thumbUploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
              {course.thumbnail_url ? 'Trocar capa' : 'Enviar capa'}
            </Button>
          </div>

          <div className="space-y-3">
            <Field label="Título">
              <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
            </Field>
            <Field label="Slug (URL)">
              <input className={inputClass} value={slug} onChange={(e) => setSlug(e.target.value)} />
              <div className="text-[11px] text-[var(--color-text-dim)] mt-1">/cursos/{slug || '...'}</div>
            </Field>
            <Field label="Descrição">
              <textarea
                className={inputClass + ' h-24 py-2 resize-none'}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Field>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Button onClick={saveBasics} size="sm">
                <Save size={12} /> Salvar
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onUpdateCourse({ published: !course.published })}
              >
                {course.published ? (
                  <>
                    <EyeOff size={12} /> Despublicar
                  </>
                ) : (
                  <>
                    <Eye size={12} /> Publicar
                  </>
                )}
              </Button>
              <a
                href={`/cursos/${course.slug}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] px-2"
              >
                <ExternalLink size={11} /> Visualizar
              </a>
              <div className="ml-auto">
                <Button onClick={onDeleteCourse} variant="ghost" size="sm" className="text-red-400 hover:text-red-300">
                  <Trash2 size={12} /> Excluir curso
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Módulos */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-medium">Módulos e aulas</div>
          <Button onClick={onCreateModule} size="sm" variant="secondary">
            <Plus size={12} /> Novo módulo
          </Button>
        </div>

        {modules.length === 0 ? (
          <div className="text-xs text-[var(--color-text-dim)] text-center py-8">
            Nenhum módulo ainda. Crie o primeiro acima.
          </div>
        ) : (
          <div className="space-y-3">
            {modules.map((m, mi) => {
              const isOpen = openModules[m.id] !== false;
              return (
                <div key={m.id} className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)]/30">
                  <div className="flex items-center gap-2 p-3">
                    <button
                      onClick={() => setOpenModules((o) => ({ ...o, [m.id]: !isOpen }))}
                      className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                    >
                      {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                    <GripVertical size={13} className="text-[var(--color-text-dim)]" />
                    <span className="text-[10px] uppercase tracking-widest text-[var(--color-text-dim)]">
                      Mód {mi + 1}
                    </span>
                    <input
                      className={inputClass + ' h-8 text-sm'}
                      defaultValue={m.title}
                      onBlur={(e) => {
                        if (e.target.value !== m.title) onUpdateModule(m.id, { title: e.target.value });
                      }}
                    />
                    <Button onClick={() => onCreateLesson(m.id)} variant="secondary" size="sm">
                      <Plus size={12} /> Aula
                    </Button>
                    <Button onClick={() => onDeleteModule(m.id)} variant="ghost" size="sm" className="text-red-400">
                      <Trash2 size={12} />
                    </Button>
                  </div>

                  {isOpen && (
                    <div className="border-t border-[var(--color-border)] p-3 space-y-2">
                      {m.lessons.length === 0 ? (
                        <div className="text-xs text-[var(--color-text-dim)] text-center py-3">
                          Sem aulas. Adicione uma.
                        </div>
                      ) : (
                        m.lessons.map((l, li) => (
                          <LessonRow
                            key={l.id}
                            index={li}
                            lesson={l}
                            onUpdate={(p) => onUpdateLesson(l.id, p)}
                            onDelete={() => onDeleteLesson(l.id)}
                            onReload={onReloadDetail}
                          />
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

// ============================================================================

function LessonRow({
  index,
  lesson,
  onUpdate,
  onDelete,
  onReload,
}: {
  index: number;
  lesson: CourseLesson;
  onUpdate: (p: Partial<CourseLesson>) => Promise<void>;
  onDelete: () => Promise<void>;
  onReload: () => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const upload = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    setProgress(0);

    const ext = f.name.split('.').pop() || 'mp4';
    const path = `${lesson.module_id}/${lesson.id}.${ext}`;

    // Apaga anterior se existir num path diferente
    if (lesson.video_path && lesson.video_path !== path) {
      await supabase.storage.from(COURSE_VIDEOS_BUCKET).remove([lesson.video_path]);
    }

    const { error } = await supabase.storage.from(COURSE_VIDEOS_BUCKET).upload(path, f, {
      upsert: true,
      contentType: f.type || 'video/mp4',
      cacheControl: '3600',
    });

    if (error) {
      toast.error(error.message);
      setUploading(false);
      return;
    }

    // Tenta extrair duração do arquivo (client-side)
    const duration = await readVideoDuration(f).catch(() => 0);

    await onUpdate({ video_path: path, duration_seconds: Math.round(duration) });
    toast.success('Vídeo enviado');
    setUploading(false);
    setProgress(0);
    if (e.target) e.target.value = '';
    await onReload();
  };

  const removeVideo = async () => {
    if (!lesson.video_path) return;
    if (!confirm('Remover o vídeo desta aula?')) return;
    await supabase.storage.from(COURSE_VIDEOS_BUCKET).remove([lesson.video_path]);
    await onUpdate({ video_path: null, duration_seconds: 0 });
    toast.success('Vídeo removido');
    await onReload();
  };

  return (
    <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="flex items-center gap-2 p-2.5">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
        >
          {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </button>
        <span className="text-[10px] tabular-nums text-[var(--color-text-dim)] w-5">{index + 1}.</span>
        <input
          className={inputClass + ' h-8 text-sm'}
          defaultValue={lesson.title}
          onBlur={(e) => {
            if (e.target.value !== lesson.title) onUpdate({ title: e.target.value });
          }}
        />
        {lesson.video_path ? (
          <Badge tone="success">
            <FilmIcon size={10} /> {formatDuration(lesson.duration_seconds)}
          </Badge>
        ) : (
          <Badge tone="warning">Sem vídeo</Badge>
        )}
        <Button onClick={onDelete} variant="ghost" size="sm" className="text-red-400">
          <Trash2 size={12} />
        </Button>
      </div>

      {expanded && (
        <div className="border-t border-[var(--color-border)] p-3 space-y-3">
          <Field label="Descrição da aula">
            <textarea
              className={inputClass + ' h-20 py-2 resize-none'}
              defaultValue={lesson.description || ''}
              onBlur={(e) => {
                if (e.target.value !== (lesson.description || '')) onUpdate({ description: e.target.value });
              }}
            />
          </Field>

          <div>
            <div className="text-xs text-[var(--color-text-muted)] mb-1.5">Vídeo</div>
            <input
              ref={fileRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={upload}
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                {lesson.video_path ? 'Trocar vídeo' : 'Enviar vídeo'}
              </Button>
              {lesson.video_path && (
                <Button onClick={removeVideo} variant="ghost" size="sm" className="text-red-400">
                  <Trash2 size={12} /> Remover
                </Button>
              )}
              {uploading && (
                <div className="text-[11px] text-[var(--color-text-muted)]">
                  Enviando... {progress > 0 && `${progress}%`}
                </div>
              )}
              {lesson.video_path && (
                <div className="text-[11px] text-[var(--color-text-dim)] font-mono">{lesson.video_path}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatDuration(seconds: number): string {
  if (!seconds) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function readVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.src = url;
    v.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(v.duration || 0);
    };
    v.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('metadata'));
    };
  });
}
