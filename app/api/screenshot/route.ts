import { NextResponse } from 'next/server'

export const maxDuration = 60

const LOCAL_CHROME_PATHS: Record<string, string> = {
  darwin: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  win32: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  linux: '/usr/bin/google-chrome',
}

const CHROMIUM_REMOTE_URL =
  'https://github.com/Sparticuz/chromium/releases/download/v131.0.0/chromium-v131.0.0-pack.tar'

export async function POST(req: Request) {
  const { html, slideIndex = 0, totalSlides } = await req.json() as {
    html: string; slideIndex?: number; totalSlides?: number
  }
  if (!html) return NextResponse.json({ error: 'html required' }, { status: 400 })

  let chromium: typeof import('@sparticuz/chromium-min').default
  let puppeteer: typeof import('puppeteer-core')

  try {
    const mod = await import('@sparticuz/chromium-min')
    chromium = mod.default
  } catch (e) {
    return NextResponse.json({ error: `chromium import failed: ${e instanceof Error ? e.message : String(e)}` }, { status: 500 })
  }
  try {
    puppeteer = await import('puppeteer-core')
  } catch (e) {
    return NextResponse.json({ error: `puppeteer import failed: ${e instanceof Error ? e.message : String(e)}` }, { status: 500 })
  }

  let executablePath: string
  try {
    const { existsSync } = await import('fs')
    const local = LOCAL_CHROME_PATHS[process.platform] ?? ''
    if (local && existsSync(local)) {
      executablePath = local
    } else {
      executablePath = await chromium.executablePath(CHROMIUM_REMOTE_URL)
    }
  } catch (e) {
    return NextResponse.json({ error: `executablePath failed: ${e instanceof Error ? e.message : String(e)}` }, { status: 500 })
  }

  let browser: import('puppeteer-core').Browser
  try {
    browser = await puppeteer.launch({
      args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 660, height: 660, deviceScaleFactor: 2 },
      executablePath,
      headless: true,
    })
  } catch (e) {
    return NextResponse.json({ error: `browser launch failed: ${e instanceof Error ? e.message : String(e)}` }, { status: 500 })
  }

  const page = await browser.newPage()
  try {
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 15000 })
    await new Promise(r => setTimeout(r, 500))

    // 테마바·도트 숨기기
    await page.evaluate(() => {
      const bar = document.querySelector('.theme-bar') as HTMLElement | null
      if (bar) bar.style.display = 'none'
      const dots = document.getElementById('dots')
      if (dots) dots.style.display = 'none'
    })

    const deck = await page.$('#deck')
    if (!deck) return NextResponse.json({ error: '#deck not found in HTML' }, { status: 500 })

    // 전체 슬라이드 캡처 (하나의 브라우저에서 순차 캡처)
    if (totalSlides && totalSlides > 1) {
      const images: string[] = []
      for (let i = 0; i < totalSlides; i++) {
        if (i > 0) {
          await page.evaluate((idx: number) => {
            ;(window as unknown as Record<string, (i: number) => void>).goTo?.(idx)
          }, i)
          await new Promise(r => setTimeout(r, 300))
        }
        const raw = await deck.screenshot({ type: 'png' })
        images.push(Buffer.from(raw).toString('base64'))
      }
      return NextResponse.json({ images }, {
        headers: { 'Cache-Control': 'no-store' }
      })
    }

    // 단일 슬라이드 캡처
    if (slideIndex > 0) {
      await page.evaluate((idx: number) => {
        ;(window as unknown as Record<string, (i: number) => void>).goTo?.(idx)
      }, slideIndex)
      await new Promise(r => setTimeout(r, 300))
    }

    const raw = await deck.screenshot({ type: 'png' })
    return new Response(Buffer.from(raw).buffer as ArrayBuffer, {
      headers: { 'Content-Type': 'image/png', 'Cache-Control': 'no-store' }
    })
  } catch (e) {
    return NextResponse.json({ error: `render failed: ${e instanceof Error ? e.message : String(e)}` }, { status: 500 })
  } finally {
    await page.close()
    await browser.close()
  }
}
