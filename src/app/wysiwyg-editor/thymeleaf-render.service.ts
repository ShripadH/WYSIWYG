import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThymeleafRenderService {

  constructor() { }

  renderTemplate(html: string, data: any): string {
    // Parse HTML string into a DOM tree
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    this.processNode(doc.body, data);
    return doc.body.innerHTML;
  }

  private processNode(node: Node, data: any) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      // th:remove
      if (el.hasAttribute('th:remove')) {
        el.remove();
        return;
      }
      // th:if
      if (el.hasAttribute('th:if')) {
        const expr = el.getAttribute('th:if')!;
        if (!this.evalExpr(expr, data)) {
          el.remove();
          return;
        }
        el.removeAttribute('th:if');
      }
      // th:unless
      if (el.hasAttribute('th:unless')) {
        const expr = el.getAttribute('th:unless')!;
        if (this.evalExpr(expr, data)) {
          el.remove();
          return;
        }
        el.removeAttribute('th:unless');
      }
      // th:each
      if (el.hasAttribute('th:each')) {
        const expr = el.getAttribute('th:each')!;
        const match = expr.match(/(\w+)\s*:\s*\$\{(.+?)\}/);
        if (match) {
          const varName = match[1];
          const arr = this.evalExpr('${' + match[2] + '}', data);
          if (Array.isArray(arr)) {
            const parent = el.parentElement;
            if (parent) {
              arr.forEach((item: any) => {
                const clone = el.cloneNode(true) as HTMLElement;
                const newData = { ...data, [varName]: item };
                clone.removeAttribute('th:each');
                this.processNode(clone, newData);
                parent.insertBefore(clone, el);
              });
              el.remove();
              return;
            }
          }
        }
      }
      // th:text
      if (el.hasAttribute('th:text')) {
        const expr = el.getAttribute('th:text')!;
        el.textContent = this.evalExpr(expr, data);
        el.removeAttribute('th:text');
      }
      // th:utext
      if (el.hasAttribute('th:utext')) {
        const expr = el.getAttribute('th:utext')!;
        el.innerHTML = this.evalExpr(expr, data);
        el.removeAttribute('th:utext');
      }
      // th:attr
      if (el.hasAttribute('th:attr')) {
        const expr = el.getAttribute('th:attr')!;
        expr.split(',').forEach(pair => {
          const [k, v] = pair.split('=');
          if (k && v) {
            el.setAttribute(k.trim(), this.evalExpr(v.trim(), data));
          }
        });
        el.removeAttribute('th:attr');
      }
      // th:attrappend (TODO)
      // th:class
      if (el.hasAttribute('th:class')) {
        const expr = el.getAttribute('th:class')!;
        el.setAttribute('class', this.evalExpr(expr, data));
        el.removeAttribute('th:class');
      }
      // th:classappend
      if (el.hasAttribute('th:classappend')) {
        const expr = el.getAttribute('th:classappend')!;
        const existing = el.getAttribute('class') || '';
        el.setAttribute('class', existing + ' ' + this.evalExpr(expr, data));
        el.removeAttribute('th:classappend');
      }
      // th:value
      if (el.hasAttribute('th:value')) {
        const expr = el.getAttribute('th:value')!;
        el.setAttribute('value', this.evalExpr(expr, data));
        el.removeAttribute('th:value');
      }
      // th:title
      if (el.hasAttribute('th:title')) {
        const expr = el.getAttribute('th:title')!;
        el.setAttribute('title', this.evalExpr(expr, data));
        el.removeAttribute('th:title');
      }
      // th:href
      if (el.hasAttribute('th:href')) {
        const expr = el.getAttribute('th:href')!;
        el.setAttribute('href', this.evalExpr(expr, data));
        el.removeAttribute('th:href');
      }
      // th:src
      if (el.hasAttribute('th:src')) {
        const expr = el.getAttribute('th:src')!;
        el.setAttribute('src', this.evalExpr(expr, data));
        el.removeAttribute('th:src');
      }
      // th:style
      if (el.hasAttribute('th:style')) {
        const expr = el.getAttribute('th:style')!;
        el.setAttribute('style', this.evalExpr(expr, data));
        el.removeAttribute('th:style');
      }
      // th:id
      if (el.hasAttribute('th:id')) {
        const expr = el.getAttribute('th:id')!;
        el.setAttribute('id', this.evalExpr(expr, data));
        el.removeAttribute('th:id');
      }
      // th:data-*
      Array.from(el.attributes).forEach(attr => {
        if (attr.name.startsWith('th:data-')) {
          const dataAttr = attr.name.replace('th:', '');
          el.setAttribute(dataAttr, this.evalExpr(attr.value, data));
          el.removeAttribute(attr.name);
        }
      });
      // TODO: th:attrappend, th:switch, th:case, th:insert, th:replace, th:include, th:fragment, th:action, th:object, th:method, th:field, th:checked, th:selected
      // Process children
      Array.from(el.childNodes).forEach(child => this.processNode(child, data));
    }
  }

  private evalExpr(expr: string, data: any): any {
    // Simple ${...} or literal
    const match = expr.match(/^\$\{(.+?)\}$/);
    if (match) {
      const path = match[1].trim();
      return this.resolvePath(data, path);
    }
    // Literal string or number
    if (/^['"].*['"]$/.test(expr)) {
      return expr.slice(1, -1);
    }
    // Fallback: try as path
    return this.resolvePath(data, expr.replace(/^\$\{/, '').replace(/\}$/, '').trim());
  }

  private resolvePath(obj: any, path: string): any {
    // Support dot notation: a.b.c
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  }
}
