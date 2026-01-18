export type Heading = {
  id: string;
  text: string;
  level: number;
};

/**
 * Extract headings from MDX content for table of contents.
 * Call this on the server with the raw MDX content.
 */
export function extractHeadings(rawContent: string): Heading[] {
  // eslint-disable-next-line sonarjs/slow-regex -- Input is trusted MDX content with short headings
  const headingRegex = /^#{2,3}\s+([^\n]+)$/gm;
  const headings: Heading[] = [];

  let match;
  while ((match = headingRegex.exec(rawContent)) !== null) {
    const text = match[1].trim();
    const level = match[0].startsWith('###') ? 3 : 2;
    // Generate ID same way as MDX/remark-slug does
    const id = text
      .toLowerCase()
      .replaceAll(/[^\w\s-]/g, '')
      .replaceAll(/\s+/g, '-')
      .replaceAll(/-+/g, '-')
      .trim();

    headings.push({ id, text, level });
  }

  return headings;
}
