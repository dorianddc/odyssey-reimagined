// Spatial planner + live timer + eval card for "Situation" mode.
import { useEffect, useMemo, useState } from "react";
import {
  DndContext, useDraggable, useDroppable, DragOverlay,
  PointerSensor, useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import { Plus, Minus, Shuffle, Wand2, Trash2, Users, Flag, Timer, AlertOctagon } from "lucide-react";
import { AvatarBlob } from "@/components/game/AvatarBlob";
import { cn } from "@/lib/utils";
import type { Student } from "@/data/curriculum";

export type Zone = "TL" | "TR" | "BL" | "BR";
export type Assignments = Record<string, { court: number; zone: Zone }>;
const ZONES: Zone[] = ["TL", "TR", "BL", "BR"];
const zoneLabel = (z: Zone) =>
  z === "TL" ? "↖ Haut · Gauche" : z === "TR" ? "↗ Haut · Droite" : z === "BL" ? "↙ Bas · Gauche" : "↘ Bas · Droite";

/* ============================== TIMER ============================== */
export function useCountdown(durationMin: number, running: boolean) {
  const [endsAt] = useState(() => Date.now() + durationMin * 60_000);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [running]);
  const remaining = Math.max(0, endsAt - now);
  return { remainingMs: remaining, finished: remaining <= 0 };
}

export function TimerBar({
  remainingMs, finished, onFinish,
}: { remainingMs: number; finished: boolean; onFinish: () => void }) {
  const m = Math.floor(remainingMs / 60000);
  const s = Math.floor((remainingMs % 60000) / 1000);
  const warn = remainingMs > 0 && remainingMs < 30_000;
  return (
    <div className={cn(
      "flex items-center justify-between gap-4 px-5 py-3 rounded-2xl border-[3px] border-ink shadow-pop-sm bg-surface",
      warn && !finished && "bg-hot/15",
      finished && "bg-hot text-hot-foreground animate-pulse"
    )}>
      <div className="flex items-center gap-3 min-w-0">
        {finished ? <AlertOctagon strokeWidth={3} /> : <Timer strokeWidth={3} />}
        <span className="font-display text-4xl md:text-6xl tabular-nums leading-none tracking-wider">
          {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
        </span>
        {finished && <span className="font-display text-xs md:text-sm uppercase tracking-widest">Temps écoulé</span>}
      </div>
      <button onClick={onFinish}
        className="inline-flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl border-[2.5px] border-ink bg-hot text-hot-foreground font-display text-[11px] md:text-xs uppercase tracking-widest shadow-pop-sm hover:-translate-y-0.5 active:translate-y-[2px]">
        <Flag size={14} strokeWidth={3} /> Terminer
      </button>
    </div>
  );
}

/* ============================ CONFIG INPUTS ============================ */
function NumStepper({ value, set, min, max, label }: { value: number; set: (n: number) => void; min: number; max: number; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-bold uppercase tracking-widest text-ink-soft">{label}</span>
      <div className="inline-flex items-center border-[2.5px] border-ink rounded-xl overflow-hidden shadow-pop-sm bg-surface">
        <button onClick={() => set(Math.max(min, value - 1))} className="px-2 py-1 hover:bg-surface-2"><Minus size={14} strokeWidth={3} /></button>
        <span className="font-display text-base px-3 min-w-[44px] text-center tabular-nums">{value}</span>
        <button onClick={() => set(Math.min(max, value + 1))} className="px-2 py-1 hover:bg-surface-2"><Plus size={14} strokeWidth={3} /></button>
      </div>
    </div>
  );
}

export function CourtConfig({
  courtCount, setCourtCount, capacity, setCapacity, durationMin, setDurationMin,
}: {
  courtCount: number; setCourtCount: (n: number) => void;
  capacity: number; setCapacity: (n: number) => void;
  durationMin: number; setDurationMin: (n: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
      <NumStepper value={durationMin} set={setDurationMin} min={1} max={60} label="Durée (min)" />
      <NumStepper value={courtCount} set={setCourtCount} min={1} max={8} label="Terrains" />
      <NumStepper value={capacity} set={setCapacity} min={1} max={4} label="Élèves / demi-terrain" />
    </div>
  );
}

/* ============================ COURT VISUAL ============================ */
function CourtVisual({
  courtIdx, count, renderZone, minHeight = "min-h-[170px]",
}: {
  courtIdx: number;
  count: number;
  renderZone: (z: Zone) => React.ReactNode;
  minHeight?: string;
}) {
  return (
    <div className="pop-card overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 bg-ink text-surface">
        <span className="font-display text-xs tracking-widest uppercase">Terrain {courtIdx + 1}</span>
        <span className="text-[10px] font-bold opacity-80">{count} élève{count > 1 ? "s" : ""}</span>
      </div>
      <div className={cn("relative grid grid-cols-2 grid-rows-2 bg-[oklch(0.93_0.05_150)]", minHeight)}>
        {/* Filet */}
        <div className="pointer-events-none absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[5px] bg-ink z-10 shadow-[0_0_0_1px_oklch(0.95_0.05_150)]" />
        {/* Ligne médiane */}
        <div className="pointer-events-none absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[1.5px] bg-ink/40 z-10" />
        {ZONES.map((z) => (
          <div key={z} className="relative">{renderZone(z)}</div>
        ))}
      </div>
    </div>
  );
}

/* ============================ STUDENT PILL ============================ */
function StudentPill({ student, dragging }: { student: Student; dragging?: boolean }) {
  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 pl-1 pr-2 py-0.5 rounded-full border-[2.5px] border-ink bg-surface shadow-pop-sm font-display text-[11px] select-none",
      dragging && "opacity-90 scale-105"
    )}>
      <AvatarBlob name={student.name} hue={student.avatarHue} size={22} rank="rookie" />
      <span className="truncate max-w-[110px]">{student.name}</span>
      <span className="ml-0.5 px-1.5 py-0.5 rounded-md bg-ink text-surface text-[9px]">N{student.level}</span>
    </div>
  );
}

function DraggablePill({ student }: { student: Student }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `student:${student.id}` });
  return (
    <button ref={setNodeRef} {...listeners} {...attributes}
      className={cn("cursor-grab active:cursor-grabbing touch-none", isDragging && "opacity-30")}>
      <StudentPill student={student} />
    </button>
  );
}

function ZoneDroppable({
  id, label, children,
}: { id: string; label: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef}
      className={cn(
        "relative h-full p-2 flex flex-wrap items-center justify-center gap-1.5 transition-colors",
        isOver && "bg-accent/30 ring-2 ring-accent ring-inset"
      )}>
      <span className="absolute top-1 left-1.5 text-[8px] font-bold uppercase tracking-widest text-ink-soft/60">{label}</span>
      {children}
    </div>
  );
}

/* ============================ SETUP PLANNER ============================ */
export function SpatialSetup({
  students, courtCount, capacity, assignments, setAssignments,
}: {
  students: Student[];
  courtCount: number;
  capacity: number;
  assignments: Assignments;
  setAssignments: (a: Assignments) => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const [activeId, setActiveId] = useState<string | null>(null);

  const assignedIds = new Set(Object.keys(assignments));
  const reserve = students.filter((s) => !assignedIds.has(s.id));

  const byZone = useMemo(() => {
    const m = new Map<string, Student[]>();
    for (let c = 0; c < courtCount; c++) for (const z of ZONES) m.set(`${c}:${z}`, []);
    for (const s of students) {
      const a = assignments[s.id];
      if (!a || a.court >= courtCount) continue;
      m.get(`${a.court}:${a.zone}`)?.push(s);
    }
    return m;
  }, [assignments, students, courtCount]);

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const overId = e.over?.id?.toString();
    const activeStr = e.active.id.toString();
    if (!overId || !activeStr.startsWith("student:")) return;
    const sid = activeStr.slice("student:".length);
    if (overId === "reserve") {
      const next = { ...assignments }; delete next[sid]; setAssignments(next);
      return;
    }
    if (!overId.startsWith("court:")) return;
    const [, courtStr, zone] = overId.split(":");
    const court = Number(courtStr);
    const occupants = Object.entries(assignments).filter(
      ([id, a]) => id !== sid && a.court === court && a.zone === zone
    ).length;
    if (occupants >= capacity) return;
    setAssignments({ ...assignments, [sid]: { court, zone: zone as Zone } });
  };

  const fillRandom = () => {
    const next: Assignments = { ...assignments };
    const slots: { court: number; zone: Zone }[] = [];
    for (let c = 0; c < courtCount; c++) for (const z of ZONES) for (let k = 0; k < capacity; k++) slots.push({ court: c, zone: z });
    for (const a of Object.values(next)) {
      const idx = slots.findIndex((s) => s.court === a.court && s.zone === a.zone);
      if (idx >= 0) slots.splice(idx, 1);
    }
    const pool = students.filter((s) => !next[s.id]);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    for (const s of pool) {
      const slot = slots.shift(); if (!slot) break;
      next[s.id] = { court: slot.court, zone: slot.zone };
    }
    setAssignments(next);
  };

  const fillHomogeneous = () => {
    const next: Assignments = {};
    const sorted = [...students].sort((a, b) => b.level - a.level);
    let i = 0;
    for (let c = 0; c < courtCount && i < sorted.length; c++) {
      for (const z of ZONES) {
        for (let r = 0; r < capacity && i < sorted.length; r++) {
          next[sorted[i].id] = { court: c, zone: z };
          i++;
        }
      }
    }
    setAssignments(next);
  };

  const ReserveDroppable = () => {
    const { setNodeRef, isOver } = useDroppable({ id: "reserve" });
    return (
      <aside ref={setNodeRef}
        className={cn(
          "pop-card p-3 flex flex-col gap-2 max-h-[60vh] overflow-auto custom-scrollbar transition-colors",
          isOver && "bg-accent/10 ring-2 ring-accent ring-inset"
        )}>
        <div className="flex items-center gap-2 sticky top-0 bg-surface/95 backdrop-blur py-1 z-10">
          <Users size={14} strokeWidth={3} />
          <span className="font-display text-xs uppercase tracking-widest">Réserve · {reserve.length}</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {reserve.map((s) => <DraggablePill key={s.id} student={s} />)}
          {reserve.length === 0 && <span className="text-xs text-ink-soft">Tous placés ✓</span>}
        </div>
        <div className="border-t-2 border-dashed border-ink/15 pt-2 mt-1 flex flex-wrap gap-1.5">
          <button onClick={fillRandom}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border-[2.5px] border-ink bg-secondary text-secondary-foreground font-display text-[10px] uppercase tracking-widest shadow-pop-sm hover:-translate-y-0.5 active:translate-y-[2px]">
            <Shuffle size={12} strokeWidth={3} /> Aléatoire
          </button>
          <button onClick={fillHomogeneous}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border-[2.5px] border-ink bg-primary text-primary-foreground font-display text-[10px] uppercase tracking-widest shadow-pop-sm hover:-translate-y-0.5 active:translate-y-[2px]">
            <Wand2 size={12} strokeWidth={3} /> Homogène
          </button>
          <button onClick={() => setAssignments({})}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border-[2.5px] border-ink bg-surface font-display text-[10px] uppercase tracking-widest shadow-pop-sm hover:-translate-y-0.5 active:translate-y-[2px]">
            <Trash2 size={12} strokeWidth={3} /> Vider
          </button>
        </div>
      </aside>
    );
  };

  const active = activeId ? students.find((s) => `student:${s.id}` === activeId) : null;

  return (
    <DndContext sensors={sensors} onDragStart={(e) => setActiveId(e.active.id.toString())} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-4 items-start">
        <ReserveDroppable />
        <div className="space-y-3">
          {Array.from({ length: courtCount }).map((_, c) => {
            const total = ZONES.reduce((n, z) => n + (byZone.get(`${c}:${z}`)?.length ?? 0), 0);
            return (
              <CourtVisual key={c} courtIdx={c} count={total}
                renderZone={(z) => (
                  <ZoneDroppable id={`court:${c}:${z}`} label={zoneLabel(z)}>
                    {(byZone.get(`${c}:${z}`) ?? []).map((s) => (
                      <div key={s.id}><DraggablePill student={s} /></div>
                    ))}
                  </ZoneDroppable>
                )}
              />
            );
          })}
        </div>
      </div>
      <DragOverlay>{active ? <StudentPill student={active} dragging /> : null}</DragOverlay>
    </DndContext>
  );
}

/* ============================ EVAL CARD (LIVE) ============================ */
export function EvalCard({
  student, stars, before, maxStars, onPlus, onMinus,
}: {
  student: Student; stars: number; before: number; maxStars: number;
  onPlus: () => void; onMinus: () => void;
}) {
  const moved = stars - before;
  const pct = Math.round((stars / maxStars) * 100);
  return (
    <div className={cn(
      "w-full pop-card p-2.5 flex items-center gap-3",
      moved !== 0 && "ring-2 ring-secondary/60"
    )}>
      <AvatarBlob name={student.name} hue={student.avatarHue} size={42} rank="rookie" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-display text-sm leading-tight truncate">{student.name}</p>
          <span className="ml-auto text-[9px] font-bold uppercase tracking-wider text-ink-soft shrink-0">N{student.level}</span>
        </div>
        <div className="h-1.5 mt-1 rounded-full bg-surface-2 border border-ink/20 overflow-hidden">
          <div className="h-full bg-gradient-sun transition-[width]" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex items-center gap-0.5 mt-1">
          {Array.from({ length: maxStars }).map((_, i) => (
            <span key={i} className={cn("w-2 h-2 rounded-full border-[1.5px] border-ink",
              i < stars ? "bg-gradient-sun" : "bg-surface-2")} />
          ))}
          {moved !== 0 && (
            <span className={cn("ml-1 text-[10px] font-bold", moved > 0 ? "text-secondary" : "text-hot")}>
              {moved > 0 ? `+${moved}` : moved}
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-1 shrink-0">
        <button onClick={onPlus} disabled={stars >= maxStars}
          className="w-11 h-11 rounded-xl border-[2.5px] border-ink bg-primary text-primary-foreground shadow-pop-sm grid place-items-center hover:-translate-y-0.5 active:translate-y-[2px] active:shadow-none disabled:opacity-40 disabled:hover:translate-y-0">
          <Plus size={20} strokeWidth={3.5} />
        </button>
        <button onClick={onMinus} disabled={stars <= 0}
          className="w-11 h-7 rounded-lg border-[2px] border-ink bg-surface grid place-items-center hover:bg-hot hover:text-hot-foreground disabled:opacity-40">
          <Minus size={14} strokeWidth={3.5} />
        </button>
      </div>
    </div>
  );
}

/* ============================ LIVE COURT GRID (no DnD) ============================ */
export function LiveCourtGrid({
  courtCount, assignments, students, renderCard,
}: {
  courtCount: number;
  assignments: Assignments;
  students: Student[];
  renderCard: (student: Student) => React.ReactNode;
}) {
  const byZone = useMemo(() => {
    const m = new Map<string, Student[]>();
    for (let c = 0; c < courtCount; c++) for (const z of ZONES) m.set(`${c}:${z}`, []);
    for (const s of students) {
      const a = assignments[s.id];
      if (!a || a.court >= courtCount) continue;
      m.get(`${a.court}:${a.zone}`)?.push(s);
    }
    return m;
  }, [assignments, students, courtCount]);

  // Unassigned students still need to be evaluated → bench section
  const unassigned = students.filter((s) => !assignments[s.id]);

  return (
    <div className="space-y-4">
      {Array.from({ length: courtCount }).map((_, c) => {
        const total = ZONES.reduce((n, z) => n + (byZone.get(`${c}:${z}`)?.length ?? 0), 0);
        return (
          <CourtVisual key={c} courtIdx={c} count={total} minHeight="min-h-[260px]"
            renderZone={(z) => {
              const list = byZone.get(`${c}:${z}`) ?? [];
              return (
                <div className="relative h-full p-3 flex flex-col gap-2">
                  <span className="absolute top-1 left-2 text-[9px] font-bold uppercase tracking-widest text-ink-soft/60">{zoneLabel(z)}</span>
                  <div className="mt-4 grid grid-cols-1 xl:grid-cols-2 gap-2">
                    {list.map((s) => <div key={s.id}>{renderCard(s)}</div>)}
                  </div>
                  {list.length === 0 && (
                    <span className="m-auto text-[10px] font-semibold text-ink-soft/50">— vide —</span>
                  )}
                </div>
              );
            }}
          />
        );
      })}
      {unassigned.length > 0 && (
        <div className="pop-card p-3">
          <div className="flex items-center gap-2 mb-2">
            <Users size={14} strokeWidth={3} />
            <span className="font-display text-xs uppercase tracking-widest">Hors terrain · {unassigned.length}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
            {unassigned.map((s) => <div key={s.id}>{renderCard(s)}</div>)}
          </div>
        </div>
      )}
    </div>
  );
}
