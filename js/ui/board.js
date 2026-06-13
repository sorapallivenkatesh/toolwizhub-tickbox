/* ui/board.js — renders the active list (header, progress, items, drag)
   and the welcome empty state. Mutates the in-memory model for inline
   edits, then delegates persistence/re-render to the injected actions. */

import { $, el } from "./dom.js";
import { newItem, progress } from "../core/model.js";

/**
 * @param {object|null} list   active list, or null for the welcome screen
 * @param {object} actions     { persist, rerender, refreshChrome, toggle, reorder, cycleEmoji, newList, openTemplates }
 */
export function renderBoard(list, actions) {
  const boardEl = $("#board");
  boardEl.innerHTML = "";

  if (!list) {
    boardEl.appendChild(welcome(actions));
    return;
  }

  const inner = el("div", "board__inner");
  inner.appendChild(header(list, actions));
  inner.appendChild(addForm(list, actions));

  const open = list.items.filter((i) => !i.done);
  const closed = list.items.filter((i) => i.done);

  const ul = el("ul", "items");
  open.forEach((it) => ul.appendChild(itemEl(it, list, actions)));
  inner.appendChild(ul);

  if (closed.length) {
    inner.appendChild(el("div", "done-divider", `Completed (${closed.length})`));
    const ulDone = el("ul", "items");
    closed.forEach((it) => ulDone.appendChild(itemEl(it, list, actions)));
    inner.appendChild(ulDone);
  }

  if (!list.items.length) {
    inner.appendChild(el("div", "list-empty", "Add your first item above ☝️"));
  }

  boardEl.appendChild(inner);
  enableDrag(ul, list, actions);

  if (!list.items.length && window.innerWidth > 760) {
    setTimeout(() => $("#add-input")?.focus(), 50);
  }
}

/* ── Header: emoji + title + progress ──────────────── */
function header(list, actions) {
  const { total, done, pct, complete } = progress(list);
  const head = el("div", "list-head", `
    <div class="list-head__top">
      <button class="emoji-btn" id="emoji-btn" title="Change emoji">${list.emoji}</button>
      <input class="list-title-input" id="title-input" value="" maxlength="80" aria-label="List name" />
    </div>
    <div class="progress">
      <div class="progress__row">
        <span class="progress__label">${complete ? "All done! 🎉" : total ? `${done} of ${total} done` : "Nothing here yet"}</span>
        <span class="progress__pct">${pct}%</span>
      </div>
      <div class="progress__track"><div class="progress__fill ${complete ? "is-complete" : ""}" style="width:${pct}%"></div></div>
    </div>`);

  head.querySelector("#title-input").value = list.name;
  head.querySelector("#emoji-btn").addEventListener("click", () => actions.cycleEmoji());

  const titleInput = head.querySelector("#title-input");
  titleInput.addEventListener("input", () => {
    list.name = titleInput.value || "Untitled list";
    actions.persist();
    actions.refreshChrome();
  });
  return head;
}

/* ── Add-item form ─────────────────────────────────── */
function addForm(list, actions) {
  const form = el("form", "add-item", `
    <input class="add-item__input" id="add-input" placeholder="Add something to do…" autocomplete="off" />
    <button class="add-item__btn" type="submit" aria-label="Add item">＋</button>`);
  const input = form.querySelector("#add-input");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    list.items.unshift(newItem(text));
    input.value = "";
    actions.persist();
    actions.rerender();
    $("#add-input")?.focus();
  });
  return form;
}

/* ── A single item row ─────────────────────────────── */
function itemEl(item, list, actions) {
  const li = el("li", "item" + (item.done ? " is-done" : ""), `
    <span class="item__grip" title="Drag to reorder">⠿</span>
    <button class="check" role="checkbox" aria-checked="${item.done}" aria-label="Toggle done"></button>
    <input class="item__text" value="" aria-label="Item text" />
    <button class="item__del" title="Delete" aria-label="Delete item">✕</button>`);
  li.dataset.id = item.id;
  if (!item.done) li.draggable = true;

  const textInput = li.querySelector(".item__text");
  textInput.value = item.text;

  li.querySelector(".check").addEventListener("click", () => actions.toggle(item));
  textInput.addEventListener("input", () => { item.text = textInput.value; actions.persist(); });
  textInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); textInput.blur(); }
  });
  li.querySelector(".item__del").addEventListener("click", () => {
    list.items = list.items.filter((i) => i.id !== item.id);
    li.style.opacity = "0";
    li.style.transform = "translateX(20px)";
    setTimeout(() => { actions.persist(); actions.rerender(); }, 160);
  });
  return li;
}

/* ── Welcome / empty state ─────────────────────────── */
function welcome(actions) {
  const e = el("div", "empty", `
    <div class="empty__art">✅</div>
    <div class="empty__title">Let's make a list</div>
    <div class="empty__text">Track project to-dos, things to pick up next, packing, groceries — anything. Check things off and watch the confetti fly. It all saves right here in your browser.</div>
    <div class="empty__actions">
      <button class="btn btn--primary" id="empty-new">＋ New list</button>
      <button class="btn" id="empty-template">✨ Use a template</button>
    </div>`);
  e.querySelector("#empty-new").addEventListener("click", actions.newList);
  e.querySelector("#empty-template").addEventListener("click", actions.openTemplates);
  return e;
}

/* ── Drag & drop reorder (open items only) ─────────── */
function enableDrag(ul, list, actions) {
  let dragId = null;

  ul.addEventListener("dragstart", (e) => {
    const li = e.target.closest(".item");
    if (!li) return;
    dragId = li.dataset.id;
    li.classList.add("is-dragging");
    e.dataTransfer.effectAllowed = "move";
  });
  ul.addEventListener("dragend", (e) => {
    e.target.closest(".item")?.classList.remove("is-dragging");
    ul.querySelectorAll(".drag-over").forEach((n) => n.classList.remove("drag-over"));
  });
  ul.addEventListener("dragover", (e) => {
    e.preventDefault();
    const after = afterElement(ul, e.clientY);
    ul.querySelectorAll(".drag-over").forEach((n) => n.classList.remove("drag-over"));
    if (after) after.classList.add("drag-over");
  });
  ul.addEventListener("drop", (e) => {
    e.preventDefault();
    if (!dragId) return;
    const after = afterElement(ul, e.clientY);
    actions.reorder(dragId, after ? after.dataset.id : null);
    dragId = null;
  });
}

function afterElement(ul, y) {
  const els = [...ul.querySelectorAll(".item:not(.is-dragging)")];
  return els.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) return { offset, element: child };
    return closest;
  }, { offset: -Infinity, element: null }).element;
}
