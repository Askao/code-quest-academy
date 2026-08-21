import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { topicsFor } from "@/lib/game";
import { completedTaskSlugs, isLessonComplete, lessonsForTopic, projectsForTopic } from "@/lib/content";

export const Route = createFileRoute("/_authenticated/projects")({
  head: () => ({
    meta: [
      { title: "Projects — H-Code" },
      {
        name: "description",
        content: "Longer assessment projects that pull together everything a topic covers.",
      },
      { property: "og:title", content: "Projects — H-Code" },
      {
        property: "og:description",
        content: "Longer assessment projects that pull together everything a topic covers.",
      },
    ],
  }),
  component: Projects,
});

function Projects() {
  const { user } = useAuth();
  const track = "gcse" as const;

  const { data } = useQuery({
    queryKey: ["projects-page", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const uid = user!.id;
      const [projectRows, passedRes, quizRes] = await Promise.all([
        supabase.from("challenges").select("id, slug, topic").eq("track", track).eq("is_project", true),
        supabase
          .from("attempts")
          .select("passed, challenges!inner(slug)")
          .eq("user_id", uid)
          .eq("passed", true),
        supabase.from("quiz_attempts").select("lesson_slug").eq("user_id", uid).eq("passed", true),
      ]);
      const passedSlugs = new Set(
        ((passedRes.data ?? []) as unknown as { challenges: { slug: string } }[]).map(
          (r) => r.challenges.slug,
        ),
      );
      const quizPassed = new Set((quizRes.data ?? []).map((r) => r.lesson_slug));
      return {
        // Only slugs that actually have a DB row (i.e. have been seeded) are
        // playable - lets projectsForTopic()'s content exist ahead of a
        // topic's rollout without it showing as broken links.
        seededSlugs: new Set((projectRows.data ?? []).map((r) => r.slug)),
        passedSlugs,
        quizPassed,
      };
    },
  });

  // Same gate as Practice: a topic's projects stay locked until at least one
  // of its lessons is complete - a project is meant to test material
  // already taught, not introduce it.
  const topicUnlocked = (topic: string) => {
    const lessons = lessonsForTopic(track, topic);
    return (
      lessons.length === 0 ||
      lessons.some((l) => isLessonComplete(l.slug, data?.passedSlugs ?? new Set(), data?.quizPassed ?? new Set()))
    );
  };

  const topicsWithProjects = topicsFor(track)
    .map((t) => ({ ...t, projects: projectsForTopic(track, t.key) }))
    .filter((t) => t.projects.some((p) => data?.seededSlugs.has(p.slug)));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Projects</h1>
        <p className="mt-1 text-muted-foreground">
          Longer, harder programs that pull together everything you've learned in a topic — a real
          test, not a quick drill.
        </p>
      </div>

      {topicsWithProjects.length === 0 ? (
        <p className="text-muted-foreground">No projects are available yet.</p>
      ) : null}

      {topicsWithProjects.map((t) => {
        const unlocked = topicUnlocked(t.key);
        if (!unlocked) {
          return (
            <section key={t.key} className="panel p-5 opacity-50">
              <p className="font-semibold">🔒 {t.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Finish a lesson in this topic to unlock its projects.
              </p>
            </section>
          );
        }
        return (
          <section key={t.key}>
            <h2 className="mb-3 text-xl font-semibold">{t.label}</h2>
            <div className="space-y-3">
              {t.projects
                .filter((p) => data?.seededSlugs.has(p.slug))
                .map((p) => {
                  const done = data?.passedSlugs.has(p.slug) ?? false;
                  return (
                    <div key={p.slug} className="panel flex flex-wrap items-center gap-3 p-4">
                      <span className={done ? "text-success" : "text-muted-foreground"}>
                        {done ? "✓" : "🏗"}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium">{p.title}</p>
                        <p className="font-mono text-xs text-muted-foreground">
                          difficulty {p.difficulty}/5 · {p.xp} XP
                        </p>
                      </div>
                      <Button asChild size="sm" variant={done ? "secondary" : "default"}>
                        <Link
                          to="/play/$slug"
                          params={{ slug: p.slug }}
                          search={{ mode: "project", track, topic: t.key }}
                        >
                          {done ? "Redo" : "Start"}
                        </Link>
                      </Button>
                    </div>
                  );
                })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
