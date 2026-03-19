import { NextResponse } from 'next/server'
import chromium from '@sparticuz/chromium-min'
import puppeteer from 'puppeteer-core'

export const maxDuration = 30

// Chromium 143 binary for Lambda/Vercel (downloaded to /tmp at runtime)
const CHROMIUM_REMOTE_URL =
  'https://github.com/Sparticuz/chromium/releases/download/v143.0.0/chromium-v143.0.0-pack.tar'

const LOCAL_CHROME_PATHS: Record<string, string> = {
  darwin: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  win32: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  linux: '/usr/bin/google-chrome',
}

async function getExecPath(): Promise<string> {
  const { existsSync } = await import('fs')
  const p = LOCAL_CHROME_PATHS[process.platform] ?? ''
  if (p && existsSync(p)) return p
  return chromium.executablePath(CHROMIUM_REMOTE_URL)
}

export async function POST(req: Request) {
  const { html, slideIndex = 0 } = await req.json() as { html: string; slideIndex?: number }
  if (!html) return NextResponse.json({ error: 'html required' }, { status: 400 })

  const executablePath = await getExecPath()
  const browser = await puppeteer.launch({
    args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 660, height: 660, deviceScaleFactor: 2 },
    executablePath,
    headless: true,
  })

  const page = await browser.newPage()
  try {
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 20000 })

    if (slideIndex > 0) {
      await page.evaluate((idx: number) => {
        ;(window as unknown as Record<string, (i: number) => void>).goTo?.(idx)
      }, slideIndex)
      await new Promise(r => setTimeout(r, 700))
    }

    // Hide theme bar (color selector dots)
    await page.evaluate(() => {
      const bar = document.querySelector('.theme-bar') as HTMLElement | null
      if (bar) bar.style.display = 'none'
    })

    const deck = await page.$('#deck')
    if (!deck) throw new Error('#deck not found')

    const screenshot = await deck.screenshot({ type: 'png' }) as Buffer

    return new Response(screenshot.buffer as ArrayBuffer, {
      headers: { 'Content-Type': 'image/png', 'Cache-Control': 'no-store' }
    })
  } finally {
    await page.close()
    await browser.close()
  }
}
