'use client'

import { useState, useEffect, useRef } from 'react'

interface CarouselSlide { slideNumber: number; headline: string; bodyText: string }
interface InstagramOutput { hook: string; caption: string; hashtags: string[]; carouselSlides: CarouselSlide[] }
interface Scene { sceneNumber: number; sceneDescription: string; narration: string; estimatedDuration: string }
interface ClipVideoScript { scenes: Scene[]; totalEstimatedDuration: string }
interface ClipTextPost { mainText: string; hashtags: string[] }
interface ConversionResult { instagram: InstagramOutput; clipVideoScript: ClipVideoScript; clipTextPost: ClipTextPost; cardNewsHtml: string; cardNewsImageHtml?: string }

interface HistoryItem {
  id: string
  url: string
  title: string
  savedAt: string
  result: ConversionResult
}

type ResultTab = 'cardnews' | 'instagram' | 'clip'

function formatDate(iso: string): string {
  const d = new Date(iso)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${mm}/${dd} ${hh}:${min}`
}

export default function Home() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<ConversionResult | null>(null)
  const [tab, setTab] = useState<ResultTab>('cardnews')
  const [copied, setCopied] = useState('')
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [historyOpen, setHistoryOpen] = useState(false)
  const iframeContainerRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [iframeContainerW, setIframeContainerW] = useState<number | null>(null)
  const [curSlide, setCurSlide] = useState(0)
  const [totalSlides, setTotalSlides] = useState(7)
  const [regenLoading, setRegenLoading] = useState<{ cardnews: boolean; instagram: boolean; clip: boolean }>({ cardnews: false, instagram: false, clip: false })
  const [cardMode, setCardMode] = useState<'simple' | 'image'>('image')
  const [activeTheme, setActiveTheme] = useState('sky')
  const busyRef = useRef(false)

  // iframe 너비 감지
  useEffect(() => {
    if (!result) return
    const el = iframeContainerRef.current
    if (!el) return
    const update = () => {
      const w = Math.round(el.getBoundingClientRect().width)
      if (w > 0) setIframeContainerW(w)
    }
    update()
    const obs = new ResizeObserver(update)
    obs.observe(el)
    return () => obs.disconnect()
  }, [result])

  // 슬라이드 변경 이벤트 수신
  useEffect(() => {
    function handler(e: MessageEvent) {
      if (e.data?.type === 'SLIDE_CHANGED') {
        setCurSlide(e.data.cur ?? 0)
        if (e.data.total) setTotalSlides(e.data.total)
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  // 히스토리 로드
  useEffect(() => {
    try {
      const stored = localStorage.getItem('hare_sns_history')
      if (stored) setHistory(JSON.parse(stored))
    } catch { /* ignore */ }
  }, [])

  // iframe 내부 함수 직접 호출
  function callIframe(fn: string, ...args: unknown[]) {
    try {
      const win = iframeRef.current?.contentWindow as Record<string, unknown> | null
      if (win && typeof win[fn] === 'function') (win[fn] as (...a: unknown[]) => void)(...args)
    } catch { /* ignore */ }
  }

  function shareCurrentSlide() {
    try {
      iframeRef.current?.contentWindow?.postMessage({ type: 'SHARE_CURRENT' }, '*')
    } catch { /* ignore */ }
  }

  function goSlide(dir: number) {
    callIframe('go', dir)
  }

  async function handleConvert() {
    const trimmed = url.trim()
    if (!trimmed) return
    if (!trimmed.includes('naver.com')) { setError('네이버 블로그 URL만 지원합니다.'); return }
    if (!/\/\d{5,}/.test(trimmed)) { setError('개별 포스트 URL을 입력해주세요.\n예: blog.naver.com/아이디/포스트번호'); return }
    setLoading(true); setError(''); setResult(null); setCurSlide(0)
    try {
      const res = await fetch('/api/convert', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: trimmed }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? '변환 실패')
      setResult(data)
      setTab('cardnews')
      try {
        const item: HistoryItem = { id: crypto.randomUUID(), url: trimmed, title: data.instagram?.hook?.slice(0, 30) ?? trimmed.slice(-30), savedAt: new Date().toISOString(), result: data }
        const prev = JSON.parse(localStorage.getItem('hare_sns_history') ?? '[]')
        const updated = [item, ...prev].slice(0, 20)
        localStorage.setItem('hare_sns_history', JSON.stringify(updated))
        setHistory(updated)
      } catch { /* ignore */ }
    } catch (e) {
      setError(e instanceof Error ? e.message : '오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function handleRegen(type: 'cardnews' | 'instagram' | 'clip') {
    if (!url.trim() || !result) return
    setRegenLoading(prev => ({ ...prev, [type]: true }))
    try {
      const res = await fetch('/api/regenerate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: url.trim(), type }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? '재생성 실패')
      setResult(prev => prev ? { ...prev, ...data } : prev)
      setCurSlide(0)
    } catch (e) {
      setError(e instanceof Error ? e.message : '재생성 중 오류가 발생했습니다.')
    } finally {
      setRegenLoading(prev => ({ ...prev, [type]: false }))
    }
  }

  function loadHistory(item: HistoryItem) {
    setUrl(item.url); setResult(item.result); setTab('cardnews'); setError(''); setCurSlide(0)
  }

  function deleteHistory(id: string) {
    try {
      const updated = history.filter(h => h.id !== id)
      localStorage.setItem('hare_sns_history', JSON.stringify(updated))
      setHistory(updated)
    } catch { /* ignore */ }
  }

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key)
      setTimeout(() => setCopied(''), 2000)
    })
  }

  const tabBtn = (id: ResultTab, label: string) => (
    <button key={id} onClick={() => setTab(id)} style={{ padding: '10px 20px', border: 'none', background: 'transparent', borderBottom: tab === id ? '2px solid #0284c7' : '2px solid transparent', color: tab === id ? '#0284c7' : '#64748b', fontWeight: tab === id ? 700 : 500, fontSize: '14px', cursor: 'pointer', marginBottom: '-2px' }}>{label}</button>
  )

  const glass = { background: 'rgba(255,255,255,0.55)', WebkitBackdropFilter: 'blur(16px)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.7)', borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }

  const navBtn = (dir: number, label: string) => (
    <button
      onClick={() => goSlide(dir)}
      style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.8)', background: 'rgba(255,255,255,0.6)', fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#334155', flexShrink: 0, WebkitBackdropFilter: 'blur(8px)', backdropFilter: 'blur(8px)' }}
    >{label}</button>
  )

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px 16px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <img src="/favicon.png" alt="hare" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
          <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a', margin: 0 }}>hare_table</h1>
        </div>
        <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>네이버 블로그 URL → 인스타그램 & 네이버 클립 자동 변환</p>
      </div>

      {/* History */}
      <div style={{ marginBottom: '16px' }}>
        <button onClick={() => setHistoryOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.45)', WebkitBackdropFilter: 'blur(12px)', backdropFilter: 'blur(12px)', fontSize: '14px', fontWeight: 700, color: '#334155', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', width: '100%', justifyContent: 'space-between' }}>
          <span>🗂 기록 {history.length > 0 ? `(${history.length})` : ''}</span>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>{historyOpen ? '▲ 접기' : '▼ 펼치기'}</span>
        </button>
        {historyOpen && (
          <div style={{ ...glass, marginTop: '8px', padding: '12px', maxHeight: '300px', overflowY: 'auto' }}>
            {history.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '13px', textAlign: 'center', margin: '16px 0' }}>저장된 기록이 없습니다.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {history.map(item => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.5)', borderRadius: '10px', padding: '10px 12px', border: '1px solid rgba(255,255,255,0.7)' }}>
                    <div style={{ flex: 1, minWidth: 0, marginRight: '10px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{formatDate(item.savedAt)}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      <button onClick={() => loadHistory(item)} style={{ padding: '5px 10px', borderRadius: '7px', border: '1px solid rgba(2,132,199,0.4)', background: 'rgba(2,132,199,0.08)', color: '#0284c7', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>불러오기</button>
                      <button onClick={() => deleteHistory(item.id)} style={{ padding: '5px 9px', borderRadius: '7px', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.07)', color: '#ef4444', fontSize: '13px', fontWeight: 700, cursor: 'pointer', lineHeight: 1 }}>×</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ ...glass, padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <input value={url} onChange={e => setUrl(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleConvert()} placeholder="https://blog.naver.com/아이디/포스트번호" style={{ flex: 1, minWidth: '200px', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.8)', background: 'rgba(255,255,255,0.7)', fontSize: '14px', outline: 'none', color: '#1e293b' }} />
          <button onClick={handleConvert} disabled={loading || !url.trim()} style={{ padding: '12px 24px', borderRadius: '10px', border: 'none', background: loading || !url.trim() ? '#94a3b8' : 'linear-gradient(145deg,#38bdf8,#0284c7)', color: '#fff', fontWeight: 700, fontSize: '14px', cursor: loading || !url.trim() ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(2,132,199,0.3)' }}>
            {loading ? '변환 중...' : '✨ 변환하기'}
          </button>
        </div>
        {error && <p style={{ color: '#ef4444', fontSize: '13px', marginTop: '12px', marginBottom: 0 }}>⚠️ {error}</p>}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ ...glass, padding: '48px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
          <p style={{ color: '#64748b', fontWeight: 500 }}>AI가 콘텐츠를 생성하고 있어요...</p>
          <p style={{ color: '#94a3b8', fontSize: '13px' }}>보통 20-40초 정도 걸려요</p>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div style={glass}>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.6)', padding: '0 20px' }}>
            {tabBtn('cardnews', '🖼 카드뉴스')}
            {tabBtn('instagram', '📸 인스타그램')}
            {tabBtn('clip', '🎬 네이버 클립')}
          </div>

          <div style={{ padding: '20px' }}>
            {/* ── 카드뉴스 ── */}
            {tab === 'cardnews' && (
              <div>
                {/* 액션 버튼 */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px', alignItems: 'center' }}>
                  <button onClick={() => handleRegen('cardnews')} disabled={regenLoading.cardnews} style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.7)', background: regenLoading.cardnews ? '#94a3b8' : 'rgba(255,255,255,0.5)', fontSize: '13px', fontWeight: 600, cursor: regenLoading.cardnews ? 'not-allowed' : 'pointer', color: '#334155' }}>
                    {regenLoading.cardnews ? '⏳' : '🔄'} 새로고침
                  </button>
                  <button onClick={() => callIframe('openModal')} style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.5)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: '#334155' }}>
                    💬 캡션
                  </button>
                  <button onClick={() => callIframe('saveCurrentSlide')} style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.7)', background: '#fce7f3', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: '#be185d' }}>
                    📸 저장
                  </button>
                  <button onClick={shareCurrentSlide} style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.7)', background: '#e0f2fe', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: '#0369a1' }}>
                    🔗 공유
                  </button>
                  <a href="https://www.instagram.com/hare_table/" target="_blank" rel="noopener noreferrer" style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg,#f9a8d4,#c084fc)', fontSize: '13px', fontWeight: 700, color: '#fff', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>📲 내 인스타</a>
                </div>

                {/* 심플/이미지 탭 + 테마 선택 */}
                {result.cardNewsImageHtml && result.cardNewsImageHtml !== result.cardNewsHtml && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', gap: '2px', background: 'rgba(255,255,255,0.5)', borderRadius: '8px', padding: '2px', border: '1px solid rgba(255,255,255,0.7)' }}>
                      {([['simple', '심플'], ['image', '🖼️ 이미지']] as const).map(([id, label]) => (
                        <button key={id} onClick={() => setCardMode(id)} style={{ padding: '6px 14px', fontSize: '12px', fontWeight: cardMode === id ? 700 : 500, border: 'none', borderRadius: '6px', cursor: 'pointer', background: cardMode === id ? '#0284c7' : 'transparent', color: cardMode === id ? '#fff' : '#64748b', transition: 'all 0.15s' }}>{label}</button>
                      ))}
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', letterSpacing: '0.03em' }}>테마</span>
                  {[
                    { name: 'sky', label: '📚 스터디', bg: 'linear-gradient(135deg,#38bdf8,#0284c7)' },
                    { name: 'food', label: '🍽️ 맛집', bg: 'linear-gradient(135deg,#fb923c,#ea580c)' },
                    { name: 'cafe', label: '☕ 카페', bg: 'linear-gradient(135deg,#f472b6,#db2777)' },
                    { name: 'travel', label: '✈️ 여행', bg: 'linear-gradient(135deg,#2dd4bf,#0d9488)' },
                    { name: 'beauty', label: '💄 뷰티', bg: 'linear-gradient(135deg,#a78bfa,#7c3aed)' },
                    { name: 'culture', label: '🎭 문화', bg: 'linear-gradient(135deg,#818cf8,#4338ca)' },
                    { name: 'life', label: '🏡 라이프', bg: 'linear-gradient(135deg,#fbbf24,#ca8a04)' },
                    { name: 'health', label: '💪 헬스', bg: 'linear-gradient(135deg,#34d399,#059669)' },
                  ].map(t => (
                    <button key={t.name} onClick={() => { setActiveTheme(t.name); try { iframeRef.current?.contentWindow?.postMessage({ type: 'SET_THEME', theme: t.name }, '*') } catch {} }} title={t.label}
                      style={{ width: '24px', height: '24px', borderRadius: '50%', border: activeTheme === t.name ? '2.5px solid #fff' : '2px solid rgba(255,255,255,0.4)', background: t.bg, cursor: 'pointer', flexShrink: 0, padding: 0, transform: activeTheme === t.name ? 'scale(1.2)' : 'scale(1)', boxShadow: activeTheme === t.name ? '0 2px 8px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.1)', transition: 'all 0.15s' }} />
                  ))}
                </div>

                {/* iframe + 부모 페이지 내비게이션 */}
                <div style={{ position: 'relative' }}>
                  <div ref={iframeContainerRef} style={{ width: '100%', aspectRatio: '1', borderRadius: '12px' }}>
                    {iframeContainerW && (
                      <iframe
                        ref={iframeRef}
                        key={iframeContainerW}
                        srcDoc={(cardMode === 'image' && result.cardNewsImageHtml ? result.cardNewsImageHtml : result.cardNewsHtml)
                          .replace('width=device-width', `width=${iframeContainerW}`)
                          .replace('</head>', `<style>*{touch-action:manipulation;-webkit-tap-highlight-color:transparent}#saveModal img{touch-action:auto!important;-webkit-touch-callout:default!important}.theme-bar{display:none!important}</style></head>`)}
                        style={{ width: `${iframeContainerW}px`, height: `${iframeContainerW}px`, border: 'none', display: 'block', borderRadius: '12px' }}
                        title="카드뉴스 미리보기"
                      />
                    )}
                  </div>
                  {/* 이전 버튼 — 부모 페이지 (iOS 터치 안정적) */}
                  {curSlide > 0 && (
                    <button onClick={() => goSlide(-1)} style={{ position: 'absolute', left: '-20px', top: '50%', transform: 'translateY(-50%)', width: '40px', height: '40px', borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.85)', background: 'rgba(255,255,255,0.7)', WebkitBackdropFilter: 'blur(8px)', backdropFilter: 'blur(8px)', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#334155', boxShadow: '0 2px 8px rgba(0,0,0,0.12)', zIndex: 10 }}>‹</button>
                  )}
                  {/* 다음 버튼 — 부모 페이지 */}
                  {curSlide < totalSlides - 1 && (
                    <button onClick={() => goSlide(1)} style={{ position: 'absolute', right: '-20px', top: '50%', transform: 'translateY(-50%)', width: '40px', height: '40px', borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.85)', background: 'rgba(255,255,255,0.7)', WebkitBackdropFilter: 'blur(8px)', backdropFilter: 'blur(8px)', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#334155', boxShadow: '0 2px 8px rgba(0,0,0,0.12)', zIndex: 10 }}>›</button>
                  )}
                </div>

                {/* 슬라이드 카운터 */}
                <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>
                  {curSlide + 1} / {totalSlides}
                </div>
              </div>
            )}

            {/* ── 인스타그램 ── */}
            {tab === 'instagram' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={() => handleRegen('instagram')} disabled={regenLoading.instagram} style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.7)', background: regenLoading.instagram ? '#94a3b8' : 'rgba(255,255,255,0.5)', fontSize: '13px', fontWeight: 600, cursor: regenLoading.instagram ? 'not-allowed' : 'pointer', color: '#334155' }}>{regenLoading.instagram ? '⏳ 생성 중...' : '🔄 새로고침'}</button>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.4)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255,255,255,0.6)' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#0284c7', marginBottom: '8px', letterSpacing: '0.1em' }}>HOOK</div>
                  <p style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>{result.instagram.hook}</p>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.4)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255,255,255,0.6)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#0284c7', letterSpacing: '0.1em' }}>CAPTION</div>
                    <button onClick={() => copy(result.instagram.caption, 'caption')} style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', color: copied === 'caption' ? '#059669' : '#334155' }}>{copied === 'caption' ? '✓ 복사됨' : '복사'}</button>
                  </div>
                  <p style={{ fontSize: '14px', color: '#334155', lineHeight: 1.8, whiteSpace: 'pre-wrap', margin: 0 }}>{result.instagram.caption}</p>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.4)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255,255,255,0.6)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#0284c7', letterSpacing: '0.1em' }}>HASHTAGS</div>
                    <button onClick={() => copy(result.instagram.hashtags.join(' '), 'hashtags')} style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', color: copied === 'hashtags' ? '#059669' : '#334155' }}>{copied === 'hashtags' ? '✓ 복사됨' : '복사'}</button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {result.instagram.hashtags.map((tag, i) => (
                      <span key={i} style={{ background: 'rgba(2,132,199,0.1)', color: '#0284c7', padding: '4px 10px', borderRadius: '100px', fontSize: '12px', fontWeight: 600 }}>{tag}</span>
                    ))}
                  </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.4)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255,255,255,0.6)' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#0284c7', marginBottom: '12px', letterSpacing: '0.1em' }}>CAROUSEL SLIDES</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {result.instagram.carouselSlides.map(slide => (
                      <div key={slide.slideNumber} style={{ background: 'rgba(255,255,255,0.5)', borderRadius: '10px', padding: '12px', border: '1px solid rgba(255,255,255,0.7)' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>SLIDE {slide.slideNumber}</div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>{slide.headline}</div>
                        <div style={{ fontSize: '13px', color: '#475569' }}>{slide.bodyText}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── 네이버 클립 ── */}
            {tab === 'clip' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={() => handleRegen('clip')} disabled={regenLoading.clip} style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.7)', background: regenLoading.clip ? '#94a3b8' : 'rgba(255,255,255,0.5)', fontSize: '13px', fontWeight: 600, cursor: regenLoading.clip ? 'not-allowed' : 'pointer', color: '#334155' }}>{regenLoading.clip ? '⏳ 생성 중...' : '🔄 새로고침'}</button>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.4)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255,255,255,0.6)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#0284c7', letterSpacing: '0.1em' }}>영상 스크립트</div>
                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>총 {result.clipVideoScript.totalEstimatedDuration}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {result.clipVideoScript.scenes.map(scene => (
                      <div key={scene.sceneNumber} style={{ background: 'rgba(255,255,255,0.5)', borderRadius: '10px', padding: '12px', border: '1px solid rgba(255,255,255,0.7)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}>SCENE {scene.sceneNumber}</span>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>{scene.estimatedDuration}</span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>🎥 {scene.sceneDescription}</div>
                        <div style={{ fontSize: '13px', color: '#1e293b', fontWeight: 500 }}>💬 {scene.narration}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.4)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255,255,255,0.6)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#0284c7', letterSpacing: '0.1em' }}>텍스트 게시글</div>
                    <button onClick={() => copy(result.clipTextPost.mainText + '\n\n' + result.clipTextPost.hashtags.join(' '), 'cliptext')} style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', color: copied === 'cliptext' ? '#059669' : '#334155' }}>{copied === 'cliptext' ? '✓ 복사됨' : '복사'}</button>
                  </div>
                  <p style={{ fontSize: '14px', color: '#334155', lineHeight: 1.8, whiteSpace: 'pre-wrap', margin: '0 0 12px' }}>{result.clipTextPost.mainText}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {result.clipTextPost.hashtags.map((tag, i) => (
                      <span key={i} style={{ background: 'rgba(2,132,199,0.1)', color: '#0284c7', padding: '4px 10px', borderRadius: '100px', fontSize: '12px', fontWeight: 600 }}>{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
