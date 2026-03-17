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
<style>
:root {
  --accent: #38bdf8;
  --deep: #0369a1;
  --text: #1e293b;
  --dim: rgba(30, 41, 59, 0.75);
  --sans: 'Noto Sans KR', sans-serif;
}
*, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
html, body { height:100%; overflow:hidden; }
body {
  font-family: var(--sans);
  -webkit-font-smoothing: antialiased;
  display:flex; align-items:center; justify-content:center;
  background:
    radial-gradient(ellipse 80% 60% at 20% 10%, rgba(186,230,253,0.3) 0%, transparent 60%),
    radial-gradient(ellipse 60% 50% at 80% 80%, rgba(226,232,240,0.5) 0%, transparent 55%),
    linear-gradient(145deg, #f0f9ff 0%, #e2e8f0 40%, #cbd5e1 100%);
}
.stage { width:100vw; height:100vh; display:flex; align-items:center; justify-content:center; }
.deck {
  position:relative; width:min(88vw,88vh); height:min(88vw,88vh);
  overflow:hidden; border-radius:32px;
  border:1px solid rgba(255,255,255,0.75);
  box-shadow: 0 40px 80px rgba(0,0,0,0.12), 0 8px 24px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.5);
}
.slide {
  position:absolute; inset:0;
  display:flex; flex-direction:column; justify-content:center;
  padding:clamp(28px,8%,52px);
  opacity:0; transform:scale(0.97) translateY(12px);
  transition:opacity .5s cubic-bezier(.4,0,.2,1), transform .5s cubic-bezier(.4,0,.2,1);
  pointer-events:none; overflow:hidden; color:var(--text);
}
.slide.active { opacity:1; transform:scale(1) translateY(0); pointer-events:auto; z-index:2; }
.slide.prev { opacity:0; transform:scale(1.03) translateY(-12px); z-index:1; }
.slide::before {
  content:''; position:absolute; inset:0;
  background:linear-gradient(135deg,rgba(255,255,255,0.35) 0%,transparent 55%);
  pointer-events:none;
}

.s-glass { background:linear-gradient(135deg,rgba(255,255,255,0.55) 0%,rgba(186,230,253,0.3) 100%); backdrop-filter:blur(12px); }
.s-silver { background:linear-gradient(135deg,rgba(245,245,248,0.7) 0%,rgba(215,220,228,0.5) 100%); backdrop-filter:blur(12px); }
.s-accent { background:linear-gradient(145deg,rgba(186,230,253,0.6), rgba(125,211,252,0.45)); backdrop-filter:blur(28px); }
.s-mid { background:linear-gradient(145deg,rgba(226,232,240,0.7), rgba(203,213,225,0.6)); backdrop-filter:blur(28px); }
.s-deep { background:linear-gradient(145deg,rgba(2,132,199,0.85), rgba(3,105,161,0.75)); backdrop-filter:blur(28px); }

.orb { position:absolute; border-radius:50%; filter:blur(clamp(24px,6vw,44px)); pointer-events:none; }
.orb-a { width:55%; aspect-ratio:1; background:rgba(56,189,248,0.45); top:-20%; right:-15%; }
.orb-b { width:40%; aspect-ratio:1; background:rgba(148,163,184,0.35); bottom:-15%; left:-10%; }
.orb-w { width:50%; aspect-ratio:1; background:rgba(255,255,255,0.1); top:-20%; right:-15%; }
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
.s-deep .tag, .s-accent .tag, .s-mid .tag { background:rgba(255,255,255,0.12); border-color:rgba(255,255,255,0.25); color:rgba(255,255,255,0.9); }

.t-xl { font-size:clamp(34px,10vw,68px); font-weight:900; line-height:1.08; letter-spacing:-0.02em; }
.t-lg { font-size:clamp(22px,6vw,42px); font-weight:700; line-height:1.2; word-break:keep-all; }
.t-body { font-size:clamp(12px,2.8vw,15px); font-weight:400; line-height:1.85; color:var(--dim); margin-top:12px; }
.s-deep .t-body, .s-accent .t-body, .s-mid .t-body { color:rgba(255,255,255,0.78); }
.s-deep .t-xl, .s-deep .t-lg, .s-accent .t-xl, .s-accent .t-lg, .s-mid .t-xl, .s-mid .t-lg { color:#fff; }

.rule { width:100%; height:1px; background:linear-gradient(90deg,rgba(255,255,255,0.7),rgba(255,255,255,0)); margin:clamp(16px,4%,28px) 0; }
.s-deep .rule, .s-accent .rule, .s-mid .rule { background:linear-gradient(90deg,rgba(255,255,255,0.2),rgba(255,255,255,0)); }

.big-num { font-size:clamp(60px,18vw,110px); font-weight:900; line-height:.9; letter-spacing:-0.03em; }
.big-unit { font-size:clamp(11px,2.5vw,15px); font-weight:400; letter-spacing:.2em; color:rgba(255,255,255,0.7); margin-top:8px; display:block; }

.cards { display:grid; grid-template-columns:1fr 1fr; gap:clamp(7px,1.8%,11px); margin-top:clamp(16px,4%,28px); }
.card {
 background:rgba(255,255,255,0.38); border:1px solid rgba(255,255,255,0.65);
 border-radius:clamp(12px,3%,18px); padding:clamp(12px,3.5%,20px);
 backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px);
 box-shadow:0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.7);
 position:relative; overflow:hidden;
}
.card::before { content:''; position:absolute; top:0; left:0; right:0; height:1px; background:linear-gradient(90deg,rgba(255,255,255,0.8),transparent); }
.s-deep .card, .s-accent .card, .s-mid .card { background:rgba(255,255,255,0.12); border-color:rgba(255,255,255,0.2); }
.card-icon { font-size:clamp(18px,4.5vw,26px); margin-bottom:clamp(5px,1.5%,9px); }
.card-title { font-size:clamp(11px,2.5vw,13px); font-weight:700; color:var(--text); margin-bottom:4px; }
.card-body { font-size:clamp(10px,2vw,12px); color:var(--dim); line-height:1.55; }
.s-deep .card-title, .s-accent .card-title, .s-mid .card-title { color:rgba(255,255,255,0.92); }
.s-deep .card-body, .s-accent .card-body, .s-mid .card-body { color:rgba(255,255,255,0.72); }

.list { list-style:none; margin-top:clamp(10px,2.5%,18px); padding:0; }
.list li { display:flex; gap:clamp(8px,2%,14px); align-items:flex-start; padding:clamp(9px,2.5%,16px) 0; border-bottom:1px solid rgba(0,0,0,0.06); }
.list li:last-child { border:none; }
.s-deep .list li, .s-mid .list li { border-color:rgba(255,255,255,0.12); }
.list-dot { width:7px; height:7px; border-radius:50%; background:var(--accent); flex-shrink:0; margin-top:6px; }
.s-deep .list-dot, .s-mid .list-dot { background:#fff; box-shadow:0 0 6px rgba(255,255,255,0.5); }
.list-txt { flex:1; font-size:clamp(12px,2.2vw,14px); color:var(--text); line-height:1.6; }
.s-deep .list-txt, .s-mid .list-txt { color:rgba(255,255,255,0.9); }
.list-em { font-weight:700; color:var(--accent); margin-right:4px; }
.s-deep .list-em { color:#fff; }
.list-sub { font-size:.82em; color:var(--dim); display:block; margin-top:2px; font-weight:400; }
.s-deep .list-sub, .s-mid .list-sub { color:rgba(255,255,255,0.62); }

.free-row { display:flex; gap:clamp(6px,1.8%,10px); flex-wrap:wrap; margin-top:clamp(12px,3%,20px); }
.free-pill { background:rgba(255,255,255,0.5); border:1px solid rgba(255,255,255,0.75); border-radius:100px; padding:6px 14px; font-size:clamp(11px,2.2vw,13px); font-weight:600; color:var(--text); display:inline-flex; align-items:center; gap:6px; backdrop-filter:blur(8px); }
.s-deep .free-pill, .s-accent .free-pill, .s-mid .free-pill { background:rgba(255,255,255,0.15); border-color:rgba(255,255,255,0.3); color:#fff; }

.loc { margin-top:clamp(12px,3%,20px); font-size:clamp(10px,2.2vw,12px); color:var(--dim); font-weight:500; display:flex; align-items:center; gap:4px; }
.s-deep .loc, .s-accent .loc, .s-mid .loc { color:rgba(255,255,255,0.55); }

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
.modal-box { background:rgba(248,250,252,0.88); border:1px solid rgba(255,255,255,0.8); backdrop-filter:blur(16px); width:100%; max-width:440px; border-radius:24px; padding:24px; box-shadow:0 24px 48px rgba(0,0,0,0.12); position:relative; }
.modal-title { font-size:11px; font-weight:600; letter-spacing:.15em; text-transform:uppercase; color:var(--accent); margin-bottom:12px; }
.modal-text { font-size:13px; line-height:1.85; color:var(--text); white-space:pre-wrap; max-height:50vh; overflow-y:auto; padding-right:8px; }
.modal-copy { margin-top:14px; width:100%; padding:12px; background:var(--accent); color:#fff; border:none; border-radius:12px; font-size:13px; font-weight:700; cursor:pointer; transition:opacity .2s; }
.modal-copy:hover { opacity:.85; }
.modal-close { margin-top:8px; width:100%; padding:9px; background:transparent; color:var(--dim); border:none; font-size:12px; font-weight:600; cursor:pointer; }
.hare-table { position: absolute; bottom: 32px; right: 36px; font-size: 13px; font-weight: 500; font-family: sans-serif; opacity: 0.6; letter-spacing: 0.05em; color: var(--text); z-index: 5; }
.closing-heart {
  position: absolute; bottom: 40px; right: 36px;
  width: 72px; height: 72px; z-index: 5;
  filter: drop-shadow(0 4px 12px rgba(16, 185, 129, 0.4));
  animation: float 3s ease-in-out infinite;
}
@keyframes float {
  0% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
  100% { transform: translateY(0); }
}
</style>
</head>
<body>
<div class="stage">
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
      <svg class="closing-heart" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <defs>
          <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="6" result="blur" />
            <feOffset dx="0" dy="12" result="offsetBlur" />
            <feComponentTransfer><feFuncA type="linear" slope="0.15" /></feComponentTransfer>
            <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <linearGradient id="glass" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#e0f2fe" />
            <stop offset="30%" stop-color="#bae6fd" />
            <stop offset="70%" stop-color="#7dd3fc" />
            <stop offset="100%" stop-color="#38bdf8" />
          </linearGradient>
          <linearGradient id="rim" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#ffffff" />
            <stop offset="100%" stop-color="rgba(255,255,255,0.3)" />
          </linearGradient>
          <radialGradient id="highlight" cx="35%" cy="25%" r="45%">
            <stop offset="0%" stop-color="rgba(255, 255, 255, 0.95)" />
            <stop offset="30%" stop-color="rgba(255, 255, 255, 0.6)" />
            <stop offset="100%" stop-color="rgba(255, 255, 255, 0)" />
          </radialGradient>
          <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fef08a" />
            <stop offset="50%" stop-color="#eab308" />
            <stop offset="100%" stop-color="#ca8a04" />
          </linearGradient>
          <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        <g filter="url(#shadow)">
          <path d="M60 100 C-20 60, 20-10, 60 30 C100-10, 140 60, 60 100" fill="url(#glass)" stroke="url(#rim)" stroke-width="2"/>
          <path d="M60 100 C-20 60, 20-10, 60 30 C100-10, 140 60, 60 100" fill="url(#highlight)" opacity="0.9"/>
          <path d="M25 35 Q30 20 50 22" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" opacity="0.9"/>
          <path d="M95 38 Q90 23 70 25" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" opacity="0.7"/>
        </g>
        <text x="60" y="52" font-size="16" fill="url(#gold)" font-weight="900" font-family="'Brush Script MT', 'Dancing Script', 'Pacifico', cursive, Georgia" font-style="italic" text-anchor="middle" filter="url(#goldGlow)">hare_</text>
        <text x="60" y="68" font-size="16" fill="url(#gold)" font-weight="900" font-family="'Brush Script MT', 'Dancing Script', 'Pacifico', cursive, Georgia" font-style="italic" text-anchor="middle" filter="url(#goldGlow)">table</text>
      </svg>
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
document.addEventListener('touchstart', e => tx = e.changedTouches[0].screenX);
document.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].screenX - tx;
  if(Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
});
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
</script>
</body>
</html>`
}
