/* ui/modals.js — template picker + share dialog, plus generic open/close. */

import { $, $$, el } from "./dom.js";
import { TEMPLATES } from "../config/templates.js";

export function openModal(m) { m.hidden = false; }
export function closeModal(m) { m.hidden = true; }

/** Wire backdrop/✕ [data-close] buttons and Escape-to-close once at boot. */
export function initModals() {
  $$("[data-close]").forEach((node) =>
    node.addEventListener("click", () => closeModal(node.closest(".modal")))
  );
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") $$(".modal:not([hidden])").forEach(closeModal);
  });
}

/**
 * Show the template grid. Calls onPick(template) when one is chosen.
 */
export function openTemplates(onPick) {
  const grid = $("#template-grid");
  grid.innerHTML = "";
  TEMPLATES.forEach((t) => {
    const card = el("button", "template-card", `
      <div class="template-card__emoji">${t.emoji}</div>
      <div class="template-card__name"></div>
      <div class="template-card__count">${t.items.length} items</div>`);
    card.querySelector(".template-card__name").textContent = t.name;
    card.addEventListener("click", () => {
      closeModal($("#template-modal"));
      onPick(t);
    });
    grid.appendChild(card);
  });
  openModal($("#template-modal"));
}

/** Show the share dialog pre-filled with `url`. */
export function openShare(url) {
  const input = $("#share-url");
  input.value = url;
  openModal($("#share-modal"));
  setTimeout(() => { input.focus(); input.select(); }, 60);
}
