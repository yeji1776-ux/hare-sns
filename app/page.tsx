'use client'

import { useState, useEffect, useRef } from 'react'

const IFRAME_W = 480

interface CarouselSlide { slideNumber: number; headline: string; bodyText: string }
interface InstagramOutput { hook: string; caption: string; hashtags: string[]; carouselSlides: CarouselSlide[] }
interface Scene { sceneNumber: number; sceneDescription: string; narration: string; estimatedDuration: string }
interface ClipVideoScript { scenes: Scene[]; totalEstimatedDuration: string }
interface ClipTextPost { mainText: string; hashtags: string[] }
interface ConversionResult { instagram: InstagramOutput; clipVideoScript: ClipVideoScript; clipTextPost: ClipTextPost; cardNewsHtml: string; cardNewsHtmlV2?: string }

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
  const [iframeContainerW, setIframeContainerW] = useState<number | null>(null)
  const [cardVersion, setCardVersion] = useState<'v1' | 'v2'>('v1')

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

  useEffect(() => {
    try {
      const stored = localStorage.getItem('hare_sns_history')
      if (stored) setHistory(JSON.parse(stored))
    } catch {
      // ignore
    }
  }, [])

  async function handleConvert() {
    const trimmed = url.trim()
    if (!trimmed) return
    if (!trimmed.includes('naver.com')) { setError('네이버 블로그 URL만 지원합니다.'); return }
    if (!/\/\d{5,}/.test(trimmed)) { setError('개별 포스트 URL을 입력해주세요.\n예: blog.naver.com/아이디/포스트번호'); return }
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch('/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? '변환 실패')
      setResult(data)
      setTab('cardnews')

      // Save to localStorage history
      try {
        const item: HistoryItem = {
          id: crypto.randomUUID(),
          url: url.trim(),
          title: data.instagram?.hook?.slice(0, 30) ?? url.trim().slice(-30),
          savedAt: new Date().toISOString(),
          result: data,
        }
        const prev = JSON.parse(localStorage.getItem('hare_sns_history') ?? '[]')
        const updated = [item, ...prev].slice(0, 20)
        localStorage.setItem('hare_sns_history', JSON.stringify(updated))
        setHistory(updated)
      } catch {
        // ignore localStorage errors
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  function loadHistory(item: HistoryItem) {
    setUrl(item.url)
    setResult(item.result)
    setTab('cardnews')
    setError('')
  }

  function deleteHistory(id: string) {
    try {
      const updated = history.filter(h => h.id !== id)
      localStorage.setItem('hare_sns_history', JSON.stringify(updated))
      setHistory(updated)
    } catch {
      // ignore
    }
  }

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key)
      setTimeout(() => setCopied(''), 2000)
    })
  }

  const tabBtn = (id: ResultTab, label: string) => (
    <button
      key={id}
      onClick={() => setTab(id)}
      style={{
        padding: '10px 20px', border: 'none', background: 'transparent',
        borderBottom: tab === id ? '2px solid #0284c7' : '2px solid transparent',
        color: tab === id ? '#0284c7' : '#64748b', fontWeight: tab === id ? 700 : 500,
        fontSize: '14px', cursor: 'pointer', marginBottom: '-2px',
      }}
    >{label}</button>
  )

  const glass = { background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.7)', borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }

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

      {/* History collapsible panel */}
      <div style={{ marginBottom: '16px' }}>
        <button
          onClick={() => setHistoryOpen(o => !o)}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.7)',
            background: 'rgba(255,255,255,0.45)', backdropFilter: 'blur(12px)',
            fontSize: '14px', fontWeight: 700, color: '#334155', cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)', width: '100%', justifyContent: 'space-between',
          }}
        >
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
                  <div
                    key={item.id}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: 'rgba(255,255,255,0.5)', borderRadius: '10px', padding: '10px 12px',
                      border: '1px solid rgba(255,255,255,0.7)',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0, marginRight: '10px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{formatDate(item.savedAt)}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      <button
                        onClick={() => loadHistory(item)}
                        style={{
                          padding: '5px 10px', borderRadius: '7px', border: '1px solid rgba(2,132,199,0.4)',
                          background: 'rgba(2,132,199,0.08)', color: '#0284c7', fontSize: '12px',
                          fontWeight: 700, cursor: 'pointer',
                        }}
                      >불러오기</button>
                      <button
                        onClick={() => deleteHistory(item.id)}
                        style={{
                          padding: '5px 9px', borderRadius: '7px', border: '1px solid rgba(239,68,68,0.3)',
                          background: 'rgba(239,68,68,0.07)', color: '#ef4444', fontSize: '13px',
                          fontWeight: 700, cursor: 'pointer', lineHeight: 1,
                        }}
                      >×</button>
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
          <input
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleConvert()}
            placeholder="https://blog.naver.com/아이디/포스트번호"
            style={{
              flex: 1, minWidth: '200px', padding: '12px 16px', borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.8)', background: 'rgba(255,255,255,0.7)',
              fontSize: '14px', outline: 'none', color: '#1e293b',
            }}
          />
          <button
            onClick={handleConvert}
            disabled={loading || !url.trim()}
            style={{
              padding: '12px 24px', borderRadius: '10px', border: 'none',
              background: loading || !url.trim() ? '#94a3b8' : 'linear-gradient(145deg, #38bdf8, #0284c7)',
              color: '#fff', fontWeight: 700, fontSize: '14px',
              cursor: loading || !url.trim() ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(2,132,199,0.3)',
            }}
          >
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

          <div style={{ padding: '24px' }}>
            {/* 카드뉴스 */}
            {tab === 'cardnews' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {result.cardNewsHtmlV2 && (
                      <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.6)', borderRadius: '8px', padding: '2px', border: '1px solid rgba(255,255,255,0.8)' }}>
                        <button onClick={() => setCardVersion('v1')} style={{ padding: '5px 12px', fontSize: '12px', fontWeight: cardVersion==='v1' ? 700 : 400, border: 'none', borderRadius: '6px', cursor: 'pointer', background: cardVersion==='v1' ? '#38bdf8' : 'transparent', color: cardVersion==='v1' ? '#fff' : '#64748b' }}>텍스트</button>
                        <button onClick={() => setCardVersion('v2')} style={{ padding: '5px 12px', fontSize: '12px', fontWeight: cardVersion==='v2' ? 700 : 400, border: 'none', borderRadius: '6px', cursor: 'pointer', background: cardVersion==='v2' ? '#38bdf8' : 'transparent', color: cardVersion==='v2' ? '#fff' : '#64748b' }}>📷 포토</button>
                      </div>
                    )}
                    <button onClick={() => { const ah=(cardVersion==='v2'&&result.cardNewsHtmlV2)?result.cardNewsHtmlV2:result.cardNewsHtml; const b=new Blob([ah],{type:'text/html'}); const u=URL.createObjectURL(b); window.open(u,'_blank'); setTimeout(()=>URL.revokeObjectURL(u),5000); }} style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.7)', background: 'rgba(209,250,229,0.7)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', color: '#065f46' }}>🖥 편집하기</button>
                  </div>
                  <button
                    onClick={() => {
                      const ah = (cardVersion==='v2'&&result.cardNewsHtmlV2)?result.cardNewsHtmlV2:result.cardNewsHtml
                      const blob = new Blob([ah], { type: 'text/html' })
                      const a = document.createElement('a')
                      a.href = URL.createObjectURL(blob)
                      a.download = 'cardnews.html'
                      a.click()
                    }}
                    style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.5)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: '#334155' }}
                  >⬇️ HTML 다운로드</button>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.4)', borderRadius: '10px', padding: '12px 16px', marginBottom: '12px', border: '1px solid rgba(255,255,255,0.6)' }}>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: '10px', letterSpacing: '0.05em' }}>카테고리 테마 가이드 (카드뉴스 내 점 클릭으로 변경)</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {[
                      { name: 'sky', label: '📚 스터디/오피스', color: '#0284c7' },
                      { name: 'food', label: '🍽️ 맛집/음식', color: '#ea580c' },
                      { name: 'cafe', label: '☕ 카페/디저트', color: '#db2777' },
                      { name: 'travel', label: '✈️ 여행/나들이', color: '#0d9488' },
                      { name: 'beauty', label: '💄 뷰티/패션', color: '#7c3aed' },
                      { name: 'culture', label: '🎭 문화/전시', color: '#4338ca' },
                      { name: 'life', label: '🏡 라이프/육아', color: '#ca8a04' },
                      { name: 'health', label: '💪 헬스/운동', color: '#059669' },
                    ].map(t => (
                      <div key={t.name} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.6)', borderRadius: '20px', padding: '4px 10px', border: '1px solid rgba(255,255,255,0.8)' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: t.color, flexShrink: 0 }} />
                        <span style={{ fontSize: '11px', fontWeight: 500, color: '#334155' }}>{t.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div ref={iframeContainerRef} style={{ overflow: 'hidden', borderRadius: '12px', width: '100%', height: `${iframeContainerW ?? IFRAME_W}px` }}>
                  {iframeContainerW && (
                    <iframe
                      key={`${iframeContainerW}-${cardVersion}`}
                      srcDoc={((cardVersion === 'v2' && result.cardNewsHtmlV2) ? result.cardNewsHtmlV2 : result.cardNewsHtml)
                        .replace('width=device-width', `width=${iframeContainerW}`)
                        .replace('</head>', '<style>.save-bar{display:none!important}</style></head>')}
                      style={{ width: `${iframeContainerW}px`, height: `${iframeContainerW}px`, border: 'none', display: 'block' }}
                      title="카드뉴스 미리보기"
                    />
                  )}
                </div>
              </div>
            )}

            {/* 인스타그램 */}
            {tab === 'instagram' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Hook */}
                <div style={{ background: 'rgba(255,255,255,0.4)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255,255,255,0.6)' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#0284c7', marginBottom: '8px', letterSpacing: '0.1em' }}>HOOK</div>
                  <p style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>{result.instagram.hook}</p>
                </div>

                {/* Caption */}
                <div style={{ background: 'rgba(255,255,255,0.4)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255,255,255,0.6)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#0284c7', letterSpacing: '0.1em' }}>CAPTION</div>
                    <button onClick={() => copy(result.instagram.caption, 'caption')} style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', color: copied === 'caption' ? '#059669' : '#334155' }}>
                      {copied === 'caption' ? '✓ 복사됨' : '복사'}
                    </button>
                  </div>
                  <p style={{ fontSize: '14px', color: '#334155', lineHeight: 1.8, whiteSpace: 'pre-wrap', margin: 0 }}>{result.instagram.caption}</p>
                </div>

                {/* Hashtags */}
                <div style={{ background: 'rgba(255,255,255,0.4)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255,255,255,0.6)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#0284c7', letterSpacing: '0.1em' }}>HASHTAGS</div>
                    <button onClick={() => copy(result.instagram.hashtags.join(' '), 'hashtags')} style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', color: copied === 'hashtags' ? '#059669' : '#334155' }}>
                      {copied === 'hashtags' ? '✓ 복사됨' : '복사'}
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {result.instagram.hashtags.map((tag, i) => (
                      <span key={i} style={{ background: 'rgba(2,132,199,0.1)', color: '#0284c7', padding: '4px 10px', borderRadius: '100px', fontSize: '12px', fontWeight: 600 }}>{tag}</span>
                    ))}
                  </div>
                </div>

                {/* Carousel */}
                <div style={{ background: 'rgba(255,255,255,0.4)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255,255,255,0.6)' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#0284c7', marginBottom: '12px', letterSpacing: '0.1em' }}>CAROUSEL SLIDES</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {result.instagram.carouselSlides.map((slide) => (
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

            {/* 네이버 클립 */}
            {tab === 'clip' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Video Script */}
                <div style={{ background: 'rgba(255,255,255,0.4)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255,255,255,0.6)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#0284c7', letterSpacing: '0.1em' }}>영상 스크립트</div>
                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>총 {result.clipVideoScript.totalEstimatedDuration}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {result.clipVideoScript.scenes.map((scene) => (
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

                {/* Text Post */}
                <div style={{ background: 'rgba(255,255,255,0.4)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255,255,255,0.6)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#0284c7', letterSpacing: '0.1em' }}>텍스트 게시글</div>
                    <button onClick={() => copy(result.clipTextPost.mainText + '\n\n' + result.clipTextPost.hashtags.join(' '), 'cliptext')} style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', color: copied === 'cliptext' ? '#059669' : '#334155' }}>
                      {copied === 'cliptext' ? '✓ 복사됨' : '복사'}
                    </button>
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
