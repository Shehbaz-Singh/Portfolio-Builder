import type {
  AuthResponse,
  ChangePasswordInput,
  DeleteAccountInput,
  LoginInput,
  RegisterInput,
  SessionResponse,
} from '@portfolio/shared';
import type { Prisma } from '../generated/prisma/client';
import { AppError } from '../lib/errors';
import { signToken } from '../lib/jwt';
import { hashPassword, verifyPassword } from '../lib/password';
import { prisma } from '../lib/prisma';
import { isUniqueViolation } from '../lib/prisma-errors';
import { profileSelect } from '../lib/selects';
import { deleteAvatarImage } from './avatar.service';
import { generateUniqueSlug } from './slug.service';

// Explicit selects mean passwordHash is never loaded unless login needs it, and the
// session builder below copies fields by name so it can never leak into a response.
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

const emailTaken = () =>
  AppError.conflict('EMAIL_TAKEN', 'An account with this email already exists');

export async function register(input: RegisterInput): Promise<AuthResponse> {
  const { email, password } = input;

  if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) {
    throw emailTaken();
  }

  const passwordHash = await hashPassword(password);
  const fullName = input.fullName ?? email.split('@')[0];

  // The checks above are not atomic with the insert, so two concurrent requests can still
  // collide. The unique constraints are the real guard: on a violation, work out which one.
  for (let attempt = 0; attempt < 3; attempt++) {
    const slug = await generateUniqueSlug(fullName);
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

// Changing or deleting an account needs the password again, even with a valid token. The error
// is 403, not 401: the session is fine, and the frontend treats a 401 as "log in again".
async function confirmPassword(userId: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true, profile: { select: { id: true, avatarUrl: true } } },
  });
  if (!user) throw AppError.unauthorized('Account no longer exists', 'INVALID_TOKEN');
  if (!(await verifyPassword(password, user.passwordHash))) {
    throw new AppError(403, 'INVALID_PASSWORD', 'Incorrect password');
  }
  return user;
}

// Tokens are not tied to the password, so other signed-in devices stay signed in until their
// token expires. Doing better would need a token version on the user.
export async function changePassword(userId: string, input: ChangePasswordInput) {
  await confirmPassword(userId, input.currentPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(input.newPassword) },
  });
}

// The profile and everything under it go with the user (cascade). The photo is removed from
// Cloudinary afterwards; a failure there only leaves an unused image behind.
export async function deleteAccount(userId: string, { password }: DeleteAccountInput) {
  const user = await confirmPassword(userId, password);
  await prisma.user.delete({ where: { id: userId } });
  if (user.profile) await deleteAvatarImage(user.profile.avatarUrl, user.profile.id);
}
