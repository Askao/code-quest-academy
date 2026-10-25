import { Link } from "@tanstack/react-router";

/** The small footer on every page: what the site is, plus the privacy policy link. */
export function SiteFooter() {
  return (
    <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
      <p>
        H-Code Academy (hcodeacademy.co.uk) — Python practice for computer science students and
        their teachers.
      </p>
      <p className="mt-2">
        <Link to="/privacy" className="underline hover:text-foreground">
          Privacy policy
        </Link>
      </p>
    </footer>
  );
}
