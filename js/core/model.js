/* core/model.js — PURE domain logic. No DOM, no storage, no globals.
   Independently testable in Node. */

/** Collision-resistant id. */
export function uid() {
  return "id-" + Math.random().toString(36).slice(2, 9) + "-" + (performance.now() | 0);
}

/** Build an item from a string or a {text, done} shape. */
export function newItem(input) {
  return typeof input === "string"
    ? { id: uid(), text: input, done: false }
    : { id: uid(), text: input.text, done: !!input.done };
}

/** Build a list. `items` may be strings or {text, done} objects. */
export function newList(name = "Untitled list", emoji = "📝", items = []) {
  return {
    id: uid(),
    name,
    emoji,
    items: items.map(newItem),
    createdAt: 0, // stamped by the caller if needed; kept deterministic for testing
  };
}

/** Progress summary for a list. */
export function progress(list) {
  const total = list.items.length;
  const done = list.items.filter((i) => i.done).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  return { total, done, pct, complete: total > 0 && done === total };
}

/**
 * Move item `dragId` so it sits before `afterId`.
 * When `afterId` is null the item is dropped at the end of the OPEN section
 * (i.e. just before the first completed item). Mutates `list.items`.
 */
export function reorder(list, dragId, afterId) {
  const items = list.items;
  const from = items.findIndex((i) => i.id === dragId);
  if (from < 0) return;
  const [moved] = items.splice(from, 1);

  if (afterId == null) {
    const firstDone = items.findIndex((i) => i.done);
    if (firstDone < 0) items.push(moved);
    else items.splice(firstDone, 0, moved);
  } else {
    const to = items.findIndex((i) => i.id === afterId);
    items.splice(to < 0 ? items.length : to, 0, moved);
  }
}
