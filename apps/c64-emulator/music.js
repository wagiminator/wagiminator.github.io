/* C64 Emulator: music tools.
 * Record what the SID plays as a WAV file, or find the music routine of the running
 * program and save the tune as a PSID file (emu/sidrip.js).
 */
(function () {
  "use strict";

  var MAX_SECONDS = 600;
  var hex = function (v, n) { return ("000" + v.toString(16).toUpperCase()).slice(-n); };
  function time(s) { s = Math.floor(s); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }
  function kb(n) { return n < 1024 * 1024 ? (n / 1024).toFixed(1) + " KB" : (n / 1048576).toFixed(1) + " MB"; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  window.C64Music = function (host) {
    var open = false, c64 = null;
    var rec = null;              // { chunks: [Int16Array], n, rate, peak }
    var rip = null, ripRes = null, ripErr = "";

    var root = document.getElementById("music");
    root.innerHTML =
      '<div class="dbg-head">' +
        '<h2 id="mus-title">Music</h2>' +
        '<p class="dbg-state">Save the SID music of the running program.</p>' +
        '<button type="button" class="dbg-close" data-mact="close" aria-label="Close the music tools" title="Close the music tools">✕</button>' +
      '</div>' +
      '<div class="mus-grid">' +
        '<section class="dbg-pane mus-rec" aria-labelledby="mus-rec-h">' +
          '<div class="pane-head"><h3 id="mus-rec-h">Record as WAV</h3></div>' +
          '<p class="mus-text">Records what the SID plays, also with the sound switched off, and saves it as a WAV file when you stop. Up to 10 minutes.</p>' +
          '<div class="rec-row">' +
            '<button type="button" class="rec-btn" data-mact="rec" id="mus-rec-btn"><span class="rec-dot" aria-hidden="true"></span><span id="mus-rec-label">Record</span></button>' +
            '<div class="rec-info"><span class="rec-time" id="mus-time">0:00</span><span class="rec-size" id="mus-size"></span>' +
              '<div class="rec-meter" aria-hidden="true"><i id="mus-level"></i></div></div>' +
          '</div>' +
          '<p class="mus-note" id="mus-rec-note" role="status"></p>' +
        '</section>' +
        '<section class="dbg-pane mus-rip" aria-labelledby="mus-rip-h">' +
          '<div class="pane-head"><h3 id="mus-rip-h">Save as SID file</h3></div>' +
          '<p class="mus-text">Finds the music routine of the running program and saves it with its data as a PSID file for SID players, such as the SID Player on this site. The tune goes on from the moment of the search; other songs of the program are not included.</p>' +
          '<div class="rip-row"><button type="button" class="dbg-btn mus-primary" data-mact="rip" id="mus-rip-btn">Find the music</button>' +
            '<div class="rip-bar" aria-hidden="true"><i id="mus-rip-bar"></i></div></div>' +
          '<div id="mus-rip-out" class="rip-out" role="status"></div>' +
        '</section>' +
      '</div>';
    var $ = function (id) { return document.getElementById(id); };

    function attach(m) {
      if (rip) { rip.stop(); rip = null; ripErr = "The C64 was replaced; search again."; renderRip(); }
      c64 = m;
    }

    // ------------------------------------------------------------ WAV recording
    function samples(s) {
      if (!rec || !s.length) return;
      var out = new Int16Array(s.length), peak = rec.peak;
      for (var i = 0; i < s.length; i++) {
        var v = s[i] * 0.9;
        if (v > 1) v = 1; else if (v < -1) v = -1;
        out[i] = v * 32767;
        var a = v < 0 ? -v : v; if (a > peak) peak = a;
      }
      rec.peak = peak;
      rec.chunks.push(out); rec.n += out.length;
      if (rec.n >= rec.rate * MAX_SECONDS) stopRec("The recording reached 10 minutes and was saved.");
    }
    function startRec() {
      rec = { chunks: [], n: 0, rate: Math.round(c64.sid.sampleRate || 44100), peak: 0 };
      $("mus-rec-note").textContent = host.isRunning() ? "" : "The C64 is paused: the recording starts when it runs again.";
      renderRec();
    }
    function stopRec(msg) {
      var r = rec; rec = null;
      renderRec();
      if (!r || !r.n) { $("mus-rec-note").textContent = "Nothing was recorded."; return; }
      var bytes = 44 + r.n * 2, buf = new ArrayBuffer(bytes), dv = new DataView(buf), o = 0;
      function str(s) { for (var i = 0; i < s.length; i++) dv.setUint8(o++, s.charCodeAt(i)); }
      str("RIFF"); dv.setUint32(o, bytes - 8, true); o += 4; str("WAVE");
      str("fmt "); dv.setUint32(o, 16, true); o += 4; dv.setUint16(o, 1, true); o += 2; dv.setUint16(o, 1, true); o += 2;
      dv.setUint32(o, r.rate, true); o += 4; dv.setUint32(o, r.rate * 2, true); o += 4; dv.setUint16(o, 2, true); o += 2; dv.setUint16(o, 16, true); o += 2;
      str("data"); dv.setUint32(o, r.n * 2, true); o += 4;
      var pcm = new Int16Array(buf, 44);
      var at = 0; r.chunks.forEach(function (c) { pcm.set(c, at); at += c.length; });
      host.download(baseName() + ".wav", new Uint8Array(buf));
      $("mus-rec-note").textContent = msg || "Saved " + time(r.n / r.rate) + " as " + baseName() + ".wav (" + kb(bytes) + ").";
    }
    function renderRec() {
      var on = !!rec;
      $("mus-rec-btn").classList.toggle("on", on);
      $("mus-rec-btn").setAttribute("aria-pressed", on ? "true" : "false");
      $("mus-rec-label").textContent = on ? "Stop and save" : "Record";
      $("mus-time").textContent = time(on ? rec.n / rec.rate : 0);
      $("mus-size").textContent = on ? kb(44 + rec.n * 2) : "";
      $("mus-level").style.width = on ? Math.round(Math.min(1, rec.peak) * 100) + "%" : "0";
      if (on) rec.peak *= 0.6;
    }
    function baseName() {
      var n = (host.fileName() || "c64-music").replace(/\.[^.]+$/, "").replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "-");
      return n || "c64-music";
    }

    // ------------------------------------------------------------ SID ripping
    function startRip() {
      if (rip) return;
      ripRes = null; ripErr = "";
      rip = window.C64SidRip.start(c64, function (res) {
        rip = null;
        if (res.error) ripErr = res.error; else ripRes = res;
        renderRip();
      });
      renderRip();
    }
    function renderRip() {
      var busy = !!rip, out = $("mus-rip-out");
      $("mus-rip-btn").disabled = busy;
      $("mus-rip-btn").textContent = busy ? "Listening…" : ripRes || ripErr ? "Search again" : "Find the music";
      $("mus-rip-bar").style.width = busy ? Math.round(rip.progress() * 100) + "%" : ripRes ? "100%" : "0";
      if (busy) {
        out.innerHTML = '<p class="mus-text">' + (host.isRunning() ? "Following the program while it plays (about 5 seconds)…" : "The C64 is paused. The search goes on when it runs.") + "</p>";
        return;
      }
      if (ripErr) {
        out.innerHTML = '<p class="mus-err">' + esc(ripErr) + "</p><p class=\"mus-text\">Recording as WAV works for any music.</p>";
        return;
      }
      if (!ripRes) { out.innerHTML = ""; return; }
      var r = ripRes, hz = Math.round(r.rate * 50.125);
      var where = r.root === "irq" ? "the interrupt" : r.root === "nmi" ? "the NMI" : "the main program";
      var name = (host.fileName() || "").replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
      out.innerHTML =
        '<dl class="facts rip-facts">' +
          "<div><dt>Play routine</dt><dd>$" + hex(r.play, 4) + ", called by " + where + " " + (r.cia ? (r.rate).toFixed(1) + " times per frame (" + hz + " Hz, CIA timer)" : "once per frame (50 Hz)") + "</dd></div>" +
          "<div><dt>Player and data</dt><dd>$" + hex(r.load, 4) + "–$" + hex(r.end, 4) + " (" + kb(r.size) + ")</dd></div>" +
          "<div><dt>Init routine</dt><dd>$" + hex(r.init, 4) + ": restores " + r.zp + " bytes of zero page and low memory, the SID registers" + (r.cia ? " and the CIA timer" : "") + "</dd></div>" +
          (r.share < 0.98 ? "<div><dt>Note</dt><dd>" + Math.round((1 - r.share) * 100) + " % of the SID writes come from elsewhere (sound effects?) and are not in the file.</dd></div>" : "") +
        "</dl>" +
        '<div class="rip-fields">' +
          '<label>Name<input class="dbg-in" id="mus-name" maxlength="32" value="' + esc(name) + '"></label>' +
          '<label>Author<input class="dbg-in" id="mus-author" maxlength="32"></label>' +
          '<label>Released<input class="dbg-in" id="mus-released" maxlength="32" placeholder="e.g. 1987 Company"></label>' +
        "</div>" +
        '<div class="rip-row"><button type="button" class="dbg-btn mus-primary" data-mact="save">Download .sid</button></div>';
    }
    function saveSid() {
      if (!ripRes) return;
      var latin = function (id) { return ($(id).value || "").replace(/[^\x20-\xFF]/g, "?"); };
      var file = window.C64SidRip.psid(ripRes, { name: latin("mus-name"), author: latin("mus-author"), released: latin("mus-released") });
      host.download(baseName() + ".sid", file);
    }

    // ------------------------------------------------------------ events
    root.addEventListener("click", function (e) {
      var t = e.target.closest("[data-mact]");
      if (!t) return;
      var a = t.getAttribute("data-mact");
      if (a === "close") host.toggle(false);
      else if (a === "rec") { if (rec) stopRec(); else startRec(); }
      else if (a === "rip") startRip();
      else if (a === "save") saveSid();
    });
    setInterval(function () {
      if (rec) renderRec();
      if (rip && open) renderRip();
    }, 200);

    function setOpen(on) {
      open = on;
      root.hidden = !on;
      document.querySelector(".app").classList.toggle("musicking", on);
      if (on) { renderRec(); renderRip(); }
    }
    return { attach: attach, setOpen: setOpen, isOpen: function () { return open; }, samples: samples, recording: function () { return !!rec; } };
  };
})();
