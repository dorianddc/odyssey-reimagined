// ============================================================================
// DataDashboard — Tableau de bord analytique interne (équivalent tableur)
// ----------------------------------------------------------------------------
// Remplace l'usage d'un Google Sheets externe. Calculs en temps réel à partir
// de useAppStore (studentsByClass, classes, situationHistory).
//
// Équivalences "tableur" :
//   SOMME / NB.VAL  -> reduce / length
//   MOYENNE         -> reduce / length
//   ARRONDI         -> Math.round(x * 10) / 10
//   SI              -> ternaire
//   NB.SI           -> filter(...).length
//   TRIS            -> sort()
//   FILTRES         -> filter() + <select>
//   Mise en forme conditionnelle -> classes Tailwind conditionnelles
//   GRAPHIQUES      -> Recharts (BarChart, LineChart)
// ============================================================================
import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft, BarChart3, ArrowUpDown, ArrowUp, ArrowDown,
  Users, Gauge, AlertTriangle, Crown, Database, Download, Upload,
} from "lucide-react";
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { useAppStore, LS_CLASSES, LS_STUDENTS, LS_HISTORY } from "@/store/AppStore";
import { useAudio } from "@/lib/audio";
import { cn } from "@/lib/utils";
import { type Student } from "@/data/curriculum";
import { AdvancedChartExplorer } from "@/components/dashboard/AdvancedChartExplorer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Analyses & Données — Défi Badminton" },
      { name: "description", content: "Tableau de bord analytique de la progression des élèves en EPS." },
    ],
  }),
  component: DataDashboard,
});

// ---------------------------------------------------------------------------
// Helpers — Biomes (cf. /parcours)
// ---------------------------------------------------------------------------
type BiomeKey = "Initiation" | "Maîtrise" | "Champion" | "Olympe";
const BIOME_RANGES: { key: BiomeKey; min: number; max: number; color: string }[] = [
  { key: "Initiation", min: 1,  max: 6,  color: "oklch(0.72 0.16 60)"  },
  { key: "Maîtrise",   min: 7,  max: 12, color: "oklch(0.75 0.05 240)" },
  { key: "Champion",   min: 13, max: 17, color: "oklch(0.82 0.18 95)"  },
  { key: "Olympe",     min: 18, max: 22, color: "oklch(0.78 0.14 320)" },
];
const countDifficulties = (s: Student) => (s.difficulties?.length ?? 0) + (s.stagnations?.length ?? 0);
const lastTierFor = (lvl: number): string => {
  const b = BIOME_RANGES.find((b) => lvl >= b.min && lvl <= b.max);
  return b ? `${b.key} (Nv ${b.min}-${b.max})` : "—";
};


type SortKey = "name" | "gender" | "level" | "diffs" | "tier";
type SortDir = "asc" | "desc";

function DataDashboard() {
  const { classes, studentsByClass, ensureClass, situationHistory } = useAppStore();
  const { setBgm } = useAudio();
  useEffect(() => { setBgm("hub"); }, [setBgm]);

  // Gate après mount pour éviter les mismatch d'hydratation (localStorage côté client uniquement)
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const [classId, setClassId] = useState<string>(classes[0]?.id ?? "");
  useEffect(() => { if (classId) ensureClass(classId); }, [classId, ensureClass]);
  useEffect(() => { if (!classId && classes[0]) setClassId(classes[0].id); }, [classes, classId]);

  const [genderFilter, setGenderFilter] = useState<"all" | "F" | "M">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "diff" | "ok">("all");

  const [sortKey, setSortKey] = useState<SortKey>("level");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(k); setSortDir("asc"); }
  };

  const students = studentsByClass[classId] || [];
  const cls = classes.find((c) => c.id === classId);
  const cycle = cls?.cycle ?? "cycle3";

  // KPIs
  const kpis = useMemo(() => {
    const effectif = students.length;
    const sumLevels = students.reduce((acc, s) => acc + s.level, 0);
    const avgLevel = effectif > 0 ? Math.round((sumLevels / effectif) * 10) / 10 : 0;
    const enAlerte = students.filter((s) => countDifficulties(s) >= 1).length;
    const maitrise = students.filter((s) => s.level > 12).length;
    const tauxMaitrise = effectif > 0 ? Math.round((maitrise / effectif) * 1000) / 10 : 0;
    return { effectif, avgLevel, enAlerte, tauxMaitrise };
  }, [students]);

  // Tableau
  const tableRows = useMemo(() => {
    const rows = students
      .filter((s) => genderFilter === "all" || s.gender === genderFilter)
      .filter((s) => {
        const n = countDifficulties(s);
        if (statusFilter === "diff") return n > 0;
        if (statusFilter === "ok") return n === 0;
        return true;
      })
      .map((s) => ({
        id: s.id, name: s.name, gender: s.gender, level: s.level,
        diffs: countDifficulties(s), tier: lastTierFor(s.level),
      }));
    rows.sort((a, b) => {
      const va = a[sortKey], vb = b[sortKey];
      const cmp = typeof va === "number" && typeof vb === "number"
        ? va - vb : String(va).localeCompare(String(vb), "fr");
      return sortDir === "asc" ? cmp : -cmp;
    });
    return rows;
  }, [students, genderFilter, statusFilter, sortKey, sortDir]);

  // BarChart : répartition par biome
  const biomeData = useMemo(() => BIOME_RANGES.map((b) => ({
    biome: b.key,
    eleves: students.filter((s) => s.level >= b.min && s.level <= b.max).length,
    color: b.color,
  })), [students]);

  // Helpers d'affichage
  const levelBadgeClass = (lvl: number) => {
    if (lvl < 6)  return "bg-hot/15 text-hot border-hot/40";
    if (lvl <= 15) return "bg-primary/15 text-primary border-primary/40";
    return "bg-gradient-sun text-ink border-ink shadow-[0_0_18px_oklch(0.85_0.18_85)]";
  };
  const rowAlertClass = (diffs: number) =>
    diffs > 2
      ? "bg-hot/8 [background-image:repeating-linear-gradient(45deg,transparent_0_8px,oklch(0.65_0.22_25/0.06)_8px_16px)]"
      : "";

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey !== k ? <ArrowUpDown size={12} className="opacity-50" />
      : sortDir === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />;

  return (
    <main className="min-h-screen px-4 md:px-8 py-8 md:py-12">
      <header className="max-w-7xl mx-auto mb-8 flex flex-wrap items-center gap-3">
        <Link to="/" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface border-[3px] border-ink shadow-pop-sm font-display uppercase text-xs hover:-translate-y-0.5 transition-transform">
          <ArrowLeft size={14} strokeWidth={3} /> Hub
        </Link>
        <div className="flex items-center gap-2">
          <BarChart3 className="text-primary" strokeWidth={3} />
          <h1 className="font-display text-3xl md:text-4xl tracking-wide">Analyses & Données</h1>
        </div>
        <div className="flex-1 h-1 bg-ink/10 rounded-full min-w-[40px]" />
        <Select value={classId} onValueChange={setClassId}>
          <SelectTrigger className="w-auto min-w-[170px] h-auto bg-surface border-[3px] border-ink rounded-xl px-3 py-2 font-display uppercase text-xs tracking-wider shadow-pop-sm hover:bg-surface-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-[2.5px] border-ink shadow-pop">
            {classes.map((c) => (
              <SelectItem key={c.id} value={c.id} className="font-display text-xs uppercase tracking-wider">
                {c.emoji} {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </header>

      {!mounted ? (
        <div className="max-w-7xl mx-auto py-20 text-center text-ink-soft font-semibold">Chargement…</div>
      ) : (
      <div className="max-w-7xl mx-auto space-y-8">
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard icon={<Users />} label="Effectif Total" value={kpis.effectif} sub="Équivalent NB.VAL / SOMME" tone="primary" />
          <KpiCard icon={<Gauge />} label="Niveau Moyen" value={kpis.avgLevel} sub="MOYENNE + ARRONDI(1)" tone="info" />
          <KpiCard icon={<AlertTriangle />} label="Élèves en Alerte" value={kpis.enAlerte} sub="NB.SI(difficultés ≥ 1)" tone="hot" />
          <KpiCard icon={<Crown />} label="Taux de Maîtrise" value={`${kpis.tauxMaitrise}%`} sub="SI(niveau > 12)" tone="gold" />
        </section>

        {/* Tableau */}
        <section className="rounded-[var(--radius)] border-[3px] border-ink bg-surface shadow-pop overflow-hidden">
          <div className="flex flex-wrap items-center gap-3 p-4 border-b-[3px] border-ink bg-surface-2">
            <h2 className="font-display text-xl tracking-wide flex items-center gap-2">
              <Users size={18} strokeWidth={3} className="text-primary" />
              Élèves de la classe
            </h2>
            <div className="flex-1" />
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-ink-soft">
              <span>Genre</span>
              <Select value={genderFilter} onValueChange={(v) => setGenderFilter(v as "all" | "F" | "M")}>
                <SelectTrigger className="w-auto min-w-[110px] h-auto bg-surface border-[2.5px] border-ink rounded-lg px-2 py-1.5 font-display uppercase text-[11px] tracking-wider shadow-pop-sm hover:bg-surface-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-[2.5px] border-ink shadow-pop">
                  <SelectItem value="all" className="font-display text-[11px] uppercase tracking-wider">Tous</SelectItem>
                  <SelectItem value="F" className="font-display text-[11px] uppercase tracking-wider">Filles</SelectItem>
                  <SelectItem value="M" className="font-display text-[11px] uppercase tracking-wider">Garçons</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-ink-soft">
              <span>Statut</span>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as "all" | "diff" | "ok")}>
                <SelectTrigger className="w-auto min-w-[160px] h-auto bg-surface border-[2.5px] border-ink rounded-lg px-2 py-1.5 font-display uppercase text-[11px] tracking-wider shadow-pop-sm hover:bg-surface-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-[2.5px] border-ink shadow-pop">
                  <SelectItem value="all" className="font-display text-[11px] uppercase tracking-wider">Tous</SelectItem>
                  <SelectItem value="diff" className="font-display text-[11px] uppercase tracking-wider">En difficulté</SelectItem>
                  <SelectItem value="ok" className="font-display text-[11px] uppercase tracking-wider">Sans difficulté</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 border-b-[3px] border-ink">
                <tr className="text-left font-display uppercase tracking-wider text-[11px]">
                  <Th onClick={() => toggleSort("name")}>Nom <SortIcon k="name" /></Th>
                  <Th onClick={() => toggleSort("gender")}>Genre <SortIcon k="gender" /></Th>
                  <Th onClick={() => toggleSort("level")}>Niveau Global <SortIcon k="level" /></Th>
                  <Th onClick={() => toggleSort("diffs")}>Difficultés <SortIcon k="diffs" /></Th>
                  <Th onClick={() => toggleSort("tier")}>Dernier Palier <SortIcon k="tier" /></Th>
                </tr>
              </thead>
              <tbody>
                {tableRows.length === 0 && (
                  <tr><td colSpan={5} className="p-8 text-center text-ink-soft font-semibold">
                    Aucun élève à afficher pour ces filtres.
                  </td></tr>
                )}
                {tableRows.map((r) => (
                  <tr key={r.id} className={cn("border-b border-ink/10 hover:bg-surface-2/60 transition-colors", rowAlertClass(r.diffs))}>
                    <td className="px-4 py-3 font-bold">{r.name}</td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border-2 border-ink",
                        r.gender === "F" ? "bg-pink-200/40 text-pink-800" : "bg-blue-200/40 text-blue-800")}>
                        {r.gender === "F" ? "Fille" : "Garçon"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-block px-2.5 py-1 rounded-lg text-xs font-display border-2", levelBadgeClass(r.level))}>
                        Nv {r.level}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-block px-2 py-0.5 rounded-md text-[11px] font-bold border-2 border-ink",
                        r.diffs === 0 ? "bg-emerald-200/50 text-emerald-900" :
                        r.diffs <= 2 ? "bg-amber-200/60 text-amber-900" : "bg-hot/20 text-hot")}>
                        {r.diffs}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink-soft font-semibold text-xs">{r.tier}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Graphiques */}
        <section className="grid grid-cols-1 gap-6">
          <div className="rounded-[var(--radius)] border-[3px] border-ink bg-surface shadow-pop p-5">
            <h3 className="font-display text-lg tracking-wide mb-1">Répartition par Biome</h3>
            <p className="text-xs text-ink-soft font-semibold mb-4">NB.SI(niveau ∈ [min, max]) pour chaque palier</p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={biomeData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.5 0 0 / 0.2)" />
                <XAxis dataKey="biome" tick={{ fontSize: 11, fontWeight: 700 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "oklch(0.18 0.02 240)", border: "3px solid oklch(0.1 0 0)", borderRadius: 12, fontWeight: 700 }} labelStyle={{ color: "oklch(0.95 0 0)" }} />
                <Bar dataKey="eleves" name="Élèves" radius={[8, 8, 0, 0]}>
                  {biomeData.map((b, i) => (<Cell key={i} fill={b.color} />))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Explorateur de données dynamique — remplace l'ancien "Suivi d'apprentissage" */}
          <AdvancedChartExplorer
            students={students}
            cycle={cycle}
            classId={classId}
            situationHistory={situationHistory}
          />
        </section>

        {/* Database Manager — sauvegarde / restauration JSON */}
        <DatabaseManager />

        <footer className="text-center text-[10px] text-ink-soft/70 font-semibold uppercase tracking-widest pt-2 pb-8">
          📊 Tableau de bord analytique · Données calculées en temps réel
        </footer>
      </div>
      )}
    </main>
  );
}

// ---------------------------------------------------------------------------
// DatabaseManager — Export / Import JSON des 3 clés du localStorage
// ---------------------------------------------------------------------------
function DatabaseManager() {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const handleExport = () => {
    try {
      const payload = {
        version: 1,
        exportedAt: new Date().toISOString(),
        [LS_CLASSES]: JSON.parse(localStorage.getItem(LS_CLASSES) || "null"),
        [LS_STUDENTS]: JSON.parse(localStorage.getItem(LS_STUDENTS) || "null"),
        [LS_HISTORY]: JSON.parse(localStorage.getItem(LS_HISTORY) || "null"),
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sauvegarde-odyssee-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      setMsg("✅ Sauvegarde exportée.");
    } catch (e) {
      setMsg("❌ Erreur lors de l'export.");
    }
  };

  const handleImportFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        if (!data || typeof data !== "object") throw new Error("Fichier invalide");
        const ok = window.confirm(
          "⚠️ Restaurer cette sauvegarde va ÉCRASER les données actuelles. Continuer ?"
        );
        if (!ok) return;
        // Écrase chacune des 3 clés (si présentes dans le fichier)
        if (data[LS_CLASSES] !== undefined) localStorage.setItem(LS_CLASSES, JSON.stringify(data[LS_CLASSES]));
        if (data[LS_STUDENTS] !== undefined) localStorage.setItem(LS_STUDENTS, JSON.stringify(data[LS_STUDENTS]));
        if (data[LS_HISTORY] !== undefined) localStorage.setItem(LS_HISTORY, JSON.stringify(data[LS_HISTORY]));
        setMsg("✅ Restauration OK — rechargement…");
        setTimeout(() => window.location.reload(), 400);
      } catch {
        setMsg("❌ Fichier JSON invalide.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <section className="rounded-[var(--radius)] border-[3px] border-ink bg-surface shadow-pop p-5">
      <div className="flex items-center gap-2 mb-3">
        <Database className="text-primary" strokeWidth={3} size={20} />
        <h3 className="font-display text-lg tracking-wide">Gestionnaire de base (Sauvegarde / Restauration)</h3>
      </div>
      <p className="text-xs text-ink-soft font-semibold mb-4">
        Exporte ou restaure les 3 clés persistées (classes, élèves, historique des situations) en un fichier JSON unique.
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground border-[3px] border-ink shadow-pop-sm font-display uppercase text-xs tracking-wider hover:-translate-y-0.5 transition-transform"
        >
          <Download size={14} strokeWidth={3} /> Exporter la base (JSON)
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface border-[3px] border-ink shadow-pop-sm font-display uppercase text-xs tracking-wider hover:-translate-y-0.5 transition-transform"
        >
          <Upload size={14} strokeWidth={3} /> Restaurer la base (JSON)
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleImportFile(f);
            e.target.value = "";
          }}
        />
      </div>
      {msg && <div className="mt-3 text-sm font-semibold">{msg}</div>}
    </section>
  );
}

// ---------------------------------------------------------------------------
function KpiCard({
  icon, label, value, sub, tone,
}: { icon: React.ReactNode; label: string; value: string | number; sub: string; tone: "primary" | "info" | "hot" | "gold"; }) {
  const toneCls: Record<string, string> = {
    primary: "from-primary/30 to-primary/5 text-primary",
    info:    "from-sky-400/30 to-sky-400/5 text-sky-500",
    hot:     "from-hot/30 to-hot/5 text-hot",
    gold:    "from-amber-300/40 to-amber-300/5 text-amber-600",
  };
  return (
    <div className="rounded-[var(--radius)] border-[3px] border-ink bg-surface shadow-pop p-5 relative overflow-hidden">
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-60 pointer-events-none", toneCls[tone])} />
      <div className="relative">
        <div className="flex items-center gap-2 mb-2">
          <div className={cn("w-9 h-9 grid place-items-center rounded-xl border-2 border-ink bg-surface", toneCls[tone].split(" ").pop())}>
            {icon}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-ink-soft">{label}</span>
        </div>
        <div className="font-display text-4xl tracking-tight leading-none">{value}</div>
        <div className="text-[10px] text-ink-soft/80 mt-1.5 font-mono">{sub}</div>
      </div>
    </div>
  );
}

function Th({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <th onClick={onClick} className="px-4 py-3 cursor-pointer select-none hover:bg-surface/60 transition-colors">
      <span className="inline-flex items-center gap-1.5">{children}</span>
    </th>
  );
}
