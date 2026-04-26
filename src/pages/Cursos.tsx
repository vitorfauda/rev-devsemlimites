import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Play, CheckCircle2, Settings } from 'lucide-react';
import { supabase, type Course, type CourseLesson, type CourseModule, type CourseProgress } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Badge, Card, PageHeader, Section, ButtonLink } from '@/components/ui';
import { LoaderRing } from '@/components/LoaderRing';

type CourseWithStats = Course & {
  total_lessons: number;
  completed_lessons: number;
};

export default function Cursos() {
  const { reseller, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<CourseWithStats[]>([]);

  useEffect(() => {
    let active = true;

    (async () => {
      setLoading(true);

      const coursesQuery = supabase
        .from('courses')
        .select('*')
        .order('sort_order', { ascending: true });

      // Admin enxerga inclusive não publicados; reseller só publicados (RLS já filtra, mas reduzo no client)
      const { data: cs } = isAdmin
        ? await coursesQuery
        : await coursesQuery.eq('published', true);

      if (!cs || !active) {
        setCourses([]);
        setLoading(false);
        return;
      }

      const courseIds = cs.map((c) => c.id);

      // Pega módulos pra mapear pra contagem de lessons
      const { data: mods } = await supabase
        .from('course_modules')
        .select('id, course_id')
        .in('course_id', courseIds);

      const moduleToCourse: Record<string, string> = {};
      (mods || []).forEach((m: Pick<CourseModule, 'id' | 'course_id'>) => {
        moduleToCourse[m.id] = m.course_id;
      });

      const moduleIds = (mods || []).map((m) => m.id);

      const { data: lessons } = moduleIds.length
        ? await supabase.from('course_lessons').select('id, module_id').in('module_id', moduleIds)
        : { data: [] as Pick<CourseLesson, 'id' | 'module_id'>[] };

      const lessonsByCourse: Record<string, string[]> = {};
      (lessons || []).forEach((l) => {
        const cid = moduleToCourse[l.module_id];
        if (!cid) return;
        (lessonsByCourse[cid] ||= []).push(l.id);
      });

      let completedByCourse: Record<string, number> = {};
      if (reseller) {
        const allLessonIds = (lessons || []).map((l) => l.id);
        if (allLessonIds.length) {
          const { data: progress } = await supabase
            .from('course_progress')
            .select('lesson_id, completed_at')
            .eq('reseller_id', reseller.id)
            .in('lesson_id', allLessonIds);

          const completedSet = new Set<string>(
            (progress || [])
              .filter((p: Pick<CourseProgress, 'lesson_id' | 'completed_at'>) => !!p.completed_at)
              .map((p) => p.lesson_id),
          );

          for (const cid of courseIds) {
            const ids = lessonsByCourse[cid] || [];
            completedByCourse[cid] = ids.filter((id) => completedSet.has(id)).length;
          }
        }
      }

      const enriched: CourseWithStats[] = cs.map((c: Course) => ({
        ...c,
        total_lessons: (lessonsByCourse[c.id] || []).length,
        completed_lessons: completedByCourse[c.id] || 0,
      }));

      if (active) {
        setCourses(enriched);
        setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [reseller, isAdmin]);

  return (
    <Section>
      <PageHeader
        title="Cursos"
        description="Aprenda a vender mais com aulas exclusivas dos fundadores"
        actions={
          isAdmin ? (
            <ButtonLink href="/admin/cursos" variant="secondary" size="sm">
              <Settings size={13} /> Gerenciar
            </ButtonLink>
          ) : null
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <LoaderRing />
        </div>
      ) : courses.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="size-12 rounded-md bg-[var(--color-surface-2)] border border-[var(--color-border)] grid place-items-center mx-auto mb-4">
            <GraduationCap size={20} className="text-[var(--color-primary)]" />
          </div>
          <div className="text-sm font-medium mb-1">Nenhum curso disponível ainda</div>
          <p className="text-xs text-[var(--color-text-muted)]">
            Os primeiros conteúdos chegam em breve. Fica de olho.
          </p>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((c) => {
            const pct = c.total_lessons > 0 ? Math.round((c.completed_lessons / c.total_lessons) * 100) : 0;
            const done = c.total_lessons > 0 && c.completed_lessons === c.total_lessons;
            return (
              <Link key={c.id} to={`/cursos/${c.slug}`} className="group">
                <Card className="overflow-hidden transition-all hover:border-[var(--color-primary)]/40">
                  <div className="aspect-video bg-[var(--color-surface-2)] relative overflow-hidden">
                    {c.thumbnail_url ? (
                      <img src={c.thumbnail_url} alt={c.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full grid place-items-center">
                        <GraduationCap size={32} className="text-[var(--color-text-dim)]" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors grid place-items-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity size-11 rounded-full bg-[var(--color-primary)] grid place-items-center">
                        <Play size={16} className="text-black ml-0.5" fill="currentColor" />
                      </div>
                    </div>
                    {!c.published && (
                      <div className="absolute top-2 left-2">
                        <Badge tone="warning">Rascunho</Badge>
                      </div>
                    )}
                    {done && (
                      <div className="absolute top-2 right-2">
                        <Badge tone="success">
                          <CheckCircle2 size={11} /> Concluído
                        </Badge>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="text-sm font-medium mb-1 line-clamp-1">{c.title}</div>
                    {c.description && (
                      <p className="text-xs text-[var(--color-text-muted)] line-clamp-2 mb-3">{c.description}</p>
                    )}
                    <div className="flex items-center justify-between text-[11px] text-[var(--color-text-dim)]">
                      <span>{c.total_lessons} {c.total_lessons === 1 ? 'aula' : 'aulas'}</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="mt-2 h-1 rounded-full bg-[var(--color-surface-2)] overflow-hidden">
                      <div
                        className="h-full bg-[var(--color-primary)] transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </Section>
  );
}
