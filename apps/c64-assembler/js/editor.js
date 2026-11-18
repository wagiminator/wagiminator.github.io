/* C64 Assembler: the code editor. A textarea over a highlighted copy of the text, with
 * line numbers, breakpoints and marks for errors in the gutter. */
(function (global) {
  "use strict";

  var A = global.Asm6502;
  var MN = {}, ILL = {};
  Object.keys(A.OPS).forEach(function (k) { MN[k] = 1; });
  Object.keys(A.ILLEGAL).forEach(function (k) { ILL[k] = 1; });
  var TAB = 8;

  function esc(s) { return s.replace(/[&<>]/g, function (c) { return c === "&" ? "&amp;" : c === "<" ? "&lt;" : "&gt;"; }); }

  // ---------------------------------------------------------------- highlighting
  function highlightLine(line) {
    var out = "", i = 0, n = line.length, start = true, first = true, m;
    while (i < n) {
      var rest = line.slice(i), c = line[i];
      if (c === ";") { out += '<span class="t-cm">' + esc(rest) + "</span>"; break; }
      if (c === '"') {
        m = /^"(?:\\.|[^"\\])*"?/.exec(rest);
        out += '<span class="t-str">' + esc(m[0]) + "</span>"; i += m[0].length; first = false; continue;
      }
      if (c === "'" && (m = /^'(\\.|[^'])'/.exec(rest))) { out += '<span class="t-str">' + esc(m[0]) + "</span>"; i += m[0].length; first = false; continue; }
      if (c === " " || c === "\t") { m = /^[ \t]+/.exec(rest); out += m[0]; i += m[0].length; start = false; continue; }
      if (start && (c === "-" || c === "+") && (n === 1 || /[ \t]/.test(line[1]))) { out += '<span class="t-lbl">' + c + "</span>"; i++; start = false; continue; }
      if ((m = /^\.[A-Za-z]+/.exec(rest))) { out += '<span class="t-dir">' + m[0] + "</span>"; i += m[0].length; first = false; start = false; continue; }
      if ((m = /^(\$[0-9a-fA-F]+|%[01]+|0x[0-9a-fA-F]+|[0-9]+)/.exec(rest))) { out += '<span class="t-num">' + m[0] + "</span>"; i += m[0].length; first = false; start = false; continue; }
      if ((m = /^[A-Za-z_@][\w.]*:?/.exec(rest))) {
        var w = m[0], lw = w.toLowerCase(), cls;
        if (start) cls = MN[lw] || (ILL[lw] && !/:$/.test(w)) ? (MN[lw] ? "t-op" : "t-ill") : "t-lbl";
        else if (first && (MN[lw] || ILL[lw])) cls = MN[lw] ? "t-op" : "t-ill";
        else if (first && /^\s/.test(line)) cls = "t-mac";
        else if (/^[axy]$/i.test(w)) cls = "t-reg";
        else cls = "t-id";
        if (start && /:$/.test(w)) cls = "t-lbl";
        out += '<span class="' + cls + '">' + esc(w) + "</span>";
        i += w.length; start = false;
        if (cls !== "t-lbl") first = false;
        continue;
      }
      out += esc(c); i++; start = false;
      if (c !== "*" && c !== "=") first = false;
    }
    return out;
  }

  // ---------------------------------------------------------------- the editor
  function Editor(root, opts) {
    this.opts = opts || {};
    this.root = root;
    root.classList.add("ed");
    root.innerHTML = '<div class="ed-scroll"><div class="ed-gutter" aria-hidden="true"></div>' +
      '<div class="ed-code"><pre class="ed-hl" aria-hidden="true"></pre>' +
      '<textarea class="ed-ta" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" wrap="off" aria-label="Source code"></textarea></div></div>';
    this.scroll = root.querySelector(".ed-scroll");
    this.gutter = root.querySelector(".ed-gutter");
    this.hl = root.querySelector(".ed-hl");
    this.ta = root.querySelector(".ed-ta");
    this.marks = { errors: {}, warnings: {}, breaks: {}, current: -1 };
    this.lineCount = 0;
    var self = this, pending = false;
    this.ta.addEventListener("input", function () {
      if (!pending) { pending = true; requestAnimationFrame(function () { pending = false; self.render(); }); }
      if (self.opts.onChange) self.opts.onChange();
    });
    this.ta.addEventListener("keydown", function (e) { self.key(e); });
    ["keyup", "click", "select"].forEach(function (ev) { self.ta.addEventListener(ev, function () { self.caret(); }); });
    this.gutter.addEventListener("click", function (e) {
      var el = e.target.closest("[data-l]");
      if (el && self.opts.onGutter) self.opts.onGutter(+el.getAttribute("data-l"));
    });
  }
  var P = Editor.prototype;

  P.setText = function (t) {
    this.ta.value = t;
    this.ta.selectionStart = this.ta.selectionEnd = 0;
    this.scroll.scrollTop = 0; this.scroll.scrollLeft = 0;
    this.render();
  };
  P.getText = function () { return this.ta.value; };
  P.setReadOnly = function (ro) { this.ta.readOnly = !!ro; };
  P.render = function () {
    var text = this.ta.value, lines = text.split("\n"), html = "", i;
    for (i = 0; i < lines.length; i++) html += highlightLine(lines[i]) + "\n";
    this.hl.innerHTML = html;
    this.lineCount = lines.length;
    // the textarea grows with the text, so the outer box scrolls both together
    var longest = 0;
    for (i = 0; i < lines.length; i++) if (lines[i].length > longest) longest = lines[i].length;
    this.ta.style.height = (lines.length + 1) * this.lineHeight() + 16 + "px";
    this.ta.style.width = "calc(" + (longest + 4) + "ch + 24px)";
    this.renderGutter();
  };
  P.lineHeight = function () {
    if (!this.lh) { var cs = getComputedStyle(this.ta); this.lh = parseFloat(cs.lineHeight) || 20; }
    return this.lh;
  };
  P.renderGutter = function () {
    var g = "", mk = this.marks;
    for (var i = 1; i <= this.lineCount; i++) {
      var cls = "gl", title = "";
      if (mk.errors[i]) { cls += " err"; title = mk.errors[i]; }
      else if (mk.warnings[i]) { cls += " warn"; title = mk.warnings[i]; }
      if (mk.breaks[i]) cls += " bp";
      if (mk.current === i) cls += " cur";
      g += '<div class="' + cls + '" data-l="' + i + '"' + (title ? ' title="' + esc(title).replace(/"/g, "&quot;") + '"' : "") + ">" + i + "</div>";
    }
    this.gutter.innerHTML = g;
    this.hl.querySelectorAll(".cur-line").forEach(function (e) { e.remove(); });
    if (mk.current > 0) {
      var bar = document.createElement("div");
      bar.className = "cur-line"; bar.style.top = (mk.current - 1) * this.lineHeight() + 8 + "px";
      this.hl.appendChild(bar);
    }
  };
  P.setMarks = function (m) {
    Object.assign(this.marks, m);
    this.renderGutter();
  };

  // ---------------------------------------------------------------- caret and lines
  P.caret = function () {
    var v = this.ta.value, p = this.ta.selectionStart, before = v.slice(0, p);
    var line = before.split("\n").length, col = p - before.lastIndexOf("\n");
    if (this.opts.onCaret) this.opts.onCaret(line, col);
  };
  P.lineStart = function (n) {
    var v = this.ta.value, pos = 0;
    for (var i = 1; i < n; i++) { var k = v.indexOf("\n", pos); if (k < 0) return v.length; pos = k + 1; }
    return pos;
  };
  P.gotoLine = function (n, focus) {
    var s = this.lineStart(n), e = this.ta.value.indexOf("\n", s);
    if (e < 0) e = this.ta.value.length;
    if (focus !== false) this.ta.focus({ preventScroll: true });
    this.ta.setSelectionRange(s, s);
    this.showLine(n);
    this.caret();
  };
  P.showLine = function (n) {
    var lh = this.lineHeight(), y = (n - 1) * lh + 8, sc = this.scroll;
    if (y < sc.scrollTop + lh || y > sc.scrollTop + sc.clientHeight - 2 * lh) sc.scrollTop = Math.max(0, y - sc.clientHeight / 3);
  };
  P.focus = function () { this.ta.focus(); };

  // edit through the browser, so undo keeps working
  P.replace = function (start, end, text, selStart, selEnd) {
    var ta = this.ta;
    ta.focus();
    ta.setSelectionRange(start, end);
    if (!document.execCommand || !document.execCommand("insertText", false, text)) {
      ta.setRangeText(text, start, end, "end");
      ta.dispatchEvent(new Event("input"));
    }
    if (selStart != null) ta.setSelectionRange(selStart, selEnd != null ? selEnd : selStart);
  };

  P.key = function (e) {
    var ta = this.ta, v = ta.value, s = ta.selectionStart, en = ta.selectionEnd;
    if (ta.readOnly) return;
    var ls = v.lastIndexOf("\n", s - 1) + 1;
    if (e.key === "Tab" && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      var multi = v.slice(s, en).indexOf("\n") >= 0;
      if (!multi && !e.shiftKey) {
        var col = s - ls, pad = TAB - (col % TAB);
        this.replace(s, en, " ".repeat(pad));
        return;
      }
      // indent or outdent the lines of the selection
      var le = v.indexOf("\n", en - (en > s && v[en - 1] === "\n" ? 1 : 0)); if (le < 0) le = v.length;
      var block = v.slice(ls, le).split("\n").map(function (l) {
        if (e.shiftKey) return l.replace(/^( {1,8}|\t)/, "");
        return " ".repeat(TAB) + l;
      }).join("\n");
      this.replace(ls, le, block, ls, ls + block.length);
      return;
    }
    if (e.key === "Enter" && !e.ctrlKey && !e.metaKey && !e.altKey) {
      // keep the indentation; after a label line start at the instruction column
      var cur = v.slice(ls, s), ind = /^[ \t]*/.exec(cur)[0];
      if (!ind && /^[A-Za-z_@][\w]*:?\s*$/.test(cur)) ind = " ".repeat(TAB);
      else if (!ind && /^[A-Za-z_@][\w]*:?\s+\S/.test(cur)) ind = " ".repeat(TAB);
      e.preventDefault();
      this.replace(s, en, "\n" + ind);
      return;
    }
    if ((e.ctrlKey || e.metaKey) && (e.key === "/" || e.code === "Slash" || e.key === "#")) {
      e.preventDefault();
      var le2 = v.indexOf("\n", Math.max(s, en - 1)); if (le2 < 0) le2 = v.length;
      var lines = v.slice(ls, le2).split("\n");
      var allC = lines.every(function (l) { return /^\s*;/.test(l) || !l.trim(); });
      var out = lines.map(function (l) { return allC ? l.replace(/^(\s*);\s?/, "$1") : (l.trim() ? "; " + l : l); }).join("\n");
      this.replace(ls, le2, out, ls, ls + out.length);
      return;
    }
  };

  global.CodeEditor = Editor;
  global.CodeEditor.highlightLine = highlightLine;
})(window);
