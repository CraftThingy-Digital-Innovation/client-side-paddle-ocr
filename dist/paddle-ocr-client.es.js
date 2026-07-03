var F = Object.defineProperty;
var W = (a, t, e) => t in a ? F(a, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : a[t] = e;
var f = (a, t, e) => W(a, typeof t != "symbol" ? t + "" : t, e);
import * as E from "onnxruntime-node";
import l from "@techstark/opencv-js";
import * as _ from "onnxruntime-web";
function P(a, t) {
  const e = typeof t == "string" && t.toLowerCase().includes("utf-8") || typeof t == "object" && t.encoding && t.encoding.toLowerCase().includes("utf-8"), i = new XMLHttpRequest();
  if (i.open("GET", a, !1), e) {
    if (i.send(), i.status !== 200 && i.status !== 0)
      throw new Error(`Failed to read text file at ${a}: HTTP ${i.status}`);
    return i.responseText;
  } else {
    if (i.overrideMimeType("text/plain; charset=x-user-defined"), i.send(), i.status !== 200 && i.status !== 0)
      throw new Error(`Failed to read binary file at ${a}: HTTP ${i.status}`);
    const n = i.responseText, o = n.length, r = new Uint8Array(o);
    for (let s = 0; s < o; s++)
      r[s] = n.charCodeAt(s) & 255;
    return {
      buffer: r.buffer,
      byteLength: r.byteLength
    };
  }
}
function G() {
  return {
    write(a, t) {
      return typeof t == "function" && t(), !0;
    },
    end() {
    },
    on() {
    }
  };
}
function O(...a) {
  const t = a[a.length - 1];
  return typeof t == "string" && (t.startsWith("http://") || t.startsWith("https://") || t.startsWith("/")), t;
}
function D(...a) {
  return a.some((t) => typeof t == "string" && (t.startsWith("http://") || t.startsWith("https://"))) ? a.join("/") : a.join("/").replace(/\/+/g, "/");
}
function k(a) {
  if (typeof a == "string" && (a.startsWith("http://") || a.startsWith("https://")))
    try {
      const t = new URL(a), e = t.pathname, i = e.substring(0, e.lastIndexOf("/"));
      return t.origin + (i || "/");
    } catch {
      return a.substring(0, a.lastIndexOf("/")) || ".";
    }
  return a.substring(0, a.lastIndexOf("/")) || ".";
}
const L = { resolve: O, join: D, dirname: k }, R = typeof HTMLCanvasElement < "u" ? HTMLCanvasElement : class {
};
function M(a, t) {
  const e = document.createElement("canvas");
  return e.width = a, e.height = t, e;
}
function V(a) {
  return typeof HTMLImageElement < "u" && a instanceof HTMLImageElement ? a.complete ? Promise.resolve(a) : new Promise((t, e) => {
    a.onload = () => t(a), a.onerror = (i) => e(new Error("Failed to load image element: " + i.message));
  }) : typeof HTMLCanvasElement < "u" && a instanceof HTMLCanvasElement ? Promise.resolve(a) : new Promise((t, e) => {
    const i = new Image();
    if (i.crossOrigin = "anonymous", i.onload = () => {
      typeof a == "object" && i.src.startsWith("blob:") && URL.revokeObjectURL(i.src), t(i);
    }, i.onerror = (n) => e(new Error("Failed to load image source: " + n.message)), a instanceof Blob || a instanceof File)
      i.src = URL.createObjectURL(a);
    else if (a instanceof ArrayBuffer || ArrayBuffer.isView(a)) {
      const n = new Blob([a]);
      i.src = URL.createObjectURL(n);
    } else
      i.src = a;
  });
}
class j {
  constructor() {
    f(this, "operations", /* @__PURE__ */ new Map());
    f(this, "defaultOptions", /* @__PURE__ */ new Map());
  }
  register(t, e, i) {
    this.operations.set(t, e), i && this.defaultOptions.set(t, i);
  }
  getOperation(t) {
    return this.operations.get(t);
  }
  getDefaultOptionsGenerator(t) {
    return this.defaultOptions.get(t) || {};
  }
  hasOperation(t) {
    return this.operations.has(t);
  }
  getOperationNames() {
    return Array.from(this.operations.keys());
  }
}
let y = new j();
function X(a, t, e) {
  let i = y.getOperation(a);
  if (!i)
    throw new Error(`Operation "${a}" not found in registry`);
  let n = y.getDefaultOptionsGenerator(a), r = { ...(typeof n == "function" ? n : () => ({}))(), ...e };
  return i(t, r);
}
function K() {
  return { upper: 255, method: l.ADAPTIVE_THRESH_GAUSSIAN_C, type: l.THRESH_BINARY_INV, size: 7, constant: 2 };
}
function Y(a, t) {
  let e = new l.Mat();
  return l.adaptiveThreshold(a, e, t.upper, t.method, t.type, t.size, t.constant), a.delete(), { img: e, width: e.cols, height: e.rows };
}
y.register("adaptiveThreshold", Y, K);
function q() {
  return { size: [5, 5], sigma: 0 };
}
function J(a, t) {
  let e = new l.Mat();
  return l.GaussianBlur(a, e, new l.Size(t.size[0], t.size[1]), t.sigma), a.delete(), { img: e, width: e.cols, height: e.rows };
}
y.register("blur", J, q);
function Q() {
  return { size: 10, borderType: l.BORDER_CONSTANT, borderColor: [255, 255, 255, 255] };
}
function Z(a, t) {
  let e = new l.Mat();
  return l.copyMakeBorder(a, e, t.size, t.size, t.size, t.size, t.borderType, t.borderColor), a.delete(), { img: e, width: e.cols, height: e.rows };
}
y.register("border", Z, Q);
function tt() {
  return { lower: 50, upper: 150 };
}
function et(a, t) {
  let e = new l.Mat();
  return l.Canny(a, e, t.lower, t.upper), a.delete(), { img: e, width: e.cols, height: e.rows };
}
y.register("canny", et, tt);
function it(a, t) {
  if (t.rtype === void 0)
    throw new Error("Invalid options: rtype is required");
  let e = new l.Mat();
  return a.convertTo(e, t.rtype), a.delete(), { img: e, width: e.cols, height: e.rows };
}
y.register("convert", it);
function nt() {
  return { size: [5, 5], iter: 1 };
}
function rt(a, t) {
  let e = new l.Mat(), i = l.getStructuringElement(l.MORPH_RECT, new l.Size(t.size[0], t.size[1]));
  return l.dilate(a, e, i, new l.Point(-1, -1), t.iter), a.delete(), { img: e, width: e.cols, height: e.rows };
}
y.register("dilate", rt, nt);
function ot() {
  return { size: [5, 5], iter: 1 };
}
function st(a, t) {
  let e = new l.Mat(), i = l.getStructuringElement(l.MORPH_RECT, new l.Size(t.size[0], t.size[1]));
  return l.erode(a, e, i, new l.Point(-1, -1), t.iter), a.delete(), { img: e, width: e.cols, height: e.rows };
}
y.register("erode", st, ot);
function at() {
  return {};
}
function lt(a, t) {
  let e = new l.Mat();
  return l.cvtColor(a, e, l.COLOR_RGBA2GRAY), a.delete(), { img: e, width: e.cols, height: e.rows };
}
y.register("grayscale", lt, at);
function ct() {
  return {};
}
function ht(a, t) {
  let e = new l.Mat();
  return l.bitwise_not(a, e), a.delete(), { img: e, width: e.cols, height: e.rows };
}
y.register("invert", ht, ct);
function dt() {
  return { size: [3, 3] };
}
function ut(a, t) {
  let e = new l.Mat(), i = l.getStructuringElement(l.MORPH_RECT, new l.Size(t.size[0], t.size[1]));
  return l.morphologyEx(a, e, l.MORPH_GRADIENT, i), a.delete(), { img: e, width: e.cols, height: e.rows };
}
y.register("morphologicalGradient", ut, dt);
function gt(a, t) {
  if (!t.width || !t.height)
    throw new Error("Invalid options: width and height are required");
  let e = new l.Mat();
  return l.resize(a, e, new l.Size(t.width, t.height)), a.delete(), { img: e, width: e.cols, height: e.rows };
}
y.register("resize", gt);
function ft(a, t) {
  let e = t.center || new l.Point(a.cols / 2, a.rows / 2), i = l.getRotationMatrix2D(e, t.angle, 1), n = new l.Size(a.cols, a.rows), o = new l.Mat();
  return l.warpAffine(a, o, i, n, l.INTER_LINEAR, l.BORDER_CONSTANT, new l.Scalar()), a.delete(), i.delete(), { img: o, width: o.cols, height: o.rows };
}
y.register("rotate", ft);
function pt() {
  return { lower: 0, upper: 255, type: l.THRESH_BINARY_INV + l.THRESH_OTSU };
}
function mt(a, t) {
  let e = new l.Mat();
  return l.threshold(a, e, t.lower, t.upper, t.type), a.delete(), { img: e, width: e.cols, height: e.rows };
}
y.register("threshold", mt, pt);
function xt(a, t) {
  if (!t.points || !t.bbox)
    throw new Error("Invalid options: points and bbox are required");
  const { points: e, bbox: i } = t;
  let n = new l.Mat(), o = i.x1 - i.x0, r = i.y1 - i.y0, s = [0, 0, o - 1, 0, o - 1, r - 1, 0, r - 1], c = [e.topLeft.x, e.topLeft.y, e.topRight.x, e.topRight.y, e.bottomRight.x, e.bottomRight.y, e.bottomLeft.x, e.bottomLeft.y], h = l.matFromArray(4, 1, l.CV_32FC2, s), d = l.matFromArray(4, 1, l.CV_32FC2, c), u = l.getPerspectiveTransform(d, h), g = new l.Size(o, r);
  return l.warpPerspective(a, n, u, g), u.delete(), d.delete(), h.delete(), a.delete(), { img: n, width: n.cols, height: n.rows };
}
y.register("warp", xt);
const C = class C {
  constructor() {
    f(this, "step", 0);
  }
  static getInstance() {
    return C.instance || (C.instance = new C()), C.instance;
  }
  crop(t) {
    const { bbox: e, canvas: i } = t;
    let n = M(e.x1 - e.x0, e.y1 - e.y0);
    return n.getContext("2d").drawImage(i, e.x0, e.y0, e.x1 - e.x0, e.y1 - e.y0, 0, 0, n.width, n.height), n;
  }
  isDirty(t) {
    const { canvas: e, threshold: i = 127.5, majorColorThreshold: n = 0.97 } = t;
    let o = 0, r = 0, s = this.crop({ bbox: { x0: e.width * 0.1, y0: e.height * 0.1, x1: e.width * 0.9, y1: e.height * 0.9 }, canvas: e }), h = s.getContext("2d").getImageData(0, 0, s.width, s.height).data;
    for (let u = 0; u < h.length; u += 4) {
      let g = h[u], p = h[u + 1], m = h[u + 2];
      g >= i && p >= i && m >= i ? o++ : r++;
    }
    return Math.max(o, r) / (r + o) < n;
  }
  saveImage(t) {
    const { canvas: e, filename: i, path: n = "out" } = t;
    let o = D(process.cwd(), n);
    D(o, `${this.step++}. ${i}.png`);
    let r = G(), s = e.toBuffer("image/png");
    return new Promise((c, h) => {
      r.write(s, (d) => {
        d ? h(d) : c();
      });
    });
  }
  clearOutput(t = "out") {
    D(process.cwd(), t);
  }
  drawLine(t) {
    const { ctx: e, x: i, y: n, width: o, height: r, lineWidth: s = 2, color: c = "blue" } = t;
    e.beginPath(), e.strokeStyle = c, e.lineWidth = s, e.strokeRect(i, n, o, r), e.closePath();
  }
  drawContour(t) {
    const { ctx: e, contour: i, strokeStyle: n = "red", lineWidth: o = 2 } = t;
    let r = i.data32S;
    if (!(r.length < 4)) {
      e.strokeStyle = n, e.lineWidth = o, e.beginPath(), e.moveTo(r[0], r[1]);
      for (let s = 2; s < r.length; s += 2)
        e.lineTo(r[s], r[s + 1]);
      e.closePath(), e.stroke();
    }
  }
};
f(C, "instance", null);
let T = C;
class yt {
  constructor(t, e = {}) {
    f(this, "contours");
    let i = { ...wt(), ...e };
    if (t instanceof l.Mat) {
      let n = new l.MatVector(), o = new l.Mat();
      try {
        l.findContours(t, n, o, i.mode, i.method);
      } catch (r) {
        throw r;
      }
      o.delete(), this.contours = n;
    } else
      throw new Error("Invalid img type. Must be cv.Mat.");
  }
  getAll() {
    return this.contours;
  }
  getSize() {
    return this.contours.size();
  }
  getFromIndex(t) {
    return t < this.contours.size() ? this.contours.get(t) : new l.Mat();
  }
  getRect(t) {
    return l.boundingRect(t);
  }
  iterate(t) {
    for (let e = 0, i = this.contours.size(); e < i; e++) {
      let n = this.contours.get(e);
      t(n);
    }
    return this;
  }
  getLargestContourArea() {
    let t = 0, e = null;
    return this.iterate((i) => {
      let n = l.contourArea(i);
      n > t && (t = n, e = i);
    }), e;
  }
  getCornerPoints(t) {
    const { canvas: e, contour: i = this.getLargestContourArea() } = t;
    let n = { x0: 0, y0: 0, x1: e.width, y1: e.height };
    if (!i)
      return { points: { topLeft: { x: n.x0, y: n.y0 }, topRight: { x: n.x1, y: n.y0 }, bottomLeft: { x: n.x0, y: n.y1 }, bottomRight: { x: n.x1, y: n.y1 } }, bbox: n };
    let o = l.minAreaRect(i), r = l.RotatedRect.points(o), s = { topLeft: { x: 0, y: 0 }, topRight: { x: 0, y: 0 }, bottomRight: { x: 0, y: 0 }, bottomLeft: { x: 0, y: 0 } }, c = r.map((w) => w.x + w.y), h = r.map((w) => w.y - w.x), d = c.indexOf(Math.min(...c)), u = h.indexOf(Math.min(...h)), g = c.indexOf(Math.max(...c)), p = h.indexOf(Math.max(...h));
    if (!r[d] || !r[u] || !r[g] || !r[p])
      return { points: { topLeft: { x: n.x0, y: n.y0 }, topRight: { x: n.x1, y: n.y0 }, bottomLeft: { x: n.x0, y: n.y1 }, bottomRight: { x: n.x1, y: n.y1 } }, bbox: n };
    s.topLeft = { x: r[d].x, y: r[d].y }, s.topRight = { x: r[u].x, y: r[u].y }, s.bottomRight = { x: r[g].x, y: r[g].y }, s.bottomLeft = { x: r[p].x, y: r[p].y }, i.delete();
    let m = (w) => (w.x = Math.max(0, Math.min(e.width, w.x)), w.y = Math.max(0, Math.min(e.height, w.y)), w);
    return s.topLeft = m(s.topLeft), s.topRight = m(s.topRight), s.bottomLeft = m(s.bottomLeft), s.bottomRight = m(s.bottomRight), { points: s, bbox: n };
  }
  getApproximateRectangleContour(t) {
    const { threshold: e = 0.02, contour: i = this.getLargestContourArea() } = t ?? {};
    if (!i) return;
    let n = e * l.arcLength(i, !0), o = new l.Mat();
    return l.approxPolyDP(i, o, n, !0), i.delete(), o;
  }
  destroy() {
    try {
      this.contours.delete();
    } catch {
    }
  }
}
function wt() {
  return { mode: l.RETR_EXTERNAL, method: l.CHAIN_APPROX_SIMPLE };
}
class I {
  constructor(t) {
    f(this, "img");
    f(this, "width");
    f(this, "height");
    if (t instanceof R) {
      let i = t.getContext("2d").getImageData(0, 0, t.width, t.height);
      this.img = l.matFromImageData(i), this.width = t.width, this.height = t.height;
    } else if (t instanceof l.Mat)
      this.img = t, this.width = t.cols, this.height = t.rows;
    else
      throw new Error("Invalid source type. Must be either Canvas or cv.Mat.");
  }
  static async prepareCanvas(t) {
    if (t instanceof R) return t;
    let e = await V(t), i = M(e.width, e.height);
    return i.getContext("2d").drawImage(e, 0, 0), i;
  }
  static async prepareBuffer(t) {
    if (t instanceof ArrayBuffer) return t;
    if (typeof t.toBuffer == "function") {
      let o = t.toBuffer("image/png"), r = new ArrayBuffer(o.byteLength);
      return new Uint8Array(r).set(new Uint8Array(o)), r;
    }
    if (typeof t.toDataURL == "function") {
      let r = t.toDataURL("image/png").replace(/^data:image\/png;base64,/, ""), s = Buffer.from(r, "base64"), c = new ArrayBuffer(s.byteLength);
      return new Uint8Array(c).set(new Uint8Array(s)), c;
    }
    let i = t.getContext("2d").getImageData(0, 0, t.width, t.height), n = new ArrayBuffer(i.data.byteLength);
    return new Uint8Array(n).set(new Uint8Array(i.data.buffer, i.data.byteOffset, i.data.byteLength)), n;
  }
  static async initRuntime() {
    return new Promise((t) => {
      l && l.Mat ? t() : l.onRuntimeInitialized = () => {
        t();
      };
    });
  }
  execute(t, e) {
    if (!y.hasOperation(t))
      throw new Error(`Operation "${t}" not found`);
    try {
      let i = X(t, this.img, e);
      this.img = i.img, this.width = i.width, this.height = i.height;
    } catch (i) {
      throw console.error(`Error executing operation "${t}":`, i), i;
    }
    return this;
  }
  grayscale(t = {}) {
    return this.execute("grayscale", t);
  }
  invert(t = {}) {
    return this.execute("invert", t);
  }
  border(t = {}) {
    return this.execute("border", t);
  }
  blur(t = {}) {
    return this.execute("blur", t);
  }
  threshold(t = {}) {
    return this.execute("threshold", t);
  }
  adaptiveThreshold(t = {}) {
    return this.execute("adaptiveThreshold", t);
  }
  canny(t = {}) {
    return this.execute("canny", t);
  }
  morphologicalGradient(t = {}) {
    return this.execute("morphologicalGradient", t);
  }
  erode(t = {}) {
    return this.execute("erode", t);
  }
  dilate(t = {}) {
    return this.execute("dilate", t);
  }
  resize(t) {
    return this.execute("resize", t);
  }
  warp(t) {
    return this.execute("warp", t);
  }
  rotate(t) {
    return this.execute("rotate", t);
  }
  convert(t) {
    return this.execute("convert", t);
  }
  destroy() {
    this.img.delete();
  }
  toMat() {
    return this.img;
  }
  toCanvas() {
    let t = M(this.width, this.height), e = t.getContext("2d"), i = e.createImageData(this.width, this.height);
    if (this.img.channels() === 1) {
      let n = i.data, o = new Uint8Array(this.img.data);
      for (let r = 0; r < o.length; r++)
        n[r * 4] = o[r], n[r * 4 + 1] = o[r], n[r * 4 + 2] = o[r], n[r * 4 + 3] = 255;
    } else
      i.data.set(new Uint8ClampedArray(this.img.data));
    return e.putImageData(i, 0, 0), t;
  }
}
var bt = "";
let Ct = () => {
  if (typeof import.meta < "u" && import.meta.url) {
    let a = import.meta.url;
    return L.dirname(a);
  }
  return bt;
}, N = Ct(), It = L.join(N, "models", "en_PP-OCRv3_det_infer.onnx"), Tt = L.join(N, "models", "en_PP-OCRv3_rec_infer.onnx"), vt = L.join(N, "models", "en_dict.txt"), Rt = { detection: It, recognition: Tt, charactersDictionary: vt }, B = { verbose: !1, debug: !1, debugFolder: "out" }, H = { mean: [0.485, 0.456, 0.406], stdDeviation: [0.229, 0.224, 0.225], maxSideLength: 960, minimumAreaThreshold: 20, paddingVertical: 0.4, paddingHorizontal: 0.6 }, U = { imageHeight: 48, charactersDictionary: [] }, Mt = { model: Rt, detection: H, recognition: U, debugging: B };
const v = class v {
  constructor(t, e = {}, i = {}) {
    f(this, "options");
    f(this, "debugging");
    f(this, "session");
    this.session = t, this.options = { ...H, ...e }, this.debugging = { ...B, ...i };
  }
  log(t) {
    this.debugging.verbose && console.log(`[DetectionService] ${t}`);
  }
  async run(t) {
    this.log("Starting text detection process");
    try {
      let e = await this.preprocessDetection(t), i = await this.runInference(e.tensor, e.width, e.height);
      if (!i)
        return console.error("Text detection failed (output tensor is null)"), [];
      let n = this.postprocessDetection(i, e);
      return this.debugging.debug && (await this.debugDetectionCanvas(i, e.width, e.height), await this.debugDetectedBoxes(t, n)), this.log(`Detected ${n.length} text boxes in image`), n;
    } catch (e) {
      return console.error("Error during text detection:", e instanceof Error ? e.message : String(e)), [];
    }
  }
  async preprocessDetection(t) {
    let e = t instanceof R ? t : await I.prepareCanvas(t);
    const { width: i, height: n } = e, { width: o, height: r, ratio: s } = this.calculateResizeDimensions(i, n);
    let c = new I(e), h = c.resize({ width: o, height: r }).toCanvas();
    c.destroy();
    let d = Math.ceil(o / 32) * 32, u = Math.ceil(r / 32) * 32, g = this.createPaddedCanvas(h, o, r, d, u), p = this.imageToTensor(g, d, u);
    return this.log(`Detection preprocessed: original(${i}x${n}), model_input(${d}x${u}), resize_ratio: ${s.toFixed(4)}`), { tensor: p, width: d, height: u, resizeRatio: s, originalWidth: i, originalHeight: n };
  }
  calculateResizeDimensions(t, e) {
    let i = this.options.maxSideLength, n = t, o = e, r = 1;
    return Math.max(o, n) > i && (r = i / (o > n ? o : n), n = Math.round(n * r), o = Math.round(o * r)), { width: n, height: o, ratio: r };
  }
  createPaddedCanvas(t, e, i, n, o) {
    let r = M(n, o);
    return r.getContext("2d").drawImage(t, 0, 0, e, i), r;
  }
  imageToTensor(t, e, i) {
    let r = t.getContext("2d").getImageData(0, 0, e, i).data, s = new Float32Array(v.NUM_CHANNELS * i * e);
    const { mean: c, stdDeviation: h } = this.options;
    for (let d = 0; d < i; d++)
      for (let u = 0; u < e; u++) {
        let g = (d * e + u) * 4, p = d * e + u;
        for (let m = 0; m < v.NUM_CHANNELS; m++) {
          let S = (r[g + m] / 255 - c[m]) / h[m];
          s[m * i * e + p] = S;
        }
      }
    return s;
  }
  async runInference(t, e, i) {
    try {
      this.log("Running detection inference...");
      let o = { x: new E.Tensor("float32", t, [1, 3, i, e]) }, s = (await this.session.run(o))[this.session.outputNames[0] || "sigmoid_0.tmp_0"];
      return this.log("Detection inference complete!"), s ? s.data : (console.error(`Output tensor ${this.session.outputNames[0]}  not found in detection results`), null);
    } catch (n) {
      throw console.error("Error during model inference:", n instanceof Error ? n.message : String(n)), n;
    }
  }
  tensorToCanvas(t, e, i) {
    let n = M(e, i), o = n.getContext("2d"), r = o.createImageData(e, i), s = r.data;
    for (let c = 0; c < i; c++)
      for (let h = 0; h < e; h++) {
        let d = c * e + h, u = t[d] || 0, g = Math.round(u * 255), p = (c * e + h) * 4;
        s[p] = g, s[p + 1] = g, s[p + 2] = g, s[p + 3] = 255;
      }
    return o.putImageData(r, 0, 0), n;
  }
  postprocessDetection(t, e, i = this.options.minimumAreaThreshold || 20, n = this.options.paddingVertical || 0.4, o = this.options.paddingHorizontal || 0.6) {
    this.log("Post-processing detection results...");
    const { width: r, height: s, resizeRatio: c, originalWidth: h, originalHeight: d } = e;
    let u = this.tensorToCanvas(t, r, s), g = new I(u);
    g.grayscale().convert({ rtype: l.CV_8UC1 });
    let p = new yt(g.toMat(), { mode: l.RETR_LIST, method: l.CHAIN_APPROX_SIMPLE }), m = this.extractBoxesFromContours(p, r, s, c, h, d, i, n, o);
    return g.destroy(), p.destroy(), this.log(`Found ${m.length} potential text boxes`), m;
  }
  extractBoxesFromContours(t, e, i, n, o, r, s, c, h) {
    let d = [];
    return t.iterate((u) => {
      let g = t.getRect(u);
      if (g.width * g.height <= s)
        return;
      let p = this.applyPaddingToRect(g, e, i, c, h), m = this.convertToOriginalCoordinates(p, n, o, r);
      m.width > 5 && m.height > 5 && d.push(m);
    }), d;
  }
  applyPaddingToRect(t, e, i, n, o) {
    let r = Math.round(t.height * n), s = Math.round(t.height * o), c = t.x - s, h = t.y - r, d = t.width + 2 * s, u = t.height + 2 * r;
    c = Math.max(0, c), h = Math.max(0, h);
    let g = Math.min(e, t.x + t.width + s), p = Math.min(i, t.y + t.height + r);
    return d = g - c, u = p - h, { x: c, y: h, width: d, height: u };
  }
  convertToOriginalCoordinates(t, e, i, n) {
    let o = t.x / e, r = t.y / e, s = t.width / e, c = t.height / e, h = Math.max(0, Math.round(o)), d = Math.max(0, Math.round(r)), u = Math.min(i - h, Math.round(s)), g = Math.min(n - d, Math.round(c));
    return { x: h, y: d, width: u, height: g };
  }
  async debugDetectionCanvas(t, e, i) {
    let n = this.tensorToCanvas(t, e, i), o = this.debugging.debugFolder;
    await T.getInstance().saveImage({ canvas: n, filename: "detection-debug", path: o }), this.log(`Probability map visualized and saved to: ${o}`);
  }
  async debugDetectedBoxes(t, e) {
    let i = t instanceof R ? t : await I.prepareCanvas(t), n = i.getContext("2d"), o = T.getInstance();
    for (let s of e) {
      const { x: c, y: h, width: d, height: u } = s;
      o.drawLine({ ctx: n, x: c, y: h, width: d, height: u });
    }
    let r = this.debugging.debugFolder;
    await T.getInstance().saveImage({ canvas: i, filename: "boxes-debug", path: r }), this.log(`Boxes visualized and saved to: ${r}`);
  }
};
f(v, "NUM_CHANNELS", 3);
let A = v;
const b = class b {
  constructor(t, e = {}, i = {}) {
    f(this, "options");
    f(this, "debugging");
    f(this, "session");
    f(this, "toolkit");
    this.session = t, this.toolkit = T.getInstance(), this.options = { ...U, ...e }, this.debugging = { ...B, ...i };
  }
  log(t) {
    this.debugging.verbose && console.log(`[RecognitionService] ${t}`);
  }
  async run(t, e) {
    this.log("Starting text recognition process");
    try {
      let i = t instanceof R ? t : await I.prepareCanvas(t), n = this.filterValidBoxes(e), o = await this.processBoxesInParallel(i, n);
      return this.sortResultsByReadingOrder(o);
    } catch (i) {
      return console.error("Error during text recognition:", i instanceof Error ? i.message : String(i)), [];
    }
  }
  filterValidBoxes(t) {
    return t.map((e, i) => ({ box: e, index: i })).filter(({ box: e, index: i }) => this.isValidBox(e, i));
  }
  async processBoxesInParallel(t, e) {
    let i = this.debugging.debugFolder + "/crops";
    this.debugging.debug && this.toolkit.clearOutput(i);
    let n = e.map(({ box: r, index: s }) => this.processBox(t, r, s, e.length, i));
    return (await Promise.all(n)).filter((r) => r !== null);
  }
  async processBox(t, e, i, n, o) {
    let r = Date.now();
    try {
      let s = this.cropRegion(t, e), c = await this.recognizeText(s);
      return this.debugging.debug && (await this.saveDebugCrop(s, i, o), this.logProcessingDetails(e, i, n, c, r)), { text: c, box: e };
    } catch (s) {
      return console.error(`Error processing box ${i + 1}: ${s.message}`, s.stack), null;
    }
  }
  sortResultsByReadingOrder(t) {
    return [...t].sort((e, i) => {
      let n = e.box, o = i.box;
      return Math.abs(n.y - o.y) < (n.height + o.height) / 4 ? n.x - o.x : n.y - o.y;
    });
  }
  isValidBox(t, e) {
    return t.width <= 0 || t.height <= 0 ? (console.warn(`Skipping invalid box ${e + 1}: w=${t.width}, h=${t.height}`), !1) : !0;
  }
  cropRegion(t, e) {
    return this.toolkit.crop({ bbox: { x0: e.x, y0: e.y, x1: e.x + e.width, y1: e.y + e.height }, canvas: t });
  }
  async saveDebugCrop(t, e, i) {
    await this.toolkit.saveImage({ canvas: t, filename: `crop_${String(e).padStart(3, "0")}.png`, path: i });
  }
  logProcessingDetails(t, e, i, n, o) {
    let r = Date.now() - o;
    this.log(`Box ${e + 1}/${i}: [x:${t.x}, y:${t.y}, w:${t.width}, h:${t.height}]
	 → "${n}" (processed in ${r}ms)
`);
  }
  async recognizeText(t) {
    const { imageTensor: e, tensorWidth: i, tensorHeight: n } = await this.preprocessImage(t);
    let o = new E.Tensor("float32", e, [1, 3, n, i]), r = await this.runInference(o);
    return this.decodeResults(r);
  }
  async preprocessImage(t) {
    let e = new I(t), i = this.options.imageHeight, n = e.width, o = e.height;
    if (o === 0 || n === 0)
      throw new Error(`Crop dimensions are zero: ${n}x${o}`);
    let r = n / o, s = Math.max(b.MIN_CROP_WIDTH, Math.round(i * r));
    e.resize({ width: s, height: i });
    let c = this.createImageTensor(e, s, i);
    return e.destroy(), { imageTensor: c, tensorWidth: s, tensorHeight: i };
  }
  createImageTensor(t, e, i) {
    let s = t.toCanvas().getContext("2d").getImageData(0, 0, e, i).data, c = 3, h = new Float32Array(c * i * e);
    for (let d = 0; d < i; d++)
      for (let u = 0; u < e; u++) {
        let g = (d * e + u) * 4, m = (s[g] / 255 - 0.5) / 0.5;
        for (let w = 0; w < c; w++) {
          let S = w * i * e + d * e + u;
          h[S] = m;
        }
      }
    return h;
  }
  async runInference(t) {
    let e = { x: t }, i = await this.session.run(e), n = Object.keys(i)[0], o = i[n];
    if (!o)
      throw new Error(`Recognition output tensor '${n}' not found. Available keys: ${Object.keys(i)}`);
    return o;
  }
  decodeResults(t) {
    let e = t.data, i = t.dims, n = i[1], o = i[2];
    return o !== this.options.charactersDictionary.length && console.warn(`Warning: Model output classes (${o}) does not match dictionary length (${this.options.charactersDictionary.length})`), this.ctcGreedyDecode(e, n, o, this.options.charactersDictionary);
  }
  ctcGreedyDecode(t, e, i, n) {
    let o = "", r = -1;
    for (let s = 0; s < e; s++) {
      const { index: c } = this.findMaxProbabilityClass(t, s, i);
      if (c === b.BLANK_INDEX || c === r) {
        r = c;
        continue;
      }
      this.isValidDictionaryIndex(c, n) ? this.appendCharacterToText(c, n, (h) => {
        o += h;
      }) : console.warn(`Decoded index ${c} out of bounds for charDict (length ${n.length}) at t=${s}`), r = c;
    }
    return o;
  }
  appendCharacterToText(t, e, i) {
    let n = e[t];
    if (t === e.length - 1) {
      if (n === b.UNK_TOKEN)
        return;
      i(" ");
      return;
    }
    i(n);
  }
  findMaxProbabilityClass(t, e, i) {
    let n = -1 / 0, o = 0;
    for (let r = 0; r < i; r++) {
      let s = t[e * i + r];
      s > n && (n = s, o = r);
    }
    return { value: n, index: o };
  }
  isValidDictionaryIndex(t, e) {
    return t >= 0 && t < e.length;
  }
};
f(b, "BLANK_INDEX", 0), f(b, "UNK_TOKEN", "<unk>"), f(b, "MIN_CROP_WIDTH", 8);
let $ = b;
const x = class x {
  constructor(t) {
    f(this, "options");
    f(this, "detectionSession", null);
    f(this, "recognitionSession", null);
    this.options = { ...Mt, ...t };
  }
  log(t) {
    var e;
    (e = this.options.debugging) != null && e.verbose && console.log(`[DetectionService] ${t}`);
  }
  async initialize(t) {
    var e;
    try {
      let i = { ...this.options, ...t }, n = O(process.cwd(), i.model.detection), o = O(process.cwd(), i.model.recognition), r = O(process.cwd(), i.model.charactersDictionary);
      this.log(`Loading Detection ONNX model from: ${n}`);
      let s = P(n).buffer;
      this.detectionSession = await E.InferenceSession.create(s), await new Promise((d) => setImmediate(d)), this.log(`Detection ONNX model loaded successfully
	Loading Recognition ONNX model from: ${o}`), this.log(`input: ${this.detectionSession.inputNames}
	output: ${this.detectionSession.outputNames}
	inputMetadata: ${JSON.stringify(this.detectionSession.inputMetadata)}
	outputMetadata: ${JSON.stringify(this.detectionSession.outputMetadata)}`);
      let c = P(o).buffer;
      this.recognitionSession = await E.InferenceSession.create(c), await new Promise((d) => setImmediate(d)), this.log(`Recognition ONNX model loaded successfully
	input: ${this.recognitionSession.inputNames}
	output: ${this.recognitionSession.outputNames}
	inputMetadata: ${JSON.stringify(this.recognitionSession.inputMetadata)}
	outputMetadata: ${JSON.stringify(this.recognitionSession.outputMetadata)}`), this.log(`Loading character dictionary from: ${r}`);
      let h = P(r, "utf-8").split(`
`);
      if (!h.length)
        throw new Error(`Character dictionary at ${r} is empty or not found.`);
      this.options.recognition.charactersDictionary = h, this.log(`Character dictionary loaded with ${((e = this.options.recognition) == null ? void 0 : e.charactersDictionary.length) || 0} entries.`);
    } catch (i) {
      throw console.error("Failed to initialize PaddleOcrService:", i), i;
    }
  }
  static async getInstance(t) {
    return x.instance ? t && await x.instance.initialize(t) : (x.instance = new x(t), await x.instance.initialize()), x.instance;
  }
  isInitialized() {
    return this.detectionSession !== null && this.recognitionSession !== null;
  }
  static async changeModel(t) {
    return x.instance ? (await x.instance.destroy(), await x.instance.initialize(t)) : (x.instance = new x(t), await x.instance.initialize()), x.instance;
  }
  static async createInstance(t) {
    let e = new x(t);
    return await e.initialize(), e;
  }
  async recognize(t) {
    await I.initRuntime();
    let e = new A(this.detectionSession, this.options.detection, this.options.debugging), i = new $(this.recognitionSession, this.options.recognition, this.options.debugging), n = await e.run(t), o = await i.run(t, n);
    return this.groupResult(o);
  }
  groupResult(t) {
    let e = { text: "", lines: [] };
    if (!t.length)
      return e;
    let i = [t[0]], n = t[0].text, o = t[0].box.height;
    for (let r = 1; r < t.length; r++) {
      let s = t[r], c = t[r - 1], h = Math.abs(s.box.y - c.box.y), d = o * 0.5;
      h <= d ? (i.push(s), n += ` ${s.text}`, o = i.reduce((u, g) => u + g.box.height, 0) / i.length) : (e.lines.push([...i]), n += `
${s.text}`, i = [s], o = s.box.height);
    }
    return i.length > 0 && e.lines.push([...i]), e.text = n, e;
  }
  async destroy() {
    var t, e;
    await ((t = this.detectionSession) == null ? void 0 : t.release()), await ((e = this.recognitionSession) == null ? void 0 : e.release());
  }
};
f(x, "instance", null);
let z = x;
class Ot {
  /**
   * Instantiate PaddleOCRClient
   * @param {object} options Configurations (e.g. { verbose: true, detection: { maxSideLength: 2000 } })
   */
  constructor(t = {}) {
    this.options = t, this.service = null;
  }
  /**
   * Initialize and load model assets via HTTP GET requests
   * @param {object} modelConfig Custom model paths, defaults to '/models/en_PP-OCRv3_det_infer.onnx', etc.
   */
  async init(t = {}) {
    const i = {
      ...{
        detection: "/models/en_PP-OCRv3_det_infer.onnx",
        recognition: "/models/en_PP-OCRv3_rec_infer.onnx",
        charactersDictionary: "/models/en_dict.txt"
      },
      ...t
    };
    this.service = new z({
      model: i,
      detection: {
        maxSideLength: this.options.maxSideLength || 2e3,
        ...this.options.detection
      },
      debugging: {
        verbose: this.options.verbose || !1,
        debug: !1
      }
    }), console.log("Initializing Client-Side PaddleOCR Service..."), console.log("Fetching characters dictionary from: " + i.charactersDictionary);
    const n = await fetch(i.charactersDictionary);
    if (!n.ok)
      throw new Error(`Failed to fetch characters dictionary: ${n.status} ${n.statusText}`);
    const r = (await n.text()).split(`
`);
    this.service.options.recognition.charactersDictionary = r, console.log(`Character dictionary loaded with ${r.length} entries.`), console.log("Loading detection model asynchronously from: " + i.detection), this.service.detectionSession = await _.InferenceSession.create(i.detection), console.log("Detection ONNX model loaded successfully."), console.log("Loading recognition model asynchronously from: " + i.recognition), this.service.recognitionSession = await _.InferenceSession.create(i.recognition), console.log("Recognition ONNX model loaded successfully."), console.log("Client-Side PaddleOCR Service initialized successfully.");
  }
  /**
   * Runs OCR text and layout extraction on an image canvas, URL, base64, Blob or File.
   * @param {string|HTMLCanvasElement|Blob|File|ArrayBuffer} imageInput
   * @returns {Promise<{text: string, lines: Array<{text: string, box: object, words: Array}>}>}
   */
  async recognize(t) {
    if (!this.service)
      throw new Error("PaddleOCRClient has not been initialized. Please call .init() first.");
    const e = await this.service.recognize(t), i = (e.lines || []).map((n) => {
      const o = n.map((s) => s.text).join(" "), r = this.getEncompassingBox(n);
      return {
        text: o,
        box: r,
        words: n.map((s) => ({
          text: s.text || "",
          box: s.box || { x: 0, y: 0, width: 0, height: 0 }
        }))
      };
    });
    return {
      text: e.text || "",
      lines: i
    };
  }
  /**
   * Helper to merge multiple bounding boxes into an encompassing bounding box.
   */
  getEncompassingBox(t) {
    if (!t || t.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
    let e = 1 / 0, i = 1 / 0, n = -1 / 0, o = -1 / 0;
    for (const r of t) {
      const s = r.box;
      s && (e = Math.min(e, s.x), i = Math.min(i, s.y), n = Math.max(n, s.x + s.width), o = Math.max(o, s.y + s.height));
    }
    return {
      x: e === 1 / 0 ? 0 : e,
      y: i === 1 / 0 ? 0 : i,
      width: n === -1 / 0 ? 0 : n - e,
      height: o === -1 / 0 ? 0 : o - i
    };
  }
}
typeof window < "u" && (window.PaddleOCRClient = Ot);
export {
  Ot as PaddleOCRClient,
  Ot as default
};
