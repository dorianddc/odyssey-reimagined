// Badminton curriculum + game logic for Cycle 3 (6e) & Cycle 4 (5/4/3e)
// Adapted from the user's original Gemini code.

export const MAX_LEVEL = 24;

export type Cycle = "cycle3" | "cycle4";
export type DimensionKey = "moteur" | "methodo" | "social";

export interface Skill {
  id: string;
  code: string;
  name: string;
  levels: string[]; // 5 paliers (0..4 then star=5 mastery)
}

export interface Dimension {
  label: string;
  iconName: "Activity" | "Brain" | "Users";
  colorVar: string; // CSS var token for hsl
  skills: Skill[];
}

export interface CurriculumCycle {
  title: string;
  field: string;
  categories: Record<DimensionKey, Dimension>;
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

// Référentiel institutionnel officiel — Badminton EPS
// Cycle 3 (6ème) : 7 compétences réparties sur 3 dimensions
// Cycle 4 (5e/4e/3e) : 6 compétences réparties sur 3 dimensions
export const CURRICULUM: Record<Cycle, CurriculumCycle> = {
  cycle3: {
    title: "Cycle 3 (6ème)",
    field: "Conduire et maîtriser un affrontement collectif ou interindividuel",
    categories: {
      moteur: {
        label: "Dimension Motrice",
        iconName: "Activity",
        colorVar: "var(--dim-motor)",
        skills: [
          {
            id: "c3_c1",
            code: "C1",
            name: "Rechercher le gain de l'affrontement par des choix tactiques simples",
            levels: [
              "Frappe subie, renvoi réflexe vers l'avant.",
              "Envoie le volant volontairement chez l'adversaire.",
              "Vise les espaces libres pour marquer le point.",
              "Provoque la rupture par des trajectoires placées.",
              "Utilise une grande variété de frappes pour déborder l'adversaire.",
            ],
          },
          {
            id: "c3_c2",
            code: "C2",
            name: "Adapter son jeu et ses actions aux adversaires et à ses partenaires",
            levels: [
              "Action non orientée vers le camp adverse.",
              "Identifie la cible et envoie le volant dedans.",
              "Oriente ses frappes vers les coins du terrain.",
              "Place le volant en fonction du placement adverse.",
              "Fixe l'adversaire avant de changer de cible.",
            ],
          },
          {
            id: "c3_c3",
            code: "C3",
            name: "Coordonner des actions motrices simples",
            levels: [
              "Gestes désordonnés, frappe à l'arrêt sans équilibre.",
              "Coordonne l'action bras/jambes lors de la frappe.",
              "Enchaîne frappe et début de replacement central.",
              "Équilibre parfait en fente et replacement rapide.",
              "Fluidité totale et jeu de jambes \"shadow\" expert.",
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
            id: "c3_c4",
            code: "C4",
            name: "Se reconnaître attaquant / défenseur",
            levels: [
              "Ne sait pas s'il est en difficulté ou en position de force.",
              "Se reconnaît attaquant uniquement sur un volant très haut et lent.",
              "Identifie son statut dès que l'adversaire frappe.",
              "Adapte sa posture (raquette haute en attaque, posture basse en défense).",
              "Passe instantanément de la défense à l'attaque sur un bon dégagement.",
            ],
          },
          {
            id: "c3_c5",
            code: "C5",
            name: "Coopérer pour attaquer et défendre",
            levels: [
              "Joue seul même en double, gêne son partenaire.",
              "Se répartit le terrain de manière figée.",
              "Communique verbalement pour éviter les collisions.",
              "Se place de manière complémentaire (avant/arrière) selon la situation.",
              "Couvre spontanément les espaces laissés par un partenaire en difficulté.",
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
            id: "c3_c6",
            code: "C6",
            name: "Accepter de tenir des rôles simples d'arbitre et d'observateur",
            levels: [
              "Refuse d'arbitrer ou n'est pas attentif.",
              "Annonce le score mais fait des erreurs de procédure.",
              "Juge les lignes correctement et annonce le score sans erreur.",
              "Utilise un outil d'observation simple de manière fiable.",
              "Arbitre avec autorité bienveillante et aide à faire le bilan.",
            ],
          },
          {
            id: "c3_c7",
            code: "C7",
            name: "S'informer pour agir",
            levels: [
              "Ne regarde que le volant ou sa raquette.",
              "Prend le temps de regarder l'adversaire avant de servir.",
              "Prend l'information sur le placement adverse pendant que le volant vole.",
              "Observe le comportement d'un joueur depuis la touche.",
              "Croise les infos (score, temps, adversaire) pour ajuster son jeu.",
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

export interface Student {
  id: string;
  name: string;
  gender: "F" | "M";
  level: number;
  skillStates: Record<string, number>; // skillId -> stars 0..5
  stagnations: { skillId: string; skillName?: string; palierCible: number; reason: string; remediation?: string; date: string }[];
  avatarHue: number;
}

export const calculateLevelFromStars = (skillStates: Record<string, number>, cycle: Cycle): number => {
  const categories = CURRICULUM[cycle]?.categories;
  if (!categories) return 4;
  let totalSkillsCount = 0;
  let totalStars = 0;
  Object.values(categories).forEach((cat) => (totalSkillsCount += cat.skills.length));
  Object.entries(skillStates).forEach(([, stars]) => (totalStars += Math.min(stars, 4)));
  const averageStars = totalStars / Math.max(1, totalSkillsCount);
  let baseLevel = averageStars * 4 + 4;
  Object.values(skillStates).forEach((stars) => {
    if (stars === 5) baseLevel += 0.5;
  });
  return Math.max(1, Math.min(MAX_LEVEL, Math.round(baseLevel)));
};

export const generateClassStudents = (classId: string): Student[] => {
  const namesF = ["Emma", "Sarah", "Jade", "Lea", "Manon", "Chloe", "Ines", "Camille", "Lola", "Zoe", "Maya", "Clara", "Eva", "Louise", "Alice"];
  const namesM = ["Lucas", "Nathan", "Kevin", "Thomas", "Hugo", "Arthur", "Jules", "Enzo", "Gabriel", "Louis", "Paul", "Leo", "Maxime", "Antoine", "Noah"];
  const cycle: Cycle = classId.startsWith("6") ? "cycle3" : "cycle4";
  const allSkills = Object.values(CURRICULUM[cycle].categories).flatMap((c) => c.skills);
  const seedRand = (seed: number) => {
    let x = seed;
    return () => {
      x = (x * 9301 + 49297) % 233280;
      return x / 233280;
    };
  };
  const make = (name: string, gender: "F" | "M", idx: number): Student => {
    const rand = seedRand(name.charCodeAt(0) + idx * 31 + classId.charCodeAt(0));
    // give a realistic distribution of stars
    const skillStates: Record<string, number> = {};
    const skill = Math.floor(rand() * 5); // overall ability bias 0..4
    allSkills.forEach((s) => {
      const r = rand();
      const stars = Math.max(0, Math.min(5, Math.round(skill + (r - 0.5) * 3)));
      if (stars > 0) skillStates[s.id] = stars;
    });
    return {
      id: `${classId}-${gender}${idx}`,
      name,
      gender,
      level: calculateLevelFromStars(skillStates, cycle),
      skillStates,
      stagnations: [],
      avatarHue: Math.floor(rand() * 360),
    };
  };
  return [
    ...namesF.map((n, i) => make(n, "F", i)),
    ...namesM.map((n, i) => make(n, "M", i)),
  ];
};

export const getRankBadge = (level: number): { label: string; tier: "rookie" | "pro" | "elite" | "legend"; emoji: string } => {
  if (level >= 20) return { label: "Légende", tier: "legend", emoji: "👑" };
  if (level >= 14) return { label: "Élite", tier: "elite", emoji: "💎" };
  if (level >= 8) return { label: "Pro", tier: "pro", emoji: "🔥" };
  return { label: "Rookie", tier: "rookie", emoji: "⭐" };
};
