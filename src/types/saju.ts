export type Gender = "male" | "female" | "other";

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

export interface SajuProfile {
  fiveElements: FiveElementsBalance;
  personalitySummary: string;
  loveStyle: string;
  idealTraits: string[];
}

export interface MatchCard {
  id: string;
  name: string;
  age: number;
  compatibility: number;
  tags: string[];
  note: string;
}

export interface PersonaResult {
  ageRange: string;
  personality: string;
  career: string;
  appearance: string;
}
