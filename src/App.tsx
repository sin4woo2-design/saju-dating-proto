import { useEffect, useMemo, useState } from "react";

type HabitCategory = "건강" | "집중" | "마음" | "생활";
type MotiveStyle = "따뜻한 코치" | "냉정한 코치" | "친구같은 응원";

type Habit = {
  id: string;
  name: string;
  category: HabitCategory;
  difficulty: "easy" | "normal" | "hard";
  streak: number;
  bestStreak: number;
  totalDone: number;
  todayDone: boolean;
  weeklyTarget: number;
  activeDays: number[]; // 0(일) ~ 6(토)
  createdAt: string;
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

type RecoveryGame = {
  habitId: string;
  target: number;
  triesLeft: number;
  active: boolean;
};

type DayLog = {
  date: string;
  doneCount: number;
  totalCount: number;
  mood: "최고" | "좋음" | "보통" | "저조";
  note: string;
};

type AppState = {
  habits: Habit[];
  challenges: Challenge[];
  motiveStyle: MotiveStyle;
  freezeTokens: number;
  levelPoint: number;
  dayLogs: DayLog[];
  lastOpenedDate: string;
};

const STORAGE_KEY = "start-is-half-v2";

const todayStr = () => new Date().toISOString().slice(0, 10);
const currentWeekday = () => new Date().getDay();
const uid = () => Math.random().toString(36).slice(2, 10);
const randomTarget = () => Math.floor(Math.random() * 10) + 1;

const initialState: AppState = {
  habits: [
    {
      id: "h1",
      name: "아침 물 1잔",
      category: "건강",
      difficulty: "easy",
      streak: 4,
      bestStreak: 7,
      totalDone: 18,
      todayDone: false,
      weeklyTarget: 6,
      activeDays: [1, 2, 3, 4, 5, 6],
      createdAt: new Date().toISOString(),
    },
    {
      id: "h2",
      name: "20분 걷기",
      category: "건강",
      difficulty: "normal",
      streak: 2,
      bestStreak: 6,
      totalDone: 12,
      todayDone: true,
      weeklyTarget: 5,
      activeDays: [1, 2, 3, 4, 5],
      createdAt: new Date().toISOString(),
    },
    {
      id: "h3",
      name: "오늘 할 일 3개 적기",
      category: "집중",
      difficulty: "easy",
      streak: 5,
      bestStreak: 9,
      totalDone: 20,
      todayDone: false,
      weeklyTarget: 7,
      activeDays: [0, 1, 2, 3, 4, 5, 6],
      createdAt: new Date().toISOString(),
    },
  ],
  challenges: [
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
  ],
  motiveStyle: "친구같은 응원",
  freezeTokens: 1,
  levelPoint: 135,
  dayLogs: [],
  lastOpenedDate: todayStr(),
};

const habitTemplates: Array<Pick<Habit, "name" | "category" | "difficulty">> = [
  { name: "물 8잔 마시기", category: "건강", difficulty: "easy" },
  { name: "10분 산책", category: "건강", difficulty: "easy" },
  { name: "SNS 없이 25분 집중", category: "집중", difficulty: "normal" },
  { name: "감사 3줄 쓰기", category: "마음", difficulty: "easy" },
  { name: "방 5분 정리", category: "생활", difficulty: "easy" },
  { name: "야식 안 먹기", category: "건강", difficulty: "hard" },
];

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    const parsed = JSON.parse(raw) as AppState;
    return {
      ...initialState,
      ...parsed,
      habits: parsed.habits?.length ? parsed.habits : initialState.habits,
      challenges: parsed.challenges?.length ? parsed.challenges : initialState.challenges,
      dayLogs: parsed.dayLogs ?? [],
    };
  } catch {
    return initialState;
  }
}

function motivationalLine(style: MotiveStyle, progressPercent: number, freezeTokens: number) {
  if (style === "냉정한 코치") {
    if (progressPercent >= 80) return "좋다. 하지만 연속성 없으면 0으로 돌아간다. 오늘 마감까지 유지.";
    if (progressPercent >= 50) return "반 왔다. 여기서 멈추면 가장 아깝다. 쉬운 습관 하나 더 끝내.";
    return "의지보다 시스템. 지금 2분짜리부터 실행.";
  }

  if (style === "따뜻한 코치") {
    if (progressPercent >= 80) return `충분히 잘하고 있어요. 필요하면 프리즈 토큰(${freezeTokens})으로 숨 고르고 가도 돼요.`;
    if (progressPercent >= 50) return "반 이상 왔어요. 오늘의 작은 한 칸만 더 채워봐요.";
    return "괜찮아요. 시작 버튼 누른 순간 이미 절반 성공이에요.";
  }

  if (progressPercent >= 80) return `미쳤다🔥 오늘 거의 클리어! 토큰 ${freezeTokens}개로 내일도 안정적.`;
  if (progressPercent >= 50) return "좋아, 절반 넘겼다. 한 개만 더 하면 기분 확 올라간다 😎";
  return "지금 딱 1개만 해보자. 시작이 반, 진짜로.";
}

export default function App() {
  const [tab, setTab] = useState<"today" | "stats" | "community" | "lab" | "settings">("today");
  const [state, setState] = useState<AppState>(loadState);
  const [newHabitName, setNewHabitName] = useState("");
  const [newHabitCategory, setNewHabitCategory] = useState<HabitCategory>("건강");
  const [newHabitDifficulty, setNewHabitDifficulty] = useState<Habit["difficulty"]>("easy");
  const [message, setMessage] = useState("시작하면 이미 절반 성공. 오늘도 한 칸 채워보자!");
  const [game, setGame] = useState<RecoveryGame | null>(null);
  const [mood, setMood] = useState<DayLog["mood"]>("보통");
  const [dailyNote, setDailyNote] = useState("");

  const habits = state.habits;

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    const today = todayStr();
    if (state.lastOpenedDate !== today) {
      const doneCount = state.habits.filter((h) => h.todayDone).length;
      const dayLog: DayLog = {
        date: state.lastOpenedDate,
        doneCount,
        totalCount: state.habits.length,
        mood,
        note: dailyNote.trim(),
      };

      setState((prev) => {
        const nextHabits = prev.habits.map((h) => ({ ...h, todayDone: false }));
        const logExists = prev.dayLogs.some((l) => l.date === prev.lastOpenedDate);
        return {
          ...prev,
          habits: nextHabits,
          dayLogs: logExists ? prev.dayLogs : [dayLog, ...prev.dayLogs].slice(0, 60),
          lastOpenedDate: today,
        };
      });

      setDailyNote("");
      setMood("보통");
    }
  }, [state.lastOpenedDate, state.habits, state.dayLogs, mood, dailyNote]);

  const activeTodayHabits = useMemo(
    () => habits.filter((h) => h.activeDays.includes(currentWeekday())),
    [habits],
  );

  const doneToday = activeTodayHabits.filter((h) => h.todayDone).length;
  const progressPercent = activeTodayHabits.length ? Math.round((doneToday / activeTodayHabits.length) * 100) : 0;
  const avgStreak = habits.length ? Math.round(habits.reduce((sum, h) => sum + h.streak, 0) / habits.length) : 0;
  const totalDone = habits.reduce((sum, h) => sum + h.totalDone, 0);
  const topHabit = [...habits].sort((a, b) => b.streak - a.streak)[0];
  const level = Math.floor(state.levelPoint / 100) + 1;
  const levelProgress = state.levelPoint % 100;

  const motivation = motivationalLine(state.motiveStyle, progressPercent, state.freezeTokens);

  const weeklyData = useMemo(() => {
    const logs = state.dayLogs.slice(0, 14);
    const byDay = ["일", "월", "화", "수", "목", "금", "토"].map((day, idx) => {
      const values = logs.filter((l) => new Date(l.date).getDay() === idx).map((l) => (l.totalCount ? l.doneCount / l.totalCount : 0));
      const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
      return { day, value: Math.round(avg * 100) };
    });
    return byDay;
  }, [state.dayLogs]);

  const achievements = useMemo(() => {
    const list = [
      { label: "첫 시작", unlocked: totalDone >= 1 },
      { label: "한 주 루틴", unlocked: habits.some((h) => h.bestStreak >= 7) },
      { label: "루틴 장인", unlocked: habits.some((h) => h.bestStreak >= 30) },
      { label: "습관 5개 보유", unlocked: habits.length >= 5 },
      { label: "누적 100회 완료", unlocked: totalDone >= 100 },
    ];
    return list;
  }, [habits, totalDone]);

  const toggleHabitDone = (habitId: string) => {
    setState((prev) => {
      const nextHabits = prev.habits.map((habit) => {
        if (habit.id !== habitId) return habit;
        if (!habit.activeDays.includes(currentWeekday())) return habit;

        if (habit.todayDone) {
          return {
            ...habit,
            todayDone: false,
            streak: Math.max(0, habit.streak - 1),
            totalDone: Math.max(0, habit.totalDone - 1),
          };
        }

        const gainedPoint = habit.difficulty === "hard" ? 12 : habit.difficulty === "normal" ? 8 : 6;
        return {
          ...habit,
          todayDone: true,
          streak: habit.streak + 1,
          bestStreak: Math.max(habit.bestStreak, habit.streak + 1),
          totalDone: habit.totalDone + 1,
          lastDoneAt: new Date().toISOString(),
          _gain: gainedPoint,
        } as Habit & { _gain?: number };
      });

      const gained = nextHabits.reduce((sum, h) => sum + Number((h as Habit & { _gain?: number })._gain || 0), 0);
      const cleaned = nextHabits.map((h) => {
        const { _gain: _g, ...rest } = h as Habit & { _gain?: number };
        return rest;
      });

      return { ...prev, habits: cleaned, levelPoint: prev.levelPoint + gained };
    });

    const target = habits.find((h) => h.id === habitId);
    if (!target?.todayDone) {
      setMessage(`좋아! ${target?.name} 시작했네. 시작이 반 ✅`);
    }
  };

  const addHabit = () => {
    const name = newHabitName.trim();
    if (!name) return;
    setState((prev) => ({
      ...prev,
      habits: [
        ...prev.habits,
        {
          id: uid(),
          name,
          category: newHabitCategory,
          difficulty: newHabitDifficulty,
          streak: 0,
          bestStreak: 0,
          totalDone: 0,
          todayDone: false,
          weeklyTarget: 5,
          activeDays: [1, 2, 3, 4, 5],
          createdAt: new Date().toISOString(),
        },
      ],
    }));
    setNewHabitName("");
    setMessage(`새 습관 '${name}' 추가 완료. 오늘 1회만 해도 절반 성공!`);
  };

  const addTemplate = (template: Pick<Habit, "name" | "category" | "difficulty">) => {
    setState((prev) => {
      if (prev.habits.some((h) => h.name === template.name)) return prev;
      return {
        ...prev,
        habits: [
          ...prev.habits,
          {
            id: uid(),
            name: template.name,
            category: template.category,
            difficulty: template.difficulty,
            streak: 0,
            bestStreak: 0,
            totalDone: 0,
            todayDone: false,
            weeklyTarget: 5,
            activeDays: [1, 2, 3, 4, 5],
            createdAt: new Date().toISOString(),
          },
        ],
      };
    });
    setMessage(`'${template.name}' 장착! 작게 시작해보자.`);
  };

  const triggerFail = (habitId: string) => {
    setState((prev) => ({
      ...prev,
      habits: prev.habits.map((habit) =>
        habit.id === habitId
          ? { ...habit, todayDone: false, streak: Math.max(0, habit.streak - 1) }
          : habit,
      ),
    }));

    setGame({ habitId, target: randomTarget(), triesLeft: 2, active: true });
    setMessage("아쉬워도 괜찮아. 미니게임 성공하면 스트릭 복구 찬스!");
  };

  const useFreezeToken = (habitId: string) => {
    if (state.freezeTokens <= 0) {
      setMessage("프리즈 토큰이 없어요. 7일 스트릭 달성 시 추가 지급!");
      return;
    }

    setState((prev) => ({
      ...prev,
      freezeTokens: prev.freezeTokens - 1,
      habits: prev.habits.map((habit) =>
        habit.id === habitId ? { ...habit, todayDone: true } : habit,
      ),
    }));

    setMessage("프리즈 토큰 사용 완료. 스트릭 끊김을 방어했어요 🛡️");
  };

  const playRecovery = (guess: number) => {
    if (!game?.active) return;
    if (guess === game.target) {
      setState((prev) => ({
        ...prev,
        habits: prev.habits.map((habit) =>
          habit.id === game.habitId ? { ...habit, streak: habit.streak + 1, todayDone: true } : habit,
        ),
        levelPoint: prev.levelPoint + 10,
      }));
      setMessage("🎉 복구 성공! 이어가는 힘이 진짜 실력이지.");
      setGame(null);
      return;
    }

    if (game.triesLeft <= 1) {
      setMessage("이번엔 실패! 내일 다시 시작하면 또 반은 해낸 거야.");
      setGame(null);
      return;
    }

    setGame({ ...game, triesLeft: game.triesLeft - 1 });
    setMessage(`아깝다! 한 번 더 도전 가능 (${game.triesLeft - 1}회 남음)`);
  };

  const joinChallenge = (challengeId: string) => {
    setState((prev) => ({
      ...prev,
      challenges: prev.challenges.map((challenge) =>
        challenge.id === challengeId
          ? {
              ...challenge,
              joined: !challenge.joined,
              participants: challenge.joined ? challenge.participants - 1 : challenge.participants + 1,
            }
          : challenge,
      ),
    }));
  };

  const saveDailyReflection = () => {
    if (!dailyNote.trim()) {
      setMessage("오늘 느낀 점을 한 줄만 적어보자. 기록이 동기부여를 만든다.");
      return;
    }
    setMessage("회고 저장 완료. 내일의 시작 확률이 올라갔어 📈");
  };

  return (
    <div className="app">
      <header className="header card">
        <p className="brand">✨ 시작이 반</p>
        <h1>시작하면 이미 절반 성공</h1>
        <p className="subtitle">실패해도 다시 이어가게 만드는 동기부여 중심 습관앱</p>

        <div className="levelBox">
          <strong>Lv.{level}</strong>
          <div className="meter"><i style={{ width: `${levelProgress}%` }} /></div>
          <small>경험치 {levelProgress}/100</small>
        </div>
      </header>

      <section className="card statusCard">
        <div>
          <strong>오늘 진행률 {progressPercent}%</strong>
          <p>{doneToday} / {activeTodayHabits.length} 완료 (활성 습관 기준)</p>
        </div>
        <div className="meter"><i style={{ width: `${progressPercent}%` }} /></div>
        <small>{motivation}</small>
      </section>

      <nav className="tabs">
        <button className={tab === "today" ? "active" : ""} onClick={() => setTab("today")}>오늘</button>
        <button className={tab === "stats" ? "active" : ""} onClick={() => setTab("stats")}>통계·분석</button>
        <button className={tab === "community" ? "active" : ""} onClick={() => setTab("community")}>같이 도전</button>
        <button className={tab === "lab" ? "active" : ""} onClick={() => setTab("lab")}>동기부여랩</button>
        <button className={tab === "settings" ? "active" : ""} onClick={() => setTab("settings")}>설정</button>
      </nav>

      {tab === "today" && (
        <main className="stack">
          <section className="card">
            <h2>오늘의 습관</h2>
            <div className="habitList">
              {activeTodayHabits.map((habit) => (
                <article key={habit.id} className="habitItem">
                  <div>
                    <strong>{habit.name}</strong>
                    <p>{habit.category} · 난이도 {habit.difficulty} · 연속 {habit.streak}일 · 최고 {habit.bestStreak}일</p>
                  </div>
                  <div className="actions wrap">
                    <button onClick={() => toggleHabitDone(habit.id)}>{habit.todayDone ? "완료 취소" : "완료 체크"}</button>
                    <button className="ghost" onClick={() => triggerFail(habit.id)}>실패했어요</button>
                    <button className="defense" onClick={() => useFreezeToken(habit.id)}>토큰 방어</button>
                  </div>
                </article>
              ))}
            </div>
            <small>🛡️ 프리즈 토큰: {state.freezeTokens}개</small>
          </section>

          <section className="card">
            <h2>새 습관 추가</h2>
            <div className="row">
              <input value={newHabitName} onChange={(e) => setNewHabitName(e.target.value)} placeholder="예: 저녁 10분 스트레칭" />
              <select value={newHabitCategory} onChange={(e) => setNewHabitCategory(e.target.value as HabitCategory)}>
                <option>건강</option><option>집중</option><option>마음</option><option>생활</option>
              </select>
              <select value={newHabitDifficulty} onChange={(e) => setNewHabitDifficulty(e.target.value as Habit["difficulty"])}>
                <option value="easy">easy</option>
                <option value="normal">normal</option>
                <option value="hard">hard</option>
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
              <p>1~10 중 숫자를 맞추면 스트릭 복구 + XP 보너스</p>
              <div className="numberGrid">
                {Array.from({ length: 10 }).map((_, idx) => (
                  <button key={idx + 1} onClick={() => playRecovery(idx + 1)}>{idx + 1}</button>
                ))}
              </div>
              <small>남은 기회: {game.triesLeft}회</small>
            </section>
          )}

          <section className="card">
            <h2>오늘의 한 줄 회고</h2>
            <div className="row two">
              <select value={mood} onChange={(e) => setMood(e.target.value as DayLog["mood"])}>
                <option>최고</option><option>좋음</option><option>보통</option><option>저조</option>
              </select>
              <input value={dailyNote} onChange={(e) => setDailyNote(e.target.value)} placeholder="예: 점심 전에 산책하니 훨씬 잘 됐음" />
              <button onClick={saveDailyReflection}>저장</button>
            </div>
          </section>

          <p className="message">{message}</p>
        </main>
      )}

      {tab === "stats" && (
        <main className="stack">
          <section className="card statGrid">
            <article><p>평균 스트릭</p><strong>{avgStreak}일</strong></article>
            <article><p>최강 습관</p><strong>{topHabit ? topHabit.name : "-"}</strong></article>
            <article><p>누적 완료</p><strong>{totalDone}회</strong></article>
          </section>

          <section className="card">
            <h2>요일별 성공률 분석</h2>
            <div className="chart">
              {weeklyData.map((d) => (
                <div key={d.day} className="barWrap">
                  <div className="bar" style={{ height: `${Math.max(16, d.value * 1.4)}px` }} />
                  <strong>{d.value}%</strong>
                  <span>{d.day}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="card">
            <h2>성과 배지</h2>
            <div className="chips">
              {achievements.map((a) => (
                <span key={a.label} className={`badge ${a.unlocked ? "on" : "off"}`}>
                  {a.unlocked ? "🏅" : "🔒"} {a.label}
                </span>
              ))}
            </div>
          </section>

          <section className="card">
            <h2>AI 분석 요약</h2>
            <ul>
              <li>성공률이 낮은 요일에 easy 습관 1개를 배치하면 전체 유지율이 올라갑니다.</li>
              <li>난이도 hard 습관은 주 3~4회만 잡아도 장기 지속성이 더 좋아집니다.</li>
              <li>회고를 남긴 날은 다음날 완료율이 높아지는 경향이 있습니다.</li>
            </ul>
          </section>
        </main>
      )}

      {tab === "community" && (
        <main className="stack">
          <section className="card">
            <h2>지금 인기 챌린지</h2>
            <div className="challengeList">
              {state.challenges.map((challenge) => (
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
            <h2>함께하는 습관 피드</h2>
            <div className="feedList">
              <article className="feedItem"><strong>민지</strong><p>아침 스트레칭 · 12일째</p><small>"2분만 해도 몸이 깨어나요"</small></article>
              <article className="feedItem"><strong>준호</strong><p>독서 15분 · 8일째</p><small>"출근 전 루틴으로 고정"</small></article>
              <article className="feedItem"><strong>유나</strong><p>영어 단어 20개 · 16일째</p><small>"점심 후 10분이 최고"</small></article>
            </div>
          </section>
        </main>
      )}

      {tab === "lab" && (
        <main className="stack">
          <section className="card premiumCard">
            <h2>동기부여 실험실</h2>
            <p>상용화에서 가장 중요한 건 "계속 하게 만드는 장치"입니다.</p>
            <ul>
              <li>복구 미니게임: 실패 직후 이탈 방지</li>
              <li>프리즈 토큰: 연속성 보호 장치</li>
              <li>레벨/경험치: 즉시 보상 루프</li>
              <li>감정 회고: 다음 행동 확률 상승</li>
              <li>챌린지/피드: 사회적 동기 부여</li>
            </ul>
          </section>

          <section className="card">
            <h2>리텐션 체크리스트 (기본기)</h2>
            <ul>
              <li>D1: 첫 완료까지 3분 이내</li>
              <li>D3: 실패 경험 시 복구 이벤트 노출</li>
              <li>D7: 첫 성취 배지 + 토큰 보상</li>
              <li>D14: 맞춤 추천 루틴 자동 제안</li>
            </ul>
          </section>
        </main>
      )}

      {tab === "settings" && (
        <main className="stack">
          <section className="card">
            <h2>동기부여 톤 설정</h2>
            <div className="chips">
              {(["따뜻한 코치", "냉정한 코치", "친구같은 응원"] as MotiveStyle[]).map((style) => (
                <button
                  key={style}
                  className={`chip ${state.motiveStyle === style ? "selected" : ""}`}
                  onClick={() => setState((prev) => ({ ...prev, motiveStyle: style }))}
                >
                  {style}
                </button>
              ))}
            </div>
          </section>

          <section className="card">
            <h2>데이터</h2>
            <p>로컬 저장 기반으로 동작 중입니다. (추후 계정/클라우드 동기화 연동 예정)</p>
            <button
              className="danger"
              onClick={() => {
                if (!confirm("정말 초기화할까요?")) return;
                setState(initialState);
                setMessage("앱 데이터 초기화 완료.");
              }}
            >
              전체 초기화
            </button>
          </section>
        </main>
      )}
    </div>
  );
}
