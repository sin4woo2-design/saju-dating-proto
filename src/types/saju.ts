export type Gender = "male" | "female" | "other";
export type ElementKey = "wood" | "fire" | "earth" | "metal" | "water";
export type YinYang = "yin" | "yang";
export type SajuSeason = "spring" | "summer" | "transition" | "autumn" | "winter";
export type SajuStrengthLevel = "strong" | "balanced" | "weak";
export type SajuTenGodCode =
  | "peer"
  | "rival"
  | "food"
  | "hurting"
  | "indirectWealth"
  | "directWealth"
  | "sevenKillings"
  | "directOfficer"
  | "indirectResource"
  | "directResource";

export interface UserProfileInput {
  name: string;
  birthDate: string;
  birthTime: string;
  gender: Gender;
}

export interface FiveElementsBalance {
  wood: number;
  fire: number;
  earth: number;
  metal: number;
  water: number;
}

export interface SajuPillarsSnapshot {
  year?: string;
  month?: string;
  day?: string;
  hour?: string;
}

export interface SajuTenGodInsight {
  pillar: "year" | "month" | "day" | "hour";
  stem?: string;
  code?: SajuTenGodCode;
  summary: string;
}

export interface SajuAnalysis {
  source: "chart-derived" | "balance-derived";
  dayMasterStem?: string;
  dayMasterLabel: string;
  dayMasterElement: ElementKey;
  dayMasterYinYang?: YinYang;
  monthBranch?: string;
  monthBranchLabel?: string;
  season: SajuSeason;
  dominantElement: ElementKey;
  weakestElement: ElementKey;
  strengthLevel: SajuStrengthLevel;
  strengthScore: number;
  strengthReason: string;
  supportElements: ElementKey[];
  usefulElements: ElementKey[];
  cautionElements: ElementKey[];
  tenGods: SajuTenGodInsight[];
  summaryLines: string[];
}

export interface SajuProfile {
  fiveElements: FiveElementsBalance;
  personalitySummary: string;
  loveStyle: string;
  idealTraits: string[];
  analysis?: SajuAnalysis;
}

export interface MatchCard {
  id: string;
  name: string;
  age: number;
  location: string;
  compatibility: number;
  tags: string[];
  intro: string;
  mbti: string;
  note: string;
}

export interface PersonaResult {
  title: string;
  ageRange: string;
  personality: string;
  career: string;
  appearance: string;
  hashtags: string[];
}
