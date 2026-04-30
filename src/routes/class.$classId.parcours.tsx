import { createFileRoute, useNavigate as useTanstackNavigate } from "@tanstack/react-router";
// Parcours — "Odyssée du Volant" : reproduction fidèle de l'image de référence.
// 4 biomes horizontaux fondus (Gymnase → Régionale → Mondiale → Panthéon),
// chemin sinueux horizontal de gauche à droite reliant 22 plateformes rondes,
// volants SVG évolutifs (8 paliers de qualité), essaim d'élèves avec tooltips.
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Maximize2, Minus, Plus, Volume2, VolumeX } from "lucide-react";
import { useAppStore } from "@/store/AppStore";
import { type Student } from "@/data/curriculum";
import { useAudio } from "@/lib/audio";

const FOCUS_KEY = "odyssey_focus_student";

// ============================================================================
// GEOMETRY — canvas vertical : 4 étages de biomes horizontaux superposés
// Progression : on commence en bas à gauche (N1), on finit en haut à gauche (N22)
// ============================================================================
const VISIBLE_LEVELS = 22;
const VB_W = 3200;            // largeur d'un étage (toute la scène) — plus large pour respiration
const FLOOR_H = 540;          // hauteur d'un étage
const FLOORS = 4;
const VB_H = FLOOR_H * FLOORS; // 2160
const PAD_X = 320;            // marge latérale large pour que les courbes ne soient pas rognées

// Définition des étages (du plus bas niveau au plus haut)
const FLOORS_DEF = [
  { min: 1,  max: 6,  dir: 1  as 1 | -1 },
  { min: 7,  max: 12, dir: -1 as 1 | -1 },
  { min: 13, max: 17, dir: 1  as 1 | -1 },
  { min: 18, max: 22, dir: -1 as 1 | -1 },
];

const floorIndexFor = (level: number) =>
  FLOORS_DEF.findIndex((f) => level >= f.min && level <= f.max);

// Y du centre d'un étage : étage 0 (N1-6) en bas → y le plus grand
const floorCenterY = (floorIdx: number) =>
  VB_H - (floorIdx + 0.5) * FLOOR_H;

// Position d'un niveau : serpentin horizontal par étages (bas → haut)
const nodePos = (level: number) => {
  const fi = floorIndexFor(level);
  const f = FLOORS_DEF[fi];
  const count = f.max - f.min + 1;
  const localIdx = level - f.min;
  const t = count === 1 ? 0.5 : localIdx / (count - 1);
  const tDir = f.dir === 1 ? t : 1 - t;
  const x = PAD_X + tDir * (VB_W - 2 * PAD_X);
  const y = floorCenterY(fi);
  return { x, y };
};

// Chemin entièrement en Bézier — virages fluides, jamais d'angle droit.
// Sur un étage : courbe horizontale très douce passant par chaque palier.
// Entre étages : "loop" en S qui s'enroule (le ruban contourne l'extrémité).
const buildPathD = () => {
  let d = "";
  for (let fi = 0; fi < FLOORS_DEF.length; fi++) {
    const f = FLOORS_DEF[fi];
    // Trace l'étage avec une suite de courbes cubiques douces
    for (let lvl = f.min; lvl <= f.max; lvl++) {
      const p = nodePos(lvl);
      if (lvl === 1) {
        d += `M ${p.x} ${p.y}`;
        continue;
      }
      if (lvl === f.min) {
        // Entrée d'étage : on vient de la transition (déjà tracée plus bas)
        d += ` L ${p.x} ${p.y}`;
        continue;
      }
      const prev = nodePos(lvl - 1);
      const dx = p.x - prev.x;
      const wobble = ((lvl % 2 === 0) ? -1 : 1) * 28;
      // Cubic Bézier symétrique : ondulation douce
      const c1x = prev.x + dx * 0.35;
      const c1y = prev.y + wobble;
      const c2x = prev.x + dx * 0.65;
      const c2y = p.y - wobble;
      d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p.x} ${p.y}`;
    }
    // Transition vers l'étage supérieur — boucle en S qui s'enroule
    if (fi < FLOORS_DEF.length - 1) {
      const last = nodePos(f.max);
      const nextF = FLOORS_DEF[fi + 1];
      const first = nodePos(nextF.min);
      // Direction de l'enroulement : si l'étage finit à droite, on enroule vers la droite
      const sideOut = f.dir === 1 ? 1 : -1;     // sort par la droite si dir=1
      const overshoot = 220 * sideOut;
      const c1x = last.x + overshoot;
      const c1y = last.y - 20;
      const c2x = first.x + overshoot;
      const c2y = first.y + 20;
      d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${first.x} ${first.y}`;
    }
  }
  return d;
};

// ============================================================================
// BIOMES — 4 décors fondus
// ============================================================================
type BiomeKey = "gym" | "regional" | "world" | "pantheon";
interface Biome {
  key: BiomeKey;
  label: string;
  sub: string;
  min: number;
  max: number;
  tier: "bronze" | "silver" | "gold" | "platinum";
}
const BIOMES: Biome[] = [
  { key: "gym",       label: "Gymnase",     sub: "Apprentissage",    min: 1,  max: 6,  tier: "bronze" },
  { key: "regional",  label: "Régionale",   sub: "Compétition",      min: 7,  max: 12, tier: "silver" },
  { key: "world",     label: "Élite",       sub: "Arène mondiale",   min: 13, max: 17, tier: "gold" },
  { key: "pantheon",  label: "Panthéon",    sub: "Légende",          min: 18, max: 22, tier: "platinum" },
];
const biomeFor = (lvl: number): Biome =>
  BIOMES.find((b) => lvl >= b.min && lvl <= b.max) || BIOMES[0];

// Index d'étage (0 en bas, 3 en haut) pour un biome
const biomeFloorIndex = (b: Biome) => floorIndexFor(b.min);

// ============================================================================
// PLATEFORMES — couleurs par tier
// ============================================================================
const tierColors = {
  bronze:   { ring: "#5a3418", face1: "#f0a665", face2: "#a55822", face3: "#5e2c0e", glow: "#d97a3b" },
  silver:   { ring: "#3a4a5e", face1: "#f1f5fa", face2: "#9eb0c4", face3: "#52617a", glow: "#aac4e0" },
  gold:     { ring: "#5a4400", face1: "#fff2a8", face2: "#e8b830", face3: "#7a5a00", glow: "#ffd954" },
  platinum: { ring: "#0e3550", face1: "#dff5ff", face2: "#7cc8ff", face3: "#1f6aa6", glow: "#9ae0ff" },
};

// ============================================================================
// VOLANTS SVG — 8 paliers de qualité visuelle (N1..N22)
// ============================================================================
const tierForLevel = (lvl: number): 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 => {
  if (lvl <= 3) return 0;
  if (lvl <= 6) return 1;
  if (lvl <= 9) return 2;
  if (lvl <= 12) return 3;
  if (lvl <= 15) return 4;
  if (lvl <= 17) return 5;
  if (lvl <= 20) return 6;
  return 7;
};

interface ShuttleProps {
  level: number;
  size?: number;
}

const Shuttle = ({ level, size = 130 }: ShuttleProps) => {
  const t = tierForLevel(level);

  // Palettes par tier
  const palettes = [
    { feather: "#e8e0d0", tip: "#d4c8b0", base: "#fff7e6", cork: "#7a5a3a", accent: "#9b8a6a", aura: "transparent" },     // 0 plastique usé
    { feather: "#ffffff", tip: "#e8e8e8", base: "#ffffff", cork: "#8a6a44", accent: "#bfb59a", aura: "transparent" },     // 1 plastique neuf
    { feather: "#fafafa", tip: "#dcdcdc", base: "#ffffff", cork: "#6a4a2a", accent: "#a89878", aura: "transparent" },     // 2 plume entrée
    { feather: "#ffffff", tip: "#cfd6df", base: "#ffffff", cork: "#5a3a1a", accent: "#c0c8d0", aura: "transparent" },     // 3 bon plume
    { feather: "#ffffff", tip: "#bcd6e8", base: "#ffffff", cork: "#3a2810", accent: "#86b8d8", aura: "rgba(135,200,240,0.55)" }, // 4 pro éclatant
    { feather: "#fff8d8", tip: "#f0d066", base: "#ffffff", cork: "#3a2810", accent: "#d4a832", aura: "rgba(255,210,90,0.6)" },   // 5 premium doré
    { feather: "#eaf6ff", tip: "#7cc8ff", base: "#ffffff", cork: "#0e3550", accent: "#3aa8e8", aura: "rgba(120,200,255,0.7)" },  // 6 high-tech
    { feather: "#dff5ff", tip: "#9ae0ff", base: "#ffffff", cork: "#1f6aa6", accent: "#7cc8ff", aura: "rgba(180,230,255,0.85)" }, // 7 divin
  ];
  const p = palettes[t];

  // Plumes : 7 plumes en éventail
  const feathers = [-42, -28, -14, 0, 14, 28, 42];

  return (
    <svg width={size} height={size * 1.4} viewBox="0 0 100 140" style={{ overflow: "visible" }}>
      <defs>
        <radialGradient id={`sh-aura-${t}`} cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor={p.aura} />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <linearGradient id={`sh-feather-${t}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={p.feather} />
          <stop offset="100%" stopColor={p.tip} />
        </linearGradient>
        <linearGradient id={`sh-cork-${t}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={p.cork} stopOpacity="0.7" />
          <stop offset="50%" stopColor={p.cork} />
          <stop offset="100%" stopColor="#000" stopOpacity="0.6" />
        </linearGradient>
      </defs>

      {/* aura premium/divine */}
      {t >= 4 && (
        <circle cx="50" cy="55" r="48" fill={`url(#sh-aura-${t})`}>
          <animate attributeName="r" values="46;52;46" dur="2.6s" repeatCount="indefinite" />
        </circle>
      )}

      {/* particules divines pour le palier ultime */}
      {t === 7 && (
        <g>
          {[...Array(8)].map((_, i) => {
            const angle = (i / 8) * Math.PI * 2;
            const cx = 50 + Math.cos(angle) * 42;
            const cy = 55 + Math.sin(angle) * 42;
            return (
              <circle key={i} cx={cx} cy={cy} r="1.6" fill="#ffffff">
                <animate attributeName="opacity" values="0.2;1;0.2" dur="1.8s" begin={`${i * 0.2}s`} repeatCount="indefinite" />
                <animate attributeName="r" values="1;2.4;1" dur="1.8s" begin={`${i * 0.2}s`} repeatCount="indefinite" />
              </circle>
            );
          })}
        </g>
      )}

      {/* Plumes (jupe du volant) */}
      <g>
        {feathers.map((angle, i) => (
          <g key={i} transform={`translate(50 70) rotate(${angle})`}>
            {/* tige */}
            <line x1="0" y1="0" x2="0" y2="-50" stroke={p.accent} strokeWidth="0.6" opacity="0.6" />
            {/* plume */}
            <path
              d="M 0 -2 Q -8 -28 -5 -54 Q 0 -58 5 -54 Q 8 -28 0 -2 Z"
              fill={`url(#sh-feather-${t})`}
              stroke={p.accent}
              strokeWidth="0.4"
              opacity={t === 0 ? 0.85 : 1}
            />
            {/* nervures */}
            {[-44, -36, -28, -20].map((y, k) => (
              <line key={k} x1="-3" y1={y} x2="3" y2={y} stroke={p.accent} strokeWidth="0.25" opacity="0.5" />
            ))}
            {/* liseré doré pour palier 5 */}
            {t === 5 && (
              <path d="M -5 -54 Q 0 -58 5 -54" fill="none" stroke="#ffcc33" strokeWidth="1.2" />
            )}
          </g>
        ))}
      </g>

      {/* Cordes circulaires liant les plumes */}
      <ellipse cx="50" cy="22" rx="28" ry="6" fill="none" stroke={p.accent} strokeWidth="0.8" opacity="0.7" />
      <ellipse cx="50" cy="14" rx="22" ry="4" fill="none" stroke={p.accent} strokeWidth="0.6" opacity="0.5" />

      {/* Bouchon (cork) */}
      <ellipse cx="50" cy="78" rx="14" ry="6" fill="#000" opacity="0.25" />
      <path
        d="M 36 70 Q 36 86 50 88 Q 64 86 64 70 Z"
        fill={`url(#sh-cork-${t})`}
        stroke="#000"
        strokeOpacity="0.4"
        strokeWidth="0.6"
      />
      {/* highlight sur cork */}
      <ellipse cx="44" cy="74" rx="3" ry="6" fill="#fff" opacity="0.25" />
    </svg>
  );
};

// ============================================================================
// PLATEFORME RONDE (Médaille)
// ============================================================================
const Platform = ({ level, x, y }: { level: number; x: number; y: number }) => {
  const b = biomeFor(level);
  const c = tierColors[b.tier];
  const radius = 102;

  return (
    <g transform={`translate(${x} ${y})`}>
      {/* halo glow */}
      <ellipse cx="0" cy="6" rx={radius + 28} ry={radius * 0.55} fill={c.glow} opacity="0.35" filter="url(#blur-soft)" />

      {/* ombre portée au sol */}
      <ellipse cx="0" cy={radius * 0.55} rx={radius * 1.1} ry={radius * 0.26} fill="#000" opacity="0.5" />

      {/* Tranche / côté de la pièce (effet 3D plus épais) */}
      <ellipse cx="0" cy={radius * 0.32} rx={radius} ry={radius * 0.46} fill={c.face3} />
      <path
        d={`M ${-radius} 0 A ${radius} ${radius * 0.46} 0 0 0 ${radius} 0 L ${radius} ${radius * 0.32} A ${radius} ${radius * 0.46} 0 0 1 ${-radius} ${radius * 0.32} Z`}
        fill={c.ring}
      />

      {/* Face supérieure principale */}
      <ellipse cx="0" cy="0" rx={radius} ry={radius * 0.46} fill={c.face2} />
      {/* gradient radial via ellipse claire */}
      <ellipse cx="0" cy="-4" rx={radius * 0.92} ry={radius * 0.4} fill={c.face1} opacity="0.85" />

      {/* anneau extérieur métal */}
      <ellipse cx="0" cy="0" rx={radius} ry={radius * 0.46} fill="none" stroke={c.ring} strokeWidth="4" />
      <ellipse cx="0" cy="0" rx={radius - 9} ry={radius * 0.46 - 5} fill="none" stroke={c.face3} strokeWidth="1.6" opacity="0.7" />

      {/* Reliefs gravés (petits points décoratifs) */}
      {[...Array(12)].map((_, i) => {
        const a = (i / 12) * Math.PI * 2;
        const px = Math.cos(a) * (radius - 16);
        const py = Math.sin(a) * (radius * 0.46 - 7);
        return <circle key={i} cx={px} cy={py} r="1.6" fill={c.face3} opacity="0.55" />;
      })}

      {/* Highlight brillant en haut */}
      <ellipse cx="-14" cy="-14" rx={radius * 0.55} ry={radius * 0.13} fill="#ffffff" opacity="0.45" />

      {/* NUMERO du niveau — Lexend Black, parfaitement centré */}
      <text
        x="0"
        y="0"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="Lexend, Inter, sans-serif"
        fontSize="72"
        fontWeight="900"
        fill="#ffffff"
        stroke={c.face3}
        strokeWidth="3"
        paintOrder="stroke"
        style={{ letterSpacing: "-0.02em", filter: `drop-shadow(0 3px 0 ${c.face3})` }}
      >
        {level}
      </text>
    </g>
  );
};

// ============================================================================
// AVATAR ÉLÈVE — petit badge rond avec initiale
// ============================================================================
const palette = [
  "#ef4444", // red
  "#f59e0b", // amber
  "#eab308", // yellow
  "#22c55e", // green
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#f97316", // orange
];
const colorForName = (name: string) => palette[name.charCodeAt(0) % palette.length];

const StudentBadge = ({
  student, x, y, delay, onClick, onHover,
}: {
  student: Student;
  x: number;
  y: number;
  delay: number;
  onClick: () => void;
  onHover?: () => void;
}) => {
  const color = colorForName(student.name);
  const initial = student.name[0].toUpperCase();
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseEnter={onHover}
      className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 group"
      style={{
        left: x,
        top: y,
        animation: `float-orbit 3.5s ease-in-out ${delay}s infinite`,
      }}
    >
      {/* Badge 3D */}
      <div
        className="grid place-items-center font-bold text-white select-none border-2 border-white/30 shadow-md"
        style={{
          width: 42,
          height: 42,
          borderRadius: "50%",
          background: `radial-gradient(circle at 30% 22%, #ffffffcc 0%, ${color}ff 45%, ${color} 70%, #00000055 100%)`,
          boxShadow: `inset 0 -3px 6px rgba(0,0,0,0.45), inset 0 2px 3px rgba(255,255,255,0.55), 0 4px 10px rgba(0,0,0,0.55), 0 0 14px ${color}99`,
          fontSize: 17,
          fontFamily: "Lexend, Inter, sans-serif",
          letterSpacing: "0.02em",
          textShadow: "0 1px 2px rgba(0,0,0,0.6)",
          transition: "transform 0.18s",
        }}
        onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.18)")}
        onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        {initial}
      </div>
      {/* Tooltip */}
      <div
        className="absolute left-1/2 -translate-x-1/2 -top-9 px-2.5 py-1 rounded-md text-[11px] font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        style={{
          background: "rgba(8, 12, 28, 0.95)",
          color: "#ffffff",
          border: `1.5px solid ${color}`,
          boxShadow: `0 0 12px ${color}99, 0 4px 12px rgba(0,0,0,0.6)`,
          fontFamily: "Lexend, Inter, sans-serif",
          letterSpacing: "0.02em",
        }}
      >
        {student.name}
        <div
          className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 rotate-45"
          style={{ background: "rgba(8, 12, 28, 0.95)", borderRight: `1.5px solid ${color}`, borderBottom: `1.5px solid ${color}` }}
        />
      </div>
    </button>
  );
};

// Positions en grappe autour d'une plateforme — évite de cacher le numéro/volant
const swarmPositions = (count: number, cx: number, cy: number) => {
  const positions: { x: number; y: number; delay: number }[] = [];
  // Couronne large : essentiellement sur les côtés de la plateforme, pas devant
  const slots = [
    { dx: -130, dy: -80 }, { dx: -150, dy: -30 }, { dx: -135, dy: 30 },
    { dx: 130, dy: -80 },  { dx: 150, dy: -30 },  { dx: 135, dy: 30 },
    { dx: -90, dy: -130 }, { dx: 90, dy: -130 },
    { dx: -180, dy: -10 }, { dx: 180, dy: -10 },
    { dx: -110, dy: 70 },  { dx: 110, dy: 70 },
  ];
  for (let i = 0; i < Math.min(count, slots.length); i++) {
    positions.push({
      x: cx + slots[i].dx,
      y: cy + slots[i].dy,
      delay: i * 0.18,
    });
  }
  return positions;
};

// ============================================================================
// PARCOURS — composant principal
// ============================================================================
const Parcours = () => {
  const { classId } = Route.useParams();
  const navigate = useTanstackNavigate();
  const goStudent = (sid: string) => { playSfx("click"); navigate({ to: "/class/$classId/student/$studentId", params: { classId, studentId: sid } }); };
  const goBack = () => navigate({ to: "/class/$classId", params: { classId } });
  const goHome = () => navigate({ to: "/" });
  const { classes, studentsByClass, ensureClass } = useAppStore();
  const { muted, toggleMute, setBgm, playSfx } = useAudio();
  const cls = classes.find((c) => c.id === classId);

  useEffect(() => {
    if (classId) ensureClass(classId);
  }, [classId, ensureClass]);

  // Background music: Odyssey track on mount
  useEffect(() => {
    setBgm("odyssey");
  }, [setBgm]);

  const students = studentsByClass[classId] || [];

  // ---- Zoom & Pan state ----
  const [scale, setScale] = useState(1);
  const [minScale, setMinScale] = useState(0.2);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const MAX_SCALE = 1.6;
  const viewportRef = useRef<HTMLDivElement>(null);
  const userInteracted = useRef(false);

  const pathD = useMemo(() => buildPathD(), []);

  // Compute minScale (fit-to-screen). On first run, fit AND center.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    let firstRun = true;
    const compute = () => {
      const sw = el.clientWidth / VB_W;
      const sh = el.clientHeight / VB_H;
      const fit = Math.min(sw, sh);
      setMinScale(fit);
      if (firstRun && !userInteracted.current) {
        firstRun = false;
        // Check if we're returning from a student profile
        const focusId = typeof window !== "undefined" ? sessionStorage.getItem(FOCUS_KEY) : null;
        if (focusId) {
          sessionStorage.removeItem(FOCUS_KEY);
          const stu = (studentsByClass[classId] || []).find((s) => s.id === focusId);
          if (stu) {
            const lvl = Math.max(1, Math.min(VISIBLE_LEVELS, stu.level));
            const { x, y } = nodePos(lvl);
            const targetScale = Math.max(fit, 0.5);
            setScale(targetScale);
            // center the platform in viewport
            setPan({
              x: el.clientWidth / 2 - x * targetScale,
              y: el.clientHeight / 2 - y * targetScale,
            });
            return;
          }
        }
        setScale(fit);
        setPan({
          x: (el.clientWidth - VB_W * fit) / 2,
          y: (el.clientHeight - VB_H * fit) / 2,
        });
      }
    };
    compute();
    const ro = new ResizeObserver(() => {
      const sw = el.clientWidth / VB_W;
      const sh = el.clientHeight / VB_H;
      setMinScale(Math.min(sw, sh));
    });
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  // Clamp pan so the canvas can't fly out of sight (keep at least some overlap)
  const clampPan = (p: { x: number; y: number }, s: number) => {
    const el = viewportRef.current;
    if (!el) return p;
    const cw = VB_W * s;
    const ch = VB_H * s;
    const vw = el.clientWidth;
    const vh = el.clientHeight;
    // Allow centering when canvas smaller than viewport
    const minX = Math.min(0, vw - cw);
    const maxX = Math.max(0, vw - cw);
    const minY = Math.min(0, vh - ch);
    const maxY = Math.max(0, vh - ch);
    return {
      x: Math.max(minX, Math.min(maxX, p.x)),
      y: Math.max(minY, Math.min(maxY, p.y)),
    };
  };

  const byLevel = useMemo(() => {
    const m = new Map<number, Student[]>();
    for (const s of students) {
      const lvl = Math.max(1, Math.min(VISIBLE_LEVELS, s.level));
      if (!m.has(lvl)) m.set(lvl, []);
      m.get(lvl)!.push(s);
    }
    return m;
  }, [students]);

  const clampScale = (s: number) => Math.max(minScale, Math.min(MAX_SCALE, s));

  // Zoom centered on viewport center
  const zoomBy = (delta: number) => {
    userInteracted.current = true;
    playSfx("zoom");
    const el = viewportRef.current;
    if (!el) { setScale((s) => clampScale(s + delta)); return; }
    const cx = el.clientWidth / 2;
    const cy = el.clientHeight / 2;
    setScale((s) => {
      const ns = clampScale(s + delta);
      const ratio = ns / s;
      setPan((p) => clampPan({
        x: cx - (cx - p.x) * ratio,
        y: cy - (cy - p.y) * ratio,
      }, ns));
      return ns;
    });
  };
  const zoomIn = () => zoomBy(0.1);
  const zoomOut = () => zoomBy(-0.1);
  const fitToScreen = () => {
    userInteracted.current = true;
    playSfx("zoom");
    const el = viewportRef.current;
    setScale(minScale);
    if (el) {
      setPan({
        x: (el.clientWidth - VB_W * minScale) / 2,
        y: (el.clientHeight - VB_H * minScale) / 2,
      });
    }
  };

  // ---- Drag-to-pan ----
  const dragRef = useRef<{ active: boolean; startX: number; startY: number; panX: number; panY: number; pointerId: number | null }>({
    active: false, startX: 0, startY: 0, panX: 0, panY: 0, pointerId: null,
  });
  const [isDragging, setIsDragging] = useState(false);

  const onPointerDown = (e: React.PointerEvent) => {
    // Only left-button / touch / pen
    if (e.button !== 0 && e.pointerType === "mouse") return;
    userInteracted.current = true;
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      panX: pan.x,
      panY: pan.y,
      pointerId: e.pointerId,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setIsDragging(true);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current.active) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPan(clampPan({ x: dragRef.current.panX + dx, y: dragRef.current.panY + dy }, scale));
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* noop */ }
    setIsDragging(false);
  };

  if (!cls) {
    return (
      <main className="min-h-screen grid place-items-center p-8 bg-[hsl(230_50%_8%)] text-white">
        <div className="text-center">
          <p className="font-display text-3xl">Classe introuvable</p>
          <button onClick={() => goHome()} className="mt-4 px-4 py-2 rounded-full bg-white text-black font-bold">Retour au hub</button>
        </div>
      </main>
    );
  }

  return (
    <main className="h-screen flex flex-col overflow-hidden relative bg-[hsl(230_55%_5%)]">
      {/* ====== HEADER FIXE ====== */}
      <header className="relative z-30 border-b border-white/10 bg-[hsl(228_50%_7%/0.85)] backdrop-blur-xl">
        <div className="px-4 md:px-8 py-3 flex items-center gap-4 justify-between">
          {/* Gauche */}
          <button
            onClick={() => { playSfx("click"); goBack(); }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-bold transition"
          >
            <ArrowLeft size={16} strokeWidth={3} />
            <span>{cls.name}</span>
          </button>

          {/* Centre */}
          <div className="text-center flex-1">
            <h1
              className="font-display text-2xl md:text-3xl leading-none text-transparent bg-clip-text"
              style={{
                backgroundImage:
                  "linear-gradient(180deg, #fff7d0 0%, #ffd54a 50%, #ff8a2a 100%)",
                filter: "drop-shadow(0 2px 0 rgba(140,60,10,0.6)) drop-shadow(0 0 14px rgba(255,180,60,0.55))",
                letterSpacing: "0.06em",
              }}
            >
              ODYSSÉE DU VOLANT
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-200/85">
              Stadium Quest · {students.length} élèves
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio toggle */}
            <button
              onClick={toggleMute}
              className="w-10 h-10 grid place-items-center rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white transition"
              title={muted ? "Activer le son" : "Couper le son"}
              aria-label="Toggle audio"
            >
              {muted ? <VolumeX size={16} strokeWidth={3} /> : <Volume2 size={16} strokeWidth={3} />}
            </button>

            {/* Zoom */}
            <div className="flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-full px-2 py-1.5 backdrop-blur">
              <button
                onClick={zoomOut}
                disabled={scale <= minScale + 0.001}
                className="w-8 h-8 grid place-items-center rounded-full text-white bg-white/5 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition"
                title="Dézoomer"
              >
                <Minus size={16} strokeWidth={3} />
              </button>
              <span suppressHydrationWarning className="text-xs font-bold tabular-nums w-12 text-center text-white" style={{ fontFamily: "Lexend, Inter, sans-serif" }}>
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={zoomIn}
                disabled={scale >= MAX_SCALE - 0.001}
                className="w-8 h-8 grid place-items-center rounded-full text-white bg-white/5 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition"
                title="Zoomer"
              >
                <Plus size={16} strokeWidth={3} />
              </button>
              <div className="w-px h-5 bg-white/20 mx-1" />
              <button onClick={fitToScreen} className="w-8 h-8 grid place-items-center rounded-full text-white hover:bg-white/15" title="Voir tout">
                <Maximize2 size={14} strokeWidth={3} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ====== VIEWPORT (full-bleed background, drag-to-pan) ====== */}
      <div
        ref={viewportRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className={`relative flex-1 overflow-hidden touch-none select-none ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
        style={{
          background:
            "radial-gradient(ellipse at center, hsl(230 50% 9%) 0%, hsl(230 60% 4%) 100%)",
        }}
      >
        {/* Full-bleed biome backdrop — stretches edge to edge regardless of canvas size */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <FullBleedBiomes />
        </div>

        {/* Pan/zoom canvas */}
        <div
          className="absolute top-0 left-0 origin-top-left will-change-transform"
          style={{
            width: VB_W,
            height: VB_H,
            transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${scale})`,
          }}
        >
          {/* Path & platforms */}
          <svg
            width={VB_W}
            height={VB_H}
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            className="absolute top-0 left-0"
            style={{ pointerEvents: "none" }}
          >
            <defs>
              <filter id="blur-soft" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="14" />
              </filter>
              <filter id="neon-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="8" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <path d={pathD} fill="none" stroke="#000" strokeOpacity="0.55" strokeWidth="64" strokeLinecap="round" strokeLinejoin="round" />
            <path d={pathD} fill="none" stroke="#fff8d6" strokeOpacity="0.35" strokeWidth="58" strokeLinecap="round" strokeLinejoin="round" filter="url(#neon-glow)" />
            <path d={pathD} fill="none" stroke="#ffffff" strokeWidth="44" strokeLinecap="round" strokeLinejoin="round" />
            <path d={pathD} fill="none" stroke="#fff2b0" strokeWidth="22" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
            <path d={pathD} fill="none" stroke="#fff" strokeOpacity="0.7" strokeWidth="3" strokeDasharray="4 22" strokeLinecap="round">
              <animate attributeName="stroke-dashoffset" from="0" to="-260" dur="14s" repeatCount="indefinite" />
            </path>

            {Array.from({ length: VISIBLE_LEVELS }, (_, i) => {
              const lvl = i + 1;
              const { x, y } = nodePos(lvl);
              return <Platform key={lvl} level={lvl} x={x} y={y} />;
            })}
          </svg>

          {/* Volants */}
          <div className="absolute top-0 left-0 pointer-events-none" style={{ width: VB_W, height: VB_H }}>
            {Array.from({ length: VISIBLE_LEVELS }, (_, i) => {
              const lvl = i + 1;
              const { x, y } = nodePos(lvl);
              return (
                <div
                  key={lvl}
                  className="absolute"
                  style={{
                    left: x,
                    top: y - 195,
                    width: 0,
                    height: 0,
                    animation: `float-shuttle 3.${(i % 5) + 2}s ease-in-out ${(i % 6) * 0.25}s infinite`,
                  }}
                >
                  <div style={{ position: "absolute", left: "50%", top: 0, transform: "translateX(-50%)" }}>
                    <Shuttle level={lvl} size={130} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Élèves */}
          <div className="absolute top-0 left-0 pointer-events-none" style={{ width: VB_W, height: VB_H }}>
            {Array.from(byLevel.entries()).map(([lvl, list]) => {
              const { x, y } = nodePos(lvl);
              const positions = swarmPositions(list.length, x, y);
              return (
                <div key={lvl}>
                  {list.slice(0, positions.length).map((s, idx) => (
                    <StudentBadge
                      key={s.id}
                      student={s}
                      x={positions[idx].x}
                      y={positions[idx].y}
                      delay={positions[idx].delay}
                      onHover={() => playSfx("hover")}
                      onClick={() => goStudent(s.id)}
                    />
                  ))}
                  {list.length > positions.length && (
                    <button
                      onClick={(e) => { e.stopPropagation(); }}
                      className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 grid place-items-center font-bold text-white"
                      style={{
                        left: x + 170,
                        top: y - 60,
                        width: 38, height: 38, borderRadius: "50%",
                        background: "linear-gradient(135deg, #555, #222)",
                        border: "2.5px solid #fff",
                        boxShadow: "0 4px 8px rgba(0,0,0,0.6)",
                        fontSize: 13,
                      }}
                    >
                      +{list.length - positions.length}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ====== STYLES LOCAUX ====== */}
      <style>{`
        @keyframes float-orbit {
          0%, 100% { transform: translate(-50%, -50%) translateY(0px); }
          50%      { transform: translate(-50%, -50%) translateY(-7px); }
        }
        @keyframes float-shuttle {
          0%, 100% { transform: translateY(0px) rotate(-2deg); }
          50%      { transform: translateY(-14px) rotate(2deg); }
        }
        @keyframes pulse-spotlight {
          0%, 100% { opacity: 0.55; transform: scale(1); }
          50%      { opacity: 0.85; transform: scale(1.08); }
        }
      `}</style>
    </main>
  );
};

// Full-bleed backdrop: 4 horizontal biome bands stretching the entire viewport width.
// Independent from the SVG canvas — guarantees no black bars on wide monitors.
const FullBleedBiomes = () => {
  return (
    <div className="absolute inset-0 flex flex-col">
      {/* Bands order top→bottom: pantheon, world, regional, gym */}
      <div className="flex-1 relative overflow-hidden">
        <BiomePantheon />
        <BiomeLabel label="PANTHÉON" />
      </div>
      <div className="flex-1 relative overflow-hidden">
        <BiomeWorld />
        <BiomeLabel label="ÉLITE" />
      </div>
      <div className="flex-1 relative overflow-hidden">
        <BiomeRegional />
        <BiomeLabel label="RÉGIONALE" />
      </div>
      <div className="flex-1 relative overflow-hidden">
        <BiomeGym />
        <BiomeLabel label="GYMNASE" />
      </div>
    </div>
  );
};

const BiomeLabel = ({ label }: { label: string }) => (
  <div
    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-display pointer-events-none select-none"
    style={{
      fontSize: "min(24vw, 360px)",
      color: "#ffffff",
      opacity: 0.04,
      letterSpacing: "0.18em",
      textTransform: "uppercase",
      whiteSpace: "nowrap",
      fontFamily: "Lexend, Inter, sans-serif",
      fontWeight: 900,
    }}
  >
    {label}
  </div>
);

// ============================================================================
// BIOMES LAYER — 4 décors superposés en bandes horizontales (1/4 hauteur chacun)
// Étage 0 (Gymnase) en bas → Étage 3 (Panthéon) en haut.
// Fondu doux entre étages via mask vertical.
// ============================================================================
const BiomesLayer = () => {
  return (
    <div className="absolute top-0 left-0 overflow-hidden" style={{ width: VB_W, height: VB_H }}>
      {BIOMES.map((b) => {
        const fi = biomeFloorIndex(b);
        // étage 0 = bas, étage 3 = haut
        const top = VB_H - (fi + 1) * FLOOR_H;
        return (
          <div
            key={b.key}
            className="absolute left-0 w-full"
            style={{
              top,
              height: FLOOR_H,
              // fondu doux haut/bas pour que les biomes voisins se mélangent
              maskImage: "linear-gradient(to bottom, transparent 0%, #000 14%, #000 86%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, #000 14%, #000 86%, transparent 100%)",
            }}
          >
            {b.key === "gym" && <BiomeGym />}
            {b.key === "regional" && <BiomeRegional />}
            {b.key === "world" && <BiomeWorld />}
            {b.key === "pantheon" && <BiomePantheon />}

            {/* Étiquette fantôme géante centrée sur l'étage */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-display pointer-events-none select-none"
              style={{
                fontSize: 360,
                color: "#ffffff",
                opacity: 0.05,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
              }}
            >
              {b.label}
            </div>

            {/* Bandeau du biome — collé au bord gauche pour ne pas masquer le chemin */}
            <div
              className="absolute top-6 left-8 px-6 py-2 rounded-full backdrop-blur"
              style={{
                background: "rgba(10, 14, 30, 0.62)",
                border: "1.5px solid rgba(255,255,255,0.18)",
              }}
            >
              <div className="text-left">
                <p className="font-display text-2xl text-white tracking-widest leading-none">
                  ÉTAGE {fi + 1} · {b.label.toUpperCase()}
                </p>
                <p className="text-[10px] font-bold tracking-[0.35em] text-white/70 mt-1">
                  {b.sub.toUpperCase()} · N{b.min}–{b.max}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ----------- BIOME 1 : GYMNASE (parquet bois + lignes blanches) ------------
const BiomeGym = () => (
  <div className="absolute inset-0">
    {/* parquet bois */}
    <div
      className="absolute inset-0"
      style={{
        background:
          "linear-gradient(180deg, hsl(28 35% 18%) 0%, hsl(30 50% 32%) 40%, hsl(32 55% 42%) 100%)," +
          "repeating-linear-gradient(90deg, transparent 0 110px, rgba(0,0,0,0.18) 110px 112px)," +
          "repeating-linear-gradient(0deg, transparent 0 24px, rgba(255,255,255,0.04) 24px 25px)",
      }}
    />
    {/* veines bois */}
    <div
      className="absolute inset-0 opacity-50"
      style={{
        backgroundImage:
          "repeating-linear-gradient(90deg, transparent 0 40px, rgba(60,30,10,0.25) 40px 42px, transparent 42px 88px)",
      }}
    />
    {/* lignes blanches du terrain badminton */}
    <div className="absolute left-0 right-0" style={{ top: "30%", height: "55%" }}>
      <div className="absolute inset-x-12 top-0 bottom-0 border-[6px] border-white/85" style={{ borderRadius: 4, boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.4)" }} />
      <div className="absolute left-1/2 top-0 bottom-0 w-[5px] -translate-x-1/2 bg-white/85" />
      <div className="absolute left-12 right-12 top-1/3 h-[5px] bg-white/85" />
      <div className="absolute left-12 right-12 top-2/3 h-[5px] bg-white/85" />
    </div>
    {/* lumière haute */}
    <div
      className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-1/2 rounded-full blur-3xl"
      style={{ background: "radial-gradient(ellipse, rgba(255,220,160,0.5), transparent 60%)" }}
    />
  </div>
);

// ----------- BIOME 2 : COMPÉTITION RÉGIONALE (taraflex bleu + spots) -------
const BiomeRegional = () => (
  <div className="absolute inset-0">
    {/* sol taraflex bleu */}
    <div
      className="absolute inset-0"
      style={{
        background:
          "linear-gradient(180deg, hsl(215 50% 18%) 0%, hsl(210 65% 32%) 50%, hsl(205 75% 45%) 100%)",
      }}
    />
    {/* tribunes sombres en haut */}
    <div
      className="absolute top-0 left-0 right-0 h-1/2"
      style={{
        background:
          "linear-gradient(180deg, hsl(220 45% 8%) 0%, hsl(220 50% 12%) 70%, transparent 100%)",
      }}
    />
    {/* points de foule */}
    <div className="absolute top-0 left-0 right-0 h-1/3 opacity-40">
      {Array.from({ length: 200 }).map((_, i) => (
        <span
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${(i * 7.3) % 100}%`,
            top: `${(i * 13.7) % 100}%`,
            width: 3,
            height: 3,
            background: i % 5 === 0 ? "#ffeeaa" : "#778899",
          }}
        />
      ))}
    </div>
    {/* faisceaux de projecteurs */}
    {[20, 50, 80].map((left, i) => (
      <div
        key={i}
        className="absolute top-0"
        style={{
          left: `${left}%`,
          width: 200,
          height: "70%",
          background: "linear-gradient(180deg, rgba(180,220,255,0.55), transparent 80%)",
          filter: "blur(28px)",
          transform: "translateX(-50%) rotate(8deg)",
          animation: `pulse-spotlight ${6 + i * 1.5}s ease-in-out ${i * 0.5}s infinite`,
        }}
      />
    ))}
    {/* lignes terrain */}
    <div className="absolute left-0 right-0" style={{ bottom: "5%", height: "45%" }}>
      <div className="absolute inset-x-16 top-0 bottom-0 border-[5px] border-white/75" style={{ borderRadius: 4 }} />
      <div className="absolute left-1/2 top-0 bottom-0 w-[4px] -translate-x-1/2 bg-white/75" />
    </div>
  </div>
);

// ----------- BIOME 3 : ARÈNE MONDIALE (sol bordeaux + grands éclairages) ---
const BiomeWorld = () => (
  <div className="absolute inset-0">
    <div
      className="absolute inset-0"
      style={{
        background:
          "linear-gradient(180deg, hsl(345 30% 8%) 0%, hsl(348 55% 22%) 50%, hsl(350 65% 32%) 100%)",
      }}
    />
    {/* tribunes brillantes */}
    <div
      className="absolute top-0 left-0 right-0 h-2/5"
      style={{ background: "linear-gradient(180deg, #050008 0%, #1a0a14 80%, transparent 100%)" }}
    />
    {/* milliers de points (foule scintillante) */}
    <div className="absolute top-0 left-0 right-0 h-2/5">
      {Array.from({ length: 350 }).map((_, i) => (
        <span
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${(i * 5.7) % 100}%`,
            top: `${(i * 11.3) % 100}%`,
            width: 2,
            height: 2,
            background: "#ffd76b",
            opacity: 0.6,
            boxShadow: "0 0 4px #ffd76b",
            animation: `pulse-spotlight ${2 + (i % 5)}s ease-in-out ${i * 0.05}s infinite`,
          }}
        />
      ))}
    </div>
    {/* spots latéraux puissants */}
    <div
      className="absolute top-1/4 left-0 w-1/3 h-1/2 rounded-full blur-3xl"
      style={{ background: "radial-gradient(ellipse, rgba(150,200,255,0.45), transparent 65%)" }}
    />
    <div
      className="absolute top-1/4 right-0 w-1/3 h-1/2 rounded-full blur-3xl"
      style={{ background: "radial-gradient(ellipse, rgba(150,200,255,0.45), transparent 65%)" }}
    />
    {/* grand spot central doré */}
    <div
      className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-2/3 rounded-full blur-3xl"
      style={{ background: "radial-gradient(circle, rgba(255,200,80,0.4), transparent 60%)" }}
    />
  </div>
);

// ----------- BIOME 4 : PANTHÉON (marbre + colonnes + statues dorées) -------
const BiomePantheon = () => (
  <div className="absolute inset-0">
    {/* fond marbre */}
    <div
      className="absolute inset-0"
      style={{
        background:
          "linear-gradient(180deg, hsl(230 40% 25%) 0%, hsl(230 35% 35%) 35%, hsl(225 30% 50%) 100%)",
      }}
    />
    {/* veines marbre */}
    <div
      className="absolute inset-0 opacity-40"
      style={{
        backgroundImage:
          "repeating-linear-gradient(115deg, transparent 0 40px, rgba(255,255,255,0.12) 40px 42px, transparent 42px 90px)," +
          "repeating-linear-gradient(75deg, transparent 0 70px, rgba(0,0,0,0.15) 70px 72px, transparent 72px 130px)",
      }}
    />
    {/* colonnes */}
    {[15, 40, 65, 90].map((left, i) => (
      <div
        key={i}
        className="absolute top-[8%] h-[55%]"
        style={{
          left: `${left}%`,
          width: 80,
          background:
            "linear-gradient(90deg, rgba(0,0,0,0.4), rgba(255,255,255,0.95) 45%, rgba(255,255,255,0.95) 55%, rgba(0,0,0,0.4))",
          borderRadius: "8px 8px 0 0",
          boxShadow: "inset 0 0 0 2px rgba(0,0,0,0.3)",
          transform: "translateX(-50%)",
        }}
      >
        {/* chapiteau */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-[110%] h-5 bg-white/90 rounded-sm shadow-md" />
        {/* base */}
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-[110%] h-4 bg-white/90 rounded-sm shadow-md" />
        {/* cannelures */}
        <div className="absolute inset-y-2 inset-x-2 opacity-40"
          style={{ backgroundImage: "repeating-linear-gradient(90deg, transparent 0 6px, rgba(0,0,0,0.5) 6px 7px)" }} />
      </div>
    ))}
    {/* niches dorées avec silhouettes */}
    {[25, 50, 75].map((left, i) => (
      <div
        key={i}
        className="absolute top-[14%] h-[35%] w-[10%]"
        style={{
          left: `${left}%`,
          transform: "translateX(-50%)",
          background:
            "radial-gradient(ellipse at center, rgba(255,200,80,0.55), rgba(120,80,20,0.7) 70%, rgba(40,25,5,0.95) 100%)",
          borderRadius: "50% 50% 8px 8px / 35% 35% 8px 8px",
          border: "2.5px solid rgba(255,210,120,0.7)",
          boxShadow: "0 0 30px rgba(255,200,80,0.45), inset 0 0 20px rgba(0,0,0,0.5)",
        }}
      >
        {/* silhouette dorée */}
        <div
          className="absolute inset-x-3 bottom-2 top-3 rounded-t-full"
          style={{
            background: "linear-gradient(180deg, rgba(255,220,130,0.95), rgba(180,120,40,0.85))",
            filter: "drop-shadow(0 0 8px rgba(255,200,80,0.7))",
          }}
        />
      </div>
    ))}
    {/* halo divin */}
    <div
      className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1/2 rounded-full blur-3xl"
      style={{ background: "radial-gradient(circle, rgba(255,230,160,0.6), transparent 60%)" }}
    />
  </div>
);



export const Route = createFileRoute("/class/$classId/parcours")({ component: Parcours });
