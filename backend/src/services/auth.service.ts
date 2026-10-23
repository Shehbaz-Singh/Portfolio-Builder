import { profileSchema } from '@portfolio/shared';
import type { AuthResponse, LoginInput, RegisterInput, SessionResponse } from '@portfolio/shared';
import { Prisma } from '../generated/prisma/client';
import { AppError } from '../lib/errors';
import { signToken } from '../lib/jwt';
import { hashPassword, verifyPassword } from '../lib/password';
import { prisma } from '../lib/prisma';
import { randomSuffix, slugify } from '../lib/slug';

// Explicit selects mean passwordHash is never loaded unless login needs it, and the
// session builder below copies fields by name so it can never leak into a response.
// The profile columns come from the shared schema's keys, so there is one field list.
const profileSelect = Object.fromEntries(
  Object.keys(profileSchema.shape).map((key) => [key, true]),
) as { [K in keyof typeof profileSchema.shape]: true } satisfies Prisma.ProfileSelect;

const sessionSelect = {
  id: true,
  email: true,
  createdAt: true,
  profile: { select: profileSelect },
} satisfies Prisma.UserSelect;

type SessionUser = Prisma.UserGetPayload<{ select: typeof sessionSelect }>;

function toSession(user: SessionUser): SessionResponse {
  return {
    user: { id: user.id, email: user.email, createdAt: user.createdAt.toISOString() },
    profile: user.profile && { ...user.profile },
  };
}

function isUniqueViolation(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002';
}

const emailTaken = () =>
  AppError.conflict('EMAIL_TAKEN', 'An account with this email already exists');

async function findFreeSlug(base: string): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const candidate = i === 0 ? base : `${base}-${randomSuffix()}`;
    const taken = await prisma.profile.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!taken) return candidate;
  }
  throw new Error('Could not generate a unique slug');
}

export async function register(input: RegisterInput): Promise<AuthResponse> {
  const { email, password } = input;

  if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) {
    throw emailTaken();
  }

  const passwordHash = await hashPassword(password);
  const fullName = input.fullName ?? email.split('@')[0];
  const baseSlug = slugify(fullName);

  // The checks above are not atomic with the insert, so two concurrent requests can still
  // collide. The unique constraints are the real guard: on a violation, work out which one.
  for (let attempt = 0; attempt < 3; attempt++) {
    const slug = await findFreeSlug(baseSlug);
    try {
      const user = await prisma.user.create({
        data: { email, passwordHash, profile: { create: { slug, fullName } } },
        select: sessionSelect,
      });
      return { token: signToken(user.id), ...toSession(user) };
    } catch (err) {
      if (!isUniqueViolation(err)) throw err;
      if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) {
        throw emailTaken();
      }
      // Otherwise the slug was taken in the meantime: retry with a new one.
    }
  }
  throw new Error('Could not create account after several attempts');
}

export async function login({ email, password }: LoginInput): Promise<AuthResponse> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { ...sessionSelect, passwordHash: true },
  });

  // Same error and same amount of work whether the email or the password was wrong.
  const valid = await verifyPassword(password, user?.passwordHash ?? null);
  if (!user || !valid) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  return { token: signToken(user.id), ...toSession(user) };
}

export async function getSession(userId: string): Promise<SessionResponse> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: sessionSelect });
  if (!user) throw AppError.unauthorized('Account no longer exists', 'INVALID_TOKEN');
  return toSession(user);
}
