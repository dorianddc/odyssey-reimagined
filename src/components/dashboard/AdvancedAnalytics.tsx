// ============================================================================
// AdvancedAnalytics — Suite de 4 graphiques avancés pour le Dashboard EPS.
//   1. Spaghetti ciblé (LineChart longitudinal, highlight au survol).
//   2. Heatmap Élèves × Contenus (table HTML/CSS Tailwind).
//   3. Radar comparatif Élève vs Moyenne classe (RadarChart).
//   4. Matrice des besoins (ScatterChart 2D + ReferenceLines de quadrants).
//
// Échelle stricte 0..4 sur tous les axes Y / radiaux.
// ============================================================================
import { useMemo, useState } from "react";
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend,
  ScatterChart, Scatter, ReferenceLine, ReferenceArea, ZAxis,
} from "recharts";
import { CURRICULUM, type Cycle, type Student, type DimensionKey } from "@/data/curriculum";
import type { SituationRecord } from "@/store/AppStore";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { TransformWrapper, TransformComponent, useControls } from "react-zoom-pan-pinch";

interface Props {
  students: Student[];
  cycle: Cycle;
  classId: string;
  situationHistory: SituationRecord[];
}

const HIGHLIGHT = "#3b82f6";

// ---------- helpers communs --------------------------------------------------
const skillList = (cycle: Cycle) => {
  const cats = CURRICULUM[cycle]?.categories;
  if (!cats) return [] as Array<{ id: string; code: string; name: string; dim: DimensionKey }>;
  return (Object.keys(cats) as DimensionKey[]).flatMap((d) =>
    cats[d].skills.map((s) => ({ id: s.id, code: s.code, name: s.name, dim: d })),
  );
};
const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
const round2 = (n: number) => Math.round(n * 100) / 100;

// Cycle3 buckets (cf. brief module 4)
const MOTOR_SKILLS_C3 = new Set([
  "c3_tech_service", "c3_tech_degage", "c3_tech_basse",
  "c3_dep_repli", "c3_tac_espace",
]);
const SOCIOMETHODO_SKILLS_C3 = new Set([
  "c3_met_invest", "c3_soc_arbitrage", "c3_soc_observation",
]);

// (Spaghetti chart retiré — illisible avec 30 élèves.)


// ============================================================================
// 2. HEATMAP — table HTML/CSS Tailwind (PAS de Recharts).
// ============================================================================
function HeatmapTable({ students, cycle }: Props) {
  const skills = useMemo(() => skillList(cycle), [cycle]);

  const cellClass = (lvl: number): string => {
    if (lvl <= 0) return "bg-gray-100 text-gray-400";
    if (lvl === 1) return "bg-yellow-100 text-yellow-800";
    if (lvl === 2) return "bg-yellow-300 text-yellow-900";
    if (lvl === 3) return "bg-amber-400 text-amber-900 font-bold";
    return "bg-amber-600 text-white font-bold";
  };

  if (students.length === 0) return <EmptyBox label="Aucun élève dans cette classe." />;

  return (
    <div className="overflow-x-auto rounded-xl border-[2.5px] border-ink shadow-pop-sm">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-surface-2 border-b-[2.5px] border-ink">
            <th className="sticky left-0 z-10 bg-surface-2 text-left px-3 py-2 font-display uppercase text-[11px] tracking-wider border-r-2 border-ink">
              Élève
            </th>
            {skills.map((s) => (
              <th key={s.id}
                  className="px-2 py-2 font-display uppercase text-[10px] tracking-wider text-center min-w-[88px]"
                  title={s.name}>
                <div className="leading-tight">{s.code}</div>
                <div className="text-[9px] font-semibold normal-case tracking-normal text-ink-soft truncate max-w-[100px] mx-auto">
                  {s.name}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {students.map((stu) => (
            <tr key={stu.id} className="border-b border-ink/10">
              <td className="sticky left-0 z-10 bg-surface px-3 py-1.5 font-bold border-r-2 border-ink whitespace-nowrap">
                {stu.name}
              </td>
              {skills.map((s) => {
                const lvl = stu.skillStates?.[s.id] ?? 0;
                return (
                  <td key={s.id}
                      className={`text-center px-2 py-1.5 border border-ink/10 ${cellClass(lvl)}`}
                      title={`${stu.name} — ${s.name} : Niveau ${lvl}`}>
                    {lvl}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================================
// 3. RADAR COMPARATIF Élève vs Moyenne classe
// ============================================================================
function CompareRadar({ students, cycle }: Props) {
  const [studentId, setStudentId] = useState<string>(students[0]?.id ?? "");
  const skills = useMemo(() => skillList(cycle), [cycle]);

  const student = students.find((s) => s.id === studentId);

  const data = useMemo(() => skills.map((sk) => ({
    subject: sk.code,
    fullName: sk.name,
    studentLevel: student?.skillStates?.[sk.id] ?? 0,
    classAvg: round2(avg(students.map((s) => s.skillStates?.[sk.id] ?? 0))),
  })), [skills, students, student]);

  if (students.length === 0) return <EmptyBox label="Aucun élève dans cette classe." />;

  return (
    <div className="space-y-3">
      <Field label="Élève à comparer à la moyenne de la classe">
        <Select value={studentId} onValueChange={setStudentId}>
          <SelectTrigger className={triggerCls + " min-w-[220px]"}><SelectValue /></SelectTrigger>
          <SelectContent className={contentCls}>
            {students.map((s) => (
              <SelectItem key={s.id} value={s.id} className={itemCls}>
                {s.name} {s.gender === "F" ? "♀" : "♂"} · Nv {s.level}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <ResponsiveContainer width="100%" height={380}>
        <RadarChart data={data} outerRadius="78%">
          <PolarGrid stroke="oklch(0.5 0 0 / 0.25)" />
          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fontWeight: 700 }} />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 4]}
            tickCount={5}
            tick={{ fontSize: 10 }}
            allowDecimals={false}
          />
          <Radar
            name="Moyenne classe"
            dataKey="classAvg"
            stroke="#9ca3af"
            fill="none"
            strokeDasharray="4 4"
            strokeWidth={2}
          />
          <Radar
            name={student?.name ?? "Élève"}
            dataKey="studentLevel"
            stroke={HIGHLIGHT}
            fill={HIGHLIGHT}
            fillOpacity={0.5}
            strokeWidth={2.5}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            labelStyle={{ color: "oklch(0.95 0 0)", fontWeight: 800 }}
            labelFormatter={(label: string) => {
              const row = data.find((d) => d.subject === label);
              return row ? `${label} · ${row.fullName}` : label;
            }}
            formatter={(v: number, name: string) => [`${round2(Number(v))} / 4`, name]}
          />
          <Legend wrapperStyle={{ fontSize: 12, fontWeight: 700, paddingTop: 8 }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ============================================================================
// 4. MATRICE DES BESOINS — ScatterChart 2D avec Zoom par sélection
// ============================================================================
const clampMatrixPoint = (n: number) => Math.max(0.18, Math.min(3.82, n));

function spreadOffset(index: number, total: number) {
  if (total <= 1) return { dx: 0, dy: 0 };
  const angle = index * 2.399963229728653;
  const radius = 0.2 + Math.floor(index / 6) * 0.12;
  return { dx: Math.cos(angle) * radius, dy: Math.sin(angle) * radius };
}

function quadrantStroke(scoreMoteur: number, scoreSocio: number, meanMotor: number, meanSocio: number) {
  const right = scoreMoteur >= meanMotor;
  const top = scoreSocio >= meanSocio;
  if (top && right) return "#16a34a";
  if (top && !right) return "#2563eb";
  if (!top && right) return "#f59e0b";
  return "#dc2626";
}

function ZoomControls() {
  const { zoomIn, zoomOut, resetTransform } = useControls();
  return (
    <div className="flex items-center gap-1.5">
      <button onClick={() => zoomIn()} className="flex items-center gap-1 bg-surface border-2 border-ink rounded-lg px-2 py-1 font-display text-[11px] font-bold uppercase tracking-wider shadow-pop-sm hover:bg-surface-2 transition-colors" title="Zoom +">
        <ZoomIn size={14} /> +
      </button>
      <button onClick={() => zoomOut()} className="flex items-center gap-1 bg-surface border-2 border-ink rounded-lg px-2 py-1 font-display text-[11px] font-bold uppercase tracking-wider shadow-pop-sm hover:bg-surface-2 transition-colors" title="Zoom -">
        <ZoomOut size={14} /> −
      </button>
      <button onClick={() => resetTransform()} className="flex items-center gap-1 bg-surface border-2 border-ink rounded-lg px-2 py-1 font-display text-[11px] font-bold uppercase tracking-wider shadow-pop-sm hover:bg-surface-2 transition-colors" title="Réinitialiser">
        <RotateCcw size={14} /> Reset
      </button>
    </div>
  );
}

function NeedsMatrix({ students, cycle }: Props) {
  const isC3 = cycle === "cycle3";

  const rawPoints = useMemo(() => students.map((s) => {
    const motorIds: string[] = [];
    const socioIds: string[] = [];
    const cats = CURRICULUM[cycle]?.categories;
    if (cats) {
      (Object.keys(cats) as DimensionKey[]).forEach((dim) => {
        cats[dim].skills.forEach((sk) => {
          if (isC3) {
            if (MOTOR_SKILLS_C3.has(sk.id)) motorIds.push(sk.id);
            else if (SOCIOMETHODO_SKILLS_C3.has(sk.id)) socioIds.push(sk.id);
          } else {
            if (dim === "moteur") motorIds.push(sk.id);
            else socioIds.push(sk.id);
          }
        });
      });
    }
    const scoreMoteur = round2(avg(motorIds.map((id) => s.skillStates?.[id] ?? 0)));
    const scoreSocio = round2(avg(socioIds.map((id) => s.skillStates?.[id] ?? 0)));
    return { id: s.id, name: s.name, gender: s.gender, scoreMoteur, scoreSocio };
  }), [students, cycle, isC3]);

  const meanMotor = round2(avg(rawPoints.map((p) => p.scoreMoteur)));
  const meanSocio = round2(avg(rawPoints.map((p) => p.scoreSocio)));
  const points = useMemo(() => {
    const grouped = new Map<string, typeof rawPoints>();
    rawPoints.forEach((p) => {
      const key = `${p.scoreMoteur}|${p.scoreSocio}`;
      grouped.set(key, [...(grouped.get(key) || []), p]);
    });
    return rawPoints.map((p) => {
      const group = grouped.get(`${p.scoreMoteur}|${p.scoreSocio}`) || [p];
      const idx = group.findIndex((g) => g.id === p.id);
      const { dx, dy } = spreadOffset(idx, group.length);
      return {
        ...p,
        displayX: clampMatrixPoint(p.scoreMoteur + dx),
        displayY: clampMatrixPoint(p.scoreSocio + dy),
      };
    });
  }, [rawPoints]);

  if (students.length === 0) return <EmptyBox label="Aucun élève dans cette classe." />;

  return (
    <div className="space-y-2">
      <TransformWrapper
        initialScale={1}
        minScale={1}
        maxScale={6}
        wheel={{ step: 0.1 }}
        doubleClick={{ disabled: false, mode: "zoomIn" }}
        panning={{ velocityDisabled: true }}
      >
        {() => (
          <>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] font-bold uppercase tracking-wider flex-1 min-w-[280px]">
                <QuadLegend color="oklch(0.78 0.18 115)" label="Leaders (haut-droite)" />
                <QuadLegend color="oklch(0.65 0.18 240)" label="Bons camarades (haut-gauche)" />
                <QuadLegend color="oklch(0.72 0.20 45)" label="Individualistes (bas-droite)" />
                <QuadLegend color="oklch(0.65 0.22 25)" label="En difficulté (bas-gauche)" />
              </div>
              <ZoomControls />
            </div>

            <div className="overflow-hidden rounded-xl border-2 border-ink/20 bg-surface-2">
              <TransformComponent
                wrapperStyle={{ width: "100%", height: 400, cursor: "grab" }}
                contentStyle={{ width: "100%", height: 400 }}
              >
                <div style={{ width: "100%", height: 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 16, right: 24, left: 0, bottom: 24 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.5 0 0 / 0.18)" />
                      <XAxis
                        type="number"
                        dataKey="displayX"
                        name="Dimension Motrice"
                        domain={[0, 4]}
                        ticks={[0, 1, 2, 3, 4]}
                        allowDecimals={false}
                        tick={{ fontSize: 11, fontWeight: 700 }}
                        label={{ value: "Dimension Motrice →", position: "insideBottom", offset: -10, fontSize: 11, fontWeight: 700 }}
                      />
                      <YAxis
                        type="number"
                        dataKey="displayY"
                        name="Dimension Socio-Méthodo"
                        domain={[0, 4]}
                        ticks={[0, 1, 2, 3, 4]}
                        allowDecimals={false}
                        tick={{ fontSize: 11, fontWeight: 700 }}
                        label={{ value: "Socio-Méthodo ↑", angle: -90, position: "insideLeft", fontSize: 11, fontWeight: 700 }}
                      />
                      <ZAxis range={[36, 36]} />
                      <ReferenceArea x1={meanMotor} x2={4} y1={meanSocio} y2={4} fill="#dcfce7" fillOpacity={0.55} stroke="none"
                        label={{ value: "Leaders", position: "insideTopRight", fill: "#15803d", fontSize: 11, fontWeight: 800 }} />
                      <ReferenceArea x1={0} x2={meanMotor} y1={meanSocio} y2={4} fill="#dbeafe" fillOpacity={0.55} stroke="none"
                        label={{ value: "Bons camarades", position: "insideTopLeft", fill: "#1d4ed8", fontSize: 11, fontWeight: 800 }} />
                      <ReferenceArea x1={meanMotor} x2={4} y1={0} y2={meanSocio} fill="#fef08a" fillOpacity={0.55} stroke="none"
                        label={{ value: "Individualistes", position: "insideBottomRight", fill: "#a16207", fontSize: 11, fontWeight: 800 }} />
                      <ReferenceArea x1={0} x2={meanMotor} y1={0} y2={meanSocio} fill="#fee2e2" fillOpacity={0.55} stroke="none"
                        label={{ value: "En difficulté", position: "insideBottomLeft", fill: "#b91c1c", fontSize: 11, fontWeight: 800 }} />
                      <ReferenceLine x={meanMotor} stroke="red" strokeDasharray="3 3" label={{ value: `x̄ ${meanMotor}`, fill: "red", fontSize: 10, fontWeight: 700, position: "top" }} />
                      <ReferenceLine y={meanSocio} stroke="red" strokeDasharray="3 3" label={{ value: `ȳ ${meanSocio}`, fill: "red", fontSize: 10, fontWeight: 700, position: "right" }} />
                      <Tooltip
                        cursor={{ strokeDasharray: "3 3" }}
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const p = payload[0].payload as typeof points[number];
                          return (
                            <div style={tooltipStyle as React.CSSProperties} className="text-xs">
                              <div className="font-extrabold text-white">{p.name} {p.gender === "F" ? "♀" : "♂"}</div>
                              <div className="text-white/90">Moteur : <b>{p.scoreMoteur} / 4</b></div>
                              <div className="text-white/90">Socio-Méthodo : <b>{p.scoreSocio} / 4</b></div>
                            </div>
                          );
                        }}
                      />
                      <Scatter
                        name="Élèves"
                        data={points}
                        shape={(p: { cx?: number; cy?: number; payload?: typeof points[number] }) => {
                          const { cx, cy, payload } = p;
                          if (cx == null || cy == null || !payload) return <g />;
                          const stroke = quadrantStroke(payload.scoreMoteur, payload.scoreSocio, meanMotor, meanSocio);
                          return (
                            <circle cx={cx} cy={cy} r={4.1} fill="#0a0a0a" stroke={stroke} strokeWidth={2.4} fillOpacity={0.96} />
                          );
                        }}
                      />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </TransformComponent>
            </div>

            <p className="text-[11px] text-ink-soft font-semibold uppercase tracking-widest">
              Molette = zoom · clic-glisser = déplacement · double-clic = zoom rapide. Lignes rouges = moyennes de classe ({isC3 ? "8 contenus 6ème" : "compétences cycle 4"}).
            </p>
          </>
        )}
      </TransformWrapper>
    </div>
  );
}

// ============================================================================
// SUITE — Tabs wrapper
// ============================================================================
export function AdvancedAnalytics(props: Props) {
  return (
    <div className="rounded-[var(--radius)] border-[3px] border-ink bg-surface shadow-pop p-5">
      <h3 className="font-display text-lg md:text-xl tracking-wide mb-1">
        Analyses avancées — 3 visualisations diagnostiques
      </h3>
      <p className="text-[11px] text-ink-soft font-semibold mb-4 uppercase tracking-widest">
        Échelle stricte 0 → 4 (palier d'acquisition). Conçu pour PC / tablette paysage.
      </p>

      <Tabs defaultValue="heatmap" className="w-full">
        <TabsList className="grid grid-cols-3 w-full h-auto bg-surface-2 border-[2.5px] border-ink rounded-xl p-1 mb-4">
          <TabsTrigger value="heatmap" className={tabCls}>1 · Heatmap</TabsTrigger>
          <TabsTrigger value="radar" className={tabCls}>2 · Radar</TabsTrigger>
          <TabsTrigger value="matrix" className={tabCls}>3 · Matrice</TabsTrigger>
        </TabsList>

        <TabsContent value="heatmap"><HeatmapTable {...props} /></TabsContent>
        <TabsContent value="radar"><CompareRadar {...props} /></TabsContent>
        <TabsContent value="matrix"><NeedsMatrix {...props} /></TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================================
// Petits helpers UI partagés (style Odyssée).
// ============================================================================
const tooltipStyle = {
  background: "oklch(0.18 0.02 240)",
  border: "3px solid oklch(0.1 0 0)",
  borderRadius: 12,
  padding: "8px 10px",
  fontWeight: 700,
} as const;

const triggerCls =
  "w-full h-auto bg-surface border-[2.5px] border-ink rounded-xl px-2.5 py-2 font-display uppercase text-[11px] tracking-wider shadow-pop-sm hover:bg-surface-2 focus:ring-2 focus:ring-primary [&>span]:truncate";
const contentCls = "rounded-xl border-[2.5px] border-ink shadow-pop max-w-[360px]";
const itemCls = "font-display text-[11px] uppercase tracking-wider rounded-lg cursor-pointer";
const tabCls =
  "font-display uppercase text-[11px] tracking-wider rounded-lg data-[state=active]:bg-surface data-[state=active]:shadow-pop-sm data-[state=active]:border-2 data-[state=active]:border-ink";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-bold uppercase tracking-widest text-ink-soft">{label}</span>
      {children}
    </label>
  );
}
function EmptyBox({ label }: { label: string }) {
  return (
    <div className="h-[320px] grid place-items-center text-ink-soft font-semibold text-sm border-2 border-dashed border-ink/20 rounded-xl">
      {label}
    </div>
  );
}
function QuadLegend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-surface-2 border-2 border-ink/20">
      <span className="w-3 h-3 rounded-full border-2 border-ink" style={{ background: color }} />
      <span className="truncate">{label}</span>
    </div>
  );
}
