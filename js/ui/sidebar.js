/* ui/sidebar.js — renders the list of lists with progress rings. */

import { $, el } from "./dom.js";
import { progress } from "../core/model.js";

/** SVG progress ring markup for a given percentage. */
function ring(pct) {
  const r = 9, c = 2 * Math.PI * r;
  const off = c * (1 - pct / 100);
  const col = pct >= 100 ? "var(--green)" : "var(--brand)";
  return `<svg class="list-pill__ring" width="24" height="24" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="${r}" fill="none" stroke="var(--brand-soft)" stroke-width="3"/>
    <circle cx="12" cy="12" r="${r}" fill="none" stroke="${col}" stroke-width="3"
      stroke-linecap="round" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}"
      transform="rotate(-90 12 12)" style="transition:stroke-dashoffset .4s"/>
  </svg>`;
}

/**
 * @param {object} state
 * @param {(id:string)=>void} onSelect
 */
export function renderSidebar(state, onSelect) {
  const listsEl = $("#lists");
  listsEl.innerHTML = "";

  state.lists.forEach((list) => {
    const { total, done, pct } = progress(list);
    const btn = el("button", "list-pill" + (list.id === state.activeId ? " is-active" : ""), `
      <span class="list-pill__emoji">${list.emoji}</span>
      <span class="list-pill__body">
        <span class="list-pill__name"></span>
        <span class="list-pill__meta">${total ? `${done}/${total} done` : "empty"}</span>
      </span>
      ${ring(pct)}`);
    btn.querySelector(".list-pill__name").textContent = list.name;
    btn.addEventListener("click", () => onSelect(list.id));
    listsEl.appendChild(btn);
  });
}
