import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// A precomputed hash with no matching plaintext, used to run a same-cost bcrypt.compare
// when a login lookup finds no user — keeps "unknown email" and "wrong password" responses
// close in timing so response latency can't be used to enumerate valid admin emails.
const DUMMY_HASH = "$2b$10$CwTycUXWue0Thq9StjUM0uJ8Q0d3.g5J.2fXK0h5x2Kk8Q1.x7XyO";

export function verifyAgainstDummyHash(plain: string): Promise<boolean> {
  return bcrypt.compare(plain, DUMMY_HASH);
}
