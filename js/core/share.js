/* core/share.js — encode/decode a list to/from a URL-safe string.
   PURE: the whole list lives in the link; nothing is sent to a server. */

import { newList } from "./model.js";

/** Compact a list to a UTF-8-safe base64 payload. */
export function encodeList(list) {
  const payload = {
    n: list.name,
    e: list.emoji,
    i: list.items.map((it) => [it.text, it.done ? 1 : 0]),
  };
  return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
}

/** Inverse of encodeList. Returns a fresh list, or null if the string is bad. */
export function decodeList(str) {
  try {
    const p = JSON.parse(decodeURIComponent(escape(atob(str))));
    return newList(
      p.n || "Shared list",
      p.e || "📝",
      (p.i || []).map(([text, done]) => ({ text, done: !!done }))
    );
  } catch (_) {
    return null;
  }
}

/** Read an incoming `#list=…` from the location hash (or null). */
export function readShareHash(hash) {
  const m = (hash || "").match(/#list=(.+)$/);
  return m ? decodeList(m[1]) : undefined; // undefined = no share present
}
