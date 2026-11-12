// Just enough DOM for js/views/elevation.js to run under Node.
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escAttr = s => esc(s).replace(/"/g, "&quot;");

class Node {
  constructor(tag, ns) { this.tag = tag; this.ns = ns; this.attrs = {}; this.children = []; this.style = {}; this._text = null; this._html = null; }
  setAttribute(k, v) { this.attrs[k] = v; }
  getAttribute(k) { return this.attrs[k]; }
  set textContent(v) { this._text = v; this.children = []; }
  get textContent() { return this._text; }
  set innerHTML(v) { this._html = v; this.children = []; }
  set className(v) { this.attrs.class = v; }
  appendChild(c) { this.children.push(c); return c; }
  append(...cs) { for (const c of cs) this.children.push(c); }
  removeChild(c) { this.children = this.children.filter(x => x !== c); }
  get firstChild() { return this.children[0]; }
  get outerHTML() {
    const a = Object.entries(this.attrs).map(([k, v]) => ` ${k}="${escAttr(v)}"`).join("");
    const st = Object.entries(this.style).filter(([, v]) => v != null && v !== "")
      .map(([k, v]) => `${k.replace(/[A-Z]/g, m => "-" + m.toLowerCase())}:${v}`).join(";");
    const style = st ? ` style="${escAttr(st)}"` : "";
    const open = `<${this.tag}${a}${style}>`;
    const inner = this._html != null ? this._html
      : this._text != null ? esc(this._text)
      : this.children.map(c => c.outerHTML).join("");
    return `${open}${inner}</${this.tag}>`;
  }
}

globalThis.document = {
  createElementNS: (ns, tag) => new Node(tag, ns),
  createElement: tag => new Node(tag, null),
};
export { Node };
