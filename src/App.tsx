import { useState, type ReactElement } from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom';
import CompatibilityPage from './pages/Compatibility/CompatibilityPage';
import HomePage from './pages/Home/HomePage';
import MySajuPage from './pages/MySaju/MySajuPage';
import OnboardingPage from './pages/Onboarding/OnboardingPage';
import PersonaPage from './pages/Persona/PersonaPage';
import type { UserProfileInput } from './types/saju';
import './index.css';

function RequireUser({
  user,
  children,
}: {
  user: UserProfileInput | null;
  children: ReactElement;
}) {
  if (!user) return <Navigate to="/onboarding" replace />;
  return children;
}

export default function App() {
  const [user, setUser] = useState<UserProfileInput | null>(null);

  return (
    <BrowserRouter>
      <div className="app-shell">
        <header className="topbar">
          <h1>Saju Dating Proto</h1>
        </header>

        <main>
          <Routes>
            <Route path="/onboarding" element={<OnboardingPage onComplete={setUser} />} />
            <Route
              path="/"
              element={
                <RequireUser user={user}>
                  <HomePage />
                </RequireUser>
              }
            />
            <Route
              path="/my-saju"
              element={
                <RequireUser user={user}>
                  <MySajuPage user={user as UserProfileInput} />
                </RequireUser>
              }
            />
            <Route
              path="/compatibility"
              element={
                <RequireUser user={user}>
                  <CompatibilityPage user={user as UserProfileInput} />
                </RequireUser>
              }
            />
            <Route
              path="/persona"
              element={
                <RequireUser user={user}>
                  <PersonaPage />
                </RequireUser>
              }
            />
          </Routes>
        </main>

        <nav className="bottom-nav">
          <Link to="/">홈</Link>
          <Link to="/my-saju">내 사주</Link>
          <Link to="/compatibility">궁합</Link>
          <Link to="/persona">페르소나</Link>
        </nav>
      </div>
    </BrowserRouter>
  );
}
