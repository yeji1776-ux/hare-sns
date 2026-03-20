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
  captionLong: string
  captionShort: string
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
  "captionLong": "긴 인스타그램 캡션 (2~3줄 감성 훅, 매장 핵심 정보, 줄바꿈, 해시태그 15개 가량, 생략체/존댓말X 간결하게${s.enabled ? '. 협찬 해시태그/문구 필수 포함' : ''})",
  "captionShort": "짧은 인스타그램 캡션 (훅 1줄 + 핵심 정보 1~2줄 + 해시태그 5~7개, 생략체/존댓말X 간결하게${s.enabled ? '. 협찬 해시태그 필수 포함' : ''})"
}`

  return callGeminiJson<CardNewsData>(prompt)
}

export function buildCardNewsHtml(data: CardNewsData): string {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${data.placeName}</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&display=swap" rel="stylesheet" crossorigin>
<script src="https://cdn.jsdelivr.net/npm/dom-to-image-more@3.4.0/dist/dom-to-image-more.min.js"></script>
<style>
:root {
  --accent: #38bdf8;
  --deep: #0369a1;
  --text: #1e293b;
  --dim: rgba(30,41,59,0.75);
  --sans: 'Noto Sans KR', sans-serif;
  --fs-xl: clamp(28px,7.5vw,52px);
  --fs-lg: clamp(22px,6vw,42px);
  --fs-body: clamp(12px,2.8vw,15px);
  --fs-content: clamp(11px,2.2vw,14px);
  --fs-small: clamp(10px,2vw,12px);
  --title-col: #0f172a;
}
*, *::before, *::after { margin:0; padding:0; box-sizing:border-box; touch-action:manipulation; -webkit-tap-highlight-color:transparent; }
html, body { width:100%; height:100%; overflow:hidden; }
body {
  font-family: var(--sans);
  -webkit-font-smoothing: antialiased;
  background:transparent;
}

/* ── Deck ── */
.deck {
  position:relative;
  width:100vw; height:100vh;
  overflow:hidden;
}

/* ── Slides ── */
.slide {
  position:absolute; inset:0;
  display:flex; flex-direction:column; justify-content:flex-start;
  padding:clamp(24px,6%,40px);
  opacity:0; transform:scale(0.97) translateY(12px);
  transition:opacity .45s cubic-bezier(.4,0,.2,1), transform .45s cubic-bezier(.4,0,.2,1);
  pointer-events:none; overflow:hidden; color:var(--text);
}
.slide.active { opacity:1; transform:scale(1) translateY(0); pointer-events:auto; z-index:2; }
.slide.prev   { opacity:0; transform:scale(1.03) translateY(-12px); z-index:1; }
/* ::before, ::after pseudo 제거 — 캡처 아티팩트 방지 */

.s-glass  { background:linear-gradient(135deg,#f0f7fe 0%,#e8f4fd 100%); }
.s-silver { background:linear-gradient(135deg,#f5f8fb 0%,#e9eff5 100%); }
.s-accent { background:linear-gradient(145deg,#dff0fc,#cce8f9); }
.s-mid    { background:linear-gradient(145deg,#eaf1f8,#dde8f2); }
.s-deep   { background:linear-gradient(145deg,#0284c7,#0369a1); }

.orb { position:absolute; border-radius:50%; filter:blur(clamp(32px,8vw,60px)); pointer-events:none; }
.orb-a { width:70%; aspect-ratio:1; background:rgba(56,189,248,0.75); top:-25%; right:-20%; }
.orb-b { width:55%; aspect-ratio:1; background:rgba(186,220,245,0.65); bottom:-20%; left:-15%; }
.orb-w { width:65%; aspect-ratio:1; background:rgba(255,255,255,0.35); top:-25%; right:-20%; }
.inner { position:relative; z-index:1; width:100%; }

.tag { display:inline-flex; align-items:center; background:rgba(255,255,255,0.85); border:1px solid rgba(255,255,255,0.95); border-radius:100px; padding:5px 13px; font-size:clamp(9px,1.9vw,11px); font-weight:600; letter-spacing:.15em; text-transform:uppercase; color:var(--accent); margin-bottom:clamp(10px,2.5%,18px); }
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
.card { background:rgba(255,255,255,0.7); border:1px solid rgba(255,255,255,0.9); border-radius:clamp(12px,3%,18px); padding:clamp(12px,3.5%,20px); position:relative; overflow:hidden; }
.s-deep .card, .s-accent .card, .s-mid .card { background:rgba(255,255,255,0.12); border-color:rgba(255,255,255,0.2); }
.s-accent .card, .s-mid .card { background:rgba(255,255,255,0.55); border-color:rgba(255,255,255,0.75); }
.card-icon { font-size:clamp(18px,4.5vw,26px); margin-bottom:clamp(5px,1.5%,9px); }
.card-title { font-size:var(--fs-content); font-weight:700; color:var(--text); margin-bottom:4px; }
.card-body { font-size:var(--fs-small); color:rgba(30,41,59,0.8); line-height:1.55; }
.s-deep .card-title { color:rgba(255,255,255,0.95); }
.s-deep .card-body { color:rgba(255,255,255,0.8); }
.s-accent .card-title, .s-mid .card-title { color:#0f172a; }
.s-accent .card-body, .s-mid .card-body { color:rgba(15,23,42,0.75); }

.list { list-style:none; margin-top:clamp(10px,2.5%,18px); padding:0; }
.list li { display:flex; gap:clamp(8px,2%,14px); align-items:flex-start; padding:clamp(9px,2.5%,16px) 0; border-bottom:1px solid rgba(0,0,0,0.06); }
.list li:last-child { border:none; }
.s-deep .list li { border-color:rgba(255,255,255,0.12); }
.list-dot { width:7px; height:7px; border-radius:50%; background:var(--accent); flex-shrink:0; margin-top:6px; }
.s-deep .list-dot { background:#fff; }
.list-txt { flex:1; font-size:var(--fs-content); color:var(--text); line-height:1.6; }
.s-deep .list-txt { color:rgba(255,255,255,0.9); }
.list-em { font-weight:700; color:var(--accent); margin-right:4px; }
.s-deep .list-em { color:#fff; }
.list-sub { font-size:.82em; color:var(--dim); display:block; margin-top:2px; }
.s-deep .list-sub { color:rgba(255,255,255,0.62); }

.free-row { display:flex; gap:clamp(6px,1.8%,10px); flex-wrap:wrap; margin-top:clamp(12px,3%,20px); }
.free-pill { background:rgba(255,255,255,0.8); border:1px solid rgba(255,255,255,0.95); border-radius:100px; padding:6px 14px; font-size:var(--fs-content); font-weight:600; color:var(--text); display:inline-flex; align-items:center; gap:6px; }
.s-deep .free-pill { background:rgba(255,255,255,0.15); border-color:rgba(255,255,255,0.3); color:#fff; }

.loc { margin-top:clamp(12px,3%,20px); font-size:var(--fs-small); color:var(--dim); font-weight:500; display:flex; align-items:center; gap:4px; }
.s-deep .loc { color:rgba(255,255,255,0.55); }
.hare-table { position:absolute; bottom:28px; right:32px; font-size:12px; font-weight:500; opacity:.55; letter-spacing:.05em; color:var(--text); z-index:5; }

/* ── 점 내비게이션 ── */
.dots-bar { position:absolute; bottom:14px; left:50%; transform:translateX(-50%); display:flex; gap:5px; align-items:center; z-index:10; }
.dot { width:5px; height:5px; border-radius:50%; background:rgba(56,189,248,0.3); transition:all .3s; }
.dot.active { width:16px; border-radius:3px; background:var(--accent); opacity:.85; }

/* ── 테마 바 ── */
.theme-bar { position:absolute; top:12px; left:50%; transform:translateX(-50%); display:flex; gap:6px; align-items:center; z-index:20; background:rgba(255,255,255,0.42); backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px); border:1px solid rgba(255,255,255,0.78); border-radius:100px; padding:5px 10px; box-shadow:0 4px 16px rgba(0,0,0,0.1),inset 0 1px 0 rgba(255,255,255,0.95); }
.theme-dot { width:18px; height:18px; border-radius:50%; cursor:pointer; border:2px solid rgba(255,255,255,0.4); transition:all .2s; flex-shrink:0; }
.theme-dot.active { border-color:#fff; transform:scale(1.25); box-shadow:0 1px 6px rgba(0,0,0,0.18); }

/* ── 테마 필터 ── */
[data-theme="food"]    .deck { filter:hue-rotate(25deg) saturate(1.1); }
[data-theme="cafe"]    .deck { filter:hue-rotate(330deg) saturate(1.05); }
[data-theme="travel"]  .deck { filter:hue-rotate(150deg) saturate(1.1); }
[data-theme="beauty"]  .deck { filter:hue-rotate(270deg) saturate(1.05); }
[data-theme="culture"] .deck { filter:hue-rotate(235deg); }
[data-theme="life"]    .deck { filter:hue-rotate(55deg) saturate(1.1); }
[data-theme="health"]  .deck { filter:hue-rotate(130deg) saturate(1.1); }
[data-theme="sky"]     .deck { filter:none; }

/* ── 캡션 모달 ── */
.modal { display:none; position:fixed; inset:0; background:rgba(0,0,0,0.28); backdrop-filter:blur(4px); -webkit-backdrop-filter:blur(4px); z-index:100; align-items:center; justify-content:center; padding:20px; }
.modal.open { display:flex; }
.modal-box { background:rgba(248,250,252,0.92); border:1px solid rgba(255,255,255,0.8); backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px); width:100%; max-width:440px; border-radius:24px; padding:24px; }
.modal-title { font-size:11px; font-weight:600; letter-spacing:.15em; text-transform:uppercase; color:var(--accent); margin-bottom:14px; }
.caption-section { margin-bottom:16px; }
.caption-label { font-size:10px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:var(--accent); opacity:.8; margin-bottom:6px; }
.caption-divider { width:100%; height:1px; background:rgba(0,0,0,0.08); margin:14px 0; }
.modal-text { font-size:13px; line-height:1.85; color:var(--text); white-space:pre-wrap; max-height:26vh; overflow-y:auto; }
.modal-copy { margin-top:8px; width:100%; padding:10px; background:var(--accent); color:#fff; border:none; border-radius:12px; font-size:13px; font-weight:700; cursor:pointer; }
.modal-close { margin-top:12px; width:100%; padding:9px; background:transparent; color:var(--dim); border:none; font-size:12px; font-weight:600; cursor:pointer; }

/* ── 저장 모달 ── */
#saveModal img { touch-action:auto !important; -webkit-touch-callout:default !important; }

</style>
</head>
<body>
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
    <div class="orb orb-a" style="opacity:.25"></div>
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
        ${data.features.map(f => `<div class="card"><div class="card-icon">${f.icon}</div><div class="card-title">${f.title}</div><div class="card-body">${f.desc}</div></div>`).join('')}
      </div>
    </div>
  </div>

  <!-- 05 혜택 -->
  <div class="slide s-glass">
    <div class="orb orb-a" style="opacity:.3"></div><div class="orb orb-b"></div>
    <div class="inner">
      <div class="tag">${data.benefitTag}</div>
      <div class="t-lg">${data.benefitTitle}</div>
      <div class="free-row">
        ${data.benefits.map(b => `<div class="free-pill">${b.icon} ${b.text}</div>`).join('')}
      </div>
      ${data.benefitSub ? `<p class="t-body" style="margin-top:clamp(12px,3%,18px)">${data.benefitSub}</p>` : ''}
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
    <div class="orb orb-a" style="opacity:.3"></div>
    <div class="inner">
      <div class="tag">${data.closingArea}</div>
      <div class="t-xl">${data.closingTitle}</div>
      <div class="rule"></div>
      <p class="t-body">${data.closingWord}</p>
      <div class="loc" style="margin-top:clamp(14px,3.5%,22px)">${data.closingHashtags}</div>
    </div>
  </div>

  <!-- 점 내비게이션 -->
  <div class="dots-bar" id="dots"></div>

  <!-- 테마 바 -->
  <div class="theme-bar">
    <div class="theme-dot active" data-theme="sky"     style="background:linear-gradient(135deg,#38bdf8,#0284c7)" onclick="setTheme('sky')"></div>
    <div class="theme-dot"        data-theme="food"    style="background:linear-gradient(135deg,#fb923c,#ea580c)" onclick="setTheme('food')"></div>
    <div class="theme-dot"        data-theme="cafe"    style="background:linear-gradient(135deg,#f472b6,#db2777)" onclick="setTheme('cafe')"></div>
    <div class="theme-dot"        data-theme="travel"  style="background:linear-gradient(135deg,#2dd4bf,#0d9488)" onclick="setTheme('travel')"></div>
    <div class="theme-dot"        data-theme="beauty"  style="background:linear-gradient(135deg,#a78bfa,#7c3aed)" onclick="setTheme('beauty')"></div>
    <div class="theme-dot"        data-theme="culture" style="background:linear-gradient(135deg,#818cf8,#4338ca)" onclick="setTheme('culture')"></div>
    <div class="theme-dot"        data-theme="life"    style="background:linear-gradient(135deg,#fbbf24,#ca8a04)" onclick="setTheme('life')"></div>
    <div class="theme-dot"        data-theme="health"  style="background:linear-gradient(135deg,#34d399,#059669)" onclick="setTheme('health')"></div>
  </div>
</div>

<!-- 캡션 모달 -->
<div class="modal" id="modal">
  <div class="modal-box">
    <div class="modal-title">Instagram Caption</div>
    <div class="caption-section">
      <div class="caption-label">✂️ 짧은 버전</div>
      <div class="modal-text" id="captionShort">${data.captionShort.replace(/\n/g, '<br>')}</div>
      <button class="modal-copy" onclick="copyCaption('captionShort',this)">복사하기</button>
    </div>
    <div class="caption-divider"></div>
    <div class="caption-section">
      <div class="caption-label">📝 긴 버전</div>
      <div class="modal-text" id="captionLong">${data.captionLong.replace(/\n/g, '<br>')}</div>
      <button class="modal-copy" onclick="copyCaption('captionLong',this)">복사하기</button>
    </div>
    <button class="modal-close" onclick="closeModal()">닫기</button>
  </div>
</div>

<script>
var slides = document.querySelectorAll('.slide');
var dotsEl = document.getElementById('dots');
var cur = 0;

// 점 생성
slides.forEach(function(_, i) {
  var d = document.createElement('div');
  d.className = 'dot' + (i === 0 ? ' active' : '');
  dotsEl.appendChild(d);
});

function update() {
  slides.forEach(function(s, i) {
    s.classList.remove('active','prev');
    if (i === cur) s.classList.add('active');
    else if (i < cur) s.classList.add('prev');
  });
  dotsEl.querySelectorAll('.dot').forEach(function(d, i) {
    d.className = 'dot' + (i === cur ? ' active' : '');
  });
  // 부모 페이지에 현재 슬라이드 알림
  try { window.parent.postMessage({ type:'SLIDE_CHANGED', cur:cur, total:slides.length }, '*'); } catch(e){}
}

function go(dir) {
  var n = cur + dir;
  if (n < 0 || n >= slides.length) return;
  cur = n;
  update();
}
function goTo(i) { cur = i; update(); }

// 키보드
document.addEventListener('keydown', function(e) {
  if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); go(1); }
  if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
});

// 캡션 모달
function openModal() { document.getElementById('modal').classList.add('open'); }
function closeModal() { document.getElementById('modal').classList.remove('open'); }
function copyCaption(id, btn) {
  var text = document.getElementById(id).innerText;
  navigator.clipboard.writeText(text).then(function() {
    btn.textContent = '✓ 복사완료';
    btn.style.background = '#059669';
    setTimeout(function() { btn.textContent = '복사하기'; btn.style.background = 'var(--accent)'; }, 2000);
  });
}

// 테마
function setTheme(name) {
  document.body.dataset.theme = name;
  document.querySelectorAll('.theme-dot').forEach(function(d) {
    d.classList.toggle('active', d.dataset.theme === name);
  });
  try { localStorage.setItem('cn_theme', name); } catch(e){}
}
try { setTheme(localStorage.getItem('cn_theme') || 'sky'); } catch(e) { setTheme('sky'); }

// 슬라이드 내용 자동 축소
function fitSlides() {
  var deck = document.getElementById('deck');
  if (!deck) return;
  document.querySelectorAll('.slide').forEach(function(slide) {
    var inner = slide.querySelector('.inner');
    if (!inner) return;
    inner.style.transform = '';
    inner.style.transformOrigin = '';
    var cs = getComputedStyle(slide);
    var pad = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) || 56;
    var avail = deck.offsetHeight - pad;
    if (avail > 0 && inner.scrollHeight > avail + 2) {
      var sc = avail / inner.scrollHeight;
      inner.style.transform = 'scale(' + sc.toFixed(4) + ')';
      inner.style.transformOrigin = 'top center';
    }
  });
}

// iframe 임베딩 시 deck 크기 맞춤
(function() {
  var embedded = false;
  try { embedded = window.self !== window.top; } catch(e) { embedded = true; }
  if (!embedded) return;
  function fix() {
    var w = document.documentElement.clientWidth;
    var deck = document.getElementById('deck');
    if (deck) { deck.style.width = w + 'px'; deck.style.height = w + 'px'; fitSlides(); }
  }
  fix();
  window.addEventListener('resize', fix);
})();

window.addEventListener('resize', fitSlides);
requestAnimationFrame(fitSlides);

// 이미지 저장 — iOS는 navigator.share로 사진첩 직접 저장, 그 외는 꾹 누르기 모달
function showSaveModal(dataUrl) {
  var existing = document.getElementById('saveModal');
  if (existing) existing.parentNode.removeChild(existing);
  var ov = document.createElement('div');
  ov.id = 'saveModal';
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.92);z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:24px;touch-action:pan-y;';
  var hint = document.createElement('p');
  hint.style.cssText = 'color:#fff;font-size:15px;font-weight:700;text-align:center;margin:0;';
  hint.innerHTML = '이미지를 <strong>꾹 눌러서</strong> 사진첩에 저장';
  var img = document.createElement('img');
  img.src = dataUrl;
  img.style.cssText = 'width:100%;max-width:400px;border-radius:20px;display:block;touch-action:auto;-webkit-touch-callout:default;';
  var btn = document.createElement('button');
  btn.textContent = '닫기';
  btn.style.cssText = 'padding:11px 36px;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.3);color:#fff;border-radius:100px;font-size:15px;font-weight:700;cursor:pointer;';
  btn.onclick = function() { ov.parentNode && ov.parentNode.removeChild(ov); };
  ov.appendChild(hint); ov.appendChild(img); ov.appendChild(btn);
  document.body.appendChild(ov);
}

var _busy = false;

function captureDeck() {
  if (typeof domtoimage === 'undefined') throw new Error('이미지 캡처 라이브러리 로드 실패 — 네트워크를 확인해주세요');
  var deck = document.getElementById('deck');
  var computedFilter = window.getComputedStyle(deck).filter;
  var prevFilter = deck.style.filter;
  var prevH = deck.style.height;

  var w = deck.offsetWidth;
  deck.style.height = w + 'px';

  if (computedFilter && computedFilter !== 'none') {
    deck.style.filter = computedFilter;
  }

  return domtoimage.toPng(deck, {
    width: w,
    height: w,
    scale: 2,
    filter: function(node) {
      return !node.classList || !node.classList.contains('theme-bar');
    }
  }).finally(function() {
    deck.style.filter = prevFilter;
    deck.style.height = prevH;
  });
}

async function saveCurrentSlide() {
  if (_busy) return;
  _busy = true;
  try {
    var dataUrl = await captureDeck();

    // iOS: navigator.share로 네이티브 공유 시트 열기 → "이미지 저장" 탭 하면 사진첩에 바로 저장
    try {
      var res = await fetch(dataUrl);
      var blob = await res.blob();
      var file = new File([blob], 'card.png', { type: 'image/png' });
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: '카드뉴스' });
        return;
      }
    } catch(shareErr) { /* share 실패 시 모달로 fallback */ }

    showSaveModal(dataUrl);
  } catch(e) {
    alert('캡처 실패: ' + (e && e.message ? e.message : e));
  } finally {
    _busy = false;
    try { window.parent.postMessage({ type: 'SAVE_DONE' }, '*'); } catch(x) {}
  }
}

async function shareCurrentSlide() {
  if (_busy) return;
  _busy = true;
  try {
    var dataUrl = await captureDeck();

    var res = await fetch(dataUrl);
    var blob = await res.blob();
    var file = new File([blob], 'card.png', { type: 'image/png' });

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: '카드뉴스' });
    } else {
      var a = document.createElement('a');
      a.href = dataUrl;
      a.download = 'card_' + (cur + 1) + '.png';
      a.click();
    }
  } catch(e) {
    if (e && e.name !== 'AbortError' && !/cancel/i.test(e.message || '')) {
      alert('공유 실패: ' + (e && e.message ? e.message : e));
    }
  } finally {
    _busy = false;
    try { window.parent.postMessage({ type: 'SHARE_DONE' }, '*'); } catch(x) {}
  }
}

// postMessage — 부모 페이지 제어
window.addEventListener('message', function(e) {
  if (!e.data || !e.data.type) return;
  if (e.data.type === 'GO_NEXT') go(1);
  if (e.data.type === 'GO_PREV') go(-1);
  if (e.data.type === 'OPEN_CAPTION') openModal();
  if (e.data.type === 'SAVE_CURRENT') saveCurrentSlide();
  if (e.data.type === 'SHARE_CURRENT') shareCurrentSlide();
  if (e.data.type === 'SET_THEME' && e.data.theme) setTheme(e.data.theme);
});

update();
</script>
</body>
</html>`
}

