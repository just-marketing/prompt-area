import { describe, it, expect } from 'vitest'
import { htmlToMarkdown, isOfficeHtml } from '../html-to-markdown'

/**
 * Abridged but structurally faithful Word-for-Mac clipboard HTML: office xmlns
 * declarations, ProgId meta, an `<xml>` data island (which the HTML parser
 * reparents out of `<head>` into `<body>`), a `<style>` block, StartFragment
 * markers, and an mso-list paragraph run — levels 1/2/1 with the `·` (Symbol)
 * and `o` (Courier New) marker glyphs inside `mso-list:Ignore` spans behind
 * downlevel-revealed `<![if !supportLists]>` conditional comments, plus `<o:p>`
 * placeholders. Word emits unquoted classes and single-quoted styles.
 */
const WORD_MAC_BULLETS = `<html xmlns:o="urn:schemas-microsoft-com:office:office"
xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta name=ProgId content=Word.Document>
<meta name=Generator content="Microsoft Word 15">
<xml><w:WordDocument><w:View>Normal</w:View><w:Zoom>0</w:Zoom></w:WordDocument></xml>
<style><!--
p.MsoListParagraphCxSpFirst, li.MsoListParagraphCxSpFirst
\t{mso-style-priority:34;margin-bottom:0in;mso-add-space:auto;text-indent:-.25in;}
--></style>
</head>
<body lang=EN-US style='tab-interval:.5in'>
<!--StartFragment-->
<p class=MsoListParagraphCxSpFirst style='text-indent:-.25in;mso-list:l0 level1 lfo1'><![if !supportLists]><span
style='font-family:Symbol;mso-fareast-font-family:Symbol;mso-bidi-font-family:Symbol'><span
style='mso-list:Ignore'>·<span style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
</span></span></span><![endif]>Alpha<o:p></o:p></p>
<p class=MsoListParagraphCxSpMiddle style='margin-left:1.0in;mso-add-space:auto;text-indent:-.25in;mso-list:l0 level2 lfo1'><![if !supportLists]><span
style='font-family:"Courier New";mso-fareast-font-family:"Courier New"'><span
style='mso-list:Ignore'>o<span style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;
</span></span></span><![endif]>Beta<o:p></o:p></p>
<p class=MsoListParagraphCxSpLast style='text-indent:-.25in;mso-list:l0 level1 lfo1'><![if !supportLists]><span
style='font-family:Symbol'><span style='mso-list:Ignore'>·<span
style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
</span></span></span><![endif]>Gamma<o:p></o:p></p>
<!--EndFragment-->
</body>
</html>`

/** Word list item in the Windows form: normal-comment-wrapped Ignore span. */
function wordItem(level: number, marker: string, text: string): string {
  return (
    `<p class=MsoListParagraphCxSpMiddle style='text-indent:-.25in;mso-list:l0 level${level} lfo1'>` +
    `<!--[if !supportLists]--><span style='mso-list:Ignore'>${marker}<span ` +
    `style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp; </span></span><!--[endif]-->` +
    `${text}<o:p></o:p></p>`
  )
}

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

  it('drops an image with an unsafe src (javascript:, bare #)', () => {
    expect(htmlToMarkdown('<img src="javascript:alert(1)" alt="x">')).toBe('')
    expect(htmlToMarkdown('<img src="#">')).toBe('')
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
  // Microsoft Word clipboard HTML (mso-list paragraphs — no <ul>/<ol>)
  // -------------------------------------------------------------------------

  it('converts a Word bullet list (mso-list paragraphs) to markdown bullets', () => {
    // Also proves: no blank lines between items, marker glyphs (·/o) and their
    // nbsp runs removed, level 2 → 2-space indent, <xml>/<o:p> junk excluded.
    expect(htmlToMarkdown(WORD_MAC_BULLETS)).toBe('- Alpha\n  - Beta\n- Gamma')
  })

  it('converts a Word ordered list with per-level numbering (1. / a. markers)', () => {
    const html =
      wordItem(1, '1.', 'First') +
      wordItem(2, 'a.', 'Sub one') +
      wordItem(2, 'b.', 'Sub two') +
      wordItem(1, '2.', 'Second')
    expect(htmlToMarkdown(html)).toBe('1. First\n  1. Sub one\n  2. Sub two\n2. Second')
  })

  it('separates a Word list from surrounding paragraphs by one blank line', () => {
    const html =
      '<p class=MsoNormal>Intro:</p>' +
      wordItem(1, '·', 'A') +
      wordItem(1, '·', 'B') +
      '<p class=MsoNormal>After</p>'
    expect(htmlToMarkdown(html)).toBe('Intro:\n\n- A\n- B\n\nAfter')
  })

  it("restarts a Word list run after an interrupting paragraph, keeping Word's numbers", () => {
    const html =
      wordItem(1, '1.', 'a') +
      wordItem(1, '2.', 'b') +
      '<p class=MsoNormal>para</p>' +
      wordItem(1, '3.', 'c') +
      wordItem(1, '4.', 'd')
    expect(htmlToMarkdown(html)).toBe('1. a\n2. b\n\npara\n\n3. c\n4. d')
  })

  it('handles the bogus-comment <![if !supportLists]> form (Word for Mac)', () => {
    const html =
      "<p class=MsoListParagraph style='mso-list:l0 level1 lfo1'><![if !supportLists]>" +
      "<span style='mso-list:Ignore'>·&nbsp;&nbsp;</span><![endif]>Item</p>"
    expect(htmlToMarkdown(html)).toBe('- Item')
  })

  it('handles the commented <!--[if !supportLists]--> form (Word for Windows)', () => {
    expect(htmlToMarkdown(wordItem(1, '·', 'Item'))).toBe('- Item')
  })

  it('falls back to a bullet when the marker is hidden inside one conditional comment', () => {
    // Filtered/Outlook HTML hides the whole marker span in a single comment,
    // so no marker text is available for ordered/bullet classification.
    const html =
      "<p class=MsoListParagraph style='mso-list:l0 level1 lfo1'>" +
      "<!--[if !supportLists]><span style='mso-list:Ignore'>1.</span><![endif]-->Item</p>"
    expect(htmlToMarkdown(html)).toBe('- Item')
  })

  it('does not treat a marker-less MsoListParagraph continuation as a list item', () => {
    // Word puts the MsoListParagraph class (without mso-list metadata) on
    // wrapped continuation paragraphs under a bullet — those are prose.
    const html =
      wordItem(1, '·', 'One') +
      '<p class=MsoListParagraph>continued text</p>' +
      wordItem(1, '·', 'Two')
    expect(htmlToMarkdown(html)).toBe('- One\n\ncontinued text\n\n- Two')
  })

  it('drops Word <o:p> placeholders and <xml> islands', () => {
    const html =
      '<xml><w:Data>junk</w:Data></xml>' +
      '<p class=MsoNormal>Hi<o:p></o:p></p><p class=MsoNormal><o:p>&nbsp;</o:p></p>'
    expect(htmlToMarkdown(html)).toBe('Hi')
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

describe('isOfficeHtml', () => {
  it('detects the Word clipboard fingerprints', () => {
    expect(isOfficeHtml(WORD_MAC_BULLETS)).toBe(true)
    expect(isOfficeHtml('<meta name=ProgId content=Word.Document><p>x</p>')).toBe(true)
    expect(isOfficeHtml('<p class=MsoNormal>x</p>')).toBe(true)
    expect(isOfficeHtml('<p class="MsoNormal">x</p>')).toBe(true)
    expect(isOfficeHtml('<span style="mso-bidi-font-weight:bold">x</span>')).toBe(true)
    expect(isOfficeHtml('<html xmlns:o="urn:schemas-microsoft-com:office:office">x</html>')).toBe(
      true,
    )
  })

  it('does not flag non-Office html', () => {
    expect(isOfficeHtml('')).toBe(false)
    expect(isOfficeHtml('<p>plain</p>')).toBe(false)
    expect(isOfficeHtml('<img src="https://x.com/a.png">')).toBe(false)
    // Google-Docs-shaped clipboard html must keep its current image-vs-text behavior.
    expect(isOfficeHtml('<b style="font-weight:normal" id="docs-internal-guid-abc">x</b>')).toBe(
      false,
    )
  })
})
