// Lightweight global store using React context — keeps generated students per class in memory.
// Persisted to localStorage so the teacher can manage real classes/students.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  CLASSES_CONFIG as DEFAULT_CLASSES,
  CURRICULUM,
  calculateLevelFromStars,
  generateClassStudents,
  findSkillMeta,
  MASTERY_THRESHOLD,
  type Cycle,
  type Student,
  type Difficulty,
} from "@/data/curriculum";

interface LevelUpEvent {
  studentId: string;
  studentName: string;
  oldLevel: number;
  newLevel: number;
}

export interface ClassConfig {
  id: string;
  name: string;
  cycle: Cycle;
  emoji: string;
}

interface SituationOutcome {
  progressed: { studentId: string; studentName: string; skillId: string; skillCode: string; before: number; after: number }[];
  stagnated: { studentId: string; studentName: string; skillId: string; skillCode: string; level: number }[];
  levelUps: { studentId: string; studentName: string; oldLevel: number; newLevel: number }[];
}

export interface SituationRecord {
  id: string;
  date: string;
  classId: string;
  skillIds: string[];
  skillCodes: string[];
  progressed: SituationOutcome["progressed"];
  stagnated: SituationOutcome["stagnated"];
  levelUps: SituationOutcome["levelUps"];
}

interface AppStore {
  classes: ClassConfig[];
  studentsByClass: Record<string, Student[]>;
  ensureClass: (classId: string) => void;
  getStudent: (classId: string, studentId: string) => Student | undefined;
  bumpSkill: (classId: string, studentId: string, skillId: string, dir: "up" | "down") => void;
  addClass: (input: { name: string; cycle: Cycle; emoji?: string }) => string;
  removeClass: (classId: string) => void;
  addStudent: (classId: string, input: { name: string; gender: "F" | "M" }) => void;
  removeStudent: (classId: string, studentId: string) => void;
  recordSituation: (
    classId: string,
    skillIds: string[],
    snapshot: Record<string, Record<string, number>>
  ) => SituationOutcome;
  situationHistory: SituationRecord[];
  setLevelUpSuspended: (suspended: boolean) => void;
  pendingLevelUp: LevelUpEvent | null;
  clearLevelUp: () => void;
}

const Ctx = createContext<AppStore | null>(null);

const LS_CLASSES = "db_classes_v1";
const LS_STUDENTS = "db_students_v1";
const LS_HISTORY = "db_situation_history_v1";

const EMOJI_POOL = ["🐣", "🦊", "⚡", "🔥", "🚀", "🏆", "👑", "💎", "🦁", "🐻", "🐯", "🦅", "🐺", "🦄", "🐲", "🌟"];

const loadHistory = (): SituationRecord[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LS_HISTORY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const loadClasses = (): ClassConfig[] => {
  if (typeof window === "undefined") return DEFAULT_CLASSES;
  try {
    const raw = window.localStorage.getItem(LS_CLASSES);
    if (!raw) return DEFAULT_CLASSES;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length) return parsed;
  } catch {
    /* noop */
  }
  return DEFAULT_CLASSES;
};

const loadStudents = (): Record<string, Student[]> => {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(LS_STUDENTS);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, Student[]>;
    // Migration: ensure every student has the `difficulties` array
    Object.keys(parsed).forEach((cid) => {
      parsed[cid] = (parsed[cid] || []).map((s) => ({
        ...s,
        difficulties: Array.isArray(s.difficulties) ? s.difficulties : [],
        stagnations: Array.isArray(s.stagnations) ? s.stagnations : [],
      }));
    });
    return parsed;
  } catch {
    return {};
  }
};

const slugifyClassName = (name: string, existing: string[]): string => {
  const base = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .slice(0, 8) || "CLASSE";
  let id = base;
  let i = 2;
  while (existing.includes(id)) {
    id = `${base}${i++}`;
  }
  return id;
};

export const AppStoreProvider = ({ children }: { children: ReactNode }) => {
  const [classes, setClasses] = useState<ClassConfig[]>(() => loadClasses());
  const [studentsByClass, setStudentsByClass] = useState<Record<string, Student[]>>(() => loadStudents());
  const [situationHistory, setSituationHistory] = useState<SituationRecord[]>(() => loadHistory());
  const [pendingLevelUp, setPendingLevelUp] = useState<LevelUpEvent | null>(null);
  const levelUpSuspendedRef = useRef(false);

  // persist
  useEffect(() => {
    try { localStorage.setItem(LS_CLASSES, JSON.stringify(classes)); } catch { /* noop */ }
  }, [classes]);
  useEffect(() => {
    try { localStorage.setItem(LS_STUDENTS, JSON.stringify(studentsByClass)); } catch { /* noop */ }
  }, [studentsByClass]);
  useEffect(() => {
    try { localStorage.setItem(LS_HISTORY, JSON.stringify(situationHistory)); } catch { /* noop */ }
  }, [situationHistory]);

  const ensureClass = useCallback((classId: string) => {
    setStudentsByClass((prev) => {
      if (prev[classId]) return prev;
      // Only auto-generate for the original mock classes; new classes start empty.
      const isDefault = DEFAULT_CLASSES.some((c) => c.id === classId);
      return { ...prev, [classId]: isDefault ? generateClassStudents(classId) : [] };
    });
  }, []);

  const getStudent = useCallback(
    (classId: string, studentId: string) => studentsByClass[classId]?.find((s) => s.id === studentId),
    [studentsByClass]
  );

  const bumpSkill = useCallback(
    (classId: string, studentId: string, skillId: string, dir: "up" | "down") => {
      const cls = classes.find((c) => c.id === classId);
      if (!cls) return;
      const cycle: Cycle = cls.cycle;

      setStudentsByClass((prev) => {
        const list = prev[classId] ? [...prev[classId]] : [];
        const idx = list.findIndex((s) => s.id === studentId);
        if (idx === -1) return prev;
        const s = { ...list[idx] };
        const cur = s.skillStates[skillId] || 0;
        if (dir === "up" && cur >= 5) return prev;
        if (dir === "down" && cur <= 0) return prev;
        const next = dir === "up" ? cur + 1 : cur - 1;
        const ns = { ...s.skillStates };
        if (next === 0) delete ns[skillId];
        else ns[skillId] = next;
        const oldLevel = s.level;
        const newLevel = calculateLevelFromStars(ns, cycle);
        s.skillStates = ns;
        s.level = newLevel;
        // Manual progression "up" clears any standing difficulty for this skill.
        if (dir === "up" && Array.isArray(s.difficulties) && s.difficulties.length) {
          s.difficulties = s.difficulties.filter((d) => d.skillId !== skillId);
        }
        list[idx] = s;
        if (newLevel > oldLevel && !levelUpSuspendedRef.current) {
          const studentId = s.id;
          setTimeout(() => {
            setPendingLevelUp({ studentId, studentName: s.name, oldLevel, newLevel });
          }, 250);
        }
        return { ...prev, [classId]: list };
      });
    },
    [classes]
  );

  const addClass = useCallback(({ name, cycle, emoji }: { name: string; cycle: Cycle; emoji?: string }) => {
    const id = slugifyClassName(name, classes.map((c) => c.id));
    const finalEmoji = emoji || EMOJI_POOL[Math.floor(Math.random() * EMOJI_POOL.length)];
    const newCls: ClassConfig = { id, name: name.trim(), cycle, emoji: finalEmoji };
    setClasses((prev) => [...prev, newCls]);
    setStudentsByClass((prev) => ({ ...prev, [id]: [] }));
    return id;
  }, [classes]);

  const removeClass = useCallback((classId: string) => {
    setClasses((prev) => prev.filter((c) => c.id !== classId));
    setStudentsByClass((prev) => {
      const { [classId]: _omit, ...rest } = prev;
      return rest;
    });
  }, []);

  const addStudent = useCallback((classId: string, { name, gender }: { name: string; gender: "F" | "M" }) => {
    const cls = classes.find((c) => c.id === classId);
    if (!cls) return;
    setStudentsByClass((prev) => {
      const list = prev[classId] ? [...prev[classId]] : [];
      const id = `${classId}-${gender}-${Date.now().toString(36)}`;
      const student: Student = {
        id,
        name: name.trim(),
        gender,
        level: calculateLevelFromStars({}, cls.cycle),
        skillStates: {},
        stagnations: [], difficulties: [],
        avatarHue: Math.floor(Math.random() * 360),
      };
      return { ...prev, [classId]: [...list, student] };
    });
  }, [classes]);

  const removeStudent = useCallback((classId: string, studentId: string) => {
    setStudentsByClass((prev) => {
      const list = prev[classId] ? prev[classId].filter((s) => s.id !== studentId) : [];
      return { ...prev, [classId]: list };
    });
  }, []);

  const recordSituation = useCallback<AppStore["recordSituation"]>(
    (classId, skillIds, snapshot) => {
      const cls = classes.find((c) => c.id === classId);
      const outcome: SituationOutcome = { progressed: [], stagnated: [], levelUps: [] };
      if (!cls) return outcome;
      const cycle = cls.cycle;

      setStudentsByClass((prev) => {
        const list = prev[classId] ? [...prev[classId]] : [];
        const next = list.map((stu) => {
          const s: Student = { ...stu, difficulties: [...(stu.difficulties || [])] };
          const before = snapshot[s.id] || {};
          const oldLevel = stu.level;
          let touched = false;
          skillIds.forEach((skillId) => {
            const meta = findSkillMeta(cycle, skillId);
            if (!meta) return;
            const beforeStars = before[skillId] ?? 0;
            const afterStars = s.skillStates[skillId] ?? 0;
            if (afterStars !== beforeStars) touched = true;
            if (afterStars > beforeStars) {
              outcome.progressed.push({
                studentId: s.id, studentName: s.name, skillId,
                skillCode: meta.skill.code, before: beforeStars, after: afterStars,
              });
              // student progressed on this skill → clear any prior difficulty for it
              s.difficulties = s.difficulties.filter((d) => d.skillId !== skillId);
              // if still under mastery, keep the difficulty list as-is (no new entry on progression)
              if (afterStars < MASTERY_THRESHOLD) {
                const diff: Difficulty = {
                  id: `${s.id}-${skillId}-${Date.now()}`,
                  skillId,
                  skillCode: meta.skill.code,
                  dimension: meta.dimension,
                  currentLevel: afterStars,
                  date: new Date().toISOString(),
                };
                s.difficulties = [...s.difficulties, diff];
              }
            } else if (afterStars < MASTERY_THRESHOLD) {
              // stagnation — record / refresh difficulty for THIS skill only
              outcome.stagnated.push({
                studentId: s.id, studentName: s.name, skillId,
                skillCode: meta.skill.code, level: afterStars,
              });
              const filtered = s.difficulties.filter((d) => d.skillId !== skillId);
              const diff: Difficulty = {
                id: `${s.id}-${skillId}-${Date.now()}`,
                skillId,
                skillCode: meta.skill.code,
                dimension: meta.dimension,
                currentLevel: afterStars,
                date: new Date().toISOString(),
              };
              s.difficulties = [...filtered, diff];
            } else {
              // reached mastery threshold → drop any prior difficulty on this skill
              s.difficulties = s.difficulties.filter((d) => d.skillId !== skillId);
            }
          });
          // recompute level after the situation; capture level-ups for the debrief
          if (touched) {
            const newLevel = calculateLevelFromStars(s.skillStates, cycle);
            s.level = newLevel;
            if (newLevel > oldLevel) {
              outcome.levelUps.push({
                studentId: s.id, studentName: s.name, oldLevel, newLevel,
              });
            }
          }
          return s;
        });
        return { ...prev, [classId]: next };
      });

      // append to history
      const codes = skillIds.map((id) => findSkillMeta(cls.cycle, id)?.skill.code || id);
      const record: SituationRecord = {
        id: `sit-${Date.now()}`,
        date: new Date().toISOString(),
        classId,
        skillIds,
        skillCodes: codes,
        progressed: outcome.progressed,
        stagnated: outcome.stagnated,
        levelUps: outcome.levelUps,
      };
      setSituationHistory((prev) => [record, ...prev]);

      return outcome;
    },
    [classes]
  );

  const setLevelUpSuspended = useCallback((suspended: boolean) => {
    levelUpSuspendedRef.current = suspended;
  }, []);

  const value = useMemo<AppStore>(
    () => ({
      classes,
      studentsByClass,
      ensureClass,
      getStudent,
      bumpSkill,
      addClass,
      removeClass,
      addStudent,
      removeStudent,
      recordSituation,
      situationHistory,
      setLevelUpSuspended,
      pendingLevelUp,
      clearLevelUp: () => setPendingLevelUp(null),
    }),
    [classes, studentsByClass, ensureClass, getStudent, bumpSkill, addClass, removeClass, addStudent, removeStudent, recordSituation, situationHistory, setLevelUpSuspended, pendingLevelUp]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useAppStore = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAppStore must be used within AppStoreProvider");
  return ctx;
};

// Re-export config for convenience
export { CURRICULUM };
export const CLASSES_CONFIG = DEFAULT_CLASSES;
