// Historique des Situations — chronological log of every recorded session.
import { useEffect, useMemo } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, History, TrendingUp, AlertTriangle, Trophy, Calendar } from "lucide-react";
import { useAppStore } from "@/store/AppStore";
import { useAudio } from "@/lib/audio";
import { PopButton } from "@/components/game/PopButton";

export const Route = createFileRoute("/class/$classId/historique")({
  component: HistoriquePage,
});

function HistoriquePage() {
  const { classId } = Route.useParams();
  const navigate = useNavigate();
  const { classes, situationHistory } = useAppStore();
  const cls = classes.find((c) => c.id === classId);
  const { setBgm } = useAudio();
  useEffect(() => { setBgm("historique"); }, [setBgm]);

  const records = useMemo(
    () => situationHistory.filter((r) => r.classId === classId),
    [situationHistory, classId]
  );

  if (!cls) {
    return (
      <main className="min-h-screen grid place-items-center p-8">
        <div className="pop-card p-8 text-center">
          <p className="font-display text-3xl">Classe introuvable</p>
          <PopButton variant="primary" onClick={() => navigate({ to: "/" })} className="mt-4">Retour</PopButton>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-20">
      <header className="sticky top-0 z-20 bg-background/85 backdrop-blur-xl border-b-[3px] border-ink">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-4 flex items-center gap-4">
          <PopButton variant="ghost" size="sm" onClick={() => navigate({ to: "/class/$classId", params: { classId } })}>
            <ArrowLeft size={16} strokeWidth={3} /> Retour
          </PopButton>
          <div>
            <h1 className="font-display text-2xl md:text-3xl leading-none flex items-center gap-2">
              <History strokeWidth={3} /> Historique des situations
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-widest text-ink-soft">
              {cls.name} · {records.length} session{records.length > 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-4 md:px-8 py-8 space-y-4">
        {records.length === 0 && (
          <div className="pop-card p-10 text-center">
            <p className="font-display text-xl mb-2">Aucune situation enregistrée</p>
            <p className="text-sm font-semibold text-ink-soft">
              Lance une situation depuis la classe pour commencer à constituer un historique.
            </p>
          </div>
        )}

        {records.map((r) => {
          const d = new Date(r.date);
          const dateStr = d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
          const timeStr = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
          return (
            <article key={r.id} className="pop-card p-5">
              <header className="flex flex-wrap items-center gap-3 justify-between border-b-[2px] border-dashed border-ink/15 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <Calendar size={18} strokeWidth={3} className="text-ink-soft" />
                  <div>
                    <p className="font-display text-lg leading-none">{dateStr}</p>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-ink-soft">{timeStr}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {r.skillCodes.map((c) => (
                    <span key={c} className="font-display text-[11px] px-2 py-1 rounded-full bg-ink text-surface tracking-wider">
                      {c}
                    </span>
                  ))}
                </div>
              </header>

              <div className="grid md:grid-cols-3 gap-3">
                <div className="rounded-2xl border-[2.5px] border-ink bg-secondary/10 p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <TrendingUp size={14} className="text-secondary" strokeWidth={3} />
                    <span className="font-display text-xs uppercase tracking-widest">Progressions ({r.progressed.length})</span>
                  </div>
                  {r.progressed.length === 0 ? (
                    <p className="text-xs text-ink-soft font-semibold">—</p>
                  ) : (
                    <ul className="space-y-1">
                      {[...r.progressed].sort((a, b) => a.before - b.before || a.after - b.after).map((p, i) => (
                        <li key={i} className="text-xs font-semibold flex items-center gap-1.5">
                          <span className="font-display px-1.5 py-0.5 rounded-full bg-secondary text-secondary-foreground text-[9px]">{p.skillCode}</span>
                          <span className="truncate">{p.studentName}</span>
                          <span className="text-ink-soft ml-auto">N{p.before}→N{p.after}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="rounded-2xl border-[2.5px] border-ink bg-hot/10 p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <AlertTriangle size={14} className="text-hot" strokeWidth={3} />
                    <span className="font-display text-xs uppercase tracking-widest">Difficultés ({r.stagnated.length})</span>
                  </div>
                  {r.stagnated.length === 0 ? (
                    <p className="text-xs text-ink-soft font-semibold">—</p>
                  ) : (
                    <ul className="space-y-1">
                      {r.stagnated.map((p, i) => (
                        <li key={i} className="text-xs font-semibold flex items-center gap-1.5">
                          <span className="font-display px-1.5 py-0.5 rounded-full bg-hot text-hot-foreground text-[9px]">{p.skillCode}</span>
                          <span className="truncate">{p.studentName}</span>
                          <span className="text-ink-soft ml-auto">N{p.level}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="rounded-2xl border-[2.5px] border-ink bg-primary/10 p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Trophy size={14} className="text-primary" strokeWidth={3} />
                    <span className="font-display text-xs uppercase tracking-widest">Niveaux ({r.levelUps.length})</span>
                  </div>
                  {r.levelUps.length === 0 ? (
                    <p className="text-xs text-ink-soft font-semibold">—</p>
                  ) : (
                    <ul className="space-y-1">
                      {r.levelUps.map((p, i) => (
                        <li key={i} className="text-xs font-semibold flex items-center gap-1.5">
                          <span className="truncate">{p.studentName}</span>
                          <span className="text-ink-soft ml-auto">Niv {p.oldLevel}→{p.newLevel}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
