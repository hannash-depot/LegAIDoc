/**
 * Truncates an HTML string to approximately the given percentage of visible text,
 * while keeping all HTML tags properly closed.
 */

const SELF_CLOSING_TAGS = new Set([
  'br',
  'hr',
  'img',
  'input',
  'meta',
  'link',
  'col',
  'area',
  'base',
  'embed',
  'source',
  'track',
  'wbr',
]);

/** Count visible (non-tag) characters in an HTML string. */
function countVisibleChars(html: string): number {
  let count = 0;
  let inTag = false;
  for (let i = 0; i < html.length; i++) {
    if (html[i] === '<') {
      inTag = true;
      continue;
    }
    if (html[i] === '>') {
      inTag = false;
      continue;
    }
    if (!inTag) count++;
  }
  return count;
}

/** Extract the tag name from an opening/closing tag string like "<div>" or "</td>". */
function getTagName(tag: string): string {
  const match = tag.match(/^<\/?([a-zA-Z][a-zA-Z0-9]*)/);
  return match ? match[1].toLowerCase() : '';
}

export function truncateHtml(html: string, percent: number): string {
  if (percent >= 100) return html;
  if (percent <= 0) return '';

  const totalVisible = countVisibleChars(html);
  const cutoff = Math.ceil((totalVisible * percent) / 100);

  if (totalVisible <= cutoff) return html;

  let visibleCount = 0;
  let inTag = false;
  let cutIndex = -1;
  const tagStack: string[] = [];
  let currentTag = '';

  // Walk the HTML to find the cutoff point and track open tags
  for (let i = 0; i < html.length; i++) {
    const ch = html[i];

    if (ch === '<') {
      inTag = true;
      currentTag = '<';
      continue;
    }

    if (ch === '>') {
      inTag = false;
      currentTag += '>';

      const tagName = getTagName(currentTag);
      if (tagName) {
        if (currentTag.startsWith('</')) {
          // Closing tag — pop from stack
          const lastIdx = tagStack.lastIndexOf(tagName);
          if (lastIdx !== -1) tagStack.splice(lastIdx, 1);
        } else if (!SELF_CLOSING_TAGS.has(tagName) && !currentTag.endsWith('/>')) {
          // Opening tag (not self-closing)
          tagStack.push(tagName);
        }
      }
      currentTag = '';
      continue;
    }

    if (inTag) {
      currentTag += ch;
      continue;
    }

    // Visible character
    visibleCount++;
    if (visibleCount >= cutoff) {
      cutIndex = i + 1;
      break;
    }
  }

  if (cutIndex === -1) return html;

  // Try to extend to the nearest block-level tag boundary to avoid cutting mid-paragraph
  const blockBoundaryPattern = /<\/(p|div|section|li|tr|h[1-6])>/gi;
  let bestEnd = cutIndex;
  const searchWindow = html.slice(cutIndex, cutIndex + 200);
  const match = blockBoundaryPattern.exec(searchWindow);
  if (match) {
    bestEnd = cutIndex + match.index + match[0].length;
    // Re-process the extended portion to update the tag stack
    let extInTag = false;
    let extTag = '';
    for (let i = cutIndex; i < bestEnd; i++) {
      const ch = html[i];
      if (ch === '<') {
        extInTag = true;
        extTag = '<';
        continue;
      }
      if (ch === '>') {
        extInTag = false;
        extTag += '>';
        const tagName = getTagName(extTag);
        if (tagName) {
          if (extTag.startsWith('</')) {
            const lastIdx = tagStack.lastIndexOf(tagName);
            if (lastIdx !== -1) tagStack.splice(lastIdx, 1);
          } else if (!SELF_CLOSING_TAGS.has(tagName) && !extTag.endsWith('/>')) {
            tagStack.push(tagName);
          }
        }
        extTag = '';
        continue;
      }
      if (extInTag) extTag += ch;
    }
  }

  // Build truncated HTML with properly closed tags
  let result = html.slice(0, bestEnd);
  for (let i = tagStack.length - 1; i >= 0; i--) {
    result += `</${tagStack[i]}>`;
  }

  return result;
}
