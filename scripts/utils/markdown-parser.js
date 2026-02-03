/**
 * PF2e Fake ID - Markdown to Foundry/PF2e Formatter
 * 
 * Converts LLM-generated markdown into Foundry VTT and PF2e-compatible HTML.
 */

/**
 * Parse markdown content into Foundry/PF2e formatted HTML
 * @param {string} content - Raw markdown text
 * @returns {string} HTML formatted for Foundry
 */
export function parseMarkdown(content) {
  if (!content) return '';
  
  // Normalize line breaks
  let html = content.trim();
  
  // Process block-level elements first (order matters!)
  html = parseCodeBlocks(html);
  html = parseHeaders(html);
  html = parseLists(html);
  html = parseParagraphs(html);
  
  // Then process inline elements
  html = parseInlineCode(html);
  html = parseBold(html);
  html = parseItalic(html);
  html = parseLinks(html);
  // html = parsePF2eSpecialTerms(html); // Disabled - only convert markdown formatting, don't add extra emphasis
  
  return html;
}

/**
 * Parse code blocks (```code```)
 */
function parseCodeBlocks(text) {
  return text.replace(/```[\s\S]*?```/g, (match) => {
    const code = match.replace(/```(\w+)?\n?/, '').replace(/```$/, '');
    return `<pre><code>${escapeHtml(code)}</code></pre>`;
  });
}

/**
 * Parse headers (# Header)
 */
function parseHeaders(text) {
  const lines = text.split('\n');
  const processed = lines.map(line => {
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const content = match[2];
      return `<h${level}>${content}</h${level}>`;
    }
    return line;
  });
  return processed.join('\n');
}

/**
 * Parse lists (bullets and numbered)
 */
function parseLists(text) {
  const lines = text.split('\n');
  let result = [];
  let inList = false;
  let listType = null; // 'ul' or 'ol'
  let listItems = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check if line is a bullet point
    const bulletMatch = line.match(/^[•\-\*]\s+(.+)$/);
    const numberedMatch = line.match(/^\d+\.\s+(.+)$/);
    
    if (bulletMatch || numberedMatch) {
      const content = bulletMatch ? bulletMatch[1] : numberedMatch[1];
      const currentType = bulletMatch ? 'ul' : 'ol';
      
      // Start new list or switch list type
      if (!inList || listType !== currentType) {
        // Close previous list if exists
        if (inList) {
          result.push(`<${listType}>${listItems.join('')}</${listType}>`);
          listItems = [];
        }
        inList = true;
        listType = currentType;
      }
      
      listItems.push(`<li>${content}</li>`);
    } else {
      // Not a list item - close any open list
      if (inList) {
        result.push(`<${listType}>${listItems.join('')}</${listType}>`);
        listItems = [];
        inList = false;
        listType = null;
      }
      
      // Add non-list line
      if (line) {
        result.push(line);
      }
    }
  }
  
  // Close any remaining open list
  if (inList) {
    result.push(`<${listType}>${listItems.join('')}</${listType}>`);
  }
  
  return result.join('\n');
}

/**
 * Parse paragraphs (non-block elements)
 */
function parseParagraphs(text) {
  // Split by existing block elements (lists, headers, code blocks)
  const blockPattern = /(<\/?(?:ul|ol|li|h[1-6]|pre|code)[^>]*>)/;
  const parts = text.split(blockPattern);
  
  return parts.map(part => {
    // Skip if it's already a block element or empty
    if (part.match(blockPattern) || part.trim() === '') {
      return part;
    }
    
    // Split into lines and wrap non-empty lines in <p> tags
    const lines = part.split('\n').filter(line => line.trim());
    if (lines.length === 0) return '';
    
    // If it's a single line, just wrap it
    if (lines.length === 1) {
      return `<p>${lines[0].trim()}</p>`;
    }
    
    // Multiple lines - wrap each
    return lines.map(line => `<p>${line.trim()}</p>`).join('');
  }).join('');
}

/**
 * Parse inline code (`code`)
 */
function parseInlineCode(text) {
  return text.replace(/`([^`]+)`/g, (match, code) => {
    return `<code>${escapeHtml(code)}</code>`;
  });
}

/**
 * Parse bold text (**bold** or __bold__)
 */
function parseBold(text) {
  // Process ** first, then __
  let result = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  result = result.replace(/__(.+?)__/g, '<strong>$1</strong>');
  return result;
}

/**
 * Parse italic text (*italic* or _italic_)
 */
function parseItalic(text) {
  // Be careful not to match ** or __ (already processed as bold)
  // Use negative lookbehind/lookahead to avoid matching doubled characters
  let result = text.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
  result = result.replace(/(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/g, '<em>$1</em>');
  return result;
}

/**
 * Parse links ([text](url))
 */
function parseLinks(text) {
  return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

/**
 * Parse PF2e-specific terms and apply appropriate formatting
 * This adds visual flair for common game terms
 */
function parsePF2eSpecialTerms(text) {
  // Common damage types - wrap in spans for potential styling
  const damageTypes = [
    'fire', 'cold', 'electricity', 'acid', 'sonic', 'positive', 'negative',
    'force', 'mental', 'poison', 'piercing', 'slashing', 'bludgeoning'
  ];
  
  let result = text;
  
  // Damage types (case-insensitive, but preserve original case)
  damageTypes.forEach(type => {
    const regex = new RegExp(`\\b(${type})\\b(?!<)`, 'gi');
    result = result.replace(regex, (match) => {
      return `<span class="damage-type" data-damage-type="${type.toLowerCase()}">${match}</span>`;
    });
  });
  
  // Common conditions (preserve case)
  const conditions = [
    'blinded', 'broken', 'clumsy', 'confused', 'controlled', 'dazzled', 'deafened',
    'doomed', 'drained', 'dying', 'encumbered', 'enfeebled', 'fascinated', 'fatigued',
    'flat-footed', 'fleeing', 'friendly', 'frightened', 'grabbed', 'helpful', 'hidden',
    'hostile', 'immobilized', 'indifferent', 'invisible', 'observed', 'paralyzed',
    'persistent damage', 'petrified', 'prone', 'quickened', 'restrained', 'sickened',
    'slowed', 'stunned', 'stupefied', 'unconscious', 'undetected', 'unfriendly', 'wounded'
  ];
  
  conditions.forEach(condition => {
    const regex = new RegExp(`\\b(${condition})\\b(?!<)`, 'gi');
    result = result.replace(regex, (match) => {
      return `<span class="condition" data-condition="${condition.toLowerCase()}">${match}</span>`;
    });
  });
  
  return result;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Simple markdown parser for basic formatting (lightweight alternative)
 * Use this for simple use cases where full parsing isn't needed
 */
export function parseSimpleMarkdown(content) {
  if (!content) return '';
  
  let html = content.trim();
  
  // Basic inline formatting only
  html = parseBold(html);
  html = parseItalic(html);
  html = parseInlineCode(html);
  
  // Simple line breaks
  html = html.split('\n').map(line => {
    line = line.trim();
    if (!line) return '';
    
    // Check for bullet points
    const bulletMatch = line.match(/^[•\-\*]\s+(.+)$/);
    if (bulletMatch) {
      return `<li>${bulletMatch[1]}</li>`;
    }
    
    return `<p>${line}</p>`;
  }).filter(Boolean).join('');
  
  // Wrap consecutive <li> in <ul>
  html = html.replace(/(<li>.*?<\/li>)+/g, match => `<ul>${match}</ul>`);
  
  return html;
}
