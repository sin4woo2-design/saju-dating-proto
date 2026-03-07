import { useMemo, useState } from "react";
import { BrowserRouter, Link, Navigate, Route, Routes } from "react-router-dom";
import OnboardingPage from "./pages/Onboarding/OnboardingPage";
import HomePage from "./pages/Home/HomePage";
import MySajuPage from "./pages/MySaju/MySajuPage";
import CompatibilityPage from "./pages/Compatibility/CompatibilityPage";
import PersonaPage from "./pages/Persona/PersonaPage";
import type { UserProfileInput } from "./types/saju";

export default function App() {
  const [me, setMe] = useState<UserProfileInput | null>(null);

  const gate = useMemo(() => {
    if (!me) return <Navigate to="/onboarding" replace />;
    return null;
  }, [me]);

  return (
    <BrowserRouter>
      <div className="appShell">
        <header className="topBar">
          <h1>Saju Dating Proto</h1>
        </header>

        <main>
          <Routes>
            <Route path="/onboarding" element={<OnboardingPage onComplete={setMe} />} />
            <Route path="/" element={me ? <HomePage /> : gate} />
            <Route path="/mysaju" element={me ? <MySajuPage me={me} /> : gate} />
            <Route path="/compatibility" element={me ? <CompatibilityPage me={me} /> : gate} />
            <Route path="/persona" element={me ? <PersonaPage /> : gate} />
          </Routes>
        </main>

        <nav className="bottomNav">
          <Link to="/">홈</Link>
          <Link to="/mysaju">내 사주</Link>
          <Link to="/compatibility">궁합</Link>
          <Link to="/persona">페르소나</Link>
        </nav>
      </div>
    </BrowserRouter>
  );
}
