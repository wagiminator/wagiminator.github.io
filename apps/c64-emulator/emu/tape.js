/* Datasette (C2N/1530) playing TAP images: pulses go to the FLAG input of CIA1,
 * the motor is switched by bit 5 of the CPU port, the PLAY key by bit 4.
 */
(function (global) {
  "use strict";

  function Datasette() {
    this.image = null;
    this.pos = 0;
    this.rem = 0;
    this.playing = false;
    this.motor = false;
    this.running = false;
    this.elapsed = 0;     // cycles played so far
  }
  var P = Datasette.prototype;

  P.insert = function (tap) {
    this.image = tap;
    this.rewind();
  };
  P.eject = function () { this.image = null; this.stop(); };
  P.rewind = function () {
    this.pos = 0; this.elapsed = 0;
    this.rem = this.image && this.image.pulses.length ? this.image.pulses[0] : 0;
  };
  P.play = function () { if (this.image) { this.playing = true; this.update(); } };
  P.stop = function () { this.playing = false; this.update(); };
  P.setMotor = function (on) { this.motor = on; this.update(); };
  P.update = function () { this.running = !!(this.image && this.playing && this.motor); };

  P.advance = function (n, cia) {
    var pulses = this.image.pulses;
    this.rem -= n;
    this.elapsed += n;
    while (this.rem <= 0) {
      cia.flag();
      this.pos++;
      if (this.pos >= pulses.length) { this.playing = false; this.update(); this.rem = 0; return; }
      this.rem += pulses[this.pos];
    }
  };

  P.progress = function () {
    if (!this.image || !this.image.cycles) return 0;
    return Math.min(1, this.elapsed / this.image.cycles);
  };

  P.saveState = function () { return { pos: this.pos, rem: this.rem, playing: this.playing, motor: this.motor, elapsed: this.elapsed }; };
  P.loadState = function (o) { this.pos = o.pos; this.rem = o.rem; this.playing = o.playing; this.motor = o.motor; this.elapsed = o.elapsed; this.update(); };

  global.Datasette = Datasette;
})(typeof window !== "undefined" ? window : globalThis);
