import { describe, expect, it } from 'vitest';
import { renderMarkdownPreview } from '@/lib/markdownPreview';

describe('renderMarkdownPreview', () => {
  it('renders headings and emphasis', async () => {
    const html = await renderMarkdownPreview('# Hello\n\nThis is **bold**.');
    expect(html).toContain('<h1>Hello</h1>');
    expect(html).toContain('<strong>bold</strong>');
  });

  it('supports tables via GFM', async () => {
    const html = await renderMarkdownPreview('| col |\n| --- |\n| val |');
    expect(html).toContain('<table>');
    expect(html).toContain('<td>val</td>');
  });
});
