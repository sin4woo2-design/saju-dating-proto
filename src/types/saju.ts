export type Gender = "male" | "female" | "other";
export type ElementKey = "wood" | "fire" | "earth" | "metal" | "water";
export type YinYang = "yin" | "yang";
export type SajuSeason = "spring" | "summer" | "transition" | "autumn" | "winter";
export type SajuStrengthLevel = "strong" | "balanced" | "weak";
export type SajuPillarKey = "year" | "month" | "day" | "hour";
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
  pillar: SajuPillarKey;
  stem?: string;
  code?: SajuTenGodCode;
  label?: string;
  summary: string;
}

export interface SajuPillarDetail {
  raw?: string;
  stem?: string;
  branch?: string;
  stemLabel?: string;
  branchLabel?: string;
  stemElement?: ElementKey;
  branchElement?: ElementKey;
  season?: SajuSeason;
  hiddenStems?: string[];
  supportWeight?: number;
  stemTenGodCode?: SajuTenGodCode;
  stemTenGodLabel?: string;
}

export interface SajuElementBreakdown {
  ruleVersion: string;
  stemContribution: FiveElementsBalance;
  branchContribution: FiveElementsBalance;
  monthBranchBonusContribution: FiveElementsBalance;
  hiddenStemContribution: FiveElementsBalance;
  overlapMonthBonusHiddenEarth: boolean;
  earthDampeningEnabled: boolean;
  earthDampeningStrength: number;
  earthDampeningApplied: number;
  rawScore: FiveElementsBalance;
  finalNormalized: FiveElementsBalance;
  winner: ElementKey;
}

export interface SajuAnalysis {
  source: "chart-derived" | "balance-derived";
  basisOrigin?: "provider" | "derived";
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
  supportScore?: number;
  regulatingScore?: number;
  seasonalBonus?: number;
  rootSupportScore?: number;
  strengthReason: string;
  supportElements: ElementKey[];
  usefulElements: ElementKey[];
  cautionElements: ElementKey[];
  tenGods: SajuTenGodInsight[];
  summaryLines: string[];
  pillarDetails?: Partial<Record<SajuPillarKey, SajuPillarDetail>>;
  elementBreakdown?: SajuElementBreakdown;
  notes?: string[];
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
