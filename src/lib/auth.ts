export type AuthProvider = "google" | "kakao";

export interface AuthUser {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  provider: AuthProvider;
}

export interface AuthSession {
  user: AuthUser;
  accessToken?: string;
  refreshToken?: string;
}

const SESSION_STORAGE_KEY = "saju-auth-session-v1";
const OAUTH_ERROR_KEY = "saju-auth-error-v1";
const OAUTH_SUCCESS_KEY = "saju-auth-success-v1";

function supabaseUrl() {
  return (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim().replace(/\/$/, "") ?? "";
}

function supabaseAnonKey() {
  return (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() ?? "";
}

function callbackUrl() {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}${window.location.pathname}`;
}

function decodeJwtSegment(segment: string) {
  try {
    const normalized = segment.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    return JSON.parse(window.atob(padded)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function readJwtPayload(token: string) {
  const payload = token.split(".")[1];
  if (!payload) return null;
  return decodeJwtSegment(payload);
}

function providerFromPayload(payload: Record<string, unknown> | null): AuthProvider | null {
  const appMetadata = payload?.app_metadata;
  if (!appMetadata || typeof appMetadata !== "object") return null;
  const provider = (appMetadata as Record<string, unknown>).provider;
  return provider === "google" || provider === "kakao" ? provider : null;
}

function userFromPayload(payload: Record<string, unknown> | null, provider: AuthProvider): AuthUser | null {
  if (!payload) return null;
  const id = typeof payload.sub === "string" ? payload.sub : "";
  if (!id) return null;

  const metadata = payload.user_metadata;
  const meta = metadata && typeof metadata === "object" ? metadata as Record<string, unknown> : {};
  const name = typeof meta.full_name === "string"
    ? meta.full_name
    : typeof meta.name === "string"
      ? meta.name
      : typeof payload.email === "string"
        ? payload.email.split("@")[0]
        : "사용자";

  const avatarUrl = typeof meta.avatar_url === "string" ? meta.avatar_url : undefined;
  const email = typeof payload.email === "string" ? payload.email : undefined;

  return { id, name, email, avatarUrl, provider };
}

function parseSearchAndHash() {
  if (typeof window === "undefined") return { search: new URLSearchParams(), hash: new URLSearchParams() };
  const url = new URL(window.location.href);
  const hash = new URLSearchParams(url.hash.startsWith("#") ? url.hash.slice(1) : url.hash);
  return { search: url.searchParams, hash };
}

export function getStoredSession(): AuthSession | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    return null;
  }
}

export function storeSession(session: AuthSession | null) {
  if (typeof window === "undefined") return;

  if (!session) {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function consumeOAuthError() {
  if (typeof window === "undefined") return "";
  const value = window.localStorage.getItem(OAUTH_ERROR_KEY) ?? "";
  if (value) window.localStorage.removeItem(OAUTH_ERROR_KEY);
  return value;
}

export function consumeOAuthSuccess() {
  if (typeof window === "undefined") return "";
  const value = window.localStorage.getItem(OAUTH_SUCCESS_KEY) ?? "";
  if (value) window.localStorage.removeItem(OAUTH_SUCCESS_KEY);
  return value;
}

function storeOAuthError(message: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(OAUTH_ERROR_KEY, message);
}

function storeOAuthSuccess(message: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(OAUTH_SUCCESS_KEY, message);
}

function cleanAuthParams(url: URL) {
  ["auth_status", "provider", "user_id", "user_name", "user_email", "avatar_url", "access_token", "error", "error_description", "code"].forEach((key) => {
    url.searchParams.delete(key);
  });
  window.history.replaceState({}, document.title, `${url.pathname}${url.search}`);
}

async function fetchSupabaseUser(accessToken: string) {
  const apiUrl = supabaseUrl();
  const anonKey = supabaseAnonKey();
  if (!apiUrl || !anonKey) return null;

  const response = await fetch(`${apiUrl}/auth/v1/user`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) return null;
  return response.json() as Promise<Record<string, unknown>>;
}

export async function consumeOAuthCallback(): Promise<{ session?: AuthSession; error?: string; success?: string }> {
  if (typeof window === "undefined") return {};

  const url = new URL(window.location.href);
  const { search, hash } = parseSearchAndHash();
  const error = search.get("error_description") || search.get("error") || hash.get("error_description") || hash.get("error");
  const accessToken = hash.get("access_token") || search.get("access_token");
  const refreshToken = hash.get("refresh_token") || undefined;

  if (!accessToken && !error) {
    const storedError = consumeOAuthError();
    const storedSuccess = consumeOAuthSuccess();
    if (storedError) return { error: storedError };
    if (storedSuccess) return { success: storedSuccess };
    return {};
  }

  if (error) {
    const message = error || "로그인에 실패했어요. 잠시 후 다시 시도해 주세요.";
    storeOAuthError(message);
    cleanAuthParams(url);
    window.history.replaceState({}, document.title, `${url.pathname}${url.search}`);
    return { error: message };
  }

  const jwtPayload = accessToken ? readJwtPayload(accessToken) : null;
  let provider = providerFromPayload(jwtPayload);
  let user = provider ? userFromPayload(jwtPayload, provider) : null;

  if ((!user || !provider) && accessToken) {
    const fetchedUser = await fetchSupabaseUser(accessToken);
    const metadata = fetchedUser?.user_metadata;
    const appMetadata = fetchedUser?.app_metadata;
    const appMeta = appMetadata && typeof appMetadata === "object" ? appMetadata as Record<string, unknown> : {};
    const providerValue = appMeta.provider;
    provider = providerValue === "google" || providerValue === "kakao" ? providerValue : provider;

    if (provider && fetchedUser?.id && typeof fetchedUser.id === "string") {
      const userMeta = metadata && typeof metadata === "object" ? metadata as Record<string, unknown> : {};
      user = {
        id: fetchedUser.id,
        provider,
        name: typeof userMeta.full_name === "string"
          ? userMeta.full_name
          : typeof userMeta.name === "string"
            ? userMeta.name
            : typeof fetchedUser.email === "string"
              ? fetchedUser.email.split("@")[0]
              : "사용자",
        email: typeof fetchedUser.email === "string" ? fetchedUser.email : undefined,
        avatarUrl: typeof userMeta.avatar_url === "string" ? userMeta.avatar_url : undefined,
      };
    }
  }

  if (!accessToken || !provider || !user) {
    const message = "로그인 응답 형식이 올바르지 않아요. 다시 시도해 주세요.";
    storeOAuthError(message);
    cleanAuthParams(url);
    return { error: message };
  }

  const session: AuthSession = {
    user,
    accessToken,
    refreshToken,
  };

  storeSession(session);
  storeOAuthSuccess(`${user.name}님으로 로그인됐어요.`);
  cleanAuthParams(url);
  return { session, success: `${user.name}님으로 로그인됐어요.` };
}

export function startOAuthLogin(provider: AuthProvider) {
  if (typeof window === "undefined") return { ok: false, reason: "SSR_NOT_SUPPORTED" as const };

  const apiUrl = supabaseUrl();
  const anonKey = supabaseAnonKey();
  if (!apiUrl || !anonKey) return { ok: false, reason: "MISSING_CONFIG" as const };

  const url = new URL(`${apiUrl}/auth/v1/authorize`);
  url.searchParams.set("provider", provider);
  url.searchParams.set("redirect_to", callbackUrl());
  url.searchParams.set("flow_type", "implicit");
  url.searchParams.set("apikey", anonKey);
  window.location.assign(url.toString());
  return { ok: true as const };
}
