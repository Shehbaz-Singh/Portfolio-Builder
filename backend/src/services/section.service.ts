import { SECTION_LIMITS, type Section } from '@portfolio/shared';
import type { Prisma } from '../generated/prisma/client';
import { AppError } from '../lib/errors';
import { prisma } from '../lib/prisma';
import { orNotFound } from '../lib/prisma-errors';

// experience, education, projects, skills and links all follow the same rules, so one
// service handles them. This is the minimal slice of a Prisma model delegate it relies on.
type Row = Record<string, unknown>;
interface Delegate {
  findMany(args: object): Promise<Row[]>;
  findFirst(args: object): Promise<Row | null>;
  count(args: object): Promise<number>;
  aggregate(args: object): Promise<{ _max: { order: number | null } }>;
  create(args: object): Promise<Row>;
  update(args: object): Promise<Row>;
  delete(args: object): Promise<Row>;
}

const delegates = {
  experience: prisma.experience,
  education: prisma.education,
  projects: prisma.project,
  skills: prisma.skill,
  links: prisma.link,
} as unknown as Record<Section, Delegate>;

const omit = { profileId: true };
const notFound = () => AppError.notFound('Item not found');

// Every query below filters by profileId. A record id that belongs to someone else simply
// does not match, so it looks exactly like a record that does not exist (404).

export function listItems(section: Section, profileId: string) {
  return delegates[section].findMany({
    where: { profileId },
    orderBy: [{ order: 'asc' }, { id: 'asc' }],
    omit,
  });
}

export async function getItem(section: Section, profileId: string, id: string) {
  const item = await delegates[section].findFirst({ where: { id, profileId }, omit });
  if (!item) throw notFound();
  return item;
}

export async function createItem(section: Section, profileId: string, input: Row) {
  const delegate = delegates[section];

  const count = await delegate.count({ where: { profileId } });
  if (count >= SECTION_LIMITS[section]) {
    throw AppError.conflict(
      'LIMIT_REACHED',
      `You can have at most ${SECTION_LIMITS[section]} items in ${section}`,
    );
  }

  // New items go to the end unless the client picked a position.
  let order: number | undefined;
  if (input.order === undefined) {
    const { _max } = await delegate.aggregate({ where: { profileId }, _max: { order: true } });
    order = (_max.order ?? -1) + 1;
  }

  return delegate.create({
    data: { ...input, ...(order !== undefined && { order }), profileId },
    omit,
  });
}

export function updateItem(section: Section, profileId: string, id: string, input: Row) {
  return orNotFound(
    delegates[section].update({ where: { id, profileId }, data: input, omit }),
    notFound,
  );
}

export async function deleteItem(section: Section, profileId: string, id: string) {
  await orNotFound(delegates[section].delete({ where: { id, profileId } }), notFound);
}

// `ids` is the new order. It must list every item in the section exactly once, which also
// guarantees it can only contain the caller's own records.
export async function reorderItems(section: Section, profileId: string, ids: string[]) {
  const delegate = delegates[section];

  const current = await delegate.findMany({ where: { profileId }, select: { id: true } });
  const currentIds = new Set(current.map((row) => row.id));
  if (ids.length !== currentIds.size || !ids.every((id) => currentIds.has(id))) {
    throw new AppError(
      400,
      'INVALID_REORDER',
      `ids must list every item in ${section} exactly once`,
    );
  }

  // One transaction, so a failure part-way cannot leave a half-reordered list.
  await prisma.$transaction(
    ids.map(
      (id, order) =>
        delegate.update({
          where: { id, profileId },
          data: { order },
          select: { id: true },
        }) as unknown as Prisma.PrismaPromise<unknown>,
    ),
  );

  return listItems(section, profileId);
}
