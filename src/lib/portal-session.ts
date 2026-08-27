import { createHmac } from "crypto";
import { cookies } from "next/headers";

const SECRET = process.env.PORTAL_SESSION_SECRET ?? "dev-portal-secret-2026";
const COOKIE = "portal_session";
const TTL = 24 * 60 * 60 * 1000; // 24h

function sign(id: string, exp: number) {
  return createHmac("sha256", SECRET).update(`${id}:${exp}`).digest("hex");
}

export function createPortalToken(patientId: string) {
  const exp = Date.now() + TTL;
  const sig = sign(patientId, exp);
  return Buffer.from(`${patientId}:${exp}:${sig}`).toString("base64url");
}

export function verifyPortalToken(token: string): string | null {
  try {
    const parts = Buffer.from(token, "base64url").toString().split(":");
    if (parts.length !== 3) return null;
    const [id, expStr, sig] = parts;
    if (Date.now() > parseInt(expStr)) return null;
    if (sign(id, parseInt(expStr)) !== sig) return null;
    return id;
  } catch {
    return null;
  }
}

export async function getPortalPatientId(): Promise<string | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  return verifyPortalToken(token);
}

export async function setPortalCookie(patientId: string) {
  const jar = await cookies();
  jar.set(COOKIE, createPortalToken(patientId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 86400,
    path: "/",
    sameSite: "lax",
  });
}

export async function clearPortalCookie() {
  const jar = await cookies();
  jar.delete(COOKIE);
}
