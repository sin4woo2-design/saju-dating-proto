import type { MatchCard, PersonaResult } from "../types/saju";

export const mockMatchCards: MatchCard[] = [
  {
    id: "m1",
    name: "서윤",
    age: 27,
    compatibility: 89,
    tags: ["전시", "요가", "브런치"],
    note: "대화 리듬이 잘 맞고 감정 온도가 비슷한 궁합",
  },
  {
    id: "m2",
    name: "민재",
    age: 30,
    compatibility: 82,
    tags: ["러닝", "스타트업", "커피"],
    note: "서로의 부족한 오행을 보완하는 성장형 궁합",
  },
  {
    id: "m3",
    name: "하린",
    age: 26,
    compatibility: 76,
    tags: ["사진", "여행", "독서"],
    note: "끌림이 강하지만 속도 조절이 중요해요",
  },
];

export const mockPersona: PersonaResult = {
  ageRange: "27-31",
  personality: "Warm Strategist",
  career: "Design / Product / Creative",
  appearance: "Calm / Intellectual",
};
