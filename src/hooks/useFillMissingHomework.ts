import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { fillMissingHomework } from "@/lib/homework-late-join";

/**
 * Gives a student who joined a class after some homework was set their own
 * task list for it (see fillMissingHomework). Mounted once in the
 * authenticated layout so it runs as soon as they're signed in, whichever
 * page they land on, and refreshes the homework views if it added anything.
 * Teachers and admins have no homework of their own to fill.
 */
export function useFillMissingHomework() {
  const { user, isTeacher } = useAuth();
  const qc = useQueryClient();
  const userId = user?.id;

  useEffect(() => {
    if (!userId || isTeacher) return;
    let cancelled = false;
    fillMissingHomework(userId)
      .then((created) => {
        if (created === 0 || cancelled) return;
        void qc.invalidateQueries({ queryKey: ["dashboard", userId] });
        void qc.invalidateQueries({ queryKey: ["homework"] });
      })
      .catch((e) => console.error("fillMissingHomework failed", e));
    return () => {
      cancelled = true;
    };
  }, [userId, isTeacher, qc]);
}
