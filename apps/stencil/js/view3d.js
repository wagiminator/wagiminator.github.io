/* Solder Paste Stencil: a small WebGL viewer for the triangle mesh (drag to turn, wheel to zoom).
 * Global: View3D */
(function (global) {
  "use strict";
  var VS = "attribute vec3 p; attribute vec3 n; uniform mat4 m; varying vec3 vn; varying float vz; void main(){ vn = n; vz = p.z; gl_Position = m * vec4(p, 1.0); }";
  var FS = "precision mediump float; varying vec3 vn; varying float vz; uniform vec3 col; uniform vec3 l1; uniform vec3 l2;" +
    "void main(){ vec3 nn = normalize(vn); float d = abs(dot(nn, l1)) * 0.65 + max(dot(nn, l2), 0.0) * 0.25 + 0.22; gl_FragColor = vec4(col * d, 1.0); }";

  function mul(a, b) { var r = new Float32Array(16); for (var i = 0; i < 4; i++) for (var j = 0; j < 4; j++) { var s = 0; for (var k = 0; k < 4; k++) s += a[k * 4 + j] * b[i * 4 + k]; r[i * 4 + j] = s; } return r; }
  function perspective(fov, asp, near, far) { var f = 1 / Math.tan(fov / 2), nf = 1 / (near - far); return new Float32Array([f / asp, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]); }
  function lookAt(e, t, u) {
    var z = [e[0] - t[0], e[1] - t[1], e[2] - t[2]], zl = Math.hypot(z[0], z[1], z[2]); z = z.map(function (v) { return v / zl; });
    var x = [u[1] * z[2] - u[2] * z[1], u[2] * z[0] - u[0] * z[2], u[0] * z[1] - u[1] * z[0]], xl = Math.hypot(x[0], x[1], x[2]) || 1; x = x.map(function (v) { return v / xl; });
    var y = [z[1] * x[2] - z[2] * x[1], z[2] * x[0] - z[0] * x[2], z[0] * x[1] - z[1] * x[0]];
    return new Float32Array([x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0,
      -(x[0] * e[0] + x[1] * e[1] + x[2] * e[2]), -(y[0] * e[0] + y[1] * e[1] + y[2] * e[2]), -(z[0] * e[0] + z[1] * e[1] + z[2] * e[2]), 1]);
  }

  function View3D(canvas) {
    var gl = canvas.getContext("webgl", { antialias: true }) || canvas.getContext("experimental-webgl");
    this.canvas = canvas; this.gl = gl; this.ok = !!gl;
    this.yaw = -0.9; this.pitch = 0.75; this.zoom = 1; this.count = 0;
    if (!gl) return;
    var sh = function (t, src) { var s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    var pr = gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr); gl.useProgram(pr);
    this.pr = pr; this.buf = gl.createBuffer();
    this.loc = { p: gl.getAttribLocation(pr, "p"), n: gl.getAttribLocation(pr, "n"), m: gl.getUniformLocation(pr, "m"), col: gl.getUniformLocation(pr, "col"), l1: gl.getUniformLocation(pr, "l1"), l2: gl.getUniformLocation(pr, "l2") };
    gl.enable(gl.DEPTH_TEST);
    var self = this, drag = null;
    canvas.addEventListener("pointerdown", function (e) { drag = { x: e.clientX, y: e.clientY, yaw: self.yaw, pitch: self.pitch }; canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener("pointermove", function (e) {
      if (!drag) return;
      self.yaw = drag.yaw - (e.clientX - drag.x) * 0.01;
      self.pitch = Math.max(-1.5, Math.min(1.5, drag.pitch + (e.clientY - drag.y) * 0.01));
      self.draw();
    });
    canvas.addEventListener("pointerup", function () { drag = null; });
    canvas.addEventListener("wheel", function (e) { e.preventDefault(); self.zoom = Math.max(0.2, Math.min(6, self.zoom * Math.exp(-e.deltaY * 0.0015))); self.draw(); }, { passive: false });
    canvas.addEventListener("dblclick", function () { self.yaw = -0.9; self.pitch = 0.75; self.zoom = 1; self.draw(); });
  }
  // mesh: Float32Array, 9 values per triangle
  View3D.prototype.set = function (mesh) {
    if (!this.ok) return;
    var n = mesh.length / 9, data = new Float32Array(n * 18), b = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity];
    for (var t = 0; t < n; t++) {
      var k = t * 9, ax = mesh[k], ay = mesh[k + 1], az = mesh[k + 2], bx = mesh[k + 3], by = mesh[k + 4], bz = mesh[k + 5], cx = mesh[k + 6], cy = mesh[k + 7], cz = mesh[k + 8];
      var nx = (by - ay) * (cz - az) - (bz - az) * (cy - ay), ny = (bz - az) * (cx - ax) - (bx - ax) * (cz - az), nz = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax), l = Math.hypot(nx, ny, nz) || 1;
      for (var v = 0; v < 3; v++) {
        var o = t * 18 + v * 6;
        data[o] = mesh[k + v * 3]; data[o + 1] = mesh[k + v * 3 + 1]; data[o + 2] = mesh[k + v * 3 + 2];
        data[o + 3] = nx / l; data[o + 4] = ny / l; data[o + 5] = nz / l;
        for (var c = 0; c < 3; c++) { b[c] = Math.min(b[c], mesh[k + v * 3 + c]); b[c + 3] = Math.max(b[c + 3], mesh[k + v * 3 + c]); }
      }
    }
    this.box = b; this.count = n * 3;
    var gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buf); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    this.draw();
  };
  View3D.prototype.draw = function () {
    if (!this.ok) return;
    var gl = this.gl, cv = this.canvas, dpr = window.devicePixelRatio || 1, w = cv.clientWidth, h = cv.clientHeight;
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    gl.viewport(0, 0, cv.width, cv.height);
    gl.clearColor(0.93, 0.94, 0.96, 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    if (!this.count) return;
    var b = this.box, c = [(b[0] + b[3]) / 2, (b[1] + b[4]) / 2, (b[2] + b[5]) / 2], r = Math.hypot(b[3] - b[0], b[4] - b[1], b[5] - b[2]) / 2 || 1;
    var d = r * 2.6 / this.zoom, e = [c[0] + d * Math.cos(this.pitch) * Math.cos(this.yaw), c[1] + d * Math.cos(this.pitch) * Math.sin(this.yaw), c[2] + d * Math.sin(this.pitch)];
    var m = mul(perspective(0.6, w / Math.max(1, h), d / 50, d * 4), lookAt(e, c, [0, 0, 1]));
    var L = this.loc;
    gl.useProgram(this.pr); gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
    gl.enableVertexAttribArray(L.p); gl.vertexAttribPointer(L.p, 3, gl.FLOAT, false, 24, 0);
    gl.enableVertexAttribArray(L.n); gl.vertexAttribPointer(L.n, 3, gl.FLOAT, false, 24, 12);
    gl.uniformMatrix4fv(L.m, false, m);
    gl.uniform3f(L.col, 0.58, 0.68, 0.8);
    var l1 = [Math.cos(this.yaw + 0.6) * 0.5, Math.sin(this.yaw + 0.6) * 0.5, 0.85], l1n = Math.hypot(l1[0], l1[1], l1[2]);
    gl.uniform3f(L.l1, l1[0] / l1n, l1[1] / l1n, l1[2] / l1n); gl.uniform3f(L.l2, 0.3, -0.5, 0.8);
    gl.drawArrays(gl.TRIANGLES, 0, this.count);
  };
  global.View3D = View3D;
})(window);
