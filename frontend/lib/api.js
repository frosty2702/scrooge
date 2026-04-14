export const API = "http://localhost:8000";

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function getUser() {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
}

export function authHeaders() {
  const token = getToken();
  return token ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` } : { "Content-Type": "application/json" };
}

export function logout(router) {
  localStorage.clear();
  router.push("/login");
}

async function authedGet(path) {
  const res = await fetch(`${API}${path}`, { headers: authHeaders() });
  if (res.status === 401) return { error: "unauthenticated" };
  if (res.status === 404) return { error: "none" };
  if (!res.ok) return { error: "failed" };
  return res.json();
}

async function authedPut(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (res.status === 401) return { error: "unauthenticated" };
  if (!res.ok) return { error: "failed" };
  return res.json();
}

export const fetchMe = () => authedGet("/api/me");
export const updateMe = (body) => authedPut("/api/me", body);
export const fetchLatestSimulation = () => authedGet("/api/latest-simulation");
export const fetchMySimulations = () => authedGet("/api/my-simulations");
export const fetchMarketRegime = () => authedGet("/api/market-regime");
export const fetchComparison = () => authedGet("/api/comparison");
