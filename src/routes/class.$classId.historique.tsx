// Historique des Situations — vue dense horizontale (zero scroll friendly).
import { useEffect, useMemo } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, History, TrendingUp, AlertTriangle } from "lucide-react";
import { useAppStore } from "@/store/AppStore";
import { useAudio } from "@/lib/audio";
import { PopButton } from "@/components/game/PopButton";
import { CURRICULUM, type DimensionKey } from "@/data/curriculum";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/class/$classId/historique")({
  component: HistoriquePage,
});

// Couleur du badge par secteur (aligné sur les tokens dim-*).
const DIM_CHIP: Record<DimensionKey, string> = {
  moteur:      "bg-dim-motor text-white",
  technique:   "bg-dim-motor text-white",
  deplacement: "bg-dim-motor text-white",
  tactique:    "bg-dim-tactic text-white",
  methodo:     "bg-dim-method text-white",
  social:      "bg-dim-social text-white",
};

function HistoriquePage() {
  const { classId } = Route.useParams();
  const navigate = useNavigate();
  const { classes, situationHistory } = useAppStore();
  const cls = classes.find((c) => c.id === classId);
  const { setBgm } = useAudio();
  useEffect(() => { setBgm("historique"); }, [setBgm]);

  // Map skillId → dimension pour colorer correctement les chips.
  const skillDim = useMemo(() => {
    const map = new Map<string, DimensionKey>();
    Object.values(CURRICULUM).forEach((cyc) => {
      (Object.entries(cyc.categories) as [DimensionKey, { skills: Array<{ id: string }> }][]).forEach(
        ([dim, cat]) => cat.skills.forEach((s) => map.set(s.id, dim))
      );
    });
    return map;
  }, []);

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
    <main className="min-h-screen pb-12">
      <header className="sticky top-0 z-20 bg-background/85 backdrop-blur-xl border-b-[3px] border-ink">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center gap-4">
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

      <section className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        {records.length === 0 ? (
          <div className="pop-card p-10 text-center">
            <p className="font-display text-xl mb-2">Aucune situation enregistrée</p>
            <p className="text-sm font-semibold text-ink-soft">
              Lance une situation depuis la classe pour commencer à constituer un historique.
            </p>
          </div>
        ) : (
          <div className="pop-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table-auto w-full text-sm">
                <thead>
                  <tr className="bg-ink text-surface font-display text-[10px] uppercase tracking-widest">
                    <th className="text-left px-4 py-2.5 w-[140px]">Date</th>
                    <th className="text-left px-4 py-2.5">Contenus travaillés</th>
                    <th className="text-left px-4 py-2.5 w-[130px]">Progressions</th>
                    <th className="text-left px-4 py-2.5 w-[130px]">Difficultés</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => {
                    const d = new Date(r.date);
                    const dateStr = d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "2-digit" });
                    const timeStr = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
                    return (
                      <tr key={r.id} className="border-t-[2px] border-dashed border-ink/15 hover:bg-surface-2/50 transition-colors">
                        <td className="px-4 py-2.5 align-middle">
                          <div className="font-display text-sm leading-tight">{dateStr}</div>
                          <div className="text-[10px] font-bold uppercase tracking-widest text-ink-soft">{timeStr}</div>
                        </td>
                        <td className="px-4 py-2.5 align-middle">
                          <div className="flex flex-wrap gap-1.5">
                            {r.skillIds.map((id, i) => {
                              const dim = skillDim.get(id);
                              const chipColor = dim ? DIM_CHIP[dim] : "bg-ink text-surface";
                              return (
                                <span
                                  key={`${r.id}-${id}-${i}`}
                                  className={cn(
                                    "font-display text-[11px] px-2 py-0.5 rounded-full border-[2px] border-ink tracking-wider",
                                    chipColor
                                  )}
                                  title={id}
                                >
                                  {r.skillCodes[i] ?? id}
                                </span>
                              );
                            })}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 align-middle">
                          <span className="inline-flex items-center gap-1.5 font-display text-sm">
                            <TrendingUp size={14} strokeWidth={3} className="text-secondary" />
                            {r.progressed.length}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 align-middle">
                          <span className="inline-flex items-center gap-1.5 font-display text-sm">
                            <AlertTriangle size={14} strokeWidth={3} className="text-hot" />
                            {r.stagnated.length}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
