import DOMPurify from 'isomorphic-dompurify';

/**
 * Allowed HTML tags for legal document rendering.
 * Restrictive allowlist — no scripts, iframes, or event handlers.
 */
const ALLOWED_TAGS = [
  'p',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'table',
  'thead',
  'tbody',
  'tr',
  'td',
  'th',
  'span',
  'section',
  'div',
  'br',
  'hr',
  'strong',
  'em',
  'b',
  'i',
  'u',
  'ul',
  'ol',
  'li',
  'a',
];

const ALLOWED_ATTR = ['style', 'class', 'dir', 'lang', 'colspan', 'rowspan', 'href'];

/**
 * Sanitize HTML content for safe rendering in documents and PDFs.
 * Strips all script tags, event handlers, and disallowed elements.
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
  });
}

/**
 * Escape a plain text value for safe insertion into HTML.
 * Use this for user-provided values interpolated into templates.
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}
