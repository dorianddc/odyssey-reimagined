import { motion } from "framer-motion";
import { useMemo } from "react";
import bgImage from "@/assets/odyssey-bg.jpg";
import type { Student } from "@/lib/curriculum";
import { MAX_LEVEL } from "@/lib/curriculum";

interface OdysseyMapProps {
  students: Student[];
  onSelectStudent: (id: string) => void;
}

// 4 BIOMES — bottom (1-6) bronze parquet, mid-low (7-12) silver blue court,
// mid-high (13-18) gold purple arena, top (19-24) crystal pantheon
type Biome = {
  range: [number, number];
  name: string;
  socle: "bronze" | "silver" | "gold" | "crystal";
  socleGradient: string;
  rim: string;
  glow: string;
  shuttleColor: string; // body color of the shuttlecock feathers
  bandLabel: string;
};

const BIOMES: Biome[] = [
  { range: [1, 6],   name: "Parquet",   socle: "bronze",  socleGradient: "radial-gradient(circle at 35% 30%, #f9c890 0%, #c97a3a 45%, #6b3712 100%)", rim: "#3a1a08", glow: "#f59e0b", shuttleColor: "#d8a878", bandLabel: "INITIATION" },
  { range: [7, 12],  name: "Court Bleu",socle: "silver",  socleGradient: "radial-gradient(circle at 35% 30%, #ffffff 0%, #c9d3df 45%, #5b6878 100%)", rim: "#1a2230", glow: "#7dd3fc", shuttleColor: "#ffffff", bandLabel: "MAÎTRISE" },
  { range: [13, 18], name: "Arène",     socle: "gold",    socleGradient: "radial-gradient(circle at 35% 30%, #fff5b0 0%, #f5c130 45%, #8a5a05 100%)", rim: "#3a2200", glow: "#facc15", shuttleColor: "#ffffff", bandLabel: "CHAMPION" },
  { range: [19, 24], name: "Panthéon",  socle: "crystal", socleGradient: "radial-gradient(circle at 35% 30%, #ffffff 0%, #b3e8ff 45%, #4a90b8 100%)", rim: "#0c2a44", glow: "#67e8f9", shuttleColor: "#bdf2ff", bandLabel: "OLYMPE" },
];

const biomeForLevel = (lvl: number): Biome => BIOMES.find(b => lvl >= b.range[0] && lvl <= b.range[1]) ?? BIOMES[0];

// Student token color cycle (the colored bubble around each shuttle)
const TOKEN_COLORS = ["#22c55e", "#3b82f6", "#ef4444", "#a855f7", "#f59e0b", "#ec4899", "#06b6d4", "#eab308"];

// === SUB COMPONENTS ===

function Shuttlecock({ color, size = 56, glow }: { color: string; size?: number; glow: string }) {
  // Pure SVG feathered shuttlecock
  const w = size;
  const h = size * 1.4;
  return (
    <svg width={w} height={h} viewBox="0 0 100 140" style={{ filter: `drop-shadow(0 0 14px ${glow})` }}>
      <defs>
        <linearGradient id={`feather-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0.6" />
        </linearGradient>
      </defs>
      {/* Feathers */}
      {[-35, -20, -7, 7, 20, 35].map((rot, i) => (
        <g key={i} transform={`rotate(${rot} 50 110)`}>
          <path d="M50 110 L38 30 Q50 18 62 30 Z" fill={`url(#feather-${color})`} stroke="#0008" strokeWidth="1" />
          {/* feather lines */}
          <line x1="50" y1="110" x2="50" y2="32" stroke="#0006" strokeWidth="0.8" />
        </g>
      ))}
      {/* Cork base */}
      <ellipse cx="50" cy="115" rx="18" ry="14" fill="#f5f1e8" stroke="#3a2a18" strokeWidth="2" />
      <ellipse cx="50" cy="112" rx="18" ry="6" fill="#ffffff" />
      {/* Band */}
      <rect x="32" y="118" width="36" height="4" fill="#1e293b" />
    </svg>
  );
}

function Pedestal({ biome }: { biome: Biome }) {
  return (
    <div className="relative" style={{ width: 130, height: 46 }}>
      {/* Bottom shadow */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-0 rounded-full"
           style={{ width: 140, height: 22, background: "radial-gradient(ellipse, rgba(0,0,0,0.55), transparent 70%)" }} />
      {/* Side rim */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-2 rounded-[50%]"
           style={{ width: 130, height: 32, background: biome.rim, boxShadow: `0 4px 0 ${biome.rim}` }} />
      {/* Top disc */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-7 rounded-[50%] border-[3px]"
           style={{ width: 130, height: 30, background: biome.socleGradient, borderColor: biome.rim,
                    boxShadow: `inset 0 -4px 8px rgba(0,0,0,0.4), 0 0 30px ${biome.glow}66` }} />
      {/* Inner ring shine */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-9 rounded-[50%]"
           style={{ width: 90, height: 18, background: "radial-gradient(ellipse, rgba(255,255,255,0.6), transparent 70%)" }} />
    </div>
  );
}

function StudentToken({ name, color, delay, onClick }: { name: string; color: string; delay: number; onClick: () => void }) {
  const initial = name[0]?.toUpperCase() ?? "?";
  return (
    <motion.button
      onClick={onClick}
      title={name}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1, y: [0, -4, 0] }}
      transition={{
        scale: { delay, type: "spring", stiffness: 300, damping: 14 },
        opacity: { delay },
        y: { duration: 2.4 + (delay % 1), repeat: Infinity, ease: "easeInOut", delay: delay * 0.8 },
      }}
      whileHover={{ scale: 1.25, zIndex: 50 }}
      whileTap={{ scale: 0.9 }}
      className="relative w-9 h-9 rounded-full flex items-center justify-center font-black text-[13px] text-white shrink-0 cursor-pointer"
      style={{
        background: `radial-gradient(circle at 30% 30%, ${color}ff 0%, ${color}cc 60%, ${color}88 100%)`,
        boxShadow: `0 3px 0 rgba(0,0,0,0.45), inset 0 -3px 4px rgba(0,0,0,0.3), inset 0 2px 3px rgba(255,255,255,0.6), 0 0 12px ${color}88`,
        border: "2px solid rgba(255,255,255,0.95)",
        textShadow: "0 1px 2px rgba(0,0,0,0.6)",
      }}
    >
      {initial}
    </motion.button>
  );
}

// Stations are positioned along an S-shaped path inside each biome row.
// Each biome has 6 levels arranged horizontally, alternating biomes flow LTR / RTL via reversed array.
function BiomeRow({
  biome, students, onSelectStudent, reverse, biomeIndex,
}: {
  biome: Biome;
  students: Student[];
  onSelectStudent: (id: string) => void;
  reverse: boolean;
  biomeIndex: number;
}) {
  const levels = useMemo(() => {
    const arr: number[] = [];
    for (let l = biome.range[0]; l <= biome.range[1]; l++) arr.push(l);
    return reverse ? arr.reverse() : arr;
  }, [biome, reverse]);

  return (
    <div className="relative w-full" style={{ height: 240 }}>
      {/* Path SVG (glowing ribbon) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 1200 240">
        <defs>
          <linearGradient id={`path-${biomeIndex}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="20%" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="80%" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <filter id={`pathglow-${biomeIndex}`}>
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>
        {/* Curve through the row */}
        <path
          d={reverse
            ? "M 1180 80 C 950 200, 700 -20, 500 140 S 100 200, 20 100"
            : "M 20 160 C 250 40, 500 240, 700 100 S 1100 40, 1180 140"}
          stroke={biome.glow}
          strokeWidth="14"
          fill="none"
          opacity="0.25"
          filter={`url(#pathglow-${biomeIndex})`}
        />
        <path
          d={reverse
            ? "M 1180 80 C 950 200, 700 -20, 500 140 S 100 200, 20 100"
            : "M 20 160 C 250 40, 500 240, 700 100 S 1100 40, 1180 140"}
          stroke={`url(#path-${biomeIndex})`}
          strokeWidth="5"
          fill="none"
          strokeDasharray="2 10"
        />
      </svg>

      {/* Stations */}
      <div className="relative flex justify-around items-end h-full px-6 pb-2">
        {levels.map((lvl, idx) => {
          const lvlStudents = students.filter(s => s.level === lvl);
          // vertical offset to mimic S curve
          const offsets = reverse ? [10, -30, -50, -30, 10, 40] : [40, 10, -30, -50, -30, 10];
          const yOff = offsets[idx];
          return (
            <Station
              key={lvl}
              level={lvl}
              students={lvlStudents}
              biome={biome}
              onSelectStudent={onSelectStudent}
              yOffset={yOff}
              indexInRow={idx}
            />
          );
        })}
      </div>
    </div>
  );
}

function Station({
  level, students, biome, onSelectStudent, yOffset, indexInRow,
}: {
  level: number;
  students: Student[];
  biome: Biome;
  onSelectStudent: (id: string) => void;
  yOffset: number;
  indexInRow: number;
}) {
  const isMaxBiome = biome.socle === "crystal";
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: yOffset }}
      transition={{ delay: indexInRow * 0.08, type: "spring", stiffness: 120, damping: 18 }}
      className="relative flex flex-col items-center"
      style={{ width: 140 }}
    >
      {/* Floating student tokens — clustered around shuttle */}
      <div className="relative mb-[-8px] flex flex-wrap justify-center gap-1.5 max-w-[150px] min-h-[40px]"
           style={{ zIndex: 30 }}>
        {students.map((s, i) => (
          <StudentToken
            key={s.id}
            name={s.name}
            color={TOKEN_COLORS[i % TOKEN_COLORS.length]}
            delay={i * 0.05 + indexInRow * 0.04}
            onClick={() => onSelectStudent(s.id)}
          />
        ))}
      </div>

      {/* Shuttle on pedestal */}
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3 + (indexInRow % 2), repeat: Infinity, ease: "easeInOut" }}
        className="relative flex flex-col items-center"
      >
        {isMaxBiome && (
          <motion.div
            className="absolute inset-0 -z-10 rounded-full"
            animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            style={{ background: `radial-gradient(circle, ${biome.glow}aa, transparent 70%)`, filter: "blur(12px)" }}
          />
        )}
        <Shuttlecock color={biome.shuttleColor} glow={biome.glow} size={54} />
        <div className="-mt-2"><Pedestal biome={biome} /></div>
      </motion.div>

      {/* Level number badge */}
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-black/85 border-2 text-white font-black text-[11px] tracking-wider shadow-lg"
           style={{ borderColor: biome.glow, color: biome.glow, textShadow: `0 0 8px ${biome.glow}` }}>
        N{level}
      </div>
    </motion.div>
  );
}

export function OdysseyMap({ students, onSelectStudent }: OdysseyMapProps) {
  // 24 levels but level 0 still possible — clamp display 1..24
  // We render 4 stacked biomes (top = highest = panthéon)
  const orderedBiomes = [...BIOMES].reverse(); // top of screen first
  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${bgImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40" />

      {/* Vignette / spotlights */}
      <div className="absolute inset-0 pointer-events-none"
           style={{ background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.55) 100%)" }} />

      {/* Scrollable content (vertical) */}
      <div className="relative h-full w-full overflow-y-auto custom-scrollbar">
        <div className="min-h-full flex flex-col">
          {/* Title banner */}
          <div className="sticky top-0 z-40 px-8 py-4 backdrop-blur-md bg-gradient-to-b from-black/70 to-transparent flex justify-between items-center pointer-events-none">
            <div>
              <div className="text-yellow-300 text-[10px] uppercase tracking-[0.4em] font-bold">Parcours</div>
              <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                Odyssée Stadium
              </h2>
            </div>
            <div className="flex gap-2">
              {BIOMES.map(b => (
                <div key={b.name} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 border border-white/10">
                  <div className="w-3 h-3 rounded-full" style={{ background: b.glow, boxShadow: `0 0 8px ${b.glow}` }} />
                  <span className="text-[9px] uppercase tracking-widest text-white/80 font-bold">{b.bandLabel} N{b.range[0]}-{b.range[1]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Biome rows */}
          <div className="flex-1 flex flex-col">
            {orderedBiomes.map((biome, i) => {
              // i=0 -> top (panthéon), reverse so highest level on right of top row leading down
              const reverse = i % 2 === 1;
              return (
                <div key={biome.name} className="relative">
                  {/* Biome label on side */}
                  <div className={`absolute top-1/2 -translate-y-1/2 ${reverse ? "right-2" : "left-2"} z-30 pointer-events-none`}>
                    <div className="rotate-90 origin-center text-[10px] tracking-[0.5em] font-black text-white/40 uppercase whitespace-nowrap">
                      {biome.name}
                    </div>
                  </div>
                  <BiomeRow
                    biome={biome}
                    students={students}
                    onSelectStudent={onSelectStudent}
                    reverse={reverse}
                    biomeIndex={i}
                  />
                </div>
              );
            })}
          </div>

          {/* Legend at bottom */}
          <div className="sticky bottom-0 z-40 px-8 py-3 bg-gradient-to-t from-black/80 to-transparent text-center pointer-events-none">
            <span className="text-[10px] uppercase tracking-[0.5em] text-white/50 font-bold">
              Cliquez sur un volant-élève pour ouvrir son profil • L'Olympe attend les champions
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
