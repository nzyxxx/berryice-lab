import { createHash, timingSafeEqual } from "node:crypto";

const COOKIE = "berryice_admin";

function digest(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

function safeEqual(left: string, right: string): boolean {
  return timingSafeEqual(digest(left), digest(right));
}

function sessionValue(secret: string): string {
  return createHash("sha256").update(`berryice-admin:${secret}`).digest("hex");
}

function readCookie(request: Request, name: string): string {
  const header = request.headers.get("cookie") ?? "";
  for (const part of header.split(";")) {
    const [rawKey, ...rest] = part.trim().split("=");
    if (rawKey === name) return decodeURIComponent(rest.join("="));
  }
  return "";
}

/** 站长写接口。口令只和哈希比较，调用方不要把口令写进日志。 */
export function isAdminRequest(request: Request): boolean {
  const secret = process.env.ADMIN_TOKEN;
  if (!secret) return false;

  const header = request.headers.get("x-admin-token");
  if (header && safeEqual(header, secret)) return true;

  const cookie = readCookie(request, COOKIE);
  return Boolean(cookie) && safeEqual(cookie, sessionValue(secret));
}

export function adminSessionSetCookie(request: Request): string {
  const secret = process.env.ADMIN_TOKEN ?? "";
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${COOKIE}=${sessionValue(secret)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=2592000${secure}`;
}

export function adminSessionClearCookie(): string {
  return `${COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`;
}
