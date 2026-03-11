import { useMemo, useState } from "react";

type Habit = {
  id: string;
  name: string;
  category: "건강" | "집중" | "마음" | "생활";
  streak: number;
  bestStreak: number;
  totalDone: number;
  todayDone: boolean;
  lastDoneAt?: string;
};

type Challenge = {
  id: string;
  title: string;
  description: string;
  days: number;
  participants: number;
  joined: boolean;
  tags: string[];
};

type CommunityHabit = {
  user: string;
  habit: string;
  streak: number;
  note: string;
};

type RecoveryGame = {
  habitId: string;
  target: number;
  triesLeft: number;
  active: boolean;
};

const habitTemplates: Array<Pick<Habit, "name" | "category">> = [
  { name: "물 8잔 마시기", category: "건강" },
  { name: "10분 산책", category: "건강" },
  { name: "SNS 없이 25분 집중", category: "집중" },
  { name: "감사 3줄 쓰기", category: "마음" },
  { name: "방 5분 정리", category: "생활" },
];

const initialHabits: Habit[] = [
  {
    id: "h1",
    name: "아침 물 1잔",
    category: "건강",
    streak: 4,
    bestStreak: 7,
    totalDone: 18,
    todayDone: false,
  },
  {
    id: "h2",
    name: "20분 걷기",
    category: "건강",
    streak: 2,
    bestStreak: 6,
    totalDone: 12,
    todayDone: true,
    lastDoneAt: new Date().toISOString(),
  },
  {
    id: "h3",
    name: "오늘 할 일 3개 적기",
    category: "집중",
    streak: 5,
    bestStreak: 9,
    totalDone: 20,
    todayDone: false,
  },
];

const initialChallenges: Challenge[] = [
  {
    id: "c1",
    title: "7일 물 루틴",
    description: "하루 6~8잔 인증. 몸이 먼저 반응해요.",
    days: 7,
    participants: 182,
    joined: false,
    tags: ["건강", "초보추천"],
  },
  {
    id: "c2",
    title: "퇴근 후 10분 정리",
    description: "작게 시작하면 집이 달라져요.",
    days: 14,
    participants: 97,
    joined: true,
    tags: ["생활", "정리"],
  },
  {
    id: "c3",
    title: "스마트폰 덜 보기",
    description: "하루 30분 줄이기 챌린지.",
    days: 10,
    participants: 211,
    joined: false,
    tags: ["집중", "디지털디톡스"],
  },
];

const communityHabits: CommunityHabit[] = [
  { user: "민지", habit: "아침 스트레칭", streak: 12, note: "2분만 해도 몸이 깨어나요" },
  { user: "준호", habit: "독서 15분", streak: 8, note: "출근 전 루틴으로 고정" },
  { user: "유나", habit: "영어 단어 20개", streak: 16, note: "점심 후 10분이 최고" },
  { user: "도현", habit: "밤 산책", streak: 5, note: "잠이 확실히 잘 와요" },
];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function randomTarget() {
  return Math.floor(Math.random() * 10) + 1;
}

export default function App() {
  const [tab, setTab] = useState<"today" | "stats" | "community" | "premium">("today");
  const [habits, setHabits] = useState<Habit[]>(initialHabits);
  const [challenges, setChallenges] = useState<Challenge[]>(initialChallenges);
  const [newHabitName, setNewHabitName] = useState("");
  const [newHabitCategory, setNewHabitCategory] = useState<Habit["category"]>("건강");
  const [message, setMessage] = useState("시작하면 이미 절반 성공. 오늘도 한 칸 채워보자!");
  const [game, setGame] = useState<RecoveryGame | null>(null);

  const doneToday = habits.filter((habit) => habit.todayDone).length;
  const progressPercent = habits.length ? Math.round((doneToday / habits.length) * 100) : 0;
  const topHabit = [...habits].sort((a, b) => b.streak - a.streak)[0];
  const avgStreak = habits.length ? Math.round(habits.reduce((sum, h) => sum + h.streak, 0) / habits.length) : 0;

  const weeklyData = useMemo(() => {
    const total = habits.reduce((sum, h) => sum + h.totalDone, 0);
    const base = Math.max(3, Math.round(total / 7));
    return [
      { day: "월", value: Math.max(0, base - 1) },
      { day: "화", value: base + 1 },
      { day: "수", value: base },
      { day: "목", value: base + 2 },
      { day: "금", value: Math.max(0, base - 2) },
      { day: "토", value: base + 1 },
      { day: "일", value: base + 2 },
    ];
  }, [habits]);

  const recommendation = useMemo(() => {
    if (progressPercent >= 80) return "지금 페이스 아주 좋아! 내일부터 목표를 1개만 추가해봐.";
    if (progressPercent >= 50) return "좋아, 이미 반 이상 왔어. 저녁 전에 쉬운 습관 1개 마무리하자.";
    return "오늘은 작은 승리부터. 2분 안에 끝나는 습관 먼저 체크해보자.";
  }, [progressPercent]);

  const toggleHabitDone = (habitId: string) => {
    setHabits((prev) =>
      prev.map((habit) => {
        if (habit.id !== habitId) return habit;
        if (habit.todayDone) {
          return {
            ...habit,
            todayDone: false,
            streak: Math.max(0, habit.streak - 1),
            totalDone: Math.max(0, habit.totalDone - 1),
          };
        }
        return {
          ...habit,
          todayDone: true,
          streak: habit.streak + 1,
          bestStreak: Math.max(habit.bestStreak, habit.streak + 1),
          totalDone: habit.totalDone + 1,
          lastDoneAt: new Date().toISOString(),
        };
      }),
    );

    const target = habits.find((h) => h.id === habitId);
    if (!target?.todayDone) {
      setMessage(`좋아! ${target?.name} 시작했네. 시작이 반 ✅`);
    }
  };

  const addHabit = () => {
    const name = newHabitName.trim();
    if (!name) return;
    setHabits((prev) => [
      ...prev,
      { id: uid(), name, category: newHabitCategory, streak: 0, bestStreak: 0, totalDone: 0, todayDone: false },
    ]);
    setNewHabitName("");
    setMessage(`새 습관 '${name}' 추가 완료. 오늘 1회만 해도 절반 성공이야!`);
  };

  const addTemplate = (template: Pick<Habit, "name" | "category">) => {
    setHabits((prev) => {
      if (prev.some((h) => h.name === template.name)) return prev;
      return [
        ...prev,
        {
          id: uid(),
          name: template.name,
          category: template.category,
          streak: 0,
          bestStreak: 0,
          totalDone: 0,
          todayDone: false,
        },
      ];
    });
    setMessage(`'${template.name}' 장착! 작게 시작해보자.`);
  };

  const triggerFail = (habitId: string) => {
    setHabits((prev) => prev.map((habit) => (habit.id === habitId ? { ...habit, todayDone: false, streak: Math.max(0, habit.streak - 1) } : habit)));
    setGame({ habitId, target: randomTarget(), triesLeft: 2, active: true });
    setMessage("아쉬워도 괜찮아. 미니게임 성공하면 스트릭 복구 찬스!");
  };

  const playRecovery = (guess: number) => {
    if (!game?.active) return;
    if (guess === game.target) {
      setHabits((prev) => prev.map((habit) => (habit.id === game.habitId ? { ...habit, streak: habit.streak + 1 } : habit)));
      setMessage("🎉 복구 성공! 이어가는 힘이 진짜 실력이지.");
      setGame(null);
      return;
    }

    if (game.triesLeft <= 1) {
      setMessage(`이번엔 실패! 내일 다시 시작하면 또 반은 해낸 거야.`);
      setGame(null);
      return;
    }

    setGame({ ...game, triesLeft: game.triesLeft - 1 });
    setMessage(`아깝다! 한 번 더 도전 가능 (${game.triesLeft - 1}회 남음)`);
  };

  const joinChallenge = (challengeId: string) => {
    setChallenges((prev) =>
      prev.map((challenge) =>
        challenge.id === challengeId
          ? { ...challenge, joined: !challenge.joined, participants: challenge.joined ? challenge.participants - 1 : challenge.participants + 1 }
          : challenge,
      ),
    );
  };

  return (
    <div className="app">
      <header className="header card">
        <p className="brand">✨ 시작이 반</p>
        <h1>시작하면 이미 절반 성공</h1>
        <p className="subtitle">재미있게 습관을 쌓고, 넘어져도 미니게임으로 다시 이어가요.</p>
      </header>

      <section className="card statusCard">
        <div>
          <strong>오늘 진행률 {progressPercent}%</strong>
          <p>{doneToday} / {habits.length} 완료</p>
        </div>
        <div className="meter"><i style={{ width: `${progressPercent}%` }} /></div>
        <small>{recommendation}</small>
      </section>

      <nav className="tabs">
        <button className={tab === "today" ? "active" : ""} onClick={() => setTab("today")}>오늘</button>
        <button className={tab === "stats" ? "active" : ""} onClick={() => setTab("stats")}>통계·분석</button>
        <button className={tab === "community" ? "active" : ""} onClick={() => setTab("community")}>같이 도전</button>
        <button className={tab === "premium" ? "active" : ""} onClick={() => setTab("premium")}>프리미엄</button>
      </nav>

      {tab === "today" && (
        <main className="stack">
          <section className="card">
            <h2>오늘의 습관</h2>
            <div className="habitList">
              {habits.map((habit) => (
                <article key={habit.id} className="habitItem">
                  <div>
                    <strong>{habit.name}</strong>
                    <p>{habit.category} · 연속 {habit.streak}일 · 최고 {habit.bestStreak}일</p>
                  </div>
                  <div className="actions">
                    <button onClick={() => toggleHabitDone(habit.id)}>{habit.todayDone ? "완료 취소" : "완료 체크"}</button>
                    <button className="ghost" onClick={() => triggerFail(habit.id)}>실패했어요</button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="card">
            <h2>새 습관 추가</h2>
            <div className="row">
              <input
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                placeholder="예: 저녁 10분 스트레칭"
              />
              <select value={newHabitCategory} onChange={(e) => setNewHabitCategory(e.target.value as Habit["category"])}>
                <option>건강</option>
                <option>집중</option>
                <option>마음</option>
                <option>생활</option>
              </select>
              <button onClick={addHabit}>추가</button>
            </div>
            <div className="chips">
              {habitTemplates.map((item) => (
                <button key={item.name} className="chip" onClick={() => addTemplate(item)}>{item.name}</button>
              ))}
            </div>
          </section>

          {game?.active && (
            <section className="card gameCard">
              <h2>복구 미니게임 🎮</h2>
              <p>1~10 중 숫자를 맞추면 방금 끊긴 스트릭을 복구해요.</p>
              <div className="numberGrid">
                {Array.from({ length: 10 }).map((_, idx) => (
                  <button key={idx + 1} onClick={() => playRecovery(idx + 1)}>{idx + 1}</button>
                ))}
              </div>
              <small>남은 기회: {game.triesLeft}회</small>
            </section>
          )}

          <p className="message">{message}</p>
        </main>
      )}

      {tab === "stats" && (
        <main className="stack">
          <section className="card statGrid">
            <article><p>평균 스트릭</p><strong>{avgStreak}일</strong></article>
            <article><p>최강 습관</p><strong>{topHabit ? topHabit.name : "-"}</strong></article>
            <article><p>누적 완료</p><strong>{habits.reduce((sum, habit) => sum + habit.totalDone, 0)}회</strong></article>
          </section>

          <section className="card">
            <h2>주간 완료량</h2>
            <div className="chart">
              {weeklyData.map((d) => (
                <div key={d.day} className="barWrap">
                  <div className="bar" style={{ height: `${Math.max(14, d.value * 12)}px` }} />
                  <span>{d.day}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="card">
            <h2>AI 분석 요약</h2>
            <ul>
              <li>월·목·일에 완료량이 높아요. 이 시간대에 핵심 습관을 배치해보세요.</li>
              <li>건강 카테고리 성공률이 높아 강점 루틴입니다.</li>
              <li>실패 버튼을 눌렀던 습관은 "2분 버전"을 별도로 만들어 복구율을 높이세요.</li>
            </ul>
          </section>
        </main>
      )}

      {tab === "community" && (
        <main className="stack">
          <section className="card">
            <h2>지금 인기 챌린지</h2>
            <div className="challengeList">
              {challenges.map((challenge) => (
                <article key={challenge.id} className="challengeItem">
                  <div>
                    <strong>{challenge.title}</strong>
                    <p>{challenge.description}</p>
                    <small>{challenge.days}일 · 참여 {challenge.participants}명 · #{challenge.tags.join(" #")}</small>
                  </div>
                  <button onClick={() => joinChallenge(challenge.id)}>{challenge.joined ? "참여중" : "같이 도전"}</button>
                </article>
              ))}
            </div>
          </section>

          <section className="card">
            <h2>다른 사람 습관 피드</h2>
            <div className="feedList">
              {communityHabits.map((feed) => (
                <article key={`${feed.user}-${feed.habit}`} className="feedItem">
                  <strong>{feed.user}</strong>
                  <p>{feed.habit} · {feed.streak}일째</p>
                  <small>"{feed.note}"</small>
                </article>
              ))}
            </div>
          </section>
        </main>
      )}

      {tab === "premium" && (
        <main className="stack">
          <section className="card premiumCard">
            <h2>프리미엄 (소액 결제 실험용)</h2>
            <p>무료로 습관을 시작하고, 더 깊은 동기부여는 유료로 전환하는 구조예요.</p>
            <ul>
              <li>₩1,900/월: 무제한 습관 + 맞춤 동기 메시지 + 주간 PDF 리포트</li>
              <li>₩4,900/회: 30일 집중 챌린지팩(직장인/다이어트/공부)</li>
              <li>친구와 배틀 랭킹, 실패 복구 코인 3개 제공</li>
            </ul>
            <button>결제 연결하기 (토스/스트라이프 연동 예정)</button>
          </section>
        </main>
      )}
    </div>
  );
}
