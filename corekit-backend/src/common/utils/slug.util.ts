/**
 * Generate a URL-friendly slug from a string.
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')        // Replace spaces with -
    .replace(/[^\w\-]+/g, '')    // Remove non-word chars
    .replace(/\-\-+/g, '-')     // Replace multiple - with single -
    .replace(/^-+/, '')          // Trim - from start
    .replace(/-+$/, '');         // Trim - from end
}

/**
 * Generate a unique slug by appending a random suffix.
 */
export function uniqueSlug(text: string): string {
  const base = slugify(text);
  const suffix = Math.random().toString(36).substring(2, 8);
  return `${base}-${suffix}`;
}
