import { callGeminiJson } from './gemini'
import { BlogPost } from './scraper'
import { SponsorshipConfig } from './converter'

export interface CardNewsData {
  placeName: string
  coverTag: string
  coverHook: string
  coverAddress: string
  basicInfo: {
    location: string
    locationSub: string
    hours: string
    hoursSub: string
    price: string
    priceSub: string
    feature: string
    featureSub: string
  }
  highlightNum: string
  highlightUnit: string
  highlightHook: string
  featureTitle: string
  features: { icon: string; title: string; desc: string }[] // 4 items
  benefitTag: string
  benefitTitle: string
  benefits: { icon: string; text: string }[] // 3~6 items
  benefitSub: string
  reviewTitle: string
  reviews: string[] // 3 items
  closingArea: string
  closingTitle: string
  closingWord: string
  closingHashtags: string
  caption: string
}

function buildSponsorContext(s: SponsorshipConfig): string {
  if (!s.enabled) return ''
  const lines = ['\n=== 협찬(스폰서) 추가 요구사항 ===']
  if (s.rawRequirements) lines.push(`\n요구사항:\n${s.rawRequirements}`)
  if (s.mandatoryMentions.length > 0) lines.push(`\n필수 언급(본문): ${s.mandatoryMentions.join(', ')}`)
  if (s.requiredHashtags.length > 0) lines.push(`\n필수 해시태그(본문/해시태그): ${s.requiredHashtags.join(' ')}`)
  if (s.links.length > 0) lines.push(`\n포함 링크: ${s.links.join(', ')}`)
  if (s.prohibitedExpressions.length > 0) lines.push(`\n사용 금지 표현: ${s.prohibitedExpressions.join(', ')}`)
  return lines.join('')
}

export async function generateCardNewsData(post: BlogPost, s: SponsorshipConfig): Promise<CardNewsData> {
  const content = post.content.slice(0, 3000)
  const sponsor = buildSponsorContext(s)

  const prompt = `당신은 블로그 리뷰를 인스타그램 '글래스모피즘(하늘+실버)' 카드뉴스와 캡션으로 변환하는 전문가입니다.

=== 원문 ===
제목: ${post.title}
내용:
${content}
${sponsor}

=== 변환 요구사항 JSON 구조 (반드시 JSON만 반환) ===
{
  "placeName": "가게 또는 장소 이름 (10자 이내 최소화)",
  "coverTag": "☕️ 카페/디저트 (이모지+카테고리)",
  "coverHook": "가장 인상적인 첫 문장 재해석 훅 (20자 이내)",
  "coverAddress": "간단한 주소나 위치 (예: 연남동)",
  "basicInfo": {
    "location": "위치 요약", "locationSub": "보조 설명",
    "hours": "운영 시간 요약", "hoursSub": "휴무일 등",
    "price": "주요 가격대", "priceSub": "대표메뉴",
    "feature": "핵심 시설/특징", "featureSub": "주차, 예약 등"
  },
  "highlightNum": "핵심 숫자 (예: 10, 50, 24)",
  "highlightUnit": "단위 설명 (예: 만원, 시간, 명)",
  "highlightHook": "숫자에 대한 임팩트 문장",
  "featureTitle": "어떤 특징이 있나요? (특징 제목)",
  "features": [
    { "icon": "이모지", "title": "특징1", "desc": "설명" } // 딱 4개 채울 것
  ],
  "benefitTag": "이용/혜택 안내",
  "benefitTitle": "알아두면 좋은 정보",
  "benefits": [
    { "icon": "이모지", "text": "항목" } // 3~6개
  ],
  "benefitSub": "추가 보조 설명 1줄",
  "reviewTitle": "전체적인 총평 한줄",
  "reviews": ["포인트1", "포인트2", "포인트3"], // 딱 3개
  "closingArea": "지역명 (예: 홍대입구)",
  "closingTitle": "장소명 또는 카테고리 (예: 인생 라떼 맛집)",
  "closingWord": "마지막으로 남기는 감성적인 한 마디",
  "closingHashtags": "대표 해시태그 3~4개",
  "caption": "인스타그램 본문 캡션 (2~3줄 훅, 매장 정보, 줄바꿈, 해시태그 포함 15개 가량, 생략체/존댓말X 간결하게${s.enabled ? '. 협찬 해시태그/문구 필수 포함' : ''}"
}`

  return callGeminiJson<CardNewsData>(prompt)
}

export function buildCardNewsHtml(data: CardNewsData): string {
  // 하늘+실버 글래스모피즘 HTML 템플릿
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${data.placeName}</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&display=swap" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"></script>
<style>
:root {
  --accent: #38bdf8;
  --deep: #0369a1;
  --text: #1e293b;
  --dim: rgba(30, 41, 59, 0.75);
  --sans: 'Noto Sans KR', sans-serif;
  --fs-xl: clamp(28px,7.5vw,52px);
  --fs-lg: clamp(22px,6vw,42px);
  --fs-body: clamp(12px,2.8vw,15px);
  --title-col: #0f172a;
}
*, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
html, body { height:100%; overflow:hidden; }
body {
  font-family: var(--sans);
  -webkit-font-smoothing: antialiased;
  display:flex; align-items:center; justify-content:center;
  background:
    radial-gradient(ellipse 80% 60% at 15% 10%, rgba(186,230,253,0.55) 0%, transparent 55%),
    radial-gradient(ellipse 70% 60% at 85% 85%, rgba(148,163,184,0.45) 0%, transparent 55%),
    radial-gradient(ellipse 50% 40% at 60% 30%, rgba(226,232,240,0.35) 0%, transparent 50%),
    linear-gradient(145deg, #ddf0fb 0%, #e2e8f0 45%, #c8d4e0 100%);
}
.stage { width:100vw; height:100vh; display:flex; align-items:center; justify-content:center; }
.deck {
  position:relative; width:min(94vw,94vh); height:min(94vw,94vh);
  overflow:hidden; border-radius:40px;
  border:1.5px solid rgba(255,255,255,0.95);
}
.slide {
  position:absolute; inset:0;
  display:flex; flex-direction:column; justify-content:center;
  padding:clamp(28px,8%,56px);
  opacity:0; transform:scale(0.97) translateY(12px);
  transition:opacity .5s cubic-bezier(.4,0,.2,1), transform .5s cubic-bezier(.4,0,.2,1);
  pointer-events:none; overflow:hidden; color:var(--text);
}
.slide.active { opacity:1; transform:scale(1) translateY(0); pointer-events:auto; z-index:2; }
.slide.prev { opacity:0; transform:scale(1.03) translateY(-12px); z-index:1; }
.slide::before {
  content:''; position:absolute; inset:0;
  background:linear-gradient(135deg,rgba(255,255,255,0.55) 0%,transparent 42%);
  pointer-events:none;
}

.s-glass { background:linear-gradient(135deg,rgba(255,255,255,0.3) 0%,rgba(186,230,253,0.12) 100%); backdrop-filter:blur(36px); -webkit-backdrop-filter:blur(36px); }
.s-silver { background:linear-gradient(135deg,rgba(248,250,252,0.38) 0%,rgba(215,220,228,0.2) 100%); backdrop-filter:blur(36px); -webkit-backdrop-filter:blur(36px); }
.s-accent { background:linear-gradient(145deg,rgba(186,230,253,0.32), rgba(125,211,252,0.18)); backdrop-filter:blur(44px); -webkit-backdrop-filter:blur(44px); }
.s-mid { background:linear-gradient(145deg,rgba(226,232,240,0.38), rgba(203,213,225,0.22)); backdrop-filter:blur(44px); -webkit-backdrop-filter:blur(44px); }
.s-deep { background:linear-gradient(145deg,rgba(2,132,199,0.72), rgba(3,105,161,0.6)); backdrop-filter:blur(44px); -webkit-backdrop-filter:blur(44px); }

.orb { position:absolute; border-radius:50%; filter:blur(clamp(32px,8vw,60px)); pointer-events:none; }
.orb-a { width:70%; aspect-ratio:1; background:rgba(56,189,248,0.55); top:-25%; right:-20%; }
.orb-b { width:55%; aspect-ratio:1; background:rgba(148,163,184,0.45); bottom:-20%; left:-15%; }
.orb-w { width:65%; aspect-ratio:1; background:rgba(255,255,255,0.18); top:-25%; right:-20%; }
.inner { position:relative; z-index:1; width:100%; }

.tag {
 display:inline-flex; align-items:center; gap:6px;
 background:rgba(255,255,255,0.45); border:1px solid rgba(255,255,255,0.7);
 border-radius:100px; padding:5px 13px;
 font-size:clamp(9px,1.9vw,11px); font-weight:600;
 letter-spacing:.15em; text-transform:uppercase;
 color:var(--accent); backdrop-filter:blur(8px);
 margin-bottom:clamp(10px,2.5%,18px);
}
.s-deep .tag { background:rgba(255,255,255,0.12); border-color:rgba(255,255,255,0.25); color:rgba(255,255,255,0.9); }
.s-accent .tag, .s-mid .tag { background:rgba(255,255,255,0.55); border-color:rgba(255,255,255,0.8); color:var(--accent); }

.t-xl { font-size:var(--fs-xl); font-weight:900; line-height:1.1; letter-spacing:-0.02em; word-break:keep-all; color:var(--title-col); }
.t-lg { font-size:var(--fs-lg); font-weight:700; line-height:1.2; word-break:keep-all; color:var(--title-col); }
.t-body { font-size:var(--fs-body); font-weight:400; line-height:1.85; color:var(--dim); margin-top:12px; }
.s-deep .t-body { color:rgba(255,255,255,0.85); }
.s-accent .t-body, .s-mid .t-body { color:rgba(15,23,42,0.75); }
.s-deep .t-xl, .s-deep .t-lg { color:#fff; }
.s-accent .t-xl, .s-accent .t-lg, .s-mid .t-xl, .s-mid .t-lg { color:var(--title-col); }

.rule { width:100%; height:1px; background:linear-gradient(90deg,rgba(255,255,255,0.7),rgba(255,255,255,0)); margin:clamp(16px,4%,28px) 0; }
.s-deep .rule { background:linear-gradient(90deg,rgba(255,255,255,0.2),rgba(255,255,255,0)); }
.s-accent .rule, .s-mid .rule { background:linear-gradient(90deg,rgba(0,0,0,0.1),rgba(0,0,0,0)); }

.big-num { font-size:clamp(60px,18vw,110px); font-weight:900; line-height:.9; letter-spacing:-0.03em; }
.big-unit { font-size:clamp(11px,2.5vw,15px); font-weight:400; letter-spacing:.2em; color:rgba(255,255,255,0.7); margin-top:8px; display:block; }

.cards { display:grid; grid-template-columns:1fr 1fr; gap:clamp(7px,1.8%,11px); margin-top:clamp(16px,4%,28px); }
.card {
 background:rgba(255,255,255,0.38); border:1px solid rgba(255,255,255,0.65);
 border-radius:clamp(12px,3%,18px); padding:clamp(12px,3.5%,20px);
 backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px);
 position:relative; overflow:hidden;
}
.card::before { content:''; position:absolute; top:0; left:0; right:0; height:1px; background:linear-gradient(90deg,rgba(255,255,255,0.8),transparent); }
.s-deep .card, .s-accent .card, .s-mid .card { background:rgba(255,255,255,0.12); border-color:rgba(255,255,255,0.2); }
.card-icon { font-size:clamp(18px,4.5vw,26px); margin-bottom:clamp(5px,1.5%,9px); }
.card-title { font-size:clamp(11px,2.5vw,13px); font-weight:700; color:var(--text); margin-bottom:4px; }
.card-body { font-size:clamp(10px,2vw,12px); color:rgba(30,41,59,0.8); line-height:1.55; }
.s-deep .card-title { color:rgba(255,255,255,0.95); }
.s-deep .card-body { color:rgba(255,255,255,0.8); }
.s-accent .card, .s-mid .card { background:rgba(255,255,255,0.55); border-color:rgba(255,255,255,0.75); }
.s-accent .card-title, .s-mid .card-title { color:#0f172a; }
.s-accent .card-body, .s-mid .card-body { color:rgba(15,23,42,0.75); }

.list { list-style:none; margin-top:clamp(10px,2.5%,18px); padding:0; }
.list li { display:flex; gap:clamp(8px,2%,14px); align-items:flex-start; padding:clamp(9px,2.5%,16px) 0; border-bottom:1px solid rgba(0,0,0,0.06); }
.list li:last-child { border:none; }
.s-deep .list li { border-color:rgba(255,255,255,0.12); }
.list-dot { width:7px; height:7px; border-radius:50%; background:var(--accent); flex-shrink:0; margin-top:6px; }
.s-deep .list-dot { background:#fff; box-shadow:0 0 6px rgba(255,255,255,0.5); }
.list-txt { flex:1; font-size:clamp(12px,2.2vw,14px); color:var(--text); line-height:1.6; }
.s-deep .list-txt { color:rgba(255,255,255,0.9); }
.list-em { font-weight:700; color:var(--accent); margin-right:4px; }
.s-deep .list-em { color:#fff; }
.list-sub { font-size:.82em; color:var(--dim); display:block; margin-top:2px; font-weight:400; }
.s-deep .list-sub { color:rgba(255,255,255,0.62); }

.free-row { display:flex; gap:clamp(6px,1.8%,10px); flex-wrap:wrap; margin-top:clamp(12px,3%,20px); }
.free-pill { background:rgba(255,255,255,0.5); border:1px solid rgba(255,255,255,0.75); border-radius:100px; padding:6px 14px; font-size:clamp(11px,2.2vw,13px); font-weight:600; color:var(--text); display:inline-flex; align-items:center; gap:6px; backdrop-filter:blur(8px); }
.s-deep .free-pill { background:rgba(255,255,255,0.15); border-color:rgba(255,255,255,0.3); color:#fff; }

.loc { margin-top:clamp(12px,3%,20px); font-size:clamp(10px,2.2vw,12px); color:var(--dim); font-weight:500; display:flex; align-items:center; gap:4px; }
.s-deep .loc { color:rgba(255,255,255,0.55); }

.nav-wrap { position:fixed; bottom:clamp(14px,3vh,26px); left:50%; transform:translateX(-50%); display:flex; gap:12px; align-items:center; z-index:10; }
.nav-btn { width:36px; height:36px; border-radius:50%; border:1px solid rgba(255,255,255,0.6); background:rgba(255,255,255,0.25); backdrop-filter:blur(8px); color:var(--text); cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all .2s; }
.nav-btn:hover { background:rgba(255,255,255,0.65); transform:scale(1.08); }
.nav-btn svg { width:14px; height:14px; }
.dots { display:flex; gap:5px; align-items:center; }
.dot { width:5px; height:5px; border-radius:50%; background:rgba(56,189,248,0.28); cursor:pointer; transition:all .3s; }
.dot.active { width:18px; border-radius:3px; background:var(--accent); opacity:.8; }

.counter { position:fixed; top:clamp(14px,3vh,22px); right:clamp(14px,3vw,22px); font-size:11px; font-weight:700; color:var(--dim); letter-spacing:.1em; z-index:10; }
.caption-btn { position:fixed; top:clamp(14px,3vh,22px); left:clamp(14px,3vw,22px); background:rgba(255,255,255,0.45); border:1px solid rgba(255,255,255,0.7); backdrop-filter:blur(8px); padding:6px 12px; border-radius:100px; font-size:11px; font-weight:600; cursor:pointer; color:var(--text); transition:all .2s; z-index:10; }
.caption-btn:hover { background:rgba(255,255,255,0.65); }

.modal { display:none; position:fixed; inset:0; background:rgba(0,0,0,0.3); backdrop-filter:blur(4px); z-index:100; align-items:center; justify-content:center; padding:20px; }
.modal.open { display:flex; }
.modal-box { background:rgba(248,250,252,0.88); border:1px solid rgba(255,255,255,0.8); backdrop-filter:blur(16px); width:100%; max-width:440px; border-radius:24px; padding:24px; position:relative; }
.modal-title { font-size:11px; font-weight:600; letter-spacing:.15em; text-transform:uppercase; color:var(--accent); margin-bottom:12px; }
.modal-text { font-size:13px; line-height:1.85; color:var(--text); white-space:pre-wrap; max-height:50vh; overflow-y:auto; padding-right:8px; }
.modal-copy { margin-top:14px; width:100%; padding:12px; background:var(--accent); color:#fff; border:none; border-radius:12px; font-size:13px; font-weight:700; cursor:pointer; transition:opacity .2s; }
.modal-copy:hover { opacity:.85; }
.modal-close { margin-top:8px; width:100%; padding:9px; background:transparent; color:var(--dim); border:none; font-size:12px; font-weight:600; cursor:pointer; }
.hare-table { position: absolute; bottom: 32px; right: 36px; font-size: 13px; font-weight: 500; font-family: sans-serif; opacity: 0.6; letter-spacing: 0.05em; color: var(--text); z-index: 5; }

/* Themes via hue-rotate */
[data-theme="food"] .deck { filter: hue-rotate(25deg) saturate(1.1); }
[data-theme="cafe"] .deck { filter: hue-rotate(330deg) saturate(1.05); }
[data-theme="travel"] .deck { filter: hue-rotate(150deg) saturate(1.1); }
[data-theme="beauty"] .deck { filter: hue-rotate(270deg) saturate(1.05); }
[data-theme="culture"] .deck { filter: hue-rotate(235deg); }
[data-theme="life"] .deck { filter: hue-rotate(55deg) saturate(1.1); }
[data-theme="health"] .deck { filter: hue-rotate(130deg) saturate(1.1); }
[data-theme="sky"] .deck { filter: none; }

.theme-bar {
  position: fixed; top: clamp(10px,2.5vh,18px); left: 50%; transform: translateX(-50%);
  display: flex; gap: 8px; align-items: center; z-index: 20;
  background: rgba(255,255,255,0.4); backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.7); border-radius: 100px;
  padding: 6px 12px;
}
.theme-dot {
  width: 20px; height: 20px; border-radius: 50%; cursor: pointer;
  border: 2px solid rgba(255,255,255,0.5); transition: all 0.2s;
  flex-shrink: 0;
}
.theme-dot.active { border-color: white; transform: scale(1.25); box-shadow: 0 2px 8px rgba(0,0,0,0.2); }
.theme-dot:hover { transform: scale(1.15); }
.theme-label {
  font-size: 10px; font-weight: 600; color: rgba(30,41,59,0.7);
  white-space: nowrap; padding: 0 4px;
}

.save-bar {
  position: fixed; bottom: clamp(56px,10vh,72px); right: clamp(10px,2.5vw,18px);
  display: flex; flex-direction: column; gap: 6px; z-index: 20;
}
.save-btn {
  padding: 7px 12px; font-size: 11px; font-weight: 700;
  background: rgba(255,255,255,0.5); border: 1px solid rgba(255,255,255,0.7);
  backdrop-filter: blur(8px); border-radius: 10px; cursor: pointer;
  color: rgba(30,41,59,0.8); transition: all 0.2s; white-space: nowrap;
}
.save-btn:hover { background: rgba(255,255,255,0.8); }
.save-btn.saving { opacity: 0.6; cursor: wait; }

@media (max-width: 540px) {
  .save-bar {
    flex-direction: row; flex-wrap: wrap; justify-content: center;
    bottom: 6px; right: auto; left: 50%; transform: translateX(-50%);
    gap: 4px; padding: 5px 8px;
    background: rgba(255,255,255,0.55); backdrop-filter: blur(12px);
    border: 1px solid rgba(255,255,255,0.7); border-radius: 12px;
    width: max-content; max-width: 96vw;
  }
  .save-btn { padding: 5px 9px; font-size: 10px; border-radius: 8px; }
  .nav-wrap { bottom: clamp(50px,10vh,64px); }
}

/* Edit Mode */
.edit-mode [contenteditable="true"] {
  outline: 1.5px dashed rgba(56,189,248,0.55);
  border-radius: 4px;
  cursor: text;
  min-width: 20px;
  display: inline-block;
}
.edit-mode [contenteditable="true"]:hover {
  outline-color: rgba(56,189,248,0.85);
  background: rgba(255,255,255,0.12);
}
.edit-mode [contenteditable="true"]:focus {
  outline: 2px solid var(--accent);
  background: rgba(255,255,255,0.18);
  border-radius: 4px;
}
.edit-mode [contenteditable="true"]:empty::before {
  content: '입력...'; opacity: 0.35; font-style: italic;
}
.edit-badge {
  position: fixed; top: clamp(10px,2.5vh,18px); left: 50%;
  transform: translateX(-50%);
  background: var(--accent); color: #fff;
  font-size: 11px; font-weight: 700; letter-spacing: .08em;
  padding: 5px 14px; border-radius: 100px; z-index: 30;
  display: none; pointer-events: none;
}
.edit-mode .edit-badge { display: block; }
.edit-mode .theme-bar { display: none; }

/* Settings Panel */
.settings-panel {
  position:fixed; left:-268px; top:50%; transform:translateY(-50%);
  width:248px; max-height:82vh; overflow-y:auto;
  background:rgba(248,250,252,0.96); border:1px solid rgba(255,255,255,0.9);
  backdrop-filter:blur(24px); -webkit-backdrop-filter:blur(24px);
  border-radius:20px; padding:20px; z-index:24;
  transition:left 0.35s cubic-bezier(.4,0,.2,1);
}
.settings-panel.open { left:10px; }
.sp-head { font-size:11px; font-weight:700; color:var(--accent); letter-spacing:.12em; text-transform:uppercase; margin-bottom:16px; }
.sp-sec { margin-bottom:14px; }
.sp-sec:last-child { margin-bottom:0; }
.sp-lbl { font-size:10px; font-weight:600; color:rgba(30,41,59,0.4); letter-spacing:.08em; text-transform:uppercase; margin-bottom:8px; }
.sp-swatches { display:flex; gap:7px; flex-wrap:wrap; align-items:center; }
.sp-sw { width:22px; height:22px; border-radius:50%; cursor:pointer; border:2.5px solid transparent; transition:all 0.2s; flex-shrink:0; }
.sp-sw.on { border-color:rgba(30,41,59,0.5); transform:scale(1.2); }
.sp-sw:hover:not(.on) { transform:scale(1.1); }
.sp-custom { width:22px; height:22px; border-radius:50%; cursor:pointer; border:2px solid rgba(200,210,220,0.6); padding:0; overflow:hidden; flex-shrink:0; background:none; }
.sp-row3 { display:flex; gap:5px; }
.sp-chip { flex:1; padding:6px 4px; font-size:11px; font-weight:600; background:rgba(255,255,255,0.6); border:1px solid rgba(255,255,255,0.8); border-radius:9px; cursor:pointer; color:rgba(30,41,59,0.5); transition:all 0.2s; text-align:center; }
.sp-chip.on { background:var(--accent); color:#fff; border-color:var(--accent); }
.sp-chip:hover:not(.on) { background:rgba(255,255,255,0.9); }
.sp-divider { height:1px; background:rgba(0,0,0,0.07); margin:12px 0; }
</style>
</head>
<body>
<div class="stage">

<div class="theme-bar" id="themeBar">
  <span class="theme-label">테마</span>
  <div class="theme-dot active" data-theme="sky" style="background:linear-gradient(135deg,#38bdf8,#0284c7)" title="스터디/오피스" onclick="setTheme('sky')"></div>
  <div class="theme-dot" data-theme="food" style="background:linear-gradient(135deg,#fb923c,#ea580c)" title="맛집/음식" onclick="setTheme('food')"></div>
  <div class="theme-dot" data-theme="cafe" style="background:linear-gradient(135deg,#f472b6,#db2777)" title="카페/디저트" onclick="setTheme('cafe')"></div>
  <div class="theme-dot" data-theme="travel" style="background:linear-gradient(135deg,#2dd4bf,#0d9488)" title="여행/나들이" onclick="setTheme('travel')"></div>
  <div class="theme-dot" data-theme="beauty" style="background:linear-gradient(135deg,#a78bfa,#7c3aed)" title="뷰티/패션" onclick="setTheme('beauty')"></div>
  <div class="theme-dot" data-theme="culture" style="background:linear-gradient(135deg,#818cf8,#4338ca)" title="문화/전시" onclick="setTheme('culture')"></div>
  <div class="theme-dot" data-theme="life" style="background:linear-gradient(135deg,#fbbf24,#ca8a04)" title="라이프/육아" onclick="setTheme('life')"></div>
  <div class="theme-dot" data-theme="health" style="background:linear-gradient(135deg,#34d399,#059669)" title="헬스/운동" onclick="setTheme('health')"></div>
</div>

<div class="save-bar">
  <button class="save-btn" id="saveCurrent" onclick="saveCurrentSlide()">📷 현재</button>
  <button class="save-btn" id="saveAll" onclick="saveAllSlides()">💾 전체</button>
  <button class="save-btn" id="editModeBtn" onclick="toggleEditMode()">📝 내용편집</button>
  <button class="save-btn" onclick="toggleSettings()">🎨 스타일</button>
</div>
<div class="edit-badge" id="editBadge">✏ 편집 중 — 텍스트를 클릭해 수정하세요</div>

<div class="settings-panel" id="settingsPanel">
  <div class="sp-head">스타일 설정</div>
  <div class="sp-sec">
    <div class="sp-lbl">주요 색상</div>
    <div class="sp-swatches">
      <div class="sp-sw on" style="background:linear-gradient(135deg,#38bdf8,#0284c7)" onclick="setAccentPreset(0,this)" title="하늘"></div>
      <div class="sp-sw" style="background:linear-gradient(135deg,#f472b6,#db2777)" onclick="setAccentPreset(1,this)" title="핑크"></div>
      <div class="sp-sw" style="background:linear-gradient(135deg,#fb923c,#ea580c)" onclick="setAccentPreset(2,this)" title="오렌지"></div>
      <div class="sp-sw" style="background:linear-gradient(135deg,#34d399,#059669)" onclick="setAccentPreset(3,this)" title="민트"></div>
      <div class="sp-sw" style="background:linear-gradient(135deg,#a78bfa,#7c3aed)" onclick="setAccentPreset(4,this)" title="보라"></div>
      <div class="sp-sw" style="background:linear-gradient(135deg,#fbbf24,#ca8a04)" onclick="setAccentPreset(5,this)" title="골드"></div>
      <input type="color" class="sp-custom" id="customColorPicker" value="#38bdf8" oninput="setCustomColor(this.value)" title="직접 선택">
    </div>
  </div>
  <div class="sp-divider"></div>
  <div class="sp-sec">
    <div class="sp-lbl">글자 크기</div>
    <div class="sp-row3">
      <button class="sp-chip" data-fs="sm" onclick="setFontSize('sm')">작게</button>
      <button class="sp-chip on" data-fs="md" onclick="setFontSize('md')">보통</button>
      <button class="sp-chip" data-fs="lg" onclick="setFontSize('lg')">크게</button>
    </div>
  </div>
  <div class="sp-divider"></div>
  <div class="sp-sec">
    <div class="sp-lbl">제목 색상</div>
    <div class="sp-row3">
      <button class="sp-chip on" data-tc="dark" onclick="setTitleColor('dark')">진하게</button>
      <button class="sp-chip" data-tc="mid" onclick="setTitleColor('mid')">중간</button>
      <button class="sp-chip" data-tc="light" onclick="setTitleColor('light')">연하게</button>
    </div>
  </div>
  <div class="sp-divider"></div>
  <div class="sp-sec">
    <div class="sp-lbl">본문 색상</div>
    <div class="sp-row3">
      <button class="sp-chip on" data-bc="dark" onclick="setBodyColor('dark')">진하게</button>
      <button class="sp-chip" data-bc="mid" onclick="setBodyColor('mid')">중간</button>
      <button class="sp-chip" data-bc="light" onclick="setBodyColor('light')">연하게</button>
    </div>
  </div>
</div>

  <div class="deck" id="deck">

    <!-- 01 커버 -->
    <div class="slide s-glass active">
      <div class="orb orb-a"></div><div class="orb orb-b"></div>
      <div class="inner">
        <div class="tag">${data.coverTag}</div>
        <div class="t-xl">${data.placeName}</div>
        <div class="rule"></div>
        <p class="t-body">${data.coverHook}</p>
        <div class="loc">📍 ${data.coverAddress}</div>
      </div>
      <div class="hare-table">@hare_table</div>
    </div>

    <!-- 02 기본정보 -->
    <div class="slide s-silver">
      <div class="orb orb-a" style="opacity:.25;"></div>
      <div class="inner">
        <div class="tag">Basic Info</div>
        <div class="t-lg">이런 곳이에요</div>
        <ul class="list">
          <li><div class="list-dot"></div><div class="list-txt"><span class="list-em">위치</span> · ${data.basicInfo.location} <span class="list-sub">${data.basicInfo.locationSub}</span></div></li>
          <li><div class="list-dot"></div><div class="list-txt"><span class="list-em">운영</span> · ${data.basicInfo.hours} <span class="list-sub">${data.basicInfo.hoursSub}</span></div></li>
          <li><div class="list-dot"></div><div class="list-txt"><span class="list-em">가격</span> · ${data.basicInfo.price} <span class="list-sub">${data.basicInfo.priceSub}</span></div></li>
          <li><div class="list-dot"></div><div class="list-txt"><span class="list-em">특징</span> · ${data.basicInfo.feature} <span class="list-sub">${data.basicInfo.featureSub}</span></div></li>
        </ul>
      </div>
    </div>

    <!-- 03 핵심수치 -->
    <div class="slide s-deep">
      <div class="orb orb-w"></div>
      <div class="inner">
        <div class="tag">Highlight</div>
        <div class="big-num">${data.highlightNum}</div>
        <div class="big-unit">${data.highlightUnit}</div>
        <div class="rule"></div>
        <p class="t-body">${data.highlightHook}</p>
      </div>
    </div>

    <!-- 04 특징 -->
    <div class="slide s-accent">
      <div class="orb orb-w"></div>
      <div class="inner">
        <div class="tag">Features</div>
        <div class="t-lg">${data.featureTitle}</div>
        <div class="cards">
          ${data.features.map(f => `
          <div class="card">
            <div class="card-icon">${f.icon}</div>
            <div class="card-title">${f.title}</div>
            <div class="card-body">${f.desc}</div>
          </div>`).join('')}
        </div>
      </div>
    </div>

    <!-- 05 혜택/구성 -->
    <div class="slide s-glass">
      <div class="orb orb-a" style="opacity:.3;"></div><div class="orb orb-b"></div>
      <div class="inner">
        <div class="tag">${data.benefitTag}</div>
        <div class="t-lg">${data.benefitTitle}</div>
        <div class="free-row">
          ${data.benefits.map(b => `<div class="free-pill">${b.icon} ${b.text}</div>`).join('')}
        </div>
        ${data.benefitSub ? `<p class="t-body" style="margin-top:clamp(12px,3%,18px);">${data.benefitSub}</p>` : ''}
      </div>
    </div>

    <!-- 06 총평 -->
    <div class="slide s-mid">
      <div class="orb orb-w"></div>
      <div class="inner">
        <div class="tag">Review</div>
        <div class="t-lg">${data.reviewTitle}</div>
        <div class="rule"></div>
        <ul class="list">
          ${data.reviews.map(r => `<li><div class="list-dot"></div><div class="list-txt">${r}</div></li>`).join('')}
        </ul>
      </div>
    </div>

    <!-- 07 클로징 -->
    <div class="slide s-silver">
      <div class="orb orb-a" style="opacity:.3;"></div>
      <div class="inner">
        <div class="tag">${data.closingArea}</div>
        <div class="t-xl">${data.closingTitle}</div>
        <div class="rule"></div>
        <p class="t-body">${data.closingWord}</p>
        <div class="loc" style="margin-top:clamp(14px,3.5%,22px);">${data.closingHashtags}</div>
      </div>
    </div>

  </div>
</div>

<div class="counter" id="counter">1 / 7</div>
<button class="caption-btn" onclick="openModal()">💬 캡션 복사</button>

<div class="nav-wrap">
  <button class="nav-btn" onclick="go(-1)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg></button>
  <div class="dots" id="dots"></div>
  <button class="nav-btn" onclick="go(1)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg></button>
</div>

<div class="modal" id="modal">
  <div class="modal-box">
    <div class="modal-title">Instagram Caption</div>
    <div class="modal-text" id="modalText">${data.caption.replace(/\n/g, '<br>')}</div>
    <button class="modal-copy" onclick="copyText()">복사하기</button>
    <button class="modal-close" onclick="closeModal()">닫기</button>
  </div>
</div>

<script>
const slides = document.querySelectorAll('.slide');
const dotsEl = document.getElementById('dots');
const counterEl = document.getElementById('counter');
let cur = 0;
slides.forEach((_,i) => {
  const d = document.createElement('div');
  d.className = 'dot' + (i===0 ? ' active' : '');
  d.onclick = () => goTo(i);
  dotsEl.appendChild(d);
});
function update() {
  slides.forEach((s,i) => {
    s.classList.remove('active','prev');
    if(i===cur) s.classList.add('active');
    else if(i<cur) s.classList.add('prev');
  });
  dotsEl.querySelectorAll('.dot').forEach((d,i) => {
    d.className = 'dot' + (i===cur ? ' active' : '');
  });
  counterEl.textContent = (cur+1) + ' / ' + slides.length;
}
function go(dir) {
  const n = cur + dir;
  if(n<0 || n>=slides.length) return;
  cur = n; update();
}
function goTo(i) { cur = i; update(); }
document.addEventListener('keydown', e => {
  if(['ArrowRight',' '].includes(e.key)) { e.preventDefault(); go(1); }
  if(['ArrowLeft'].includes(e.key)) { e.preventDefault(); go(-1); }
});
let tx = 0;
function txHandler(e) { tx = e.changedTouches[0].screenX; }
function teHandler(e) {
  const dx = e.changedTouches[0].screenX - tx;
  if(Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
}
document.addEventListener('touchstart', txHandler);
document.addEventListener('touchend', teHandler);
function openModal() { document.getElementById('modal').classList.add('open'); }
function closeModal() { document.getElementById('modal').classList.remove('open'); }
function copyText() {
  const text = document.getElementById('modalText').innerText;
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.querySelector('.modal-copy');
    btn.textContent = '✓ 복사완료';
    btn.style.background = '#059669';
    setTimeout(() => { btn.textContent = '복사하기'; btn.style.background = 'var(--accent)'; }, 2000);
  });
}
update();

// ── deck 크기 재계산: clientWidth/Height 기준 (vw/vh가 device-width 기준인 경우 보정) ──
(function resizeDeckToFit() {
  function fix() {
    var vw = document.documentElement.clientWidth;
    var vh = document.documentElement.clientHeight;
    var size = Math.min(vw, vh) * 0.96;
    var deck = document.getElementById('deck');
    if (deck) { deck.style.width = size + 'px'; deck.style.height = size + 'px'; }
  }
  fix();
  window.addEventListener('resize', fix);
})();

// ── iframe 감지: save-bar 숨김 (sandbox 환경에서 window.top 접근 SecurityError 대비) ──
(function hideSaveBarInIframe() {
  var embedded = false;
  try { embedded = window.self !== window.top; } catch(e) { embedded = true; }
  if (!embedded) return;
  var bar = document.querySelector('.save-bar');
  if (bar) bar.style.display = 'none';
})();

// Theme switcher
let currentTheme = localStorage.getItem('cardNewsTheme') || 'sky';
function setTheme(name) {
  document.body.dataset.theme = name;
  document.querySelectorAll('.theme-dot').forEach(d => {
    d.classList.toggle('active', d.dataset.theme === name);
  });
  currentTheme = name;
  try { localStorage.setItem('cardNewsTheme', name); } catch(e) {}
}
setTheme(currentTheme);

// Content edit mode
const editSelectors = ['.t-xl','.t-lg','.t-body','.tag','.card-icon','.card-title','.card-body','.list-txt','.free-pill','.loc','.big-num','.big-unit','.hare-table'];
let isEditing = false;
function toggleEditMode() {
  isEditing = !isEditing;
  document.body.classList.toggle('edit-mode', isEditing);
  const btn = document.getElementById('editModeBtn');
  editSelectors.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => {
      el.contentEditable = isEditing ? 'true' : 'false';
      if(isEditing) el.spellcheck = false;
    });
  });
  if(isEditing) {
    btn.textContent = '✓ 편집완료';
    btn.style.cssText = 'background:var(--accent);color:#fff;border-color:var(--accent);';
    document.removeEventListener('touchstart', txHandler);
    document.removeEventListener('touchend', teHandler);
  } else {
    btn.textContent = '📝 내용편집';
    btn.style.cssText = '';
    document.addEventListener('touchstart', txHandler);
    document.addEventListener('touchend', teHandler);
  }
}

// Style settings panel
function toggleSettings() {
  document.getElementById('settingsPanel').classList.toggle('open');
}
const accentList = [
  ['#38bdf8','#0284c7'],['#f472b6','#db2777'],['#fb923c','#ea580c'],
  ['#34d399','#059669'],['#a78bfa','#7c3aed'],['#fbbf24','#ca8a04']
];
function applyAccent(a, d) {
  document.documentElement.style.setProperty('--accent', a);
  document.documentElement.style.setProperty('--deep', d);
}
function setAccentPreset(i, el) {
  applyAccent(...accentList[i]);
  document.querySelectorAll('.sp-sw').forEach(s => s.classList.remove('on'));
  el.classList.add('on');
  try { localStorage.setItem('cn_acc', JSON.stringify({i, a:accentList[i][0], d:accentList[i][1]})); } catch(e){}
}
function setCustomColor(hex) {
  const r2=parseInt(hex.slice(1,3),16), g2=parseInt(hex.slice(3,5),16), b2=parseInt(hex.slice(5,7),16);
  const deep='rgb('+Math.floor(r2*.72)+','+Math.floor(g2*.72)+','+Math.floor(b2*.72)+')';
  applyAccent(hex, deep);
  document.querySelectorAll('.sp-sw').forEach(s => s.classList.remove('on'));
  try { localStorage.setItem('cn_acc', JSON.stringify({a:hex, d:deep})); } catch(e){}
}
const fsSizes = {
  sm:['clamp(22px,6vw,40px)','clamp(18px,5vw,32px)','clamp(11px,2.2vw,13px)'],
  md:['clamp(28px,7.5vw,52px)','clamp(22px,6vw,42px)','clamp(12px,2.8vw,15px)'],
  lg:['clamp(34px,9vw,64px)','clamp(26px,7vw,50px)','clamp(13px,3.2vw,17px)']
};
function setFontSize(sz) {
  const [xl,lg,bd] = fsSizes[sz];
  const r = document.documentElement;
  r.style.setProperty('--fs-xl', xl);
  r.style.setProperty('--fs-lg', lg);
  r.style.setProperty('--fs-body', bd);
  document.querySelectorAll('.sp-chip[data-fs]').forEach(c => c.classList.toggle('on', c.dataset.fs===sz));
  try { localStorage.setItem('cn_fs', sz); } catch(e){}
}
const titleCols = { dark:'#0f172a', mid:'#334155', light:'#64748b' };
function setTitleColor(k) {
  document.documentElement.style.setProperty('--title-col', titleCols[k]);
  document.querySelectorAll('.sp-chip[data-tc]').forEach(c => c.classList.toggle('on', c.dataset.tc===k));
  try { localStorage.setItem('cn_tc', k); } catch(e){}
}
const bodyCols = { dark:'rgba(30,41,59,0.85)', mid:'rgba(30,41,59,0.65)', light:'rgba(30,41,59,0.45)' };
function setBodyColor(k) {
  document.documentElement.style.setProperty('--dim', bodyCols[k]);
  document.querySelectorAll('.sp-chip[data-bc]').forEach(c => c.classList.toggle('on', c.dataset.bc===k));
  try { localStorage.setItem('cn_bc', k); } catch(e){}
}
(function loadStyleSettings() {
  try {
    const acc = JSON.parse(localStorage.getItem('cn_acc') || 'null');
    if(acc) { applyAccent(acc.a, acc.d); if(acc.i!=null) document.querySelectorAll('.sp-sw')[acc.i]?.classList.add('on'); }
    else document.querySelectorAll('.sp-sw')[0]?.classList.add('on');
    setFontSize(localStorage.getItem('cn_fs') || 'md');
    setTitleColor(localStorage.getItem('cn_tc') || 'dark');
    setBodyColor(localStorage.getItem('cn_bc') || 'dark');
  } catch(e) { document.querySelectorAll('.sp-sw')[0]?.classList.add('on'); setFontSize('md'); setTitleColor('dark'); setBodyColor('dark'); }
})();

// Image save
async function saveCurrentSlide() {
  const btn = document.getElementById('saveCurrent');
  btn.classList.add('saving');
  btn.textContent = '저장 중...';
  try {
    const deck = document.getElementById('deck');
    const canvas = await html2canvas(deck, { scale: 2, useCORS: true, allowTaint: true, backgroundColor: null });
    const link = document.createElement('a');
    link.download = 'slide_' + (cur + 1) + '.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  } catch(e) { alert('저장 실패: ' + e.message); }
  btn.classList.remove('saving');
  btn.textContent = '📷 현재';
}

async function saveAllSlides() {
  const btn = document.getElementById('saveAll');
  btn.classList.add('saving');
  const total = slides.length;
  for (let i = 0; i < total; i++) {
    goTo(i);
    btn.textContent = (i+1) + '/' + total + ' 저장 중...';
    await new Promise(r => setTimeout(r, 400));
    const deck = document.getElementById('deck');
    const canvas = await html2canvas(deck, { scale: 2, useCORS: true, allowTaint: true, backgroundColor: null });
    const link = document.createElement('a');
    link.download = 'slide_' + (i + 1) + '.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    await new Promise(r => setTimeout(r, 300));
  }
  btn.classList.remove('saving');
  btn.textContent = '💾 전체';
}
</script>
</body>
</html>`
}
