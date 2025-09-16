/**
 * Mobile-first markdown processor for HowToMgr guides
 */

export class MarkdownProcessor {
  static toHTML(markdown) {
    if (!markdown) return '';

    const lines = markdown.split('\n');
    const result = [];
    let inCodeBlock = false;
    let codeLanguage = '';
    let codeLines = [];
    let inList = false;
    let listType = 'ul';

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];

      // Handle code blocks
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          // End code block
          const code = codeLines.join('\n');
          result.push(this.createCodeBlock(code, codeLanguage));
          inCodeBlock = false;
          codeLanguage = '';
          codeLines = [];
        } else {
          // Start code block
          codeLanguage = line.substring(3).trim() || 'text';
          inCodeBlock = true;
        }
        continue;
      }

      if (inCodeBlock) {
        codeLines.push(line);
        continue;
      }

      // Close lists when we hit non-list content
      if (inList && !line.match(/^\s*[-*\d]/)) {
        result.push(`</${listType}>`);
        inList = false;
      }

      // Process different line types
      const processed = this.processLine(line);

      // Handle list items
      if (processed.startsWith('<li>')) {
        if (!inList) {
          listType = line.match(/^\s*\d+\./) ? 'ol' : 'ul';
          result.push(`<${listType}>`);
          inList = true;
        }
      }

      result.push(processed);
    }

    // Close any open lists
    if (inList) {
      result.push(`</${listType}>`);
    }

    return result.join('\n');
  }

  static processLine(line) {
    // Empty lines
    if (line.trim() === '') {
      return '';
    }

    // Headers with mobile-friendly IDs
    if (line.startsWith('### ')) {
      const text = line.substring(4).trim();
      const id = this.createId(text);
      return `<h3 id="${id}" class="mobile-header">${this.processInline(text)}</h3>`;
    }
    if (line.startsWith('## ')) {
      const text = line.substring(3).trim();
      const id = this.createId(text);
      return `<h2 id="${id}" class="mobile-header">${this.processInline(text)}</h2>`;
    }
    if (line.startsWith('# ')) {
      const text = line.substring(2).trim();
      const id = this.createId(text);
      return `<h1 id="${id}" class="mobile-header">${this.processInline(text)}</h1>`;
    }

    // Lists
    if (line.match(/^\s*[-*]\s+/)) {
      const content = line.replace(/^\s*[-*]\s+/, '');
      return `<li class="mobile-list-item">${this.processInline(content)}</li>`;
    }

    if (line.match(/^\s*\d+\.\s+/)) {
      const content = line.replace(/^\s*\d+\.\s+/, '');
      return `<li class="mobile-list-item">${this.processInline(content)}</li>`;
    }

    // Blockquotes
    if (line.startsWith('> ')) {
      const content = line.substring(2);
      return `<blockquote class="mobile-blockquote">${this.processInline(content)}</blockquote>`;
    }

    // Regular paragraphs
    return `<p class="mobile-paragraph">${this.processInline(line)}</p>`;
  }

  static processInline(text) {
    // Inline code (before other processing)
    text = text.replace(/`([^`]+)`/g, '<code class="mobile-inline-code">$1</code>');

    // Bold and italic
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\*([^*\s][^*]*[^*\s])\*/g, '<em>$1</em>');

    // Links with mobile-friendly attributes
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener" class="mobile-link">$1</a>');

    return text;
  }

  static createCodeBlock(code, language) {
    const escapedCode = this.escapeHtml(code);
    const displayLang = language === 'text' ? '' : language;

    return `<div class="mobile-code-block" data-language="${language}">
      <div class="mobile-code-header">
        <span class="mobile-code-language">${displayLang}</span>
        <button class="mobile-copy-button" onclick="copyCode(this)" title="Copy code">
          <span class="copy-icon">📋</span>
          <span class="copy-text">Copy</span>
        </button>
      </div>
      <div class="mobile-code-content">
        <pre><code class="language-${language}">${escapedCode}</code></pre>
      </div>
    </div>`;
  }

  static createId(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  static escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  static calculateReadTime(text) {
    const wordsPerMinute = 200;
    const wordCount = text.split(/\s+/).length;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return minutes === 1 ? '1 min' : `${minutes} min`;
  }
}