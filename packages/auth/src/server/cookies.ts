import { SESSION_COOKIE_NAME } from "../shared/session";

export function parseCookieHeader(
  header: string | null,
): Record<string, string> {
  if (!header) return {};
  const out: Record<string, string> = {};
  for (const part of header.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (!k) continue;
    out[k] = decodeURIComponent(rest.join("=").trim());
  }
  return out;
}

export function getSessionTokenFromCookieHeader(
  cookieHeader: string | null,
): string | null {
  const cookies = parseCookieHeader(cookieHeader);
  return cookies[SESSION_COOKIE_NAME] ?? null;
}

export function buildSetCookieHeader(opts: {
  name: string;
  value: string;
  maxAgeSeconds: number;
  secure: boolean;
  httpOnly?: boolean;
  sameSite?: "lax" | "strict" | "none";
  path?: string;
}): string {
  const parts = [
    `${opts.name}=${encodeURIComponent(opts.value)}`,
    `Path=${opts.path ?? "/"}`,
    `Max-Age=${opts.maxAgeSeconds}`,
    `SameSite=${opts.sameSite ?? "Lax"}`,
  ];
  if (opts.httpOnly !== false) parts.push("HttpOnly");
  if (opts.secure) parts.push("Secure");
  return parts.join("; ");
}

export function buildClearCookieHeader(opts: {
  name: string;
  secure: boolean;
  path?: string;
}): string {
  const parts = [
    `${opts.name}=`,
    `Path=${opts.path ?? "/"}`,
    "Max-Age=0",
    `SameSite=Lax`,
    "HttpOnly",
  ];
  if (opts.secure) parts.push("Secure");
  return parts.join("; ");
}
