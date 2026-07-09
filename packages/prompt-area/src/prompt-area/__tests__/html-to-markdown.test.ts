import { describe, it, expect } from 'vitest'
import { htmlToMarkdown } from '../html-to-markdown'

describe('htmlToMarkdown', () => {
  // -------------------------------------------------------------------------
  // Inline emphasis
  // -------------------------------------------------------------------------

  it('converts <strong> to bold', () => {
    expect(htmlToMarkdown('<strong>hello</strong>')).toBe('**hello**')
  })

  it('converts <b> to bold', () => {
    expect(htmlToMarkdown('<b>hello</b>')).toBe('**hello**')
  })

  it('converts <em> to italic', () => {
    expect(htmlToMarkdown('<em>hi</em>')).toBe('*hi*')
  })

  it('converts <i> to italic', () => {
    expect(htmlToMarkdown('<i>hi</i>')).toBe('*hi*')
  })

  it('collapses nested bold+italic to a triple marker', () => {
    expect(htmlToMarkdown('<strong><em>x</em></strong>')).toBe('***x***')
  })

  it('collapses combined bold+italic inline styles to a triple marker', () => {
    expect(htmlToMarkdown('<span style="font-weight:700;font-style:italic">x</span>')).toBe(
      '***x***',
    )
  })

  it('detects Google-Docs style bold via inline style attribute', () => {
    expect(htmlToMarkdown('<span style="font-weight:700">g</span>')).toBe('**g**')
  })

  it('respects font-weight:normal on a <b> wrapper (Google Docs root)', () => {
    expect(htmlToMarkdown('<b style="font-weight:normal">plain</b>')).toBe('plain')
  })

  it('detects italic via inline style attribute', () => {
    expect(htmlToMarkdown('<span style="font-style:italic">g</span>')).toBe('*g*')
  })

  it('converts strikethrough to ~~', () => {
    expect(htmlToMarkdown('<s>x</s>')).toBe('~~x~~')
    expect(htmlToMarkdown('<del>x</del>')).toBe('~~x~~')
    expect(htmlToMarkdown('<span style="text-decoration:line-through">x</span>')).toBe('~~x~~')
  })

  // -------------------------------------------------------------------------
  // Links & images
  // -------------------------------------------------------------------------

  it('converts an anchor to a markdown link', () => {
    expect(htmlToMarkdown('<a href="https://x.com">site</a>')).toBe('[site](https://x.com)')
  })

  it('emits a bare URL when the anchor text equals its href', () => {
    expect(htmlToMarkdown('<a href="https://x.com">https://x.com</a>')).toBe('https://x.com')
  })

  it('emits the bare href when the anchor has no text', () => {
    expect(htmlToMarkdown('<a href="https://x.com"></a>')).toBe('https://x.com')
  })

  it('drops unsafe hrefs and keeps only the text', () => {
    expect(htmlToMarkdown('<a href="javascript:alert(1)">click</a>')).toBe('click')
    expect(htmlToMarkdown('<a href="#">click</a>')).toBe('click')
  })

  it('converts an image to a markdown image', () => {
    expect(htmlToMarkdown('<img src="https://x.com/a.png" alt="a">')).toBe(
      '![a](https://x.com/a.png)',
    )
  })

  it('converts an image with empty alt', () => {
    expect(htmlToMarkdown('<img src="https://x.com/a.png">')).toBe('![](https://x.com/a.png)')
  })

  // -------------------------------------------------------------------------
  // Block-level
  // -------------------------------------------------------------------------

  it('maps heading level to # count', () => {
    expect(htmlToMarkdown('<h1>Title</h1>')).toBe('# Title')
    expect(htmlToMarkdown('<h2>Title</h2>')).toBe('## Title')
    expect(htmlToMarkdown('<h6>Title</h6>')).toBe('###### Title')
  })

  it('inline-converts content inside a heading', () => {
    expect(htmlToMarkdown('<h2><strong>Big</strong> title</h2>')).toBe('## **Big** title')
  })

  it('separates paragraphs by a blank line', () => {
    expect(htmlToMarkdown('<p>one</p><p>two</p>')).toBe('one\n\ntwo')
  })

  it('converts <br> to a single newline', () => {
    expect(htmlToMarkdown('a<br>b')).toBe('a\nb')
  })

  it('converts <hr> to a thematic break', () => {
    expect(htmlToMarkdown('<p>a</p><hr><p>b</p>')).toBe('a\n\n---\n\nb')
  })

  it('converts <blockquote> with > prefix', () => {
    expect(htmlToMarkdown('<blockquote>quote</blockquote>')).toBe('> quote')
  })

  // -------------------------------------------------------------------------
  // Lists
  // -------------------------------------------------------------------------

  it('converts an unordered list to dash bullets', () => {
    expect(htmlToMarkdown('<ul><li>a</li><li>b</li></ul>')).toBe('- a\n- b')
  })

  it('converts an ordered list to numbered items', () => {
    expect(htmlToMarkdown('<ol><li>a</li><li>b</li></ol>')).toBe('1. a\n2. b')
  })

  it('honors the ordered list start attribute', () => {
    expect(htmlToMarkdown('<ol start="3"><li>a</li><li>b</li></ol>')).toBe('3. a\n4. b')
  })

  it('indents nested lists by two spaces per depth level', () => {
    const html = '<ul><li>a<ul><li>a1</li><li>a2</li></ul></li><li>b</li></ul>'
    expect(htmlToMarkdown(html)).toBe('- a\n  - a1\n  - a2\n- b')
  })

  it('resets numbering for sibling ordered lists', () => {
    const html = '<ol><li>a</li></ol><ol><li>b</li></ol>'
    expect(htmlToMarkdown(html)).toBe('1. a\n\n1. b')
  })

  it('nests ordered lists with two-space indent and per-level numbering', () => {
    const html = '<ol><li>a<ol><li>a1</li><li>a2</li></ol></li><li>b</li></ol>'
    expect(htmlToMarkdown(html)).toBe('1. a\n  1. a1\n  2. a2\n2. b')
  })

  it('nests ordered lists three levels deep (Slack "Copy message" shape)', () => {
    const html =
      '<ol><li>Branding<ol><li>present</li><li>pitch<ol><li>warm intro</li><li>outreach</li></ol></li></ol></li><li>ICP</li></ol>'
    expect(htmlToMarkdown(html)).toBe(
      '1. Branding\n  1. present\n  2. pitch\n    1. warm intro\n    2. outreach\n2. ICP',
    )
  })

  it('nests an unordered list inside an ordered item (mixed markers)', () => {
    const html = '<ol><li>a<ul><li>x</li><li>y</li></ul></li><li>b</li></ol>'
    expect(htmlToMarkdown(html)).toBe('1. a\n  - x\n  - y\n2. b')
  })

  it('keeps a link inside a nested list item intact', () => {
    const html = '<ol><li>a<ol><li>see <a href="https://x.io">x</a></li></ol></li></ol>'
    expect(htmlToMarkdown(html)).toBe('1. a\n  1. see [x](https://x.io)')
  })

  // -------------------------------------------------------------------------
  // Code
  // -------------------------------------------------------------------------

  it('wraps inline code in backticks', () => {
    expect(htmlToMarkdown('<code>npm i</code>')).toBe('`npm i`')
  })

  it('does not convert emphasis inside inline code', () => {
    expect(htmlToMarkdown('<code>a * b</code>')).toBe('`a * b`')
  })

  it('widens the fence for inline code containing a backtick', () => {
    expect(htmlToMarkdown('<code>a`b</code>')).toBe('`` a`b ``')
  })

  it('converts <pre><code> to a fenced block', () => {
    expect(htmlToMarkdown('<pre><code>const a = 1</code></pre>')).toBe('```\nconst a = 1\n```')
  })

  it('derives the fence language from a language class', () => {
    expect(htmlToMarkdown('<pre><code class="language-ts">let a</code></pre>')).toBe(
      '```ts\nlet a\n```',
    )
  })

  it('preserves interior newlines and markers raw in a code block', () => {
    expect(htmlToMarkdown('<pre><code>a\n* b\nc</code></pre>')).toBe('```\na\n* b\nc\n```')
  })

  // -------------------------------------------------------------------------
  // Tables
  // -------------------------------------------------------------------------

  it('converts a GFM table', () => {
    const html =
      '<table><thead><tr><th>H1</th><th>H2</th></tr></thead><tbody><tr><td>a</td><td>b</td></tr></tbody></table>'
    expect(htmlToMarkdown(html)).toBe('| H1 | H2 |\n| --- | --- |\n| a | b |')
  })

  it('escapes literal pipes inside table cells', () => {
    const html = '<table><tr><th>H</th></tr><tr><td>a|b</td></tr></table>'
    expect(htmlToMarkdown(html)).toBe('| H |\n| --- |\n| a\\|b |')
  })

  // -------------------------------------------------------------------------
  // Unwrapping, entities, whitespace, escaping
  // -------------------------------------------------------------------------

  it('unwraps a plain span to its text', () => {
    expect(htmlToMarkdown('<span>plain</span>')).toBe('plain')
  })

  it('unwraps <div> block wrappers to lines', () => {
    expect(htmlToMarkdown('<div>a</div><div>b</div>')).toBe('a\n\nb')
  })

  it('drops <style> and <script> content', () => {
    expect(htmlToMarkdown('<style>.x{}</style><p>body</p>')).toBe('body')
    expect(htmlToMarkdown('<script>evil()</script><p>body</p>')).toBe('body')
  })

  it('escapes literal asterisks in prose so they do not re-parse as emphasis', () => {
    expect(htmlToMarkdown('<p>2 * 3 = 6</p>')).toBe('2 \\* 3 = 6')
  })

  it('decodes entities and normalizes &nbsp; to a regular space', () => {
    expect(htmlToMarkdown('<p>a&nbsp;&amp;&nbsp;b</p>')).toBe('a & b')
  })

  it('collapses inter-element whitespace to single spaces', () => {
    expect(htmlToMarkdown('<b>bold</b>   and   <i>it</i>')).toBe('**bold** and *it*')
  })

  it('returns an empty string for empty or whitespace-only html', () => {
    expect(htmlToMarkdown('')).toBe('')
    expect(htmlToMarkdown('<p>   </p>')).toBe('')
  })

  it('keeps a one-line mixed paste on a single line (no spurious blank lines)', () => {
    expect(htmlToMarkdown('<b>bold</b> and <i>it</i>')).toBe('**bold** and *it*')
  })

  it('caps consecutive blank lines at one between blocks', () => {
    expect(htmlToMarkdown('<p>a</p>\n\n\n<p>b</p>')).toBe('a\n\nb')
  })
})
