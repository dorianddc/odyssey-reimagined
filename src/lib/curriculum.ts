export const MAX_LEVEL = 24;

export const CLASSES_CONFIG = [
  { id: '6A', name: '6ème A', cycle: 'cycle3' as const }, { id: '6B', name: '6ème B', cycle: 'cycle3' as const },
  { id: '5A', name: '5ème A', cycle: 'cycle4' as const }, { id: '5B', name: '5ème B', cycle: 'cycle4' as const },
  { id: '4A', name: '4ème A', cycle: 'cycle4' as const }, { id: '4B', name: '4ème B', cycle: 'cycle4' as const },
  { id: '3A', name: '3ème A', cycle: 'cycle4' as const }, { id: '3B', name: '3ème B', cycle: 'cycle4' as const },
];

export type Cycle = 'cycle3' | 'cycle4';

export interface Skill {
  id: string;
  code: string;
  name: string;
  levels: string[];
}

export interface Category {
  label: string;
  iconName: string;
  color: string;
  skills: Skill[];
}

export const CURRICULUM: Record<Cycle, { title: string; field: string; categories: Record<string, Category> }> = {
  cycle3: {
    title: "Cycle 3 (6ème)",
    field: "Conduire et maîtriser un affrontement collectif ou interindividuel",
    categories: {
      moteur: { label: "Dimension Motrice", iconName: "Activity", color: "#f87171", skills: [
        { id: "c3_a", code: "a", name: "Maniabilité raquette", levels: ["Frappe subie, renvoi réflexe vers l'avant", "Envoie le volant volontairement", "Vise les espaces libres", "Provoque la rupture par placement", "Variété de frappes"] },
        { id: "c3_b", code: "b", name: "Service (Golf-minton)", levels: ["Action non orientée vers la cible", "Identifie la cible et l'atteint", "Oriente ses frappes vers les coins", "Adapte son service au placement adverse", "Fixe l'adversaire avant de servir"] },
        { id: "c3_d", code: "d", name: "Continuité de l'échange", levels: ["Statique face au volant", "Réagit après l'impact", "Se déplace pour intercepter", "Ajuste son placement avant la frappe adverse", "Lit les intentions de frappe de l'adversaire"] },
        { id: "c3_e", code: "e", name: "Coordination frappe", levels: ["Gestes désordonnés", "Frappe à l'arrêt sans équilibre", "Coordonne bras/jambes lors de la frappe", "Enchaîne frappe et début de replacement", "Équilibre parfait en fente et replacement rapide"] }
      ]},
      methodo: { label: "Dimension Méthodologique", iconName: "Brain", color: "#60a5fa", skills: [
        { id: "c3_f", code: "f", name: "S'informer pour agir", levels: ["Regard au sol", "Regarde uniquement le volant", "Prend l'info sur l'adversaire avant de frapper", "Analyse globalement le terrain", "Identifie les pannes tactiques du partenaire"] }
      ]},
      social: { label: "Dimension Sociale", iconName: "Users", color: "#34d399", skills: [
        { id: "c3_c", code: "c", name: "Rôles sociaux", levels: ["Refuse le duel ou le score", "Accepte de jouer avec/contre tout le monde", "Coopère activement pour la réussite commune", "Respecte l'éthique et accepte le verdict", "Aide les autres à progresser"] },
        { id: "c3_g", code: "g", name: "Règles et arbitrage", levels: ["Règles non connues", "Connaît les fautes simples", "Applique le règlement sans erreur", "Garant des règles et de la sécurité", "Arbitre expert capable d'expliquer"] }
      ]}
    }
  },
  cycle4: {
    title: "Cycle 4 (5e, 4e, 3e)",
    field: "Conduire et maîtriser un affrontement collectif ou interindividuel",
    categories: {
      moteur: { label: "Dimension Motrice", iconName: "Activity", color: "#f87171", skills: [
        { id: "c4_a", code: "a", name: "Service tactique", levels: ["Jeu de renvoi sans intention tactique", "Utilise l'alternance court/long", "Vise les zones faibles identifiées", "Utilise des feintes de service", "Domination tactique par le service"] },
        { id: "c4_b", code: "b", name: "Zones de divorce", levels: ["Jeu centré sur soi", "Réagit au style adverse", "Modifie sa tactique en cours de match", "Anticipe et neutralise le projet adverse", "Ajuste son placement continuellement"] },
        { id: "c4_c", code: "c", name: "Placement/Déplacement", levels: ["Appuis lourds ou statiques", "Reprise d'appui efficace", "Enchaîne fentes avant et frappes hautes", "Maîtrise la dissociation déplacement/frappe", "Jeu de jambe shadow parfait"] },
        { id: "c4_d", code: "d", name: "Utilisation du Smash", levels: ["Statut subi en permanence", "Identifie la position favorable", "Prend l'initiative sur volant haut", "Gère stratégiquement les transitions", "Provoque volontairement le passage en attaque"] }
      ]},
      methodo: { label: "Dimension Méthodologique", iconName: "Brain", color: "#60a5fa", skills: [
        { id: "c4_g", code: "g", name: "S'informer pour agir", levels: ["Information prise trop tard", "Observe la position au service", "Prend l'information sur les trajectoires", "Lecture de jeu experte (anticipation)", "Analyse stat en temps réel"] },
        { id: "c4_comm", code: "5", name: "Commenter le résultat", levels: ["Simple annonce du score", "Décrit le déroulement des échanges", "Analyse les causes de la défaite/victoire", "Propose une remédiation tactique précise", "Bilan technique de niveau entraîneur"] }
      ]},
      social: { label: "Dimension Sociale", iconName: "Users", color: "#34d399", skills: [
        { id: "c4_f", code: "f", name: "Arbitre / Observateur", levels: ["Rôle non investi ou erroné", "Annonce le score et les fautes simples", "Arbitre avec autorité et fiabilité", "Médiateur expert", "Tuteur pour les jeunes officiels"] },
        { id: "c4_e", code: "e", name: "Coopération", levels: ["Actions isolées", "Communique avec le partenaire", "Se coordonne tactiquement", "Synergie totale en double", "Leader stratégique guidant son partenaire"] }
      ]}
    }
  }
};

export const STAGNATION_REASONS = [
  { id: "mot_tech", cat: "moteur", label: "Frein Moteur : Technique trop fragile", remediation: "Simplifier l'incertitude spatiale. Travailler le geste avec un volant mousse." },
  { id: "mot_coo", cat: "moteur", label: "Frein Moteur : Coordination bras/jambes", remediation: "Isoler le travail d'appuis (échelles de rythme) avant la frappe." },
  { id: "aff_stress", cat: "affectif", label: "Frein Affectif : Stress de l'opposition", remediation: "Passer sur une situation de coopération. Valoriser la tentative." },
  { id: "cog_com", cat: "cognitif", label: "Frein Cognitif : Consigne non assimilée", remediation: "Reformuler l'objectif. Utiliser un schéma ou une vidéo." },
  { id: "eng_mot", cat: "engagement", label: "Engagement : Manque de motivation", remediation: "Donner un rôle social valorisant (coach). Fixer un défi XP court." }
];

export interface Student {
  id: string;
  name: string;
  gender: 'F' | 'M';
  level: number;
  skillStates: Record<string, number>;
  stagnations: Array<{
    skillId: string;
    skillName?: string;
    palierCible: number;
    reason: string;
    remediation?: string;
    date: string;
  }>;
}

export const calculateLevelFromStars = (skillStates: Record<string, number>, cycle: Cycle): number => {
  const categories = CURRICULUM[cycle]?.categories;
  if (!categories) return 4;
  let totalSkillsCount = 0;
  let totalStars = 0;
  Object.values(categories).forEach(cat => totalSkillsCount += cat.skills.length);
  Object.entries(skillStates).forEach(([, stars]) => totalStars += Math.min(stars, 4));
  const averageStars = totalStars / totalSkillsCount;
  let baseLevel = averageStars * 4 + 4;
  Object.values(skillStates).forEach(stars => { if (stars === 5) baseLevel += 0.5; });
  return Math.max(1, Math.min(MAX_LEVEL, Math.round(baseLevel)));
};

export const generateClassStudents = (classId: string): Student[] => {
  const namesF = ["Emma", "Sarah", "Jade", "Lea", "Manon", "Chloe", "Ines", "Camille", "Lola", "Zoe", "Maya", "Clara", "Eva", "Louise", "Alice"];
  const namesM = ["Lucas", "Nathan", "Kevin", "Thomas", "Hugo", "Arthur", "Jules", "Enzo", "Gabriel", "Louis", "Paul", "Leo", "Maxime", "Antoine", "Noah"];
  return [
    ...namesF.map((n, i) => ({ id: `${classId}-F${i}`, name: n, gender: 'F' as const, level: 4, skillStates: {}, stagnations: [] })),
    ...namesM.map((n, i) => ({ id: `${classId}-M${i}`, name: n, gender: 'M' as const, level: 4, skillStates: {}, stagnations: [] }))
  ];
};
