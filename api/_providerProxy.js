const DEFAULT_TIMEOUT_MS = 4000;

function readFirstHeader(value) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function normalizeOrigin(value) {
  return typeof value === "string" ? value.trim().replace(/\/$/, "") : "";
}

function getProviderOrigin() {
  const legacyClientOrigin = normalizeOrigin(process.env.VITE_SAJU_PROVIDER_BASE_URL);
  const origin = normalizeOrigin(
    process.env.SAJU_PROVIDER_ORIGIN
    || process.env.PROVIDER_ORIGIN
    || process.env.SAJU_PROVIDER_URL
    || (legacyClientOrigin.startsWith("http://") || legacyClientOrigin.startsWith("https://")
      ? legacyClientOrigin
      : "")
    || (process.env.VERCEL_ENV === "production" ? "" : "http://127.0.0.1:8081")
  );

  if (!origin) {
    throw new Error("SAJU_PROVIDER_ORIGIN_NOT_CONFIGURED");
  }

  return origin;
}

function getTimeoutMs() {
  const raw = process.env.SAJU_PROVIDER_TIMEOUT_MS || process.env.VITE_SAJU_PROVIDER_TIMEOUT_MS;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TIMEOUT_MS;
}

async function readRequestBody(req) {
  if (req.body !== undefined && req.body !== null) {
    if (Buffer.isBuffer(req.body) || typeof req.body === "string") {
      return req.body;
    }

    return JSON.stringify(req.body);
  }

  return new Promise((resolve, reject) => {
    const chunks = [];

    req.on("data", (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });

    req.on("end", () => {
      if (!chunks.length) {
        resolve(undefined);
        return;
      }

      resolve(Buffer.concat(chunks));
    });

    req.on("error", reject);
  });
}

function buildUpstreamHeaders(req, hasBody) {
  const headers = {
    accept: readFirstHeader(req.headers.accept) || "application/json",
  };

  const contentType = readFirstHeader(req.headers["content-type"]);
  if (hasBody && contentType) {
    headers["content-type"] = contentType;
  }

  const requestId = readFirstHeader(req.headers["x-request-id"]);
  if (requestId) {
    headers["x-request-id"] = requestId;
  }

  const forwardedFor = readFirstHeader(req.headers["x-forwarded-for"]);
  if (forwardedFor) {
    headers["x-forwarded-for"] = forwardedFor;
  }

  const forwardedProto = readFirstHeader(req.headers["x-forwarded-proto"]);
  if (forwardedProto) {
    headers["x-forwarded-proto"] = forwardedProto;
  }

  const forwardedHost = readFirstHeader(req.headers.host);
  if (forwardedHost) {
    headers["x-forwarded-host"] = forwardedHost;
  }

  return headers;
}

function forwardResponseHeaders(upstream, res) {
  const contentType = upstream.headers.get("content-type");
  const cacheControl = upstream.headers.get("cache-control");

  if (contentType) res.setHeader("content-type", contentType);
  if (cacheControl) res.setHeader("cache-control", cacheControl);
}

function sendProxyError(res, statusCode, code, message) {
  res.statusCode = statusCode;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify({
    error: {
      code,
      message,
    },
  }));
}

export async function proxyProviderRequest(req, res, upstreamPath) {
  if (!upstreamPath.startsWith("/")) {
    sendProxyError(res, 500, "PROVIDER_PROXY_BAD_PATH", "Proxy path must start with '/'.");
    return;
  }

  if (!["GET", "POST"].includes(req.method || "")) {
    res.statusCode = 405;
    res.setHeader("allow", "GET, POST");
    res.end();
    return;
  }

  let origin = "";

  try {
    origin = getProviderOrigin();
  } catch (error) {
    if (error instanceof Error && error.message === "SAJU_PROVIDER_ORIGIN_NOT_CONFIGURED") {
      sendProxyError(res, 500, "PROVIDER_PROXY_NOT_CONFIGURED", "Missing SAJU_PROVIDER_ORIGIN.");
      return;
    }

    sendProxyError(res, 500, "PROVIDER_PROXY_SETUP_ERROR", "Provider proxy is not configured correctly.");
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), getTimeoutMs());

  try {
    const body = req.method === "GET" ? undefined : await readRequestBody(req);
    const upstream = await fetch(`${origin}${upstreamPath}`, {
      method: req.method,
      headers: buildUpstreamHeaders(req, body !== undefined),
      body,
      signal: controller.signal,
      redirect: "manual",
    });

    const payload = await upstream.text();
    res.statusCode = upstream.status;
    forwardResponseHeaders(upstream, res);
    res.end(payload);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      sendProxyError(res, 504, "PROVIDER_TIMEOUT", "Upstream provider timed out.");
      return;
    }

    sendProxyError(res, 502, "PROVIDER_UNAVAILABLE", "Upstream provider request failed.");
  } finally {
    clearTimeout(timeout);
  }
}
