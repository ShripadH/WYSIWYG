import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'syntaxHighlight', standalone: true })
export class SyntaxHighlightPipe implements PipeTransform {
  transform(code: string, language: 'json' | 'html' = 'json'): string {
    if (!code) return '';

    try {
      if (language === 'json') {
        code = JSON.stringify(JSON.parse(code), null, 2);
        return this.highlightJson(code);
      } else {
        return this.highlightHtml(code);
      }
    } catch (e: any) {
      return `<span style="color: red;">Error: ${e.message}</span>`;
    }
  }

  private highlightJson(json: string): string {
    return json
      .replace(/(&)/g, '&amp;')
      .replace(/(>)/g, '&gt;')
      .replace(/(<)/g, '&lt;')
      .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|\d+)/g, match => {
        let cls = 'number';
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = 'key';
          } else {
            cls = 'string';
          }
        } else if (/true|false/.test(match)) {
          cls = 'boolean';
        } else if (/null/.test(match)) {
          cls = 'null';
        }
        return `<span class="${cls}">${match}</span>`;
      });
  }

  private highlightHtml(html: string): string {
    return html
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="comment">$1</span>') // comments
      .replace(/(&lt;\/?[a-zA-Z\-]+)(.*?)(&gt;)/g, (_match, p1, p2, p3) => {
        return `<span class="tag">${p1}</span><span class="attr">${p2}</span><span class="tag">${p3}</span>`;
      });
  }
} 