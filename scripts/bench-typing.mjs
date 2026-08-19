#!/usr/bin/env node
/**
 * Real-browser typing benchmark for the PromptArea component.
 *
 * Drives the dev-only /bench page with Playwright (playwright-core + a
 * system Chromium) and measures, per keystroke:
 *   - sync ms:  time spent in synchronous input handlers (capture-phase
 *               listener starts the clock before React's root handler,
 *               bubble-phase document listener stops it after) — this is
 *               the component's per-keystroke JS + forced-layout cost.
 *   - frame ms: input event → next requestAnimationFrame — how long the
 *               keystroke keeps the next frame away (responsiveness).
 *
 * Usage:
 *   node scripts/bench-typing.mjs --url http://localhost:3000 --lines 600 \
 *     --mode md --autogrow 1 --label after --out bench-after.json
 *   node scripts/bench-typing.mjs --compare bench-before.json bench-after.json
 *
 * The dev server must be running (pnpm dev). Compare runs only against the
 * same server mode and machine.
 */

import { chromium } from 'playwright-core'
import { readFileSync, writeFileSync } from 'node:fs'

const EXECUTABLE = process.env.BENCH_CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'

function parseArgs(argv) {
  const args = {
    url: 'http://localhost:3000',
    lines: 600,
    mode: 'md',
    autogrow: '1',
    label: 'run',
    out: null,
    compare: null,
    typeDelay: 30,
  }
  for (let i = 2; i < argv.length; i++) {
    const key = argv[i]
    if (key === '--compare') {
      args.compare = [argv[++i], argv[++i]]
    } else if (key.startsWith('--')) {
      args[key.slice(2)] = argv[++i]
    }
  }
  args.lines = Number(args.lines)
  args.typeDelay = Number(args.typeDelay)
  return args
}

function stats(values) {
  if (values.length === 0) return { n: 0, median: 0, p95: 0, max: 0, mean: 0 }
  const sorted = [...values].sort((a, b) => a - b)
  const pick = (q) => sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))]
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  return {
    n: values.length,
    median: pick(0.5),
    p95: pick(0.95),
    max: sorted[sorted.length - 1],
    mean,
  }
}

function fmt(s) {
  return `n=${String(s.n).padStart(3)}  median=${s.median.toFixed(1).padStart(7)}ms  p95=${s.p95
    .toFixed(1)
    .padStart(7)}ms  max=${s.max.toFixed(1).padStart(7)}ms`
}

function printReport(label, report) {
  console.log(
    `\n=== ${label} (lines=${report.lines}, mode=${report.mode}, autogrow=${report.autogrow})`,
  )
  console.log(`  sync  ${fmt(report.sync)}`)
  console.log(`  frame ${fmt(report.frame)}`)
}

function compare(beforePath, afterPath) {
  const before = JSON.parse(readFileSync(beforePath, 'utf8'))
  const after = JSON.parse(readFileSync(afterPath, 'utf8'))
  printReport(`BEFORE ${before.label}`, before)
  printReport(`AFTER ${after.label}`, after)
  const speedup = (m) => (after[m].median > 0 ? before[m].median / after[m].median : Infinity)
  console.log(
    `\n  median speedup: sync ${speedup('sync').toFixed(1)}x, frame ${speedup('frame').toFixed(1)}x`,
  )
  const passSync = after.sync.median < 8
  const passFrame = after.frame.p95 < 50
  console.log(
    `  thresholds: sync median < 8ms → ${passSync ? 'PASS' : 'FAIL'}, frame p95 < 50ms → ${passFrame ? 'PASS' : 'FAIL'}`,
  )
  process.exitCode = passSync && passFrame ? 0 : 1
}

async function main() {
  const args = parseArgs(process.argv)
  if (args.compare) {
    compare(args.compare[0], args.compare[1])
    return
  }

  const browser = await chromium.launch({ executablePath: EXECUTABLE, headless: true })
  try {
    const page = await browser.newPage()

    await page.addInitScript(() => {
      window.__sync = []
      window.__frame = []
      window.__t0 = 0
      // Registered before React hydrates, so on the shared document node this
      // capture listener runs before React's — it starts the clock.
      document.addEventListener(
        'input',
        () => {
          window.__t0 = performance.now()
          requestAnimationFrame(() => {
            window.__frame.push(performance.now() - window.__t0)
          })
        },
        true,
      )
    })

    const url = `${args.url}/bench?lines=${args.lines}&mode=${args.mode}&autogrow=${args.autogrow}`
    console.log(`navigating ${url}`)
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await page.waitForFunction(() => window.__benchReady === true, undefined, { timeout: 180_000 })

    // The sync-end listener must run AFTER React's handlers. React (App
    // Router) attaches its delegated listeners on document during hydration,
    // and same-node same-phase listeners run in registration order — so this
    // one is registered only now, post-hydration.
    await page.evaluate(() => {
      document.addEventListener(
        'input',
        () => {
          window.__sync.push(performance.now() - window.__t0)
        },
        false,
      )
    })

    const midLine = Math.floor(args.lines / 2)
    const placed = await page.evaluate((line) => window.__placeCaretAtLine?.(line), midLine)
    if (!placed) throw new Error(`could not place caret at line ${midLine}`)

    // Warmup (JIT, style/layout caches), then reset metrics.
    await page.keyboard.type('warmup warmup ', { delay: args.typeDelay })
    await page.waitForTimeout(300)
    await page.evaluate(() => {
      window.__sync = []
      window.__frame = []
    })

    // Caret-integrity probe: plain-text offset before vs after typing.
    const offsetBefore = await page.evaluate(() => {
      const sel = window.getSelection()
      if (!sel || sel.rangeCount === 0) return -1
      const editor = document.querySelector('[data-test-id="bench-editor"]')
      const pre = document.createRange()
      pre.selectNodeContents(editor)
      const r = sel.getRangeAt(0)
      pre.setEnd(r.startContainer, r.startOffset)
      return pre.toString().length
    })

    // Measured scenario: prose + markdown + a URL at mid-document… (the
    // trailing padding is what the Backspaces below consume, keeping the URL
    // intact for the decoration sanity check)
    const typed =
      'The quick brown fox — **bold** move at https://bench.example/x with padding to erase'
    await page.keyboard.type(typed, { delay: args.typeDelay })
    // …then deletions…
    for (let i = 0; i < 15; i++) {
      await page.keyboard.press('Backspace', { delay: args.typeDelay })
    }
    // …then typing at the document end.
    await page.keyboard.press('Control+End')
    await page.keyboard.type(' tail typing zone', { delay: args.typeDelay })

    const metrics = await page.evaluate(() => ({ sync: window.__sync, frame: window.__frame }))

    // --- functional sanity checks ------------------------------------------
    // 1. Caret integrity: after `typed` minus 15 backspaces at mid-line, the
    //    plain-text offset advanced by exactly typed.length - 15.
    await page.evaluate((line) => window.__placeCaretAtLine?.(line), midLine)
    const offsetAfter = await page.evaluate(() => {
      const sel = window.getSelection()
      const editor = document.querySelector('[data-test-id="bench-editor"]')
      const pre = document.createRange()
      pre.selectNodeContents(editor)
      const r = sel.getRangeAt(0)
      pre.setEnd(r.startContainer, r.startOffset)
      return pre.toString().length
    })
    const expectedDelta = typed.length - 15
    if (offsetAfter - offsetBefore !== expectedDelta) {
      throw new Error(
        `caret integrity failed: offset delta ${offsetAfter - offsetBefore}, expected ${expectedDelta}`,
      )
    }

    // 2. The typed markdown and URL got decorated on the edited line.
    const decorated = await page.evaluate(() => {
      const editor = document.querySelector('[data-test-id="bench-editor"]')
      const bold = [...editor.querySelectorAll('span[data-md]')].some(
        (s) => s.textContent === '**bold**',
      )
      const url = [...editor.querySelectorAll('a[data-url]')].some((a) =>
        (a.textContent ?? '').startsWith('https://bench.example/x'),
      )
      return { bold, url }
    })
    if (!decorated.bold || !decorated.url) {
      throw new Error(`decoration sanity failed: ${JSON.stringify(decorated)}`)
    }

    // 3. Decorations elsewhere in the document survived the typing session.
    const counts = await page.evaluate(() => {
      const editor = document.querySelector('[data-test-id="bench-editor"]')
      return {
        bullets: editor.querySelectorAll('.prompt-area-list-bullet').length,
        headings: editor.querySelectorAll('.prompt-area-md-heading').length,
        urls: editor.querySelectorAll('a[data-url]').length,
      }
    })
    if (args.mode === 'md' && (counts.bullets === 0 || counts.headings === 0 || counts.urls < 2)) {
      throw new Error(`sibling decoration sanity failed: ${JSON.stringify(counts)}`)
    }

    const report = {
      label: args.label,
      lines: args.lines,
      mode: args.mode,
      autogrow: args.autogrow,
      typeDelay: args.typeDelay,
      timestamp: new Date().toISOString(),
      sync: stats(metrics.sync),
      frame: stats(metrics.frame),
      sanity: { caretDelta: expectedDelta, ...counts },
    }
    printReport(args.label, report)
    console.log(`  sanity: caret ok, decorations ok (${JSON.stringify(counts)})`)

    if (args.out) {
      writeFileSync(args.out, JSON.stringify(report, null, 2))
      console.log(`  wrote ${args.out}`)
    }
  } finally {
    await browser.close()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
