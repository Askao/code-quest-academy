import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { TeacherFeedbackForm } from "@/components/TeacherFeedback";

export const Route = createFileRoute("/_authenticated/feedback")({
  head: () => ({ meta: [{ title: "Give feedback — H-Code" }] }),
  component: FeedbackPage,
});

function FeedbackPage() {
  const { isTeacher } = useAuth();
  const [sent, setSent] = useState(false);

  if (!isTeacher) {
    return (
      <div className="panel mx-auto max-w-xl p-6">
        <h1 className="text-2xl font-semibold">Give feedback</h1>
        <p className="mt-2 text-muted-foreground">
          This form is for teachers. If something isn't working, tell your teacher, or use the{" "}
          <Link to="/contact" className="text-primary underline-offset-4 hover:underline">
            contact form
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Give feedback</h1>
        <p className="mt-1 text-muted-foreground">
          Five quick questions. H-Code Academy is made by one teacher, and your answers decide what
          gets fixed next.
        </p>
      </div>
      <div className="panel p-6">
        {sent ? (
          <div className="space-y-3">
            <p className="text-lg font-semibold">Thank you, that's been sent.</p>
            <p className="text-muted-foreground">
              You can send more feedback any time from the Teacher page.
            </p>
            <Button asChild variant="secondary">
              <Link to="/teacher">Back to the Teacher page</Link>
            </Button>
          </div>
        ) : (
          <TeacherFeedbackForm idPrefix="page" onSent={() => setSent(true)} />
        )}
      </div>
    </div>
  );
}
