import { describe, it, expect } from 'vitest';
import { sanitizeHtml, escapeHtml } from '@/lib/sanitize';

describe('sanitizeHtml', () => {
  it('allows safe HTML tags', () => {
    const html = '<p>Hello <strong>world</strong></p>';
    expect(sanitizeHtml(html)).toBe(html);
  });

  it('strips script tags', () => {
    const html = '<p>Hello</p><script>alert("xss")</script>';
    expect(sanitizeHtml(html)).toBe('<p>Hello</p>');
  });

  it('strips iframe tags', () => {
    const html = '<p>Content</p><iframe src="evil.com"></iframe>';
    expect(sanitizeHtml(html)).toBe('<p>Content</p>');
  });

  it('strips event handlers', () => {
    const html = '<p onclick="alert(1)">Click me</p>';
    const result = sanitizeHtml(html);
    expect(result).not.toContain('onclick');
    expect(result).toContain('<p>Click me</p>');
  });

  it('allows table elements', () => {
    const html = '<table><tr><td>Cell</td></tr></table>';
    expect(sanitizeHtml(html)).toContain('<table>');
    expect(sanitizeHtml(html)).toContain('<td>');
  });

  it('allows style and dir attributes', () => {
    const html = '<div dir="rtl" style="color: red;">RTL text</div>';
    const result = sanitizeHtml(html);
    expect(result).toContain('dir="rtl"');
    expect(result).toContain('style="color: red;"');
  });

  it('allows list elements', () => {
    const html = '<ul><li>Item 1</li><li>Item 2</li></ul>';
    expect(sanitizeHtml(html)).toBe(html);
  });
});

describe('escapeHtml', () => {
  it('escapes HTML special characters', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
    );
  });

  it('escapes ampersands', () => {
    expect(escapeHtml('A & B')).toBe('A &amp; B');
  });

  it('escapes single quotes', () => {
    expect(escapeHtml("it's")).toBe('it&#x27;s');
  });

  it('returns plain text unchanged', () => {
    expect(escapeHtml('Hello World')).toBe('Hello World');
  });

  it('handles Hebrew text correctly', () => {
    const hebrew = 'שם המשכיר';
    expect(escapeHtml(hebrew)).toBe(hebrew);
  });
});
