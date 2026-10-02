import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Lock } from "lucide-react";
import { sb } from "@/lib/assessments-db";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CosmeticAvatar } from "@/components/CosmeticAvatar";
import { AVATARS, BANNERS, cosmeticUnlockedClientSide, levelFromXp } from "@/lib/game";

export const Route = createFileRoute("/_authenticated/locker")({
  head: () => ({
    meta: [
      { title: "Locker — H-Code" },
      { name: "description", content: "Customise your avatar and banner as you level up." },
      { property: "og:title", content: "Locker — H-Code" },
      { property: "og:description", content: "Customise your avatar and banner as you level up." },
    ],
  }),
  component: Locker,
});

function BannerPreview({ gradient, className = "" }: { gradient: string; className?: string }) {
  return <div className={`rounded-lg ${className}`} style={{ background: gradient }} />;
}

function Locker() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [equipping, setEquipping] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["locker", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const uid = user!.id;
      const [profile, stats, duelWins, passed] = await Promise.all([
        sb.from("profiles").select("selected_avatar, selected_banner").eq("id", uid).maybeSingle(),
        sb.from("stats").select("xp, best_streak").eq("user_id", uid).maybeSingle(),
        sb
          .from("duels")
          .select("id", { count: "exact", head: true })
          .eq("winner_id", uid),
        // Distinct challenges, not attempt rows: replaying a task you've
        // already passed must not count towards Century.
        sb.rpc("my_passed_challenge_count"),
      ]);
      return {
        selectedAvatar: profile.data?.selected_avatar ?? null,
        selectedBanner: profile.data?.selected_banner ?? null,
        xp: stats.data?.xp ?? 0,
        bestStreak: stats.data?.best_streak ?? 0,
        duelWins: duelWins.count ?? 0,
        passedCount: typeof passed.data === "number" ? passed.data : 0,
      };
    },
  });

  const equip = async (kind: "avatar" | "banner", key: string | null) => {
    setEquipping(key ?? `clear-${kind}`);
    const { error } = await sb.rpc("set_cosmetic", { _kind: kind, _key: key });
    setEquipping(null);
    if (error) {
      toast.error(error.message || "Couldn't equip that");
      return;
    }
    toast.success(key ? "Equipped!" : "Cleared");
    void qc.invalidateQueries({ queryKey: ["locker", user?.id] });
  };

  const { level, intoLevel, needed } = levelFromXp(data?.xp ?? 0);
  const ctx = {
    level,
    duelWins: data?.duelWins ?? 0,
    passedCount: data?.passedCount ?? 0,
    bestStreak: data?.bestStreak ?? 0,
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">The Locker</h1>
        <p className="mt-1 text-muted-foreground">
          Unlock avatars and banners as you level up, win duels and build a streak — then show them
          off on the leaderboard and in Duels.
        </p>
      </div>

      <div className="panel flex flex-wrap items-center gap-4 p-5">
        <CosmeticAvatar avatarKey={data?.selectedAvatar} size="lg" />
        <div className="flex-1">
          <p className="font-mono text-xs text-muted-foreground">LEVEL {level}</p>
          <Progress value={(intoLevel / needed) * 100} className="mt-2 w-full max-w-xs" />
          <p className="mt-1 text-xs text-muted-foreground">
            {intoLevel} / {needed} XP to level {level + 1}
          </p>
        </div>
        {data?.selectedBanner ? (
          <BannerPreview
            gradient={BANNERS.find((b) => b.key === data.selectedBanner)?.gradient ?? ""}
            className="h-12 w-24 shrink-0"
          />
        ) : null}
      </div>

      <Tabs defaultValue="avatars">
        <TabsList>
          <TabsTrigger value="avatars">Avatars</TabsTrigger>
          <TabsTrigger value="banners">Banners</TabsTrigger>
        </TabsList>

        <TabsContent value="avatars" className="pt-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {AVATARS.map((a) => {
              const unlocked = cosmeticUnlockedClientSide(a.key, ctx);
              const active = data?.selectedAvatar === a.key;
              return (
                <div
                  key={a.key}
                  className={`panel flex items-center gap-3 p-4 ${active ? "border-primary" : ""}`}
                >
                  <div className={`relative shrink-0 ${unlocked ? "" : "opacity-35"}`}>
                    <CosmeticAvatar avatarKey={a.key} size="md" />
                    {!unlocked ? (
                      <Lock className="absolute -right-1 -bottom-1 h-3.5 w-3.5 rounded-full bg-background p-0.5 text-muted-foreground" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{a.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{a.requirement}</p>
                  </div>
                  <Button
                    size="sm"
                    variant={active ? "secondary" : "default"}
                    disabled={!unlocked || equipping === a.key}
                    onClick={() => void equip("avatar", active ? null : a.key)}
                  >
                    {active ? "Equipped" : "Equip"}
                  </Button>
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="banners" className="pt-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {BANNERS.map((b) => {
              const unlocked = cosmeticUnlockedClientSide(b.key, ctx);
              const active = data?.selectedBanner === b.key;
              return (
                <div
                  key={b.key}
                  className={`panel space-y-3 p-4 ${active ? "border-primary" : ""}`}
                >
                  <BannerPreview
                    gradient={b.gradient}
                    className={`h-16 w-full ${unlocked ? "" : "opacity-35"}`}
                  />
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{b.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{b.requirement}</p>
                    </div>
                    <Button
                      size="sm"
                      variant={active ? "secondary" : "default"}
                      disabled={!unlocked || equipping === b.key}
                      onClick={() => void equip("banner", active ? null : b.key)}
                    >
                      {active ? "Equipped" : "Equip"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
