import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const SALT_LEN = 16;
const KEY_LEN = 64;

function scryptKey(password: string, salt: Buffer): Buffer {
  return scryptSync(password, salt, KEY_LEN);
}

export function hashPassword(password: string): string {
  const salt = randomBytes(SALT_LEN);
  const key = scryptKey(password, salt);
  return `${salt.toString("hex")}:${key.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [saltHex, keyHex] = stored.split(":");
  if (!saltHex || !keyHex || saltHex.length !== SALT_LEN * 2) return false;
  try {
    const salt = Buffer.from(saltHex, "hex");
    const key = Buffer.from(keyHex, "hex");
    if (key.length !== KEY_LEN) return false;
    const derived = scryptKey(password, salt);
    return timingSafeEqual(key, derived);
  } catch {
    return false;
  }
}
