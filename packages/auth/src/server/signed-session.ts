import { createHmac, timingSafeEqual } from "node:crypto";

import type { Session, SessionUser } from "../shared/session";

export interface SessionPayload {
  user: SessionUser;
  exp: number;
}

function b64url(buf: Buffer | string) {
  const b = typeof buf === "string" ? Buffer.from(buf, "utf8") : buf;
  return b
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function b64urlDecode(s: string): Buffer {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  return Buffer.from(b64, "base64");
}

function sign(secret: string, payloadJson: string): string {
  const sig = createHmac("sha256", secret).update(payloadJson).digest();
  return `${b64url(payloadJson)}.${b64url(sig)}`;
}

export function encodeSession(
  secret: string,
  user: SessionUser,
  expMs: number,
) {
  const payload: SessionPayload = {
    user,
    exp: expMs,
  };
  const json = JSON.stringify(payload);
  return sign(secret, json);
}

export function decodeSession(
  secret: string,
  token: string,
): SessionPayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadPart, sigPart] = parts;
  if (!payloadPart || !sigPart) return null;
  try {
    const payloadJson = b64urlDecode(payloadPart).toString("utf8");
    const sig = b64urlDecode(sigPart);
    const expected = createHmac("sha256", secret).update(payloadJson).digest();
    if (sig.length !== expected.length || !timingSafeEqual(sig, expected)) {
      return null;
    }
    const data = JSON.parse(payloadJson) as unknown;
    if (
      typeof data !== "object" ||
      data === null ||
      !("exp" in data) ||
      !("user" in data) ||
      typeof data.exp !== "number" ||
      typeof data.user !== "object" ||
      data.user === null ||
      !("id" in data.user) ||
      typeof data.user.id !== "string" ||
      !("name" in data.user) ||
      typeof data.user.name !== "string" ||
      !("email" in data.user) ||
      typeof data.user.email !== "string"
    ) {
      return null;
    }
    const payload = data as SessionPayload;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function payloadToSession(payload: SessionPayload): Session {
  return {
    user: payload.user,
    expiresAt: new Date(payload.exp).toISOString(),
  };
}
