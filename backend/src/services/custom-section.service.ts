import {
  MAX_CUSTOM_ITEMS,
  MAX_CUSTOM_SECTIONS,
  type CustomItemInput,
  type CustomSectionInput,
} from '@parichay/shared';
import type { Prisma } from '../generated/prisma/client';
import { AppError } from '../lib/errors';
import { WAIT, lockProfile } from '../lib/locks';
import { prisma } from '../lib/prisma';
import { assertExactIds } from '../lib/reorder';
import { orNotFound } from '../lib/prisma-errors';
import { customItems } from '../lib/selects';
import { saveSectionConfig } from './section-layout.service';
import { deleteTranslationsFor } from './translation.service';
import { ERRORS } from '../lib/messages';

// User-made sections and their items. Ownership: a section is always looked up by
// (id, profileId), and an item by (id, sectionId) only after that. A record that belongs to
// someone else therefore looks exactly like one that does not exist (404).

const sectionSelect = {
  id: true,
  title: true,
  visible: true,
  order: true,
  items: customItems,
} satisfies Prisma.CustomSectionSelect;

const sectionNotFound = () => AppError.notFound(ERRORS.customSectionNotFound);
const itemNotFound = () => AppError.notFound(ERRORS.itemNotFound);

type Db = Prisma.TransactionClient | typeof prisma;

async function assertOwnSection(db: Db, profileId: string, id: string) {
  const section = await db.customSection.findFirst({
    where: { id, profileId },
    select: { id: true },
  });
  if (!section) throw sectionNotFound();
}

// Checks the section is the caller's and locks it in one query, so items added to it at the
// same time are counted one after another.
async function lockOwnSection(tx: Prisma.TransactionClient, profileId: string, id: string) {
  const rows = await tx.$queryRaw<
    unknown[]
  >`SELECT 1 FROM "CustomSection" WHERE "id" = ${id} AND "profileId" = ${profileId} FOR UPDATE`;
  if (rows.length === 0) throw sectionNotFound();
}

// ---- sections

export const listSections = (profileId: string) =>
  prisma.customSection.findMany({
    where: { profileId },
    select: sectionSelect,
    orderBy: [{ order: 'asc' }, { id: 'asc' }],
  });

// Also adds the section to the end of the page layout (the section config).
export function createSection(profileId: string, input: CustomSectionInput) {
  return prisma.$transaction(async (tx) => {
    await lockProfile(tx, profileId);
    const count = await tx.customSection.count({ where: { profileId } });
    if (count >= MAX_CUSTOM_SECTIONS) {
      throw AppError.conflict('LIMIT_REACHED', ERRORS.maxCustomSections(MAX_CUSTOM_SECTIONS));
    }
    const created = await tx.customSection.create({
      data: { profileId, title: input.title, order: count },
      select: { id: true },
    });
    const sections = await saveSectionConfig(tx, profileId);
    const section = await tx.customSection.findUniqueOrThrow({
      where: { id: created.id },
      select: sectionSelect,
    });
    return { section, sections };
  }, WAIT);
}

export function updateSection(profileId: string, id: string, input: CustomSectionInput) {
  return orNotFound(
    prisma.customSection.update({
      where: { id, profileId },
      data: { title: input.title },
      select: sectionSelect,
    }),
    sectionNotFound,
  );
}

// Deletes the section and its items (cascade), and removes it from the page layout.
export function deleteSection(profileId: string, id: string) {
  return prisma.$transaction(async (tx) => {
    const items = await tx.customSectionItem.findMany({
      where: { sectionId: id, section: { profileId } },
      select: { id: true },
    });
    const { count } = await tx.customSection.deleteMany({ where: { id, profileId } });
    if (count === 0) throw sectionNotFound();
    await deleteTranslationsFor(tx, profileId, 'customSection', [id]);
    await deleteTranslationsFor(
      tx,
      profileId,
      'customItem',
      items.map((item) => item.id),
    );
    return { sections: await saveSectionConfig(tx, profileId) };
  }, WAIT);
}

// ---- items

export async function listItems(profileId: string, sectionId: string) {
  await assertOwnSection(prisma, profileId, sectionId);
  return prisma.customSectionItem.findMany({ where: { sectionId }, ...customItems });
}

export async function getItem(profileId: string, sectionId: string, id: string) {
  await assertOwnSection(prisma, profileId, sectionId);
  const item = await prisma.customSectionItem.findFirst({
    where: { id, sectionId },
    omit: customItems.omit,
  });
  if (!item) throw itemNotFound();
  return item;
}

export function createItem(profileId: string, sectionId: string, input: CustomItemInput) {
  return prisma.$transaction(async (tx) => {
    await lockOwnSection(tx, profileId, sectionId);

    const { _count, _max } = await tx.customSectionItem.aggregate({
      where: { sectionId },
      _count: true,
      _max: { order: true },
    });
    if (_count >= MAX_CUSTOM_ITEMS) {
      throw AppError.conflict('LIMIT_REACHED', ERRORS.maxCustomItems(MAX_CUSTOM_ITEMS));
    }
    return tx.customSectionItem.create({
      data: { ...input, sectionId, order: (_max.order ?? -1) + 1 },
      omit: customItems.omit,
    });
  }, WAIT);
}

export async function updateItem(
  profileId: string,
  sectionId: string,
  id: string,
  input: CustomItemInput,
) {
  await assertOwnSection(prisma, profileId, sectionId);
  return orNotFound(
    prisma.customSectionItem.update({
      where: { id, sectionId },
      data: input,
      omit: customItems.omit,
    }),
    itemNotFound,
  );
}

export async function deleteItem(profileId: string, sectionId: string, id: string) {
  await assertOwnSection(prisma, profileId, sectionId);
  await prisma.$transaction(async (tx) => {
    await orNotFound(tx.customSectionItem.delete({ where: { id, sectionId } }), itemNotFound);
    await deleteTranslationsFor(tx, profileId, 'customItem', [id]);
  });
}

// `ids` is the new order. It must list every item in the section exactly once, which also
// guarantees it can only contain this section's own items.
export async function reorderItems(profileId: string, sectionId: string, ids: string[]) {
  await assertOwnSection(prisma, profileId, sectionId);

  const current = await prisma.customSectionItem.findMany({
    where: { sectionId },
    select: { id: true },
  });
  assertExactIds(ids, current, ERRORS.reorderCustomItems);

  await prisma.$transaction(
    ids.map((id, order) =>
      prisma.customSectionItem.update({
        where: { id, sectionId },
        data: { order },
        select: { id: true },
      }),
    ),
  );
  return listItems(profileId, sectionId);
}
