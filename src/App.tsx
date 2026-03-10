import { useMemo } from "react";
import { BrowserRouter, NavLink, Navigate, Route, Routes } from "react-router-dom";
import OnboardingPage from "./pages/Onboarding/OnboardingPage";
import HomePage from "./pages/Home/HomePage";
import MySajuPage from "./pages/MySaju/MySajuPage";
import CompatibilityPage from "./pages/Compatibility/CompatibilityPage";
import FortunePage from "./pages/Fortune/FortunePage";
import PersonaPage from "./pages/Persona/PersonaPage";
import InyeonPage from "./pages/Inyeon/InyeonPage";
import { usePersistedProfile } from "./hooks/usePersistedProfile";

export default function App() {
  const { profile: me, setProfile: setMe } = usePersistedProfile();

  const gate = useMemo(() => {
    if (!me) return <Navigate to="/onboarding" replace />;
    return null;
  }, [me]);

  return (
    <BrowserRouter>
      <div className="appShell">
        <header className="topBar">
          <h1>사주 라운지</h1>
          {me ? (
            <button
              type="button"
              className="resetBtn"
              onClick={() => {
                if (!confirm("입력 정보를 초기화하고 다시 온보딩할까요?")) return;
                setMe(null);
              }}
            >
              입력 다시하기
            </button>
          ) : null}
        </header>

        <main>
          <Routes>
            <Route path="/onboarding" element={<OnboardingPage onComplete={setMe} />} />
            <Route path="/" element={me ? <HomePage me={me} /> : gate} />
            <Route path="/mysaju" element={me ? <MySajuPage me={me} /> : gate} />
            <Route path="/fortune" element={me ? <FortunePage me={me} /> : gate} />
            <Route path="/persona" element={me ? <PersonaPage /> : gate} />
            <Route path="/inyeon" element={me ? <InyeonPage /> : gate} />
            <Route path="/compatibility" element={me ? <CompatibilityPage me={me} /> : gate} />
            <Route path="*" element={<Navigate to={me ? "/" : "/onboarding"} replace />} />
          </Routes>
        </main>

        <nav className="bottomNav bottomNavFive">
          <NavLink to="/" className={({ isActive }) => `tabLink ${isActive ? "active" : ""}`}>
            <span className="tabIcon">⌂</span>
            <span>홈</span>
          </NavLink>
          <NavLink to="/mysaju" className={({ isActive }) => `tabLink ${isActive ? "active" : ""}`}>
            <span className="tabIcon">▣</span>
            <span>내 사주</span>
          </NavLink>
          <NavLink to="/fortune" className={({ isActive }) => `tabLink ${isActive ? "active" : ""}`}>
            <span className="tabIcon">◌</span>
            <span>운세</span>
          </NavLink>
          <NavLink to="/persona" className={({ isActive }) => `tabLink ${isActive ? "active" : ""}`}>
            <span className="tabIcon">◔</span>
            <span>페르소나</span>
          </NavLink>
          <NavLink to="/inyeon" className={({ isActive }) => `tabLink ${isActive ? "active" : ""}`}>
            <span className="tabIcon">♡</span>
            <span>인연</span>
          </NavLink>
        </nav>
      </div>
    </BrowserRouter>
  );
}
