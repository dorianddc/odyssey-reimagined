// Badminton curriculum + game logic for Cycle 3 (6e) & Cycle 4 (5/4/3e)
// Adapted from the user's original Gemini code.

export const MAX_LEVEL = 22;

export type Cycle = "cycle3" | "cycle4";
// Cycle 4 garde l'ancien découpage (moteur/methodo/social).
// Cycle 3 introduit 5 "Secteurs d'activité" : technique, deplacement, tactique, methodo, social.
export type DimensionKey =
  | "moteur" | "methodo" | "social"
  | "technique" | "deplacement" | "tactique";

export interface Skill {
  id: string;
  code: string;
  name: string;
  // 4 paliers (cycle3) ou 5 paliers (cycle4).
  levels: string[];
}

export interface Dimension {
  label: string;
  iconName: "Activity" | "Brain" | "Users" | "Target" | "Move" | "Crosshair";
  colorVar: string;
  skills: Skill[];
}

export interface CurriculumCycle {
  title: string;
  field: string;
  // Record<string> car cycle3 et cycle4 n'ont pas les mêmes clés de secteurs/dimensions.
  categories: Record<string, Dimension>;
}

export const CLASSES_CONFIG: { id: string; name: string; cycle: Cycle; emoji: string }[] = [
  { id: "6A", name: "6ème A", cycle: "cycle3", emoji: "🐣" },
  { id: "6B", name: "6ème B", cycle: "cycle3", emoji: "🦊" },
  { id: "5A", name: "5ème A", cycle: "cycle4", emoji: "⚡" },
  { id: "5B", name: "5ème B", cycle: "cycle4", emoji: "🔥" },
  { id: "4A", name: "4ème A", cycle: "cycle4", emoji: "🚀" },
  { id: "4B", name: "4ème B", cycle: "cycle4", emoji: "🏆" },
  { id: "3A", name: "3ème A", cycle: "cycle4", emoji: "👑" },
  { id: "3B", name: "3ème B", cycle: "cycle4", emoji: "💎" },
];

// ─────────────────────────────────────────────────────────────────────────────
// CYCLE 3 (6ème) — Approche par "Contenus d'Apprentissage" (CA) regroupés
// par "Secteur d'activité". 5 secteurs, 8 contenus, 4 paliers d'acquisition
// (L1 Insuffisant → L4 Très bonne). Le mot "Compétence" est volontairement
// abandonné en 6ème ; on parle de "Secteur" et de "Contenu".
// ─────────────────────────────────────────────────────────────────────────────
export const CURRICULUM: Record<Cycle, CurriculumCycle> = {
  cycle3: {
    title: "Cycle 3 (6ème)",
    field: "Contenus d'apprentissage par secteur d'activité",
    categories: {
      technique: {
        label: "Secteur Technique",
        iconName: "Activity",
        colorVar: "var(--dim-motor)", // rouge #ef4444
        skills: [
          {
            id: "c3_tech_service",
            code: "CA1",
            name: "Mise en jeu (Service)",
            levels: [
              "Service non réglementaire ou aléatoire.",
              "Service réglementaire mais trajectoire prévisible.",
              "Service précis, zone visée atteinte régulièrement.",
              "Service varié (court/long) avec intention de gêner l'adversaire.",
            ],
          },
          {
            id: "c3_tech_degage",
            code: "CA2",
            name: "Le Dégagé (Frappe haute)",
            levels: [
              "Frappe \"poussée\", volant reste au centre du terrain.",
              "Frappe en cloche, commence à chercher la profondeur.",
              "Dégagé long maîtrisé, fait reculer l'adversaire en zone arrière.",
              "Dégagé puissant et tendu, précis en zone fond de court.",
            ],
          },
          {
            id: "c3_tech_basse",
            code: "CA3",
            name: "Frappe basse (Amorti / Défense)",
            levels: [
              "Ne parvient pas à relever les volants bas.",
              "Renvoi \"sauvetage\" sans contrôle de trajectoire.",
              "Amorti simple réussi, volant passe proche du filet.",
              "Amorti précis et masqué, intention de rupture immédiate.",
            ],
          },
        ],
      },
      deplacement: {
        label: "Secteur Déplacement",
        iconName: "Move",
        colorVar: "var(--dim-motor)", // rouge #ef4444
        skills: [
          {
            id: "c3_dep_repli",
            code: "CA4",
            name: "Le Repli (Replacement)",
            levels: [
              "Jeu statique, attend le volant sans bouger.",
              "Se déplace vers l'avant mais oublie le fond de court.",
              "Déplacement avant/arrière coordonné, revient au centre.",
              "Replacement systématique et dynamique après chaque frappe.",
            ],
          },
        ],
      },
      tactique: {
        label: "Secteur Tactique",
        iconName: "Crosshair",
        colorVar: "var(--dim-tactic)", // orange #f97316
        skills: [
          {
            id: "c3_tac_espace",
            code: "CA5",
            name: "Exploitation de l'espace",
            levels: [
              "Renvoie \"avec\" l'adversaire (sur lui).",
              "Essaie de renvoyer loin du joueur adverse sans succès constant.",
              "Cherche activement l'espace libre (là où l'adversaire n'est pas).",
              "Combine frappes longues et courtes pour créer la rupture.",
            ],
          },
        ],
      },
      methodo: {
        label: "Secteur Méthodologique",
        iconName: "Brain",
        colorVar: "var(--dim-method)", // bleu #3b82f6
        skills: [
          {
            id: "c3_met_invest",
            code: "CA6",
            name: "Investissement & Concentration",
            levels: [
              "Distrait, ne respecte pas les consignes ou abandonne vite.",
              "Applique les consignes avec aide, effort discontinu.",
              "Concentré, persévère dans l'effort sur toute la séance.",
              "Autonome, cherche activement à progresser et écoute les feedbacks.",
            ],
          },
        ],
      },
      social: {
        label: "Secteur Social",
        iconName: "Users",
        colorVar: "var(--dim-social)", // vert #22c55e
        skills: [
          {
            id: "c3_soc_arbitrage",
            code: "CA7",
            name: "L'Arbitrage",
            levels: [
              "Ne connaît pas les règles, spectateur passif.",
              "Compte les points dans sa tête, fait des erreurs de score.",
              "Annonce le score à voix haute et juge les fautes avec justesse.",
              "Explique les fautes, gère les litiges et annonce le serveur.",
            ],
          },
          {
            id: "c3_soc_observation",
            code: "CA8",
            name: "L'Observation",
            levels: [
              "Remplissage de fiche inexistant ou bâclé.",
              "Remplissage approximatif avec de nombreuses erreurs.",
              "Fiche/Tablette remplie correctement de façon autonome.",
              "Analyse les données recueillies pour aider son partenaire.",
            ],
          },
        ],
      },
    },
  },
  cycle4: {
    title: "Cycle 4 (5e, 4e, 3e)",
    field: "Conduire et maîtriser un affrontement collectif ou interindividuel",
    categories: {
      moteur: {
        label: "Dimension Motrice",
        iconName: "Activity",
        colorVar: "var(--dim-motor)",
        skills: [
          {
            id: "c4_c1",
            code: "C1",
            name: "Rechercher le gain de la rencontre par un projet tactique adapté au rapport de force",
            levels: [
              "Joue sans tactique, renvoie le volant dans l'axe.",
              "Tente une tactique stéréotypée sans s'adapter.",
              "Construit un projet basé sur les points faibles adverses.",
              "Maintient son projet tactique avec lucidité malgré la pression.",
              "Varie son projet tactique en cours de match pour surprendre.",
            ],
          },
          {
            id: "c4_c2",
            code: "C2",
            name: "Utiliser au mieux ses ressources physiques et de motricité pour gagner en efficacité",
            levels: [
              "Se fatigue vite, déplacements inefficaces.",
              "Gère son effort mais s'épuise sur un seul type de frappe.",
              "Utilise l'amorti ou le smash au bon moment pour s'économiser.",
              "Enchaîne des frappes de rupture avec relâchement.",
              "Domine l'échange physiquement par sa vitesse de replacement.",
            ],
          },
          {
            id: "c4_c3",
            code: "C3",
            name: "S'adapter rapidement au changement de statut défenseur / attaquant",
            levels: [
              "Reste figé après sa frappe, subit le retour.",
              "Reprend son appui de base avec un temps de retard.",
              "Identifie un volant favorable et s'engage vers l'avant.",
              "Se replace en posture adaptée dès le départ du volant.",
              "Provoque intentionnellement une frappe défensive adverse pour attaquer.",
            ],
          },
        ],
      },
      methodo: {
        label: "Dimension Méthodologique",
        iconName: "Brain",
        colorVar: "var(--dim-method)",
        skills: [
          {
            id: "c4_c4",
            code: "C4",
            name: "Co-arbitrer une séquence de match (de combat)",
            levels: [
              "N'ose pas prendre de décision, se laisse influencer.",
              "Juge les volants in/out mais hésite sur les fautes de filet.",
              "Co-arbitre efficacement, annonce les fautes sans hésiter.",
              "Gère les litiges avec calme et pédagogie.",
              "Arbitre un match à enjeu de manière incontestable.",
            ],
          },
          {
            id: "c4_c5",
            code: "C5",
            name: "Anticiper la prise et le traitement d'information pour enchaîner des actions",
            levels: [
              "Agit en réaction pure, frappe souvent en retard.",
              "Lit la trajectoire du volant pour se déplacer avant le rebond.",
              "Regarde l'orientation de la raquette adverse.",
              "Lit les intentions (feintes) pour amorcer son replacement.",
              "Pré-positionnement optimal (sur le volant avant qu'il ne redescende).",
            ],
          },
        ],
      },
      social: {
        label: "Dimension Sociale",
        iconName: "Users",
        colorVar: "var(--dim-social)",
        skills: [
          {
            id: "c4_c6",
            code: "C6",
            name: "Se mettre au service de l'autre pour lui permettre de progresser",
            levels: [
              "Centré uniquement sur lui-même, ignore son partenaire.",
              "Observe mais donne des conseils vagues.",
              "Utilise des critères précis pour faire un retour objectif.",
              "Agit comme un coach, propose des remédiations pertinentes.",
              "Tuteur investi, capable de faire évoluer le niveau de jeu d'un camarade.",
            ],
          },
        ],
      },
    },
  },
};

// Attendus de fin de cycle (référentiel institutionnel)
export const ATTENDUS: Record<Cycle, string[]> = {
  cycle3: [
    "En situation aménagée ou à effectif réduit, s'organiser tactiquement pour gagner le duel ou le match en identifiant les situations favorables de marque.",
    "Maintenir un engagement moteur efficace sur tout le temps de jeu prévu.",
    "Respecter les partenaires, les adversaires et l'arbitre.",
    "Assurer différents rôles sociaux (joueur, arbitre, observateur) inhérents à l'activité et à l'organisation de la classe.",
    "Accepter le résultat de la rencontre et être capable de le commenter.",
  ],
  cycle4: [
    "Réaliser des actions décisives en situation favorable afin de faire basculer le rapport de force en sa faveur ou en faveur de son équipe.",
    "Adapter son engagement moteur en fonction de son état physique et du rapport de force.",
    "Être solidaire de ses partenaires et respectueux de son (ses) adversaire(s) et de l'arbitre.",
    "Observer et co-arbitrer.",
    "Accepter le résultat de la rencontre et savoir l'analyser avec objectivité.",
  ],
};

export interface Difficulty {
  id: string;
  skillId: string;
  skillCode: string; // e.g. "C1"
  dimension: DimensionKey;
  currentLevel: number; // stars at the moment the difficulty was recorded
  date: string;
}

export interface Student {
  id: string;
  name: string;
  gender: "F" | "M";
  level: number;
  skillStates: Record<string, number>; // skillId -> stars 0..5
  stagnations: { skillId: string; skillName?: string; palierCible: number; reason: string; remediation?: string; date: string }[];
  difficulties: Difficulty[];
  avatarHue: number;
}

export const MAX_SKILL_STARS = 5;
export const MASTERY_THRESHOLD = 4; // a student at >= 4 stars cannot be tagged as a difficulty

export const findSkillMeta = (
  cycle: Cycle,
  skillId: string
): { skill: Skill; dimension: DimensionKey } | null => {
  const cats = CURRICULUM[cycle]?.categories;
  if (!cats) return null;
  for (const dim of Object.keys(cats) as DimensionKey[]) {
    const s = cats[dim].skills.find((sk) => sk.id === skillId);
    if (s) return { skill: s, dimension: dim };
  }
  return null;
};

export const dimensionColor = (d: DimensionKey): { bg: string; text: string; label: string } => {
  switch (d) {
    case "moteur":
      return { bg: "bg-[oklch(0.65_0.22_25)]", text: "text-white", label: "Moteur" };
    case "technique":
      return { bg: "bg-[oklch(0.65_0.22_25)]", text: "text-white", label: "Technique" };
    case "deplacement":
      return { bg: "bg-[oklch(0.65_0.22_25)]", text: "text-white", label: "Déplacement" };
    case "tactique":
      return { bg: "bg-[oklch(0.72_0.20_45)]", text: "text-white", label: "Tactique" };
    case "methodo":
      return { bg: "bg-[oklch(0.78_0.18_115)]", text: "text-ink", label: "Méthodo" };
    case "social":
      return { bg: "bg-[oklch(0.65_0.18_240)]", text: "text-white", label: "Social" };
  }
};

// Plafond d'étoiles par cycle : 4 paliers en 6ème (L1→L4), 5 en cycle 4.
export const getMaxStarsForCycle = (cycle: Cycle): number => (cycle === "cycle3" ? 4 : 5);

// Vocabulaire pédagogique : 6ème parle de "Contenu" et "Secteur",
// le cycle 4 conserve "Compétence" et "Dimension".
export const getCycleVocab = (cycle: Cycle) =>
  cycle === "cycle3"
    ? { skill: "Contenu", skillPlural: "Contenus", group: "Secteur", groupPlural: "Secteurs" }
    : { skill: "Compétence", skillPlural: "Compétences", group: "Dimension", groupPlural: "Dimensions" };

// Niveau brut (continu) — base de calcul partagée par le niveau global et la jauge intra-niveau.
// Cycle 3 (6ème) : formule stricte imposée — 8 contenus × 4 étoiles = 32 étoiles max.
//   Niveau Brut = TotalÉtoiles × (5 / 8) → 8★=N5, 16★=N10, 24★=N15, 32★=N20.
//   Chaque étoile remplit la jauge de 62.5%.
// Cycle 4 : moyenne d'étoiles × 4 + 4, bonus +0.5 par compétence maîtrisée (5★).
export const getRawLevel = (skillStates: Record<string, number>, cycle: Cycle): number => {
  const categories = CURRICULUM[cycle]?.categories;
  if (!categories) return 0;
  // Filtrer les ID fantômes : seules les étoiles sur des skills existants comptent.
  const validIds = new Set<string>();
  Object.values(categories).forEach((cat) => cat.skills.forEach((s) => validIds.add(s.id)));
  const entries = Object.entries(skillStates).filter(([id]) => validIds.has(id));
  if (cycle === "cycle3") {
    const maxStars = 4;
    const totalStars = entries.reduce((acc, [, n]) => acc + Math.min(Math.max(0, n), maxStars), 0);
    // 32 étoiles → 20 niveaux. Pas de plancher : 0 étoile = Niveau 0.
    return Math.min(20, totalStars * (5 / 8));
  }
  // cycle4 (inchangé)
  const totalSkillsCount = Object.values(categories).reduce((acc, c) => acc + c.skills.length, 0);
  const totalStars = entries.reduce((acc, [, n]) => acc + Math.min(n, 4), 0);
  const avg = totalStars / Math.max(1, totalSkillsCount);
  const mastered = entries.filter(([, n]) => n === 5).length;
  return Math.min(MAX_LEVEL, avg * 4 + 4 + mastered * 0.5);
};

export const calculateLevelFromStars = (skillStates: Record<string, number>, cycle: Cycle): number => {
  const raw = getRawLevel(skillStates, cycle);
  if (cycle === "cycle3") {
    // 0 étoile ⇒ strictement N0 ; sinon floor (chaque palier complet débloque le niveau).
    return Math.max(0, Math.min(20, Math.floor(raw)));
  }
  return Math.max(1, Math.min(MAX_LEVEL, Math.round(raw)));
};

// Pourcentage de remplissage de la jauge intra-niveau (0..100).
export const getProgressPercentage = (skillStates: Record<string, number>, cycle: Cycle): number => {
  const raw = getRawLevel(skillStates, cycle);
  if (cycle === "cycle3") {
    if (raw >= 20) return 100;
    return (raw % 1) * 100; // 62.5% par étoile
  }
  // cycle4 : Math.round transitionne à .5 → progression sur [level-0.5 ; level+0.5]
  const lvl = Math.max(1, Math.min(MAX_LEVEL, Math.round(raw)));
  if (lvl >= MAX_LEVEL) return 100;
  return Math.max(0, Math.min(100, (raw - (lvl - 0.5)) * 100));
};

// Purge des "données fantômes" : supprime de skillStates / difficulties / stagnations
// toute clé qui ne correspond plus à un skill défini dans le CURRICULUM du cycle de l'élève.
// Recalcule le niveau strictement à partir des données nettoyées.
export const sanitizeStudentData = (student: Student, cycle: Cycle): Student => {
  const cats = CURRICULUM[cycle]?.categories;
  if (!cats) return student;
  const validIds = new Set<string>();
  Object.values(cats).forEach((c) => c.skills.forEach((s) => validIds.add(s.id)));
  const cleanStates: Record<string, number> = {};
  Object.entries(student.skillStates || {}).forEach(([k, v]) => {
    if (validIds.has(k) && v > 0) cleanStates[k] = Math.min(v, getMaxStarsForCycle(cycle));
  });
  const cleanDiff = (student.difficulties || []).filter((d) => validIds.has(d.skillId));
  const cleanStag = (student.stagnations || []).filter((s) => validIds.has(s.skillId));
  return {
    ...student,
    skillStates: cleanStates,
    difficulties: cleanDiff,
    stagnations: cleanStag,
    level: calculateLevelFromStars(cleanStates, cycle),
  };
};

// Génère la liste nominative d'une classe SANS aucune compétence acquise.
// Aucune donnée aléatoire : skillStates {} et difficulties [] vides.
// Le niveau est strictement calculé à partir d'un état vide → niveau plancher du cycle.
// Toute progression future doit provenir de bumpSkill / recordSituation.
export const generateClassStudents = (classId: string): Student[] => {
  const namesF = ["Emma", "Sarah", "Jade", "Lea", "Manon", "Chloe", "Ines", "Camille", "Lola", "Zoe", "Maya", "Clara", "Eva", "Louise", "Alice"];
  const namesM = ["Lucas", "Nathan", "Kevin", "Thomas", "Hugo", "Arthur", "Jules", "Enzo", "Gabriel", "Louis", "Paul", "Leo", "Maxime", "Antoine", "Noah"];
  const cycle: Cycle = classId.startsWith("6") ? "cycle3" : "cycle4";
  // Hue déterministe (sans Math.random) pour la couleur d'avatar — pas de simulation pédagogique.
  const hueFor = (name: string, idx: number) =>
    (name.charCodeAt(0) * 17 + idx * 53 + classId.charCodeAt(0) * 11) % 360;
  const make = (name: string, gender: "F" | "M", idx: number): Student => ({
    id: `${classId}-${gender}${idx}`,
    name,
    gender,
    level: calculateLevelFromStars({}, cycle),
    skillStates: {},
    stagnations: [],
    difficulties: [],
    avatarHue: hueFor(name, idx),
  });
  return [
    ...namesF.map((n, i) => make(n, "F", i)),
    ...namesM.map((n, i) => make(n, "M", i)),
  ];
};

export const getRankBadge = (level: number): { label: string; tier: "rookie" | "pro" | "elite" | "legend"; emoji: string } => {
  if (level >= 18) return { label: "Légende", tier: "legend", emoji: "👑" };
  if (level >= 13) return { label: "Élite", tier: "elite", emoji: "💎" };
  if (level >= 7) return { label: "Pro", tier: "pro", emoji: "🔥" };
  return { label: "Rookie", tier: "rookie", emoji: "⭐" };
};

// Tier ranges and visual styles for grouped roster view.
export const RANK_TIERS = [
  { tier: "rookie", label: "Rookie", emoji: "⭐", range: [1, 6] as const,
    headerCls: "bg-gradient-to-r from-[oklch(0.55_0.13_55)] to-[oklch(0.72_0.14_70)] text-white" },
  { tier: "pro", label: "Pro", emoji: "🔥", range: [7, 12] as const,
    headerCls: "bg-gradient-to-r from-[oklch(0.55_0.10_240)] to-[oklch(0.78_0.05_250)] text-white" },
  { tier: "elite", label: "Élite", emoji: "💎", range: [13, 17] as const,
    headerCls: "bg-gradient-to-r from-[oklch(0.45_0.12_25)] to-[oklch(0.78_0.16_85)] text-white" },
  { tier: "legend", label: "Légende", emoji: "👑", range: [18, 22] as const,
    headerCls: "bg-gradient-to-r from-[oklch(0.85_0.02_280)] to-[oklch(0.95_0.01_60)] text-ink" },
] as const;

export const tierForLevel = (level: number): typeof RANK_TIERS[number] =>
  RANK_TIERS.find((t) => level >= t.range[0] && level <= t.range[1]) || RANK_TIERS[0];
