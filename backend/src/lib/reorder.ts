import { AppError } from './errors';

// A new order is `ids`, and it must list every current item exactly once: that is what stops a
// client from leaving an item out, repeating one, or naming a record that is not theirs.
export function assertExactIds(
  ids: readonly string[],
  current: readonly { id: string }[],
  message: string,
) {
  const known = new Set(current.map((item) => item.id));
  if (
    ids.length !== known.size ||
    new Set(ids).size !== ids.length ||
    !ids.every((id) => known.has(id))
  ) {
    throw new AppError(400, 'INVALID_REORDER', message);
  }
}
