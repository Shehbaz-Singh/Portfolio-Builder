import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

// A real hash to compare against when the email is unknown, so a login for a missing user
// takes as long as one for an existing user and timing does not reveal which emails exist.
const dummyHash = bcrypt.hash('not-a-real-password', SALT_ROUNDS);

export async function verifyPassword(password: string, hash: string | null): Promise<boolean> {
  const valid = await bcrypt.compare(password, hash ?? (await dummyHash));
  return hash !== null && valid;
}
