export type { AuthHandlerConfig } from "./handlers";
export { createAuthHandlers } from "./handlers";
export { getServerSession, verifySession } from "./get-server-session";
export type { GetServerSessionOptions } from "./get-server-session";
export {
  buildClearCookieHeader,
  buildSetCookieHeader,
  getSessionTokenFromCookieHeader,
  parseCookieHeader,
} from "./cookies";
export type { Session, SessionUser } from "../shared/session";
export {
  SESSION_COOKIE_NAME,
  SessionSchema,
  SessionUserSchema,
} from "../shared/session";
