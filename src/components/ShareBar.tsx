import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { readSnoozed, SHARE_BAR_KEY, snooze } from "@/lib/nudges";

const SITE = "https://www.hcodeacademy.co.uk";

/**
 * A slim line under the menu on teachers' pages asking them to tell a
 * colleague. Word of mouth between teachers is the site's only advertising.
 * The × hides it for 30 days in this browser. Never shown to students.
 */
export function ShareBar() {
  // Starts hidden so the server render and first paint never flash it at
  // someone who has already dismissed it.
  const [visible, setVisible] = useState(false);
  useEffect(() => setVisible(!readSnoozed(SHARE_BAR_KEY)), []);
  if (!visible) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(SITE);
      toast.success("Link copied");
    } catch {
      toast.message(`Copy this link: ${SITE}`);
    }
  };

  return (
    <div className="border-b border-border bg-primary/10">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2 text-sm">
        <p className="min-w-0 flex-1">
          <span className="font-semibold">Know another computing teacher?</span> Tell them about
          H-Code Academy: <span className="font-mono text-xs">hcodeacademy.co.uk</span>
        </p>
        <Button size="sm" onClick={copy}>
          Copy link
        </Button>
        <button
          type="button"
          onClick={() => {
            snooze(SHARE_BAR_KEY, 30);
            setVisible(false);
          }}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
          aria-label="Hide for 30 days"
          title="Hide for 30 days"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
