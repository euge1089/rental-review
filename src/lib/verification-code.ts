import { randomInt, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const SALT_LEN = 12;
const KEY_LEN = 32;

function scryptCode(code: string, salt: Buffer): Buffer {
  return scryptSync(code.normalize("NFKC"), salt, KEY_LEN);
}

export function generateSixDigitCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function hashVerificationCode(code: string): string {
  const salt = randomBytes(SALT_LEN);
  const key = scryptCode(code, salt);
  return `${salt.toString("hex")}:${key.toString("hex")}`;
}

export function verifyVerificationCode(code: string, stored: string): boolean {
  const [saltHex, keyHex] = stored.split(":");
  if (!saltHex || !keyHex) return false;
  try {
    const salt = Buffer.from(saltHex, "hex");
    const key = Buffer.from(keyHex, "hex");
    if (key.length !== KEY_LEN) return false;
    const derived = scryptCode(code, salt);
    return timingSafeEqual(key, derived);
  } catch {
    return false;
  }
}
