// Class roster — grid of student "trading cards", click to open profile.
import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Search, SortAsc, SortDesc, Users, Filter, Plus, Trash2, X, Map as MapIcon, UserPlus, Flag, AlertTriangle, History } from "lucide-react";
import { useAppStore } from "@/store/AppStore";
import { useAudio } from "@/lib/audio";
import { AvatarBlob } from "@/components/game/AvatarBlob";
import { PopButton } from "@/components/game/PopButton";
import { DifficultyDot } from "@/components/game/DifficultyDot";
import { getRankBadge, MAX_LEVEL, CURRICULUM, RANK_TIERS, tierForLevel, getCycleVocab, type DimensionKey } from "@/data/curriculum";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/class/$classId/")({
  component: ClassRoster,
});

function ClassRoster() {
  const { classId } = Route.useParams();
  const navigate = useNavigate();
  const { classes, studentsByClass, ensureClass, addStudent, removeStudent } = useAppStore();
  const cls = classes.find((c) => c.id === classId);

  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<"name" | "level">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [genderFilter, setGenderFilter] = useState<"All" | "F" | "M">("All");

  // Pédagogical filters
  const [dimFilter, setDimFilter] = useState<"all" | DimensionKey>("all");
  const [urgencyFilter, setUrgencyFilter] = useState<"all" | "high" | "low">("all");
  const [skillFilter, setSkillFilter] = useState<string>("all");

  const [openAdd, setOpenAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newGender, setNewGender] = useState<"F" | "M">("F");
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const { setBgm } = useAudio();
  useEffect(() => { setBgm("class"); }, [setBgm]);

  useEffect(() => {
    if (classId) ensureClass(classId);
  }, [classId, ensureClass]);

  const students = studentsByClass[classId] || [];
  const studentToDelete = students.find((s) => s.id === confirmDel);

  // List of skills available for the filter dropdown (depends on cycle)
  const skillsCatalog = useMemo(() => {
    if (!cls) return [];
    const cats = CURRICULUM[cls.cycle].categories;
    return (Object.keys(cats) as DimensionKey[]).flatMap((dim) =>
      cats[dim].skills.map((s) => ({ id: s.id, code: s.code, dimension: dim, name: s.name }))
    );
  }, [cls]);

  const filtered = useMemo(() => {
    const list = students
      .filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
      .filter((s) => genderFilter === "All" || s.gender === genderFilter)
      .filter((s) => {
        const diffs = s.difficulties || [];
        if (dimFilter !== "all" && !diffs.some((d) => d.dimension === dimFilter)) return false;
        if (urgencyFilter === "high" && !diffs.some((d) => d.currentLevel <= 2)) return false;
        if (urgencyFilter === "low" && !diffs.some((d) => d.currentLevel >= 3)) return false;
        if (skillFilter !== "all" && !diffs.some((d) => d.skillId === skillFilter)) return false;
        return true;
      });
    list.sort((a, b) => {
      let va: string | number = a[sortKey];
      let vb: string | number = b[sortKey];
      if (typeof va === "string") {
        va = va.toLowerCase();
        vb = (vb as string).toLowerCase();
      }
      return sortOrder === "asc" ? (va > vb ? 1 : -1) : va < vb ? 1 : -1;
    });
    return list;
  }, [students, search, genderFilter, sortKey, sortOrder, dimFilter, urgencyFilter, skillFilter]);

  const anyPedagogicalFilter = dimFilter !== "all" || urgencyFilter !== "all" || skillFilter !== "all";

  const handleConfirmAdd = () => {
    if (!newName.trim()) return;
    addStudent(classId, { name: newName.trim(), gender: newGender });
    setNewName("");
    setNewGender("F");
    setOpenAdd(false);
  };

  if (!cls) {
    return (
      <main className="min-h-screen grid place-items-center p-8">
        <div className="pop-card p-8 text-center">
          <p className="font-display text-3xl">Classe introuvable</p>
          <PopButton variant="primary" onClick={() => navigate({ to: "/" })} className="mt-4">
            Retour au hub
          </PopButton>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-20">
      <header className="sticky top-0 z-20 bg-background/85 backdrop-blur-xl border-b-[3px] border-ink">
        <div className="w-full max-w-[95vw] mx-auto px-4 md:px-6 py-4 flex flex-wrap items-center gap-4 justify-between">
          <div className="flex items-center gap-4">
            <PopButton variant="ghost" size="sm" onClick={() => navigate({ to: "/" })}>
              <ArrowLeft size={16} strokeWidth={3} /> Hub
            </PopButton>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl border-[3px] border-ink bg-gradient-sun grid place-items-center font-display text-xl shadow-pop-sm">
                {cls.id.slice(0, 3)}
              </div>
              <div>
                <h1 className="font-display text-2xl md:text-3xl leading-none">{cls.name}</h1>
                <span className="text-[10px] font-bold uppercase tracking-widest text-ink-soft">
                  {cls.cycle === "cycle3" ? "Cycle 3 · 6ᵉ" : "Cycle 4 · 5ᵉ→3ᵉ"} · {students.length} élèves
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <PopButton variant="hot" size="sm" onClick={() => navigate({ to: "/class/$classId/situation", params: { classId } })}>
              <Flag size={14} strokeWidth={3} /> Situation
            </PopButton>
            <PopButton variant="ghost" size="sm" onClick={() => navigate({ to: "/class/$classId/historique", params: { classId } })}>
              <History size={14} strokeWidth={3} /> Historique
            </PopButton>
            <PopButton variant="accent" size="sm" onClick={() => navigate({ to: "/class/$classId/parcours", params: { classId } })}>
              <MapIcon size={14} strokeWidth={3} /> Parcours
            </PopButton>
            <PopButton variant="primary" size="sm" onClick={() => setOpenAdd(true)}>
              <UserPlus size={14} strokeWidth={3} /> Élève
            </PopButton>
          </div>

          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-soft" size={18} strokeWidth={3} />
            <input
              type="text"
              placeholder="Rechercher un élève..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface border-[3px] border-ink rounded-2xl py-3 pl-12 pr-4 text-sm font-semibold placeholder:text-ink-soft/60 focus:outline-none focus:ring-4 focus:ring-primary/40 shadow-pop-sm"
            />
          </div>
        </div>

        <div className="w-full max-w-[95vw] mx-auto px-4 md:px-6 pb-4 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase text-ink-soft mr-1">
            <Filter size={14} strokeWidth={3} /> Tri
          </span>
          {([
            { k: "name", label: "A-Z" },
            { k: "level", label: "Niveau" },
          ] as const).map((opt) => (
            <button
              key={opt.k}
              onClick={() => setSortKey(opt.k)}
              className={cn(
                "px-3 py-1.5 rounded-xl border-[2.5px] border-ink font-display text-xs tracking-widest transition-all",
                sortKey === opt.k ? "bg-secondary text-secondary-foreground shadow-pop-sm" : "bg-surface hover:bg-surface-2"
              )}
            >
              {opt.label}
            </button>
          ))}
          <button
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="px-2.5 py-1.5 rounded-xl border-[2.5px] border-ink bg-surface hover:bg-surface-2"
            aria-label="Inverser l'ordre"
          >
            {sortOrder === "asc" ? <SortAsc size={14} strokeWidth={3} /> : <SortDesc size={14} strokeWidth={3} />}
          </button>

          <span className="ml-3 inline-flex items-center gap-1.5 text-xs font-bold uppercase text-ink-soft mr-1">
            <Users size={14} strokeWidth={3} /> Filtre
          </span>
          {(["All", "F", "M"] as const).map((g) => (
            <button
              key={g}
              onClick={() => setGenderFilter(g)}
              className={cn(
                "px-3 py-1.5 rounded-xl border-[2.5px] border-ink font-display text-xs tracking-widest transition-all",
                genderFilter === g
                  ? g === "F"
                    ? "bg-hot text-hot-foreground shadow-pop-sm"
                    : g === "M"
                      ? "bg-secondary text-secondary-foreground shadow-pop-sm"
                      : "bg-primary text-primary-foreground shadow-pop-sm"
                  : "bg-surface hover:bg-surface-2"
              )}
            >
              {g === "All" ? "Tous" : g === "F" ? "Filles" : "Garçons"}
            </button>
          ))}
        </div>

        <div className="w-full max-w-[95vw] mx-auto px-4 md:px-6 pb-4 flex flex-wrap items-center gap-2 border-t-2 border-dashed border-ink/15 pt-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase text-ink-soft mr-1">
            <AlertTriangle size={14} strokeWidth={3} /> Filtres pédago
          </span>

          {/* Dimension */}
          {([
            { k: "all", label: "Toutes", cls: "bg-surface" },
            { k: "moteur", label: "Moteur", cls: "bg-[oklch(0.65_0.22_25)] text-white" },
            { k: "methodo", label: "Méthodo", cls: "bg-[oklch(0.82_0.18_115)] text-ink" },
            { k: "social", label: "Social", cls: "bg-[oklch(0.65_0.18_240)] text-white" },
          ] as const).map((opt) => (
            <button
              key={opt.k}
              onClick={() => setDimFilter(opt.k as typeof dimFilter)}
              className={cn(
                "px-3 py-1.5 rounded-xl border-[2.5px] border-ink font-display text-xs tracking-widest transition-all",
                dimFilter === opt.k ? `${opt.cls} shadow-pop-sm` : "bg-surface hover:bg-surface-2"
              )}
            >
              {opt.label}
            </button>
          ))}

          <span className="ml-3 inline-flex items-center gap-1.5 text-xs font-bold uppercase text-ink-soft mr-1">Urgence</span>
          {([
            { k: "all", label: "Toutes" },
            { k: "high", label: "N≤2" },
            { k: "low", label: "N≥3" },
          ] as const).map((opt) => (
            <button
              key={opt.k}
              onClick={() => setUrgencyFilter(opt.k as typeof urgencyFilter)}
              className={cn(
                "px-3 py-1.5 rounded-xl border-[2.5px] border-ink font-display text-xs tracking-widest transition-all",
                urgencyFilter === opt.k ? "bg-hot text-hot-foreground shadow-pop-sm" : "bg-surface hover:bg-surface-2"
              )}
            >
              {opt.label}
            </button>
          ))}

          <select
            value={skillFilter}
            onChange={(e) => setSkillFilter(e.target.value)}
            className="ml-2 px-3 py-1.5 rounded-xl border-[2.5px] border-ink bg-surface font-display text-xs tracking-widest"
          >
            <option value="all">Toute compétence</option>
            {skillsCatalog.map((s) => (
              <option key={s.id} value={s.id}>{s.code} · {s.dimension}</option>
            ))}
          </select>

          {anyPedagogicalFilter && (
            <button
              onClick={() => { setDimFilter("all"); setUrgencyFilter("all"); setSkillFilter("all"); }}
              className="ml-1 px-2.5 py-1.5 rounded-xl border-[2.5px] border-ink bg-surface hover:bg-surface-2 inline-flex items-center gap-1 text-xs font-display"
              aria-label="Réinitialiser filtres"
            >
              <X size={12} strokeWidth={3} /> Réinit.
            </button>
          )}
        </div>
      </header>

      {(() => {
        const renderCard = (s: typeof filtered[number], i: number) => {
          const rank = getRankBadge(s.level);
          const pct = Math.min(100, Math.round((s.level / MAX_LEVEL) * 100));
          return (
            <div
              key={s.id}
              className="pop-card-interactive p-3 text-center group animate-pop-in relative"
              style={{ animationDelay: `${Math.min(i * 15, 400)}ms` }}
              onClick={() => navigate({ to: "/class/$classId/student/$studentId", params: { classId, studentId: s.id } })}
            >
              <button
                onClick={(e) => { e.stopPropagation(); setConfirmDel(s.id); }}
                className="absolute top-1.5 right-1.5 z-10 w-6 h-6 grid place-items-center rounded-full bg-surface border-[2px] border-ink shadow-pop-sm hover:bg-hot hover:text-hot-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label={`Supprimer ${s.name}`}
                title="Supprimer l'élève"
              >
                <Trash2 size={10} strokeWidth={3} />
              </button>

              {s.difficulties && s.difficulties.length > 0 && (
                <div className="absolute top-1.5 left-1.5 z-10 flex flex-col items-start gap-1 max-w-[60%] pointer-events-none">
                  <div className="flex flex-wrap gap-0.5">
                    {s.difficulties.slice(0, 3).map((d) => (
                      <DifficultyDot key={d.id} difficulty={d} />
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-center mb-2">
                <AvatarBlob name={s.name} hue={s.avatarHue} size={48} rank={rank.tier} />
              </div>
              <h3 className="font-display text-sm leading-none truncate">{s.name}</h3>
              <span className="text-[9px] font-bold uppercase tracking-widest text-ink-soft">
                {rank.emoji} {rank.label}
              </span>

              <div className="mt-2 h-1.5 rounded-full bg-muted border-2 border-ink overflow-hidden">
                <div className="h-full bg-gradient-sun transition-all" style={{ width: `${pct}%` }} />
              </div>
              <div className="mt-1 flex justify-between items-center text-[9px] font-bold">
                <span className="text-ink-soft">N{s.level}</span>
                <span className="text-primary">/{MAX_LEVEL}</span>
              </div>
            </div>
          );
        };

        const gridCls = "grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-3";

        if (sortKey === "level" && filtered.length > 0) {
          return (
            <section className="w-full max-w-[95vw] mx-auto px-4 md:px-6 py-6 space-y-6">
              {RANK_TIERS.map((tier) => {
                const group = filtered.filter((s) => s.level >= tier.range[0] && s.level <= tier.range[1]);
                if (group.length === 0) return null;
                return (
                  <div key={tier.tier}>
                    <div className={cn("flex items-center gap-3 mb-3 px-4 py-2 rounded-2xl border-[3px] border-ink shadow-pop-sm", tier.headerCls)}>
                      <span className="text-2xl" aria-hidden>{tier.emoji}</span>
                      <h2 className="font-display text-xl md:text-2xl tracking-wider uppercase">{tier.label}</h2>
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">
                        Niv {tier.range[0]}–{tier.range[1]}
                      </span>
                      <span className="ml-auto font-display text-sm">
                        {group.length} élève{group.length > 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className={gridCls}>
                      {group.map((s, i) => renderCard(s, i))}
                    </div>
                  </div>
                );
              })}
              <button
                onClick={() => setOpenAdd(true)}
                className="w-full rounded-[var(--radius)] border-[3px] border-dashed border-ink/40 bg-surface/50 hover:bg-surface hover:border-ink py-6 grid place-items-center group transition-all hover:shadow-pop-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl border-[3px] border-ink bg-primary text-primary-foreground grid place-items-center shadow-pop-sm group-hover:rotate-90 transition-transform">
                    <Plus size={18} strokeWidth={3} />
                  </div>
                  <p className="font-display text-base tracking-wide">Nouvel élève</p>
                </div>
              </button>
            </section>
          );
        }

        return (
          <section className={cn("w-full max-w-[95vw] mx-auto px-4 md:px-6 py-6", gridCls)}>
            {filtered.map((s, i) => renderCard(s, i))}

            <button
              onClick={() => setOpenAdd(true)}
              className="rounded-[var(--radius)] border-[3px] border-dashed border-ink/40 bg-surface/50 hover:bg-surface hover:border-ink min-h-[155px] grid place-items-center group transition-all hover:shadow-pop-sm"
            >
              <div className="text-center">
                <div className="w-10 h-10 mx-auto rounded-2xl border-[3px] border-ink bg-primary text-primary-foreground grid place-items-center shadow-pop-sm group-hover:rotate-90 transition-transform">
                  <Plus size={18} strokeWidth={3} />
                </div>
                <p className="mt-1.5 font-display text-sm tracking-wide">Nouvel élève</p>
              </div>
            </button>

            {filtered.length === 0 && students.length > 0 && (
              <div className="col-span-full text-center py-16 font-semibold text-ink-soft">
                Aucun élève ne correspond à ces filtres.
              </div>
            )}
            {students.length === 0 && (
              <div className="col-span-full text-center py-16 font-semibold text-ink-soft">
                Aucun élève dans cette classe. Cliquez sur « Nouvel élève » pour commencer.
              </div>
            )}
          </section>
        );
      })()}

      <button
        onClick={() => setOpenAdd(true)}
        className="fixed bottom-6 right-6 z-30 w-16 h-16 rounded-full bg-primary text-primary-foreground border-[3px] border-ink shadow-pop hover:-translate-y-1 hover:shadow-pop-lg active:translate-y-1 active:shadow-pop-sm transition-all grid place-items-center"
        aria-label="Ajouter un élève"
        title="Ajouter un élève"
      >
        <UserPlus size={26} strokeWidth={3} />
      </button>

      <Dialog open={openAdd} onOpenChange={setOpenAdd}>
        <DialogContent className="bg-surface border-[3px] border-ink shadow-pop rounded-[var(--radius)]">
          <DialogHeader>
            <DialogTitle className="font-display text-3xl tracking-wide flex items-center gap-2">
              <UserPlus className="text-primary" strokeWidth={3} /> Nouvel élève
            </DialogTitle>
            <DialogDescription className="font-semibold text-ink-soft">
              Ajout dans la classe {cls.name}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-ink-soft block mb-1.5">Prénom</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleConfirmAdd()}
                placeholder="ex. Lucas, Sarah..."
                className="w-full bg-surface-2 border-[3px] border-ink rounded-2xl py-3 px-4 text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-primary/40"
                autoFocus
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-ink-soft block mb-1.5">Genre</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setNewGender("F")}
                  className={cn(
                    "px-3 py-3 rounded-2xl border-[3px] border-ink font-display tracking-wider uppercase text-sm transition-all",
                    newGender === "F" ? "bg-hot text-hot-foreground shadow-pop-sm" : "bg-surface-2 hover:bg-muted"
                  )}
                >
                  Fille
                </button>
                <button
                  onClick={() => setNewGender("M")}
                  className={cn(
                    "px-3 py-3 rounded-2xl border-[3px] border-ink font-display tracking-wider uppercase text-sm transition-all",
                    newGender === "M" ? "bg-secondary text-secondary-foreground shadow-pop-sm" : "bg-surface-2 hover:bg-muted"
                  )}
                >
                  Garçon
                </button>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <PopButton variant="ghost" size="sm" onClick={() => setOpenAdd(false)}>
              <X size={14} strokeWidth={3} /> Annuler
            </PopButton>
            <PopButton variant="primary" size="sm" onClick={handleConfirmAdd} disabled={!newName.trim()}>
              <Plus size={14} strokeWidth={3} /> Ajouter
            </PopButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDel} onOpenChange={(o) => !o && setConfirmDel(null)}>
        <AlertDialogContent className="bg-surface border-[3px] border-ink shadow-pop rounded-[var(--radius)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-2xl tracking-wide">
              Supprimer {studentToDelete?.name} ?
            </AlertDialogTitle>
            <AlertDialogDescription className="font-semibold text-ink-soft">
              Cette action est définitive. Toutes les évaluations de cet élève seront perdues.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[3px] border-ink rounded-2xl font-display uppercase">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (confirmDel) removeStudent(classId, confirmDel); setConfirmDel(null); }}
              className="bg-hot text-hot-foreground border-[3px] border-ink rounded-2xl font-display uppercase shadow-pop-sm"
            >
              <Trash2 size={14} strokeWidth={3} className="mr-1.5" /> Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
