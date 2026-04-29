// SVG Radar chart for student skill spectrum — Sport Pop style.
import { CURRICULUM, type Cycle } from "@/data/curriculum";

interface FullSpectrumRadarProps {
  skillStates: Record<string, number>;
  cycle: Cycle;
  size?: number;
}

export const FullSpectrumRadar = ({ skillStates, cycle, size = 320 }: FullSpectrumRadarProps) => {
  const tree = CURRICULUM[cycle]?.categories;
  if (!tree) return null;

  const allSkills: { id: string; code: string; name: string; colorVar: string }[] = [];
  Object.values(tree).forEach((cat) => {
    cat.skills.forEach((s) => allSkills.push({ ...s, colorVar: cat.colorVar }));
  });

  const angleStep = (Math.PI * 2) / allSkills.length;
  const center = size / 2;
  const radius = center - 56;

  const points = allSkills.map((s, i) => {
    const stars = skillStates[s.id] || 0;
    const scale = stars / 5;
    const angle = i * angleStep - Math.PI / 2;
    return {
      x: center + radius * scale * Math.cos(angle),
      y: center + radius * scale * Math.sin(angle),
      labelX: center + (radius + 28) * Math.cos(angle),
      labelY: center + (radius + 28) * Math.sin(angle),
      maxX: center + radius * Math.cos(angle),
      maxY: center + radius * Math.sin(angle),
      colorVar: s.colorVar,
      code: s.code,
    };
  });

  const d =
    points.length > 0
      ? `M ${points[0].x} ${points[0].y} ${points.map((p) => `L ${p.x} ${p.y}`).join(" ")} Z`
      : "";

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} className="overflow-visible">
        <defs>
          <radialGradient id="radarFill" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.55" />
            <stop offset="100%" stopColor="hsl(var(--secondary))" stopOpacity="0.35" />
          </radialGradient>
        </defs>

        {/* Concentric polygons */}
        {[0.2, 0.4, 0.6, 0.8, 1].map((r, idx) => (
          <polygon
            key={r}
            points={allSkills
              .map((_, i) => {
                const angle = i * angleStep - Math.PI / 2;
                return `${center + radius * r * Math.cos(angle)},${center + radius * r * Math.sin(angle)}`;
              })
              .join(" ")}
            fill={idx === 4 ? "hsl(var(--surface-2))" : "transparent"}
            stroke="hsl(var(--ink) / 0.12)"
            strokeWidth={idx === 4 ? 3 : 1.5}
            strokeDasharray={idx === 4 ? "0" : "4 4"}
          />
        ))}

        {/* Axes */}
        {allSkills.map((_, i) => {
          const angle = i * angleStep - Math.PI / 2;
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={center + radius * Math.cos(angle)}
              y2={center + radius * Math.sin(angle)}
              stroke="hsl(var(--ink) / 0.1)"
              strokeWidth={1.5}
            />
          );
        })}

        {/* Filled spectrum */}
        {d && (
          <path
            d={d}
            fill="url(#radarFill)"
            stroke="hsl(var(--ink))"
            strokeWidth={3}
            strokeLinejoin="round"
            className="transition-all duration-700"
          />
        )}

        {/* Vertices */}
        {points.map((p, i) => (
          <g key={i}>
            <circle
              cx={p.x}
              cy={p.y}
              r={6}
              fill="hsl(var(--primary))"
              stroke="hsl(var(--ink))"
              strokeWidth={2.5}
              className="transition-all duration-700"
            />
            {/* Label bubble */}
            <g transform={`translate(${p.labelX}, ${p.labelY})`}>
              <circle
                r={14}
                fill="hsl(var(--surface))"
                stroke="hsl(var(--ink))"
                strokeWidth={2.5}
                style={{ filter: `drop-shadow(0 2px 0 hsl(var(--ink)))` }}
              />
              <text
                fontFamily="Bebas Neue"
                fontSize={14}
                fontWeight="700"
                textAnchor="middle"
                dominantBaseline="central"
                fill={`hsl(${p.colorVar.replace("var(", "").replace(")", "")})`}
                style={{ textTransform: "uppercase" }}
              >
                {p.code}
              </text>
            </g>
          </g>
        ))}
      </svg>
    </div>
  );
};
