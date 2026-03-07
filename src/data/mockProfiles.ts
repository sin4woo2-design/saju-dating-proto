import type { DatingProfile } from '../types/saju';

export const mockProfiles: DatingProfile[] = [
  {
    id: '1',
    name: '하윤',
    age: 27,
    image: 'https://picsum.photos/seed/saju1/480/640',
    score: 91,
    summary: '감정 흐름이 자연스럽고, 장기 관계 궁합이 높은 편',
    tags: ['전시', '독서', '필라테스'],
  },
  {
    id: '2',
    name: '서준',
    age: 30,
    image: 'https://picsum.photos/seed/saju2/480/640',
    score: 84,
    summary: '가치관 균형이 좋아 현실/감성 조합이 안정적',
    tags: ['스타트업', '커피', '러닝'],
  },
  {
    id: '3',
    name: '지우',
    age: 26,
    image: 'https://picsum.photos/seed/saju3/480/640',
    score: 76,
    summary: '매력 포인트는 강하지만 대화 속도 조율이 필요',
    tags: ['사진', '여행', '요리'],
  },
];
