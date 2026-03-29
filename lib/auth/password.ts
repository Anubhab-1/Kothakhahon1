import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [salt, savedHash] = storedHash.split(":");
  if (!salt || !savedHash) {
    return false;
  }

  const incomingHash = scryptSync(password, salt, 64).toString("hex");
  const savedBuffer = Buffer.from(savedHash, "hex");
  const incomingBuffer = Buffer.from(incomingHash, "hex");

  if (savedBuffer.length !== incomingBuffer.length) {
    return false;
  }

  return timingSafeEqual(savedBuffer, incomingBuffer);
}

export const hashAdminPassword = hashPassword;
export const verifyAdminPassword = verifyPassword;
