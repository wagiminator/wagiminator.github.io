/* C64 Cartridge Builder: user interface (image layout in cartgen.js) */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const EPROMS = [
    { kb: 64, chip: "27C512", board: "64k/256k cartridge" },
    { kb: 128, chip: "27C010", board: "other Magic Desk boards", note: "Not listed for the cartridges in the C64 Collection." },
    { kb: 256, chip: "27C020", board: "64k/256k cartridge" },
    { kb: 512, chip: "27C040", board: "512k cartridge" },
    { kb: 1024, chip: "27C080", board: "other Magic Desk boards", note: "Not listed for the cartridges in the C64 Collection; VICE supports Magic Desk up to 1 MB." },
  ];
  // Function keys that select menus 1-8 (menu.asm: menu index = PETSCII code - $85)
  const FKEYS = ["F1", "F3", "F5", "F7", "F2", "F4", "F6", "F8"];
  const COLORS = ["Black", "White", "Red", "Cyan", "Purple", "Green", "Blue", "Yellow", "Orange", "Brown", "Light red", "Dark grey", "Grey", "Light green", "Light blue", "Light grey"];
  const KEYS = "1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const SEG_COLORS = ["#56ac4d", "#edc84a", "#75cec8", "#c46c71", "#a9d98f", "#8e83e0", "#d79a5a", "#c27fcf"];

  const state = { sizeKB: 64, menus: [], nextId: 1, result: null };
  const newMenu = (title) => ({ id: state.nextId++, title: title || "", spacing: false, items: [] });
  state.menus.push(newMenu("My cartridge"));

  const hex4 = (v) => "$" + v.toString(16).toUpperCase().padStart(4, "0");
  const allItems = () => state.menus.flatMap((m) => m.items);

  // Keep only characters the menu can show
  const clean = (text, max) => [...text].filter((c) => CART.isValidChar(c)).slice(0, max).join("");

  /* ---------- EPROM size ---------- */

  const sizes = $("sizes");
  for (const e of EPROMS) {
    const label = document.createElement("label");
    label.className = "size";
    label.innerHTML = `<input type="radio" name="size" value="${e.kb}"${e.kb === state.sizeKB ? " checked" : ""}><strong>${e.kb === 1024 ? "1 MB" : e.kb + " KB"}</strong><span>${e.chip}</span><span>${e.board}</span>`;
    if (e.note) label.title = e.note;
    label.querySelector("input").addEventListener("change", () => { state.sizeKB = e.kb; update(); });
    sizes.append(label);
  }

  /* ---------- Adding programs ---------- */

  // PRG or PC64 (.P00) file -> { name, prg }
  function readProgram(fileName, bytes) {
    let name = fileName.replace(/\.[^.]+$/, "").replace(/_/g, " ");
    let prg = bytes;
    if (bytes.length > 26 && String.fromCharCode(...bytes.subarray(0, 7)) === "C64File") {
      const raw = bytes.subarray(8, 24);
      const end = raw.indexOf(0);
      name = String.fromCharCode(...(end < 0 ? raw : raw.subarray(0, end))).toLowerCase();
      prg = bytes.subarray(26);
    }
    if (prg.length < 3) throw new Error(`“${fileName}” is too short to be a program.`);
    name = clean(name, 31).trim();
    name = name.charAt(0).toUpperCase() + name.slice(1);
    return { name: name || "Program", prg: new Uint8Array(prg) };
  }

  async function addFiles(files, menu) {
    const target = menu || state.menus[state.menus.length - 1];
    const problems = [];
    for (const f of files) {
      try {
        const { name, prg } = readProgram(f.name, new Uint8Array(await f.arrayBuffer()));
        const load = prg[0] | (prg[1] << 8);
        target.items.push({ id: state.nextId++, fileName: f.name, name, prg, load, len: prg.length - 2, run: "" });
      } catch (err) {
        problems.push(err.message);
      }
    }
    renderMenus();
    update(problems);
  }

  $("btn-add").addEventListener("click", () => $("file-input").click());
  $("file-input").addEventListener("change", (ev) => { addFiles([...ev.target.files]); ev.target.value = ""; });
  const isFileDrag = (ev) => ev.dataTransfer && [...ev.dataTransfer.types].includes("Files");
  let fileDepth = 0;
  window.addEventListener("dragenter", (ev) => { if (isFileDrag(ev)) { fileDepth++; document.body.classList.add("dragging"); } });
  window.addEventListener("dragleave", (ev) => { if (isFileDrag(ev) && --fileDepth <= 0) { fileDepth = 0; document.body.classList.remove("dragging"); } });
  window.addEventListener("dragover", (ev) => { if (isFileDrag(ev)) ev.preventDefault(); });
  window.addEventListener("drop", (ev) => {
    if (!isFileDrag(ev)) return;
    ev.preventDefault();
    fileDepth = 0;
    document.body.classList.remove("dragging");
    const menuEl = ev.target.closest && ev.target.closest(".menu");
    const menu = menuEl ? state.menus.find((m) => m.id === Number(menuEl.dataset.id)) : null;
    addFiles([...ev.dataTransfer.files], menu);
  });

  $("btn-add-menu").addEventListener("click", () => {
    if (state.menus.length >= CART.MAX_MENUS) return;
    state.menus.push(newMenu(`Menu ${state.menus.length + 1}`));
    renderMenus();
    update();
    const inputs = document.querySelectorAll(".menu-head input[type=text]");
    inputs[inputs.length - 1].focus();
  });

  /* ---------- Program list ---------- */

  function renderMenus() {
    const box = $("menus");
    box.textContent = "";
    const multi = state.menus.length > 1;
    state.menus.forEach((m, mi) => {
      const sec = document.createElement("section");
      sec.className = "menu";
      sec.dataset.id = m.id;

      const head = document.createElement("div");
      head.className = "menu-head";
      const lab = document.createElement("label");
      lab.className = "menu-label";
      lab.textContent = multi ? `Menu ${mi + 1} (${FKEYS[mi]})` : "Menu title";
      const title = document.createElement("input");
      title.type = "text";
      title.maxLength = 40;
      title.value = m.title;
      title.placeholder = "Title shown above the menu";
      title.id = `menu-title-${m.id}`;
      lab.htmlFor = title.id;
      title.addEventListener("input", () => { const c = clean(title.value, 40); if (c !== title.value) title.value = c; m.title = c; update(); });
      const sp = document.createElement("label");
      sp.className = "choice";
      sp.innerHTML = `<input type="checkbox"${m.spacing ? " checked" : ""}> Empty line between entries`;
      sp.querySelector("input").addEventListener("change", (ev) => { m.spacing = ev.target.checked; update(); });
      head.append(lab, title, sp);
      if (multi) {
        const del = document.createElement("button");
        del.type = "button";
        del.className = "icon-btn remove";
        del.title = m.items.length ? "Only empty menus can be removed" : "Remove this menu";
        del.setAttribute("aria-label", "Remove this menu");
        del.textContent = "✕";
        del.disabled = m.items.length > 0;
        del.addEventListener("click", () => { state.menus.splice(mi, 1); renderMenus(); update(); });
        head.append(del);
      }
      sec.append(head);

      if (!m.items.length) {
        const p = document.createElement("p");
        p.className = "menu-empty";
        p.textContent = multi ? "No programs yet. Drop files here or drag entries from another menu." : "No programs yet.";
        sec.append(p);
      }
      const ul = document.createElement("ol");
      ul.className = "items";
      m.items.forEach((it, ii) => ul.append(renderItem(m, mi, it, ii)));
      sec.append(ul);
      const direct = allItems().length === 1 && $("opt-direct").checked;
      if (m.items.length && !direct) {
        const basic = document.createElement("p");
        basic.className = "basic-row";
        basic.innerHTML = `<span class="key">←</span><span>Basic</span><span class="basic-note">always the last entry: leaves the menu and starts BASIC</span>`;
        sec.append(basic);
      }
      box.append(sec);
    });
    $("btn-add-menu").disabled = state.menus.length >= CART.MAX_MENUS;
    $("order-hint").hidden = allItems().length < 2;
    $("drop").hidden = allItems().length > 0;
    wireDrag();
  }

  function renderItem(m, mi, it, ii) {
    const li = document.createElement("li");
    li.className = "item";
    li.draggable = true;
    li.dataset.menu = m.id;
    li.dataset.item = it.id;

    const grip = document.createElement("span");
    grip.className = "grip";
    grip.textContent = "⠿";
    grip.setAttribute("aria-hidden", "true");

    const key = document.createElement("span");
    key.className = "key";
    key.textContent = KEYS[ii] || "–";
    key.title = "Key that starts this program in the menu";

    const name = document.createElement("input");
    name.type = "text";
    name.maxLength = 31;
    name.value = it.name;
    name.setAttribute("aria-label", `Menu name of ${it.fileName}`);
    name.addEventListener("input", () => { const c = clean(name.value, 31); if (c !== name.value) name.value = c; it.name = c; update(); });
    name.addEventListener("dragstart", (ev) => ev.preventDefault());

    const meta = document.createElement("div");
    meta.className = "meta";
    meta.innerHTML = `${hex4(it.load)}–${hex4(Math.min(0xffff, it.load + it.len - 1))}<br>${(it.len / 1024).toFixed(1)} KB, ${Math.ceil(it.len / 254)} blocks`;
    meta.title = it.fileName;

    const runWrap = document.createElement("label");
    runWrap.className = "run";
    const run = document.createElement("input");
    run.type = "text";
    run.value = it.run;
    run.placeholder = it.load === 0x0801 ? "RUN" : hex4(it.load);
    run.title = "Start address. Empty: RUN for BASIC programs, otherwise the load address. Enter $C000 or 49152.";
    run.setAttribute("aria-label", `Start address of ${it.name}`);
    run.addEventListener("input", () => { it.run = run.value.trim(); run.classList.toggle("invalid", parseRun(it.run) === null); update(); });
    run.classList.toggle("invalid", parseRun(it.run) === null);
    runWrap.append(run);

    const actions = document.createElement("div");
    actions.className = "actions";
    const btn = (label, text, fn, disabled) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "icon-btn";
      b.textContent = text;
      b.title = label;
      b.setAttribute("aria-label", `${label}: ${it.name}`);
      b.disabled = !!disabled;
      b.addEventListener("click", fn);
      actions.append(b);
      return b;
    };
    btn("Move up", "↑", () => move(m, ii, -1), mi === 0 && ii === 0);
    btn("Move down", "↓", () => move(m, ii, 1), mi === state.menus.length - 1 && ii === m.items.length - 1);
    btn("Remove", "✕", () => { m.items.splice(ii, 1); renderMenus(); update(); }).classList.add("remove");

    li.append(grip, key, name, meta, runWrap, actions);
    li.addEventListener("keydown", (ev) => {
      if (ev.altKey && (ev.key === "ArrowUp" || ev.key === "ArrowDown")) {
        ev.preventDefault();
        move(m, ii, ev.key === "ArrowUp" ? -1 : 1, true);
      }
    });
    return li;
  }

  // Move an entry; at the edge of a menu it moves into the neighbor menu
  function move(m, ii, d, keepFocus) {
    const mi = state.menus.indexOf(m);
    const [it] = m.items.splice(ii, 1);
    let target = m, pos = ii + d;
    if (pos < 0 && mi > 0) { target = state.menus[mi - 1]; pos = target.items.length; }
    else if (pos > m.items.length && mi < state.menus.length - 1) { target = state.menus[mi + 1]; pos = 0; }
    pos = Math.max(0, Math.min(pos, target.items.length));
    target.items.splice(pos, 0, it);
    renderMenus();
    update();
    if (keepFocus) {
      const row = document.querySelector(`.item[data-item="${it.id}"] input[type=text]`);
      if (row) row.focus();
    }
  }

  // Start address: "" = automatic, $hex, 0xhex or decimal
  function parseRun(text) {
    if (!text) return 0;
    const t = text.replace(/^\$/, "0x");
    const v = /^0x[0-9a-f]+$/i.test(t) ? parseInt(t, 16) : /^\d+$/.test(t) ? parseInt(t, 10) : NaN;
    return v >= 1 && v <= 0xffff ? v : null;
  }

  /* ---------- Drag and drop between and within menus ---------- */

  let dragItem = null;
  function wireDrag() {
    document.querySelectorAll(".item").forEach((li) => {
      li.addEventListener("dragstart", (ev) => {
        dragItem = Number(li.dataset.item);
        li.classList.add("dragging");
        ev.dataTransfer.effectAllowed = "move";
        ev.dataTransfer.setData("application/x-cart-item", String(dragItem));
      });
      li.addEventListener("dragend", () => { dragItem = null; clearMarks(); });
    });
    document.querySelectorAll(".menu").forEach((sec) => {
      sec.addEventListener("dragover", (ev) => {
        if (dragItem === null) return;
        ev.preventDefault();
        clearMarks();
        const li = ev.target.closest(".item");
        if (li) li.classList.add(after(ev, li) ? "drop-after" : "drop-before");
        else sec.classList.add("drop-target");
      });
      sec.addEventListener("drop", (ev) => {
        if (dragItem === null) return;
        ev.preventDefault();
        ev.stopPropagation();
        const li = ev.target.closest(".item");
        const from = state.menus.find((m) => m.items.some((x) => x.id === dragItem));
        const it = from.items.find((x) => x.id === dragItem);
        const to = state.menus.find((m) => m.id === Number(sec.dataset.id));
        from.items.splice(from.items.indexOf(it), 1);
        let pos = to.items.length;
        if (li && Number(li.dataset.item) !== it.id) {
          pos = to.items.findIndex((x) => x.id === Number(li.dataset.item)) + (after(ev, li) ? 1 : 0);
        }
        to.items.splice(Math.max(0, pos), 0, it);
        dragItem = null;
        renderMenus();
        update();
      });
    });
  }
  const after = (ev, el) => { const r = el.getBoundingClientRect(); return ev.clientY > r.top + r.height / 2; };
  const clearMarks = () => document.querySelectorAll(".drop-before, .drop-after, .drop-target, .dragging").forEach((el) => el.classList.remove("drop-before", "drop-after", "drop-target", "dragging"));

  /* ---------- Options ---------- */

  for (const id of ["opt-border", "opt-background", "opt-character"]) {
    const sel = $(id);
    COLORS.forEach((c, i) => { const o = document.createElement("option"); o.value = i; o.textContent = `${i} ${c}`; sel.append(o); });
  }
  $("opt-border").value = 14; $("opt-background").value = 6; $("opt-character").value = 14;
  for (const id of ["opt-wave", "opt-sound", "opt-border", "opt-background", "opt-character"]) $(id).addEventListener("change", () => update());
  $("opt-direct").addEventListener("change", () => { renderMenus(); update(); });
  $("opt-help").addEventListener("input", (ev) => { const c = clean(ev.target.value, 40); if (c !== ev.target.value) ev.target.value = c; update(); });

  /* ---------- Building ---------- */

  function options() {
    const single = allItems().length === 1 && $("opt-direct").checked;
    return {
      sizeKB: state.sizeKB,
      single,
      help: $("opt-help").value,
      wave: $("opt-wave").checked ? 1 : 0,
      sound: $("opt-sound").checked ? 1 : 0,
      border: Number($("opt-border").value),
      background: Number($("opt-background").value),
      character: Number($("opt-character").value),
      menus: state.menus.map((m) => ({
        title: m.title,
        spacing: m.spacing,
        items: m.items.map((it) => ({ id: it.id, name: it.name || it.fileName, prg: it.prg, run: parseRun(it.run) || 0 })),
      })),
    };
  }

  function update(problems) {
    const items = allItems();
    $("direct-wrap").hidden = items.length !== 1;
    const r = CART.build(options());
    state.result = r;
    const badRun = items.filter((it) => parseRun(it.run) === null);
    const errors = [...(problems || []), ...r.errors.filter((e) => items.length || !/at least one/.test(e))];
    for (const it of badRun) errors.push(`The start address of “${it.name}” is not valid. Use $0801 to $FFFF or a decimal number.`);
    const empty = state.menus.filter((m) => !m.items.length).length;
    const warnings = [...r.warnings];
    if (empty && items.length) warnings.push(`${empty === 1 ? "One menu is" : `${empty} menus are`} empty and will not be on the cartridge.`);

    // Messages
    const ul = $("messages");
    ul.textContent = "";
    const msg = (cls, text) => { const li = document.createElement("li"); li.className = cls; li.textContent = text; ul.append(li); };
    errors.forEach((e) => msg("error", e));
    warnings.forEach((w) => msg("warning", w));
    const ok = items.length && !errors.length;
    if (ok) msg("ok", items.length === 1 && options().single ? "Ready: the program starts as soon as the C64 is switched on." : `Ready: ${items.length} programs in ${state.menus.filter((m) => m.items.length).length > 1 ? "several menus" : "a menu"}.`);
    $("btn-bin").disabled = !ok;
    $("btn-crt").disabled = !ok;

    // Free space
    const size = state.sizeKB * 1024;
    const used = items.length ? r.length : 0;
    const free = size - used;
    $("free-kb").textContent = (Math.abs(free) / 1024).toFixed(free % 1024 && Math.abs(free) < 10240 ? 1 : 0);
    $("free-unit").textContent = free >= 0 ? "KB free" : "KB too much";
    $("free-kb").parentElement.classList.toggle("over", free < 0);
    const bar = $("bar");
    bar.textContent = "";
    const seg = (bytes, color, title) => {
      const s = document.createElement("span");
      s.style.width = `${Math.min(100, (bytes / Math.max(size, used)) * 100)}%`;
      s.style.background = color;
      s.title = title;
      bar.append(s);
    };
    if (items.length) {
      seg(r.menuSize, "var(--menu-seg)", `Menu and tables: ${r.menuSize} bytes`);
      r.layout.forEach((l, i) => seg(l.length, SEG_COLORS[i % SEG_COLORS.length], `${l.name}: ${l.length.toLocaleString("en")} bytes, bank ${l.bank}`));
    }
    const facts = $("space-facts");
    facts.textContent = "";
    const banks = size / CART.BANK;
    const row = (k, v) => { const dt = document.createElement("dt"); dt.textContent = k; const dd = document.createElement("dd"); dd.textContent = v; facts.append(dt, dd); };
    row("EPROM", `${state.sizeKB === 1024 ? "1 MB" : state.sizeKB + " KB"} (${EPROMS.find((e) => e.kb === state.sizeKB).chip})`);
    row("Used", `${used.toLocaleString("en")} bytes`);
    row("Free", free >= 0 ? `${free.toLocaleString("en")} bytes, ${Math.floor(free / 254)} blocks` : `${(-free).toLocaleString("en")} bytes too much`);
    row("Banks", `${Math.min(banks, Math.ceil(used / CART.BANK))} of ${banks} used`);
    if (items.length) row("Menu area", `${r.menuSize.toLocaleString("en")} of 8,192 bytes`);
    $("help-count").textContent = `(${$("opt-help").value.length}/40)`;

    renderPreview(r);

    // Default file name from the first menu title
    if (!$("out-name").dataset.touched) {
      const base = (state.menus[0].title || (items[0] && items[0].name) || "cartridge").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
      $("out-name").value = base || "cartridge";
    }
  }
  $("out-name").addEventListener("input", (ev) => { ev.target.dataset.touched = "1"; });

  /* ---------- Menu preview ---------- */

  let previewMenu = 0;
  function renderPreview(r) {
    const panel = $("preview-panel");
    const screens = r.screens || [];
    const single = options().single;
    panel.hidden = !allItems().length;
    if (panel.hidden) return;
    const tabs = $("preview-tabs");
    tabs.textContent = "";
    if (single) {
      $("preview-note").textContent = "There is no menu: the program starts as soon as the C64 is switched on.";
      $("preview").hidden = true;
      return;
    }
    $("preview").hidden = false;
    $("preview-note").textContent = "Close to what the C64 shows, drawn without the C64 character set and without the waving. Programs start with the key in front of their name; F-keys or RETURN switch between menus.";
    if (previewMenu >= screens.length) previewMenu = 0;
    if (screens.length > 1) {
      screens.forEach((sc, i) => {
        const b = document.createElement("button");
        b.type = "button";
        b.setAttribute("role", "tab");
        b.setAttribute("aria-selected", String(i === previewMenu));
        b.textContent = FKEYS[i];
        b.title = `Menu ${i + 1}${sc.title.trim() ? ": " + sc.title.trim() : ""}`;
        b.addEventListener("click", () => { previewMenu = i; renderPreview(state.result); });
        tabs.append(b);
      });
    }
    PREVIEW.draw($("preview"), screens[previewMenu], r.help);
  }
  // Redraw when the pixel font has loaded
  if (document.fonts) document.fonts.load("8px 'Press Start 2P'").then(() => { if (state.result) renderPreview(state.result); });

  function outName(ext) {
    const n = ($("out-name").value.trim() || "cartridge").replace(/\.(bin|crt)$/i, "");
    return `${n}.${ext}`;
  }
  function download(bytes, name) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([bytes], { type: "application/octet-stream" }));
    a.download = name;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  $("btn-bin").addEventListener("click", () => { if (state.result && state.result.bin) download(state.result.bin, outName("bin")); });
  $("btn-crt").addEventListener("click", () => {
    if (!state.result || !state.result.bin) return;
    const name = state.menus[0].title || (allItems()[0] && allItems()[0].name) || "MAGIC DESK";
    download(CART.toCRT(state.result.bin, name), outName("crt"));
  });

  renderMenus();
  update();
})();
