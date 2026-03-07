export type Gender = 'male' | 'female' | 'other';

export interface UserProfileInput {
  name: string;
  birthDate: string;
  birthTime: string;
  gender: Gender;
  interests: string[];
}

export interface FiveElementsBalance {
  wood: number;
  fire: number;
  earth: number;
  metal: number;
  water: number;
}

export interface SajuResult {
  pillars: string[];
  fiveElements: FiveElementsBalance;
  personalitySummary: string;
  loveStyle: string;
  idealPartnerTraits: string[];
}

export interface DatingProfile {
  id: string;
  name: string;
  age: number;
  image: string;
  score: number;
  summary: string;
  tags: string[];
}
