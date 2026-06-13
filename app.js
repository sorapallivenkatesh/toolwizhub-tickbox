/* ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
   Tickbox — playful, no-signup checklists.
   Vanilla JS, localStorage, zero dependencies.
   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ */
(() => {
  "use strict";

  const STORAGE_KEY = "tickbox:v1";
  const EMOJIS = ["✅","📝","🚀","🎯","📚","🛒","✈️","🎨","💡","🏠","💪","🎬","🍳","🌱","⭐","🔥","🧩","🎁","☕","🐢"];

  /* ── State ──────────────────────────────────────── */
  let state = { lists: [], activeId: null };

  const uid = () => "id-" + Math.random().toString(36).slice(2, 9) + "-" + (performance.now() | 0);

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) state = JSON.parse(raw);
    } catch (_) { /* corrupt storage — start fresh */ }
    if (!Array.isArray(state.lists)) state.lists = [];
  }

  let saveTimer = null;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {}
    }, 120);
  }

  const activeList = () => state.lists.find((l) => l.id === state.activeId) || null;

  function newList(name = "Untitled list", emoji = "📝", items = []) {
    return {
      id: uid(),
      name,
      emoji,
      items: items.map((it) =>
        typeof it === "string"
          ? { id: uid(), text: it, done: false }
          : { id: uid(), text: it.text, done: !!it.done }
      ),
      createdAt: Date.now(),
    };
  }

  /* ── DOM refs ───────────────────────────────────── */
  const $ = (sel) => document.querySelector(sel);
  const app          = $("#app");
  const listsEl      = $("#lists");
  const boardEl      = $("#board");
  const topbarTitle  = $("#topbar-title");
  const listActions  = $("#list-actions");

  /* ── Render: sidebar ────────────────────────────── */
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

  function renderSidebar() {
    listsEl.innerHTML = "";
    state.lists.forEach((list) => {
      const total = list.items.length;
      const done = list.items.filter((i) => i.done).length;
      const pct = total ? Math.round((done / total) * 100) : 0;

      const btn = document.createElement("button");
      btn.className = "list-pill" + (list.id === state.activeId ? " is-active" : "");
      btn.innerHTML = `
        <span class="list-pill__emoji">${list.emoji}</span>
        <span class="list-pill__body">
          <span class="list-pill__name"></span>
          <span class="list-pill__meta">${total ? `${done}/${total} done` : "empty"}</span>
        </span>
        ${ring(pct)}`;
      btn.querySelector(".list-pill__name").textContent = list.name;
      btn.addEventListener("click", () => { selectList(list.id); closeSidebar(); });
      listsEl.appendChild(btn);
    });
  }

  /* ── Render: board ──────────────────────────────── */
  function renderBoard() {
    const list = activeList();
    boardEl.innerHTML = "";

    if (!state.lists.length) { renderWelcome(); topbarTitle.textContent = "Tickbox"; listActions.hidden = true; return; }
    if (!list) { selectList(state.lists[0].id); return; }

    topbarTitle.textContent = `${list.emoji} ${list.name}`;
    listActions.hidden = false;

    const inner = document.createElement("div");
    inner.className = "board__inner";

    const total = list.items.length;
    const done = list.items.filter((i) => i.done).length;
    const pct = total ? Math.round((done / total) * 100) : 0;
    const complete = total > 0 && done === total;

    /* Header */
    const head = document.createElement("div");
    head.className = "list-head";
    head.innerHTML = `
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
      </div>`;
    head.querySelector("#title-input").value = list.name;
    inner.appendChild(head);

    head.querySelector("#emoji-btn").addEventListener("click", () => cycleEmoji(list));
    const titleInput = head.querySelector("#title-input");
    titleInput.addEventListener("input", () => { list.name = titleInput.value || "Untitled list"; save(); renderSidebar(); topbarTitle.textContent = `${list.emoji} ${list.name}`; });

    /* Add item */
    const add = document.createElement("form");
    add.className = "add-item";
    add.innerHTML = `
      <input class="add-item__input" id="add-input" placeholder="Add something to do…" autocomplete="off" />
      <button class="add-item__btn" type="submit" aria-label="Add item">＋</button>`;
    inner.appendChild(add);
    const addInput = add.querySelector("#add-input");
    add.addEventListener("submit", (e) => {
      e.preventDefault();
      const text = addInput.value.trim();
      if (!text) return;
      list.items.unshift({ id: uid(), text, done: false });
      addInput.value = "";
      save(); render();
      $("#add-input").focus();
    });

    /* Items — open first, completed below a divider */
    const open = list.items.filter((i) => !i.done);
    const closed = list.items.filter((i) => i.done);

    const ul = document.createElement("ul");
    ul.className = "items";
    open.forEach((it) => ul.appendChild(itemEl(it, list)));
    inner.appendChild(ul);

    if (closed.length) {
      const div = document.createElement("div");
      div.className = "done-divider";
      div.textContent = `Completed (${closed.length})`;
      inner.appendChild(div);
      const ulDone = document.createElement("ul");
      ulDone.className = "items";
      closed.forEach((it) => ulDone.appendChild(itemEl(it, list)));
      inner.appendChild(ulDone);
    }

    if (!total) {
      const e = document.createElement("div");
      e.className = "list-empty";
      e.textContent = "Add your first item above ☝️";
      inner.appendChild(e);
    }

    boardEl.appendChild(inner);
    enableDrag(ul, list);

    // focus the add box on desktop for new/empty lists
    if (!total && window.innerWidth > 760) setTimeout(() => addInput.focus(), 50);
  }

  function itemEl(item, list) {
    const li = document.createElement("li");
    li.className = "item" + (item.done ? " is-done" : "");
    li.dataset.id = item.id;
    if (!item.done) li.draggable = true;
    li.innerHTML = `
      <span class="item__grip" title="Drag to reorder">⠿</span>
      <button class="check" role="checkbox" aria-checked="${item.done}" aria-label="Toggle done"></button>
      <input class="item__text" value="" aria-label="Item text" />
      <button class="item__del" title="Delete" aria-label="Delete item">✕</button>`;

    const textInput = li.querySelector(".item__text");
    textInput.value = item.text;

    li.querySelector(".check").addEventListener("click", () => toggleItem(item, list, li));
    textInput.addEventListener("input", () => { item.text = textInput.value; save(); });
    textInput.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); textInput.blur(); } });
    li.querySelector(".item__del").addEventListener("click", () => {
      list.items = list.items.filter((i) => i.id !== item.id);
      li.style.opacity = "0";
      li.style.transform = "translateX(20px)";
      setTimeout(() => { save(); render(); }, 160);
    });
    return li;
  }

  function toggleItem(item, list, li) {
    item.done = !item.done;
    save();
    const wasAllDone = list.items.length > 0 && list.items.every((i) => i.done);
    render();
    if (item.done && wasAllDone) celebrate();
  }

  function cycleEmoji(list) {
    const i = EMOJIS.indexOf(list.emoji);
    list.emoji = EMOJIS[(i + 1) % EMOJIS.length];
    save();
    const btn = $("#emoji-btn");
    if (btn) { btn.textContent = list.emoji; btn.classList.remove("wobble"); void btn.offsetWidth; btn.classList.add("wobble"); }
    renderSidebar();
    topbarTitle.textContent = `${list.emoji} ${list.name}`;
  }

  /* ── Drag & drop reorder (open items only) ──────── */
  function enableDrag(ul, list) {
    let dragId = null;

    ul.addEventListener("dragstart", (e) => {
      const li = e.target.closest(".item");
      if (!li) return;
      dragId = li.dataset.id;
      li.classList.add("is-dragging");
      e.dataTransfer.effectAllowed = "move";
    });
    ul.addEventListener("dragend", (e) => {
      const li = e.target.closest(".item");
      if (li) li.classList.remove("is-dragging");
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
      const afterId = after ? after.dataset.id : null;
      reorder(list, dragId, afterId);
      dragId = null;
      save(); render();
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

  function reorder(list, dragId, afterId) {
    const items = list.items;
    const from = items.findIndex((i) => i.id === dragId);
    if (from < 0) return;
    const [moved] = items.splice(from, 1);
    if (afterId == null) {
      // dropped at the end of the open section → place before first completed item
      const firstDone = items.findIndex((i) => i.done);
      if (firstDone < 0) items.push(moved); else items.splice(firstDone, 0, moved);
    } else {
      const to = items.findIndex((i) => i.id === afterId);
      items.splice(to, 0, moved);
    }
  }

  /* ── Welcome / empty state ──────────────────────── */
  function renderWelcome() {
    const e = document.createElement("div");
    e.className = "empty";
    e.innerHTML = `
      <div class="empty__art">✅</div>
      <div class="empty__title">Let's make a list</div>
      <div class="empty__text">Track project to-dos, things to pick up next, packing, groceries — anything. Check things off and watch the confetti fly. It all saves right here in your browser.</div>
      <div class="empty__actions">
        <button class="btn btn--primary" id="empty-new">＋ New list</button>
        <button class="btn" id="empty-template">✨ Use a template</button>
      </div>`;
    boardEl.appendChild(e);
    e.querySelector("#empty-new").addEventListener("click", createListFlow);
    e.querySelector("#empty-template").addEventListener("click", openTemplates);
  }

  /* ── List CRUD flows ────────────────────────────── */
  function createListFlow() {
    const list = newList("Untitled list", EMOJIS[Math.floor(state.lists.length) % EMOJIS.length] || "📝");
    state.lists.unshift(list);
    state.activeId = list.id;
    save(); render();
    setTimeout(() => { const ti = $("#title-input"); if (ti) { ti.focus(); ti.select(); } }, 60);
  }

  function selectList(id) { state.activeId = id; save(); render(); }

  function deleteActiveList() {
    const list = activeList();
    if (!list) return;
    if (!confirm(`Delete “${list.name}”? This can't be undone.`)) return;
    state.lists = state.lists.filter((l) => l.id !== list.id);
    state.activeId = state.lists[0] ? state.lists[0].id : null;
    save(); render();
    toast("List deleted");
  }

  function renameActiveList() {
    const ti = $("#title-input");
    if (ti) { ti.focus(); ti.select(); }
  }

  /* ── Templates ──────────────────────────────────── */
  const TEMPLATES = [
    { emoji: "🚀", name: "New project setup", items: ["Create the repo","Set up README","Add license","Configure CI","Write first test","Deploy a hello world"] },
    { emoji: "🎯", name: "Projects to pick up", items: ["Idea A — sketch the scope","Idea B — research feasibility","Idea C — draft a landing page"] },
    { emoji: "✈️", name: "Trip packing", items: ["Passport / ID","Chargers & adapters","Toiletries","Meds","Headphones","Reusable water bottle"] },
    { emoji: "🛒", name: "Groceries", items: ["Milk","Eggs","Bread","Coffee","Fruit","Veggies"] },
    { emoji: "📚", name: "Reading list", items: ["Book one","Book two","That article I saved"] },
    { emoji: "💪", name: "Weekly habits", items: ["Move 30 min","Read a chapter","Inbox to zero","Plan the week","Call a friend"] },
  ];

  function openTemplates() {
    const grid = $("#template-grid");
    grid.innerHTML = "";
    TEMPLATES.forEach((t) => {
      const card = document.createElement("button");
      card.className = "template-card";
      card.innerHTML = `
        <div class="template-card__emoji">${t.emoji}</div>
        <div class="template-card__name"></div>
        <div class="template-card__count">${t.items.length} items</div>`;
      card.querySelector(".template-card__name").textContent = t.name;
      card.addEventListener("click", () => {
        const list = newList(t.name, t.emoji, t.items);
        state.lists.unshift(list);
        state.activeId = list.id;
        save(); closeModal($("#template-modal")); render();
        toast(`Added “${t.name}” ✨`);
      });
      grid.appendChild(card);
    });
    openModal($("#template-modal"));
  }

  /* ── Share via URL ──────────────────────────────── */
  function encodeList(list) {
    const payload = { n: list.name, e: list.emoji, i: list.items.map((it) => [it.text, it.done ? 1 : 0]) };
    const json = JSON.stringify(payload);
    // UTF-8 safe base64
    return btoa(unescape(encodeURIComponent(json)));
  }
  function decodeList(str) {
    try {
      const json = decodeURIComponent(escape(atob(str)));
      const p = JSON.parse(json);
      return newList(p.n || "Shared list", p.e || "📝", (p.i || []).map(([text, done]) => ({ text, done: !!done })));
    } catch (_) { return null; }
  }

  function shareActiveList() {
    const list = activeList();
    if (!list) return;
    const url = `${location.origin}${location.pathname}#list=${encodeList(list)}`;
    const input = $("#share-url");
    input.value = url;
    openModal($("#share-modal"));
    setTimeout(() => { input.focus(); input.select(); }, 60);
  }

  function checkIncomingShare() {
    const m = location.hash.match(/#list=(.+)$/);
    if (!m) return;
    const list = decodeList(m[1]);
    history.replaceState(null, "", location.pathname); // clean the URL
    if (!list) { toast("That shared link looked broken 😕"); return; }
    state.lists.unshift(list);
    state.activeId = list.id;
    save();
    toast(`Imported “${list.name}” 🎁`);
  }

  /* ── Export as Markdown ─────────────────────────── */
  function exportMarkdown() {
    const list = activeList();
    if (!list) return;
    let md = `# ${list.emoji} ${list.name}\n\n`;
    list.items.forEach((it) => { md += `- [${it.done ? "x" : " "}] ${it.text}\n`; });
    copyText(md.trim()).then((ok) => toast(ok ? "Copied as Markdown 📋" : "Couldn't copy"));
  }

  /* ── Clipboard helper ───────────────────────────── */
  async function copyText(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); return true; }
    } catch (_) {}
    try {
      const ta = document.createElement("textarea");
      ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch (_) { return false; }
  }

  /* ── Modal helpers ──────────────────────────────── */
  function openModal(m) { m.hidden = false; }
  function closeModal(m) { m.hidden = true; }
  document.querySelectorAll("[data-close]").forEach((el) =>
    el.addEventListener("click", () => closeModal(el.closest(".modal")))
  );
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") document.querySelectorAll(".modal:not([hidden])").forEach(closeModal);
  });

  /* ── Toast ──────────────────────────────────────── */
  let toastTimer = null;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg; t.hidden = false;
    void t.offsetWidth;
    t.classList.add("is-show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      t.classList.remove("is-show");
      setTimeout(() => { t.hidden = true; }, 300);
    }, 2200);
  }

  /* ── Sidebar (mobile) ───────────────────────────── */
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

  /* ── Confetti 🎉 ────────────────────────────────── */
  const canvas = $("#confetti-canvas");
  const ctx = canvas.getContext("2d");
  let pieces = [], rafId = null;

  function sizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr;
    canvas.style.width = innerWidth + "px"; canvas.style.height = innerHeight + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function celebrate() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { toast("List complete! 🎉"); return; }
    sizeCanvas();
    const colors = ["#7c5cff","#ff6fae","#25c685","#ffb648","#5fb8ff","#ff5d6c"];
    const n = 140;
    for (let k = 0; k < n; k++) {
      pieces.push({
        x: innerWidth / 2 + (Math.random() - 0.5) * 120,
        y: innerHeight / 3,
        vx: (Math.random() - 0.5) * 14,
        vy: Math.random() * -16 - 4,
        g: 0.32 + Math.random() * 0.18,
        size: 6 + Math.random() * 8,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.4,
        color: colors[(Math.random() * colors.length) | 0],
        shape: Math.random() < 0.5 ? "rect" : "circ",
        life: 0,
      });
    }
    if (!rafId) tick();
  }

  function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach((p) => {
      p.vy += p.g; p.x += p.vx; p.y += p.vy; p.vx *= 0.99; p.rot += p.vr; p.life++;
      ctx.save();
      ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.globalAlpha = Math.max(0, 1 - p.life / 160);
      ctx.fillStyle = p.color;
      if (p.shape === "rect") ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      else { ctx.beginPath(); ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
    });
    pieces = pieces.filter((p) => p.life < 170 && p.y < innerHeight + 40);
    if (pieces.length) rafId = requestAnimationFrame(tick);
    else { ctx.clearRect(0, 0, canvas.width, canvas.height); rafId = null; }
  }
  window.addEventListener("resize", () => { if (rafId) sizeCanvas(); });

  /* ── Wire up chrome ─────────────────────────────── */
  $("#add-list-btn").addEventListener("click", createListFlow);
  $("#templates-btn").addEventListener("click", openTemplates);
  $("#menu-btn").addEventListener("click", openSidebar);
  $("#sidebar-close").addEventListener("click", closeSidebar);
  $("#share-btn").addEventListener("click", shareActiveList);
  $("#export-btn").addEventListener("click", exportMarkdown);
  $("#rename-btn").addEventListener("click", renameActiveList);
  $("#delete-list-btn").addEventListener("click", deleteActiveList);
  $("#copy-share-btn").addEventListener("click", () => {
    copyText($("#share-url").value).then((ok) => { toast(ok ? "Link copied 🔗" : "Couldn't copy"); if (ok) closeModal($("#share-modal")); });
  });

  /* ── Boot ───────────────────────────────────────── */
  function render() { renderSidebar(); renderBoard(); }

  load();
  checkIncomingShare();
  render();
})();
