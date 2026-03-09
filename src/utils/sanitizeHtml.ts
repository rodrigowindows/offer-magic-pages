/**
 * Simple HTML sanitizer to prevent XSS attacks in template previews.
 * Strips dangerous tags/attributes while preserving safe formatting.
 */

const ALLOWED_TAGS = new Set([
  'a', 'b', 'br', 'div', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'hr', 'i', 'img', 'li', 'ol', 'p', 'span', 'strong', 'table',
  'tbody', 'td', 'th', 'thead', 'tr', 'u', 'ul', 'blockquote',
  'pre', 'code', 'section', 'header', 'footer', 'main', 'article',
  'center', 'font', 'head', 'body', 'html', 'meta', 'title', 'style',
  'link', 'sup', 'sub', 'small', 'big', 'label', 'button',
]);

const ALLOWED_ATTRS = new Set([
  'href', 'src', 'alt', 'title', 'class', 'style', 'width', 'height',
  'target', 'rel', 'align', 'valign', 'bgcolor', 'border', 'cellpadding',
  'cellspacing', 'colspan', 'rowspan', 'color', 'face', 'size', 'type',
  'name', 'content', 'charset', 'http-equiv',
]);

const DANGEROUS_PATTERNS = [
  /javascript\s*:/gi,
  /vbscript\s*:/gi,
  /data\s*:(?!image\/)/gi,
  /on\w+\s*=/gi,
  /<\s*script/gi,
  /<\s*iframe/gi,
  /<\s*object/gi,
  /<\s*embed/gi,
  /<\s*form/gi,
  /<\s*input/gi,
  /<\s*textarea/gi,
  /<\s*select/gi,
];

/**
 * Sanitizes HTML by removing dangerous patterns.
 * For template previews where we control the input templates.
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';

  let sanitized = html;

  // Remove script/iframe/object/embed/form tags and their content
  sanitized = sanitized.replace(/<script[\s\S]*?<\/script>/gi, '');
  sanitized = sanitized.replace(/<iframe[\s\S]*?<\/iframe>/gi, '');
  sanitized = sanitized.replace(/<iframe[\s\S]*?\/?>/gi, '');
  sanitized = sanitized.replace(/<object[\s\S]*?<\/object>/gi, '');
  sanitized = sanitized.replace(/<embed[\s\S]*?\/?>/gi, '');
  sanitized = sanitized.replace(/<form[\s\S]*?<\/form>/gi, '');
  sanitized = sanitized.replace(/<input[\s\S]*?\/?>/gi, '');
  sanitized = sanitized.replace(/<textarea[\s\S]*?<\/textarea>/gi, '');
  sanitized = sanitized.replace(/<select[\s\S]*?<\/select>/gi, '');

  // Remove event handlers (onclick, onerror, onload, etc.)
  sanitized = sanitized.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s+on\w+\s*=\s*[^\s>]*/gi, '');

  // Remove javascript: and vbscript: URLs
  sanitized = sanitized.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href="#"');
  sanitized = sanitized.replace(/src\s*=\s*["']javascript:[^"']*["']/gi, 'src=""');
  sanitized = sanitized.replace(/href\s*=\s*["']vbscript:[^"']*["']/gi, 'href="#"');

  // Remove data: URLs (except images)
  sanitized = sanitized.replace(/src\s*=\s*["']data:(?!image\/)[^"']*["']/gi, 'src=""');

  return sanitized;
}
