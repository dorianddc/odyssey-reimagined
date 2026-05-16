// ============================================================================
// AdvancedChartExplorer — Explorateur de données dynamique pour le Dashboard.
// ----------------------------------------------------------------------------
// 4 manettes (xAxis / yMetric / filterSkill / filterGender) qui croisent les
// variables de l'AppStore (studentsByClass + situationHistory) et choisissent
// automatiquement le bon type de graphique Recharts.
//
// Règle stricte axe Y : `allowDecimals={false}` + `domain={[0, 'dataMax + 2']}`.
// On ne coupe pas un élève en deux et l'échelle s'adapte au max réel.
// ============================================================================
import { useMemo, useState as useStateLocal } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  CURRICULUM, findSkillMeta, getCycleVocab,
  type Cycle, type Student, type DimensionKey,
} from "@/data/curriculum";
import type { SituationRecord } from "@/store/AppStore";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type XAxisKey = "chronology" | "gender" | "dimension" | "biome";
type YMetric = "progressedCount" | "stagnationCount" | "averageLevel";
type GenderFilter = "all" | "F" | "M";

const X_OPTIONS: { value: XAxisKey; label: string }[] = [
  { value: "chronology", label: "Chronologie (situations)" },
  { value: "gender", label: "Genre (Filles vs Garçons)" },
  { value: "dimension", label: "Dimension (Moteur / Méthodo / Social)" },
  { value: "biome", label: "Biome (paliers de niveau)" },
];
const Y_OPTIONS: { value: YMetric; label: string; unit: string; short: string }[] = [
  { value: "progressedCount", label: "Nombre d'élèves ayant progressé", unit: "élève", short: "progressés" },
  { value: "stagnationCount", label: "Nombre d'élèves en difficulté / stagnation", unit: "élève", short: "en difficulté" },
  { value: "averageLevel",    label: "Niveau global moyen", unit: "niveau", short: "niveau moyen" },
];
const DIM_LABEL: Record<DimensionKey, string> = {
  moteur: "Motrice", methodo: "Méthodologique", social: "Sociale",
  technique: "Technique", deplacement: "Déplacement", tactique: "Tactique",
};
const DIM_COLOR: Record<DimensionKey, string> = {
  moteur:      "oklch(0.65 0.22 25)",
  methodo:     "oklch(0.78 0.18 115)",
  social:      "oklch(0.65 0.18 240)",
  technique:   "oklch(0.65 0.22 25)",
  deplacement: "oklch(0.65 0.22 25)",
  tactique:    "oklch(0.72 0.20 45)",
};
const BIOMES: { key: string; min: number; max: number; color: string }[] = [
  { key: "Initiation", min: 1,  max: 6,  color: "oklch(0.72 0.16 60)"  },
  { key: "Maîtrise",   min: 7,  max: 12, color: "oklch(0.75 0.05 240)" },
  { key: "Champion",   min: 13, max: 17, color: "oklch(0.82 0.18 95)"  },
  { key: "Olympe",     min: 18, max: 22, color: "oklch(0.78 0.14 320)" },
];
const GENDER_COLOR = { F: "oklch(0.72 0.18 350)", M: "oklch(0.65 0.18 240)" } as const;
const PRIMARY_COLOR = "oklch(0.65 0.18 240)";

const round1 = (n: number) => Math.round(n * 10) / 10;

interface Props {
  students: Student[];
  cycle: Cycle;
  classId: string;
  situationHistory: SituationRecord[];
}

export function AdvancedChartExplorer({ students, cycle, classId, situationHistory }: Props) {
  const [xAxis, setXAxis] = useStateLocal<XAxisKey>("chronology");
  const [yMetric, setYMetric] = useStateLocal<YMetric>("progressedCount");
  const [filterSkill, setFilterSkill] = useStateLocal<string>("all");
  const [filterGender, setFilterGender] = useStateLocal<GenderFilter>("all");

  const skillOptions = useMemo(() => {
    const cats = CURRICULUM[cycle]?.categories;
    if (!cats) return [];
    return (Object.keys(cats) as DimensionKey[]).flatMap((d) =>
      cats[d].skills.map((s) => ({ id: s.id, code: s.code, name: s.name, dim: d })),
    );
  }, [cycle]);

  const skillMeta = filterSkill === "all" ? null : findSkillMeta(cycle, filterSkill);
  const effectiveSkill = skillMeta ? filterSkill : "all";

  const baseStudents = useMemo(
    () => students.filter((s) => filterGender === "all" || s.gender === filterGender),
    [students, filterGender],
  );
  const studentById = useMemo(() => {
    const m = new Map<string, Student>();
    students.forEach((s) => m.set(s.id, s));
    return m;
  }, [students]);

  const records = useMemo(
    () => situationHistory
      .filter((r) => r.classId === classId)
      .slice()
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [situationHistory, classId],
  );

  const studentMatchesSkillFilter = (s: Student) => {
    if (effectiveSkill === "all") return true;
    return (s.difficulties || []).some((d) => d.skillId === effectiveSkill)
        || (s.skillStates?.[effectiveSkill] ?? 0) > 0;
  };
  const isStudentInDifficulty = (s: Student): boolean => {
    if (effectiveSkill === "all") return (s.difficulties?.length ?? 0) > 0;
    return (s.difficulties || []).some((d) => d.skillId === effectiveSkill);
  };
  const isStudentInDifficultyOnDim = (s: Student, dim: DimensionKey): boolean => {
    return (s.difficulties || []).some((d) => {
      if (effectiveSkill !== "all" && d.skillId !== effectiveSkill) return false;
      return d.dimension === dim;
    });
  };
  const skillStarsForDim = (s: Student, dim: DimensionKey): number[] => {
    const cats = CURRICULUM[cycle]?.categories;
    if (!cats) return [];
    return cats[dim].skills.map((sk) => s.skillStates?.[sk.id] ?? 0);
  };

  type Row = { name: string; value: number; color?: string };
  const chartData: Row[] = useMemo(() => {
    if (xAxis === "chronology") {
      return records.map((r, i) => {
        const label = `S${i + 1} · ${new Date(r.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}`;
        const prog = r.progressed.filter((p) => {
          if (effectiveSkill !== "all" && p.skillId !== effectiveSkill) return false;
          if (filterGender !== "all") {
            const stu = studentById.get(p.studentId);
            if (!stu || stu.gender !== filterGender) return false;
          }
          return true;
        });
        const stag = r.stagnated.filter((p) => {
          if (effectiveSkill !== "all" && p.skillId !== effectiveSkill) return false;
          if (filterGender !== "all") {
            const stu = studentById.get(p.studentId);
            if (!stu || stu.gender !== filterGender) return false;
          }
          return true;
        });
        let value = 0;
        if (yMetric === "progressedCount") {
          value = new Set(prog.map((p) => p.studentId)).size;
        } else if (yMetric === "stagnationCount") {
          value = new Set(stag.map((p) => p.studentId)).size;
        } else {
          const ids = new Set<string>([...prog.map((p) => p.studentId), ...stag.map((p) => p.studentId)]);
          const lvls = [...ids].map((id) => studentById.get(id)?.level).filter((n): n is number => typeof n === "number");
          value = lvls.length ? round1(lvls.reduce((a, b) => a + b, 0) / lvls.length) : 0;
        }
        return { name: label, value };
      });
    }

    if (xAxis === "gender") {
      const groups: Array<{ key: "F" | "M"; label: string }> = [
        { key: "F", label: "Filles" }, { key: "M", label: "Garçons" },
      ];
      return groups
        .filter((g) => filterGender === "all" || filterGender === g.key)
        .map((g) => {
          const list = students.filter((s) => s.gender === g.key && studentMatchesSkillFilter(s));
          let value = 0;
          if (yMetric === "progressedCount") {
            const ids = new Set<string>();
            records.forEach((r) => r.progressed.forEach((p) => {
              if (effectiveSkill !== "all" && p.skillId !== effectiveSkill) return;
              const stu = studentById.get(p.studentId);
              if (stu && stu.gender === g.key) ids.add(p.studentId);
            }));
            value = ids.size;
          } else if (yMetric === "stagnationCount") {
            value = list.filter(isStudentInDifficulty).length;
          } else {
            value = list.length ? round1(list.reduce((a, s) => a + s.level, 0) / list.length) : 0;
          }
          return { name: g.label, value, color: GENDER_COLOR[g.key] };
        });
    }

    if (xAxis === "dimension") {
      const dims: DimensionKey[] = skillMeta ? [skillMeta.dimension] : ["moteur", "methodo", "social"];
      return dims.map((d) => {
        let value = 0;
        if (yMetric === "progressedCount") {
          const ids = new Set<string>();
          records.forEach((r) => r.progressed.forEach((p) => {
            const meta = findSkillMeta(cycle, p.skillId);
            if (!meta || meta.dimension !== d) return;
            if (effectiveSkill !== "all" && p.skillId !== effectiveSkill) return;
            const stu = studentById.get(p.studentId);
            if (!stu) return;
            if (filterGender !== "all" && stu.gender !== filterGender) return;
            ids.add(p.studentId);
          }));
          value = ids.size;
        } else if (yMetric === "stagnationCount") {
          value = baseStudents.filter((s) => isStudentInDifficultyOnDim(s, d)).length;
        } else {
          const stars = baseStudents.flatMap((s) => skillStarsForDim(s, d));
          value = stars.length ? round1(stars.reduce((a, b) => a + b, 0) / stars.length) : 0;
        }
        return { name: DIM_LABEL[d], value, color: DIM_COLOR[d] };
      });
    }

    return BIOMES.map((b) => {
      const list = baseStudents.filter((s) => s.level >= b.min && s.level <= b.max && studentMatchesSkillFilter(s));
      let value = 0;
      if (yMetric === "progressedCount") {
        const ids = new Set<string>();
        const listIds = new Set(list.map((s) => s.id));
        records.forEach((r) => r.progressed.forEach((p) => {
          if (!listIds.has(p.studentId)) return;
          if (effectiveSkill !== "all" && p.skillId !== effectiveSkill) return;
          ids.add(p.studentId);
        }));
        value = ids.size;
      } else if (yMetric === "stagnationCount") {
        value = list.filter(isStudentInDifficulty).length;
      } else {
        value = list.length ? round1(list.reduce((a, s) => a + s.level, 0) / list.length) : 0;
      }
      return { name: b.key, value, color: b.color };
    });
  }, [xAxis, yMetric, effectiveSkill, filterGender, baseStudents, students, records, studentById, cycle, skillMeta]);

  const yMeta = Y_OPTIONS.find((o) => o.value === yMetric)!;
  const skillLabel = skillMeta ? `${skillMeta.skill.code} · ${skillMeta.skill.name}` : "toutes compétences";
  const genderLabel = filterGender === "all" ? "tous élèves" : (filterGender === "F" ? "Filles" : "Garçons");
  const xLabel = X_OPTIONS.find((o) => o.value === xAxis)!.label;
  const title = `${yMeta.label} — ${xLabel} · ${skillLabel} · ${genderLabel}`;

  const isEmpty = chartData.length === 0 || chartData.every((d) => d.value === 0);
  const yUnitFormatter = (v: number) => {
    if (yMetric === "averageLevel") return `${v} ${yMeta.unit}`;
    return `${v} ${yMeta.unit}${v > 1 ? "s" : ""}`;
  };

  return (
    <div className="rounded-[var(--radius)] border-[3px] border-ink bg-surface shadow-pop p-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Field label="Axe horizontal (X)">
          <select value={xAxis} onChange={(e) => setXAxis(e.target.value as XAxisKey)} className={selectCls}>
            {X_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </Field>
        <Field label="Métrique (Y)">
          <select value={yMetric} onChange={(e) => setYMetric(e.target.value as YMetric)} className={selectCls}>
            {Y_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </Field>
        <Field label="Compétence ciblée">
          <select value={filterSkill} onChange={(e) => setFilterSkill(e.target.value)} className={selectCls}>
            <option value="all">Toutes les compétences</option>
            {skillOptions.map((s) => (
              <option key={s.id} value={s.id}>{s.code} · {s.name.slice(0, 40)}{s.name.length > 40 ? "…" : ""}</option>
            ))}
          </select>
        </Field>
        <Field label="Genre">
          <select value={filterGender} onChange={(e) => setFilterGender(e.target.value as GenderFilter)} className={selectCls}>
            <option value="all">Tous les élèves</option>
            <option value="F">Filles uniquement</option>
            <option value="M">Garçons uniquement</option>
          </select>
        </Field>
      </div>

      <h3 className="font-display text-base md:text-lg tracking-wide leading-tight mb-1">{title}</h3>
      <p className="text-[11px] text-ink-soft font-semibold mb-4 uppercase tracking-widest">
        Croisement temps réel · type de graphique adapté à la requête
      </p>

      {isEmpty ? (
        <div className="h-[300px] grid place-items-center text-ink-soft font-semibold text-sm">
          Aucune donnée à afficher pour cette combinaison de filtres.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          {renderChart(xAxis, chartData, yMeta, yUnitFormatter)}
        </ResponsiveContainer>
      )}
    </div>
  );
}

function renderChart(
  xAxis: XAxisKey,
  data: { name: string; value: number; color?: string }[],
  yMeta: { label: string; unit: string; short: string },
  fmt: (v: number) => string,
) {
  const tooltip = (
    <Tooltip
      cursor={{ fill: "oklch(0.5 0 0 / 0.08)" }}
      contentStyle={{ background: "oklch(0.18 0.02 240)", border: "3px solid oklch(0.1 0 0)", borderRadius: 12, fontWeight: 700 }}
      labelStyle={{ color: "oklch(0.95 0 0)" }}
      formatter={(v: number) => [fmt(v), yMeta.short]}
    />
  );
  const yAxis = (
    <YAxis
      allowDecimals={false}
      domain={[0, (dataMax: number) => Math.max(dataMax + 2, 4)]}
      tick={{ fontSize: 11, fontWeight: 700 }}
    />
  );

  if (xAxis === "chronology") {
    return (
      <LineChart data={data} margin={{ top: 8, right: 12, left: -8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.5 0 0 / 0.2)" />
        <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700 }} />
        {yAxis}
        {tooltip}
        <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700 }} />
        <Line type="monotone" dataKey="value" name={yMeta.label}
              stroke={PRIMARY_COLOR} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
      </LineChart>
    );
  }

  if (xAxis === "gender") {
    return (
      <PieChart>
        {tooltip}
        <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700 }} />
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%"
             outerRadius={110} innerRadius={50} stroke="oklch(0.1 0 0)" strokeWidth={3}
             label={(p: { name: string; value: number }) => `${p.name} · ${p.value}`}>
          {data.map((d, i) => (<Cell key={i} fill={d.color || PRIMARY_COLOR} />))}
        </Pie>
      </PieChart>
    );
  }

  return (
    <BarChart data={data} margin={{ top: 8, right: 12, left: -8, bottom: 4 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.5 0 0 / 0.2)" />
      <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 700 }} />
      {yAxis}
      {tooltip}
      <Bar dataKey="value" name={yMeta.label} radius={[8, 8, 0, 0]}>
        {data.map((d, i) => (<Cell key={i} fill={d.color || PRIMARY_COLOR} />))}
      </Bar>
    </BarChart>
  );
}

const selectCls =
  "w-full bg-surface border-[2.5px] border-ink rounded-lg px-2.5 py-2 font-display uppercase text-[11px] tracking-wider shadow-pop-sm focus:outline-none focus:ring-2 focus:ring-primary";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-bold uppercase tracking-widest text-ink-soft">{label}</span>
      {children}
    </label>
  );
}
