// Comparative radar — student vs class average. Reused on Dashboard + Student Profile.
import { useMemo } from "react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  Tooltip, Legend,
} from "recharts";
import { CURRICULUM, type Cycle, type Student, type DimensionKey, getMaxStarsForCycle } from "@/data/curriculum";

interface Props {
  student: Student;
  classmates: Student[]; // full class incl. the student
  cycle: Cycle;
  height?: number;
}

const HIGHLIGHT = "#3b82f6";
const round2 = (n: number) => Math.round(n * 100) / 100;
const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

const tooltipStyle = {
  background: "oklch(0.18 0.02 240)",
  border: "3px solid oklch(0.1 0 0)",
  borderRadius: 12,
  padding: "8px 10px",
  fontWeight: 700,
} as const;

export function ComparativeRadar({ student, classmates, cycle, height = 320 }: Props) {
  const max = getMaxStarsForCycle(cycle) || 4;

  const { data, hasClassAvg } = useMemo(() => {
    const cats = CURRICULUM[cycle]?.categories;
    if (!cats || !student) return { data: [], hasClassAvg: false };
    const skills = (Object.keys(cats) as DimensionKey[]).flatMap((d) =>
      (cats[d]?.skills ?? []).map((s) => ({ id: s.id, code: s.code, name: s.name })),
    );
    if (skills.length === 0) return { data: [], hasClassAvg: false };

    const peers = Array.isArray(classmates) ? classmates.filter(Boolean) : [];
    const canComputeAvg = peers.length > 0;

    const rows = skills.map((sk) => {
      const studentLevel = Number(student.skillStates?.[sk.id] ?? 0) || 0;
      let classAvg = 0;
      if (canComputeAvg) {
        try {
          const vals = peers.map((s) => Number(s?.skillStates?.[sk.id] ?? 0) || 0);
          classAvg = round2(avg(vals));
        } catch {
          classAvg = 0;
        }
      }
      return {
        subject: sk.code,
        fullName: sk.name,
        studentLevel,
        studentPlotLevel: studentLevel === 0 ? 0.16 : studentLevel,
        classAvg,
        classAvgPlot: classAvg === 0 ? 0.1 : classAvg,
      };
    });
    return { data: rows, hasClassAvg: canComputeAvg };
  }, [student, classmates, cycle]);

  if (!student || data.length === 0) {
    return (
      <div style={{ height }} className="grid place-items-center text-ink-soft text-xs font-semibold border-2 border-dashed border-ink/20 rounded-xl">
        Pas encore de données à afficher
      </div>
    );
  }

  return (
    <div className="w-full overflow-visible" style={{ height }}>
      <RadarChart width={420} height={height} data={data} outerRadius="72%" margin={{ top: 16, right: 28, bottom: 24, left: 28 }}>
        <PolarGrid stroke="oklch(0.5 0 0 / 0.25)" />
        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fontWeight: 700 }} />
        <PolarRadiusAxis
          angle={30}
          domain={[0, max]}
          tickCount={max + 1}
          tick={{ fontSize: 10 }}
          allowDecimals={false}
        />
        {hasClassAvg && (
          <Radar
            name="Moyenne classe"
            dataKey="classAvgPlot"
            stroke="#9ca3af"
            fill="none"
            strokeDasharray="4 4"
            strokeWidth={2}
            dot={{ r: 3, fill: "#9ca3af", strokeWidth: 0 }}
          />
        )}
        <Radar
          name={student.name}
          dataKey="studentPlotLevel"
          stroke={HIGHLIGHT}
          fill={HIGHLIGHT}
          fillOpacity={0.45}
          strokeWidth={3}
          dot={{ r: 4, fill: HIGHLIGHT, stroke: "#ffffff", strokeWidth: 1.5 }}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          labelStyle={{ color: "oklch(0.95 0 0)", fontWeight: 800 }}
          labelFormatter={(label: string) => {
            const row = data.find((d) => d.subject === label);
            return row ? `${label} · ${row.fullName}` : label;
          }}
          formatter={(_v: number, name: string, ctx: { payload?: { studentLevel?: number; classAvg?: number } }) => {
            const trueValue = name === student.name ? ctx.payload?.studentLevel : ctx.payload?.classAvg;
            return [`${round2(Number(trueValue ?? 0))} / ${max}`, name];
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12, fontWeight: 700, paddingTop: 8 }} />
      </RadarChart>
    </div>
  );
}
