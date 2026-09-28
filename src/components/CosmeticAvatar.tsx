import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AVATARS } from "@/lib/game";
import { cn } from "@/lib/utils";

const SIZES = { sm: "h-8 w-8 text-base", md: "h-10 w-10 text-lg", lg: "h-16 w-16 text-3xl" };

/** A student's equipped avatar (or the default 👤 if they haven't picked one
 * yet) - used anywhere an identity is shown next to a name: the Locker,
 * dashboard header, leaderboard rows, Duels classmate rows. */
export function CosmeticAvatar({
  avatarKey,
  size = "md",
  className,
}: {
  avatarKey?: string | null | undefined;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const icon = AVATARS.find((a) => a.key === avatarKey)?.icon ?? "👤";
  return (
    <Avatar className={cn(SIZES[size], className)}>
      <AvatarFallback className="bg-secondary">{icon}</AvatarFallback>
    </Avatar>
  );
}
