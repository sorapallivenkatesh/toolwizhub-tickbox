/* main.js — entry point. Wires chrome events to actions and owns render().
   Boundaries: config = data, core = pure logic + storage, ui = DOM.
   This file is the only place those layers meet. */

import { state, load, save, activeList } from "./core/store.js";
import { newList, reorder as reorderItems } from "./core/model.js";
import { encodeList, readShareHash } from "./core/share.js";
import { EMOJIS } from "./config/templates.js";

import { $, toast, copyText } from "./ui/dom.js";
import { renderSidebar } from "./ui/sidebar.js";
import { renderBoard } from "./ui/board.js";
import { celebrate, prefersReducedMotion } from "./ui/confetti.js";
import { initModals, openTemplates, openShare } from "./ui/modals.js";

const now = () => Date.now();

/* ── Render ────────────────────────────────────────── */
function render() {
  if (state.lists.length && !activeList()) state.activeId = state.lists[0].id;
  renderSidebar(state, selectList);
  updateTopbar();
  renderBoard(activeList(), actions);
}

/** Update sidebar pills + topbar without re-rendering the board (keeps focus). */
function refreshChrome() {
  renderSidebar(state, selectList);
  updateTopbar();
}

function updateTopbar() {
  const list = activeList();
  const title = $("#topbar-title");
  const listActions = $("#list-actions");
  if (!state.lists.length || !list) {
    title.textContent = "Tickbox";
    listActions.hidden = true;
  } else {
    title.textContent = `${list.emoji} ${list.name}`;
    listActions.hidden = false;
  }
}

/* ── Actions (injected into the board) ─────────────── */
const actions = {
  persist: save,
  rerender: render,
  refreshChrome,
  newList: createListFlow,
  openTemplates: openTemplatesFlow,

  toggle(item) {
    const list = activeList();
    item.done = !item.done;
    save();
    const allDone = list.items.length > 0 && list.items.every((i) => i.done);
    render();
    if (item.done && allDone) {
      if (prefersReducedMotion()) toast("List complete! 🎉");
      else celebrate();
    }
  },

  reorder(dragId, afterId) {
    reorderItems(activeList(), dragId, afterId);
    save();
    render();
  },

  cycleEmoji() {
    const list = activeList();
    const i = EMOJIS.indexOf(list.emoji);
    list.emoji = EMOJIS[(i + 1) % EMOJIS.length];
    save();
    const btn = $("#emoji-btn");
    if (btn) {
      btn.textContent = list.emoji;
      btn.classList.remove("wobble");
      void btn.offsetWidth;
      btn.classList.add("wobble");
    }
    refreshChrome();
  },
};

/* ── List CRUD flows ───────────────────────────────── */
function createListFlow() {
  const list = newList("Untitled list", EMOJIS[state.lists.length % EMOJIS.length] || "📝");
  list.createdAt = now();
  state.lists.unshift(list);
  state.activeId = list.id;
  save();
  render();
  setTimeout(() => { const ti = $("#title-input"); if (ti) { ti.focus(); ti.select(); } }, 60);
}

function selectList(id) {
  state.activeId = id;
  save();
  render();
  closeSidebar();
}

function deleteActiveList() {
  const list = activeList();
  if (!list) return;
  if (!confirm(`Delete “${list.name}”? This can't be undone.`)) return;
  state.lists = state.lists.filter((l) => l.id !== list.id);
  state.activeId = state.lists[0] ? state.lists[0].id : null;
  save();
  render();
  toast("List deleted");
}

function renameActiveList() {
  const ti = $("#title-input");
  if (ti) { ti.focus(); ti.select(); }
}

function openTemplatesFlow() {
  openTemplates((t) => {
    const list = newList(t.name, t.emoji, t.items);
    list.createdAt = now();
    state.lists.unshift(list);
    state.activeId = list.id;
    save();
    render();
    toast(`Added “${t.name}” ✨`);
  });
}

/* ── Share & export ────────────────────────────────── */
function shareActiveList() {
  const list = activeList();
  if (!list) return;
  openShare(`${location.origin}${location.pathname}#list=${encodeList(list)}`);
}

function exportMarkdown() {
  const list = activeList();
  if (!list) return;
  let md = `# ${list.emoji} ${list.name}\n\n`;
  list.items.forEach((it) => { md += `- [${it.done ? "x" : " "}] ${it.text}\n`; });
  copyText(md.trim()).then((ok) => toast(ok ? "Copied as Markdown 📋" : "Couldn't copy"));
}

function checkIncomingShare() {
  const incoming = readShareHash(location.hash);
  if (incoming === undefined) return; // no #list= present
  history.replaceState(null, "", location.pathname); // clean the URL
  if (!incoming) { toast("That shared link looked broken 😕"); return; }
  incoming.createdAt = now();
  state.lists.unshift(incoming);
  state.activeId = incoming.id;
  save();
  toast(`Imported “${incoming.name}” 🎁`);
}

/* ── Mobile sidebar ────────────────────────────────── */
const app = $("#app");
function openSidebar() {
  app.classList.add("sidebar-open");
  if (!$(".scrim")) {
    const s = document.createElement("div");
    s.className = "scrim";
    s.addEventListener("click", closeSidebar);
    app.appendChild(s);
  }
}
function closeSidebar() { app.classList.remove("sidebar-open"); }

/* ── Wire chrome ───────────────────────────────────── */
$("#add-list-btn").addEventListener("click", createListFlow);
$("#templates-btn").addEventListener("click", openTemplatesFlow);
$("#menu-btn").addEventListener("click", openSidebar);
$("#sidebar-close").addEventListener("click", closeSidebar);
$("#share-btn").addEventListener("click", shareActiveList);
$("#export-btn").addEventListener("click", exportMarkdown);
$("#rename-btn").addEventListener("click", renameActiveList);
$("#delete-list-btn").addEventListener("click", deleteActiveList);
$("#copy-share-btn").addEventListener("click", () => {
  copyText($("#share-url").value).then((ok) => {
    toast(ok ? "Link copied 🔗" : "Couldn't copy");
    if (ok) document.getElementById("share-modal").hidden = true;
  });
});

/* ── Boot ──────────────────────────────────────────── */
load();
initModals();
checkIncomingShare();
render();
