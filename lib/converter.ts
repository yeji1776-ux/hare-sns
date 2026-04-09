import { callGeminiJson } from './gemini'
import { BlogPost } from './scraper'

export interface SponsorshipConfig {
  enabled: boolean
  rawRequirements: string
  mandatoryMentions: string[]
  requiredHashtags: string[]
  links: string[]
  prohibitedExpressions: string[]
}

export interface CarouselSlide {
  slideNumber: number
  headline: string
  bodyText: string
}

export interface InstagramOutput {
  hook: string
  caption: string
  hashtags: string[]
  carouselSlides: CarouselSlide[]
}

export interface ConversionResult {
  instagram: InstagramOutput
  cardNewsHtml: string
}


function buildSponsorContext(s: SponsorshipConfig): string {
  if (!s.enabled) return ''
  const lines = ['\n=== 협찬 미션 요구사항 (반드시 자연스럽게 포함) ===']
  if (s.rawRequirements) lines.push(`\n미션 요구사항:\n${s.rawRequirements}`)
  if (s.mandatoryMentions.length > 0) lines.push(`\n필수 언급 항목: ${s.mandatoryMentions.join(', ')}`)
  if (s.requiredHashtags.length > 0) lines.push(`\n필수 해시태그: ${s.requiredHashtags.join(' ')}`)
  if (s.links.length > 0) lines.push(`\n포함할 링크: ${s.links.join(', ')}`)
  if (s.prohibitedExpressions.length > 0) lines.push(`\n사용 금지 표현: ${s.prohibitedExpressions.join(', ')}`)
  lines.push('\n위 협찬 요구사항을 모든 플랫폼 콘텐츠에 자연스럽게 녹여내세요.')
  return lines.join('')
}

import { CardNewsData, buildCardNewsHtml } from './cardnews'

interface AllInOneResult {
  instagram: InstagramOutput
  cardNews: CardNewsData
}

function allInOnePrompt(post: BlogPost, s: SponsorshipConfig): string {
  const content = post.content.slice(0, 3000)
  const sponsor = buildSponsorContext(s)
  const placeSection = post.placeInfo ? `\n=== 장소/주소 정보 ===\n${post.placeInfo}\n` : ''
  return `당신은 블로그 글을 여러 SNS 플랫폼용 콘텐츠로 변환하는 전문가입니다.
아래 블로그 글을 읽고, 인스타그램 + 카드뉴스 콘텐츠를 **한 번에** 생성해주세요.

=== 블로그 원문 ===
제목: ${post.title}
작성자: ${post.author}
내용:
${content}
${placeSection}${sponsor}

반드시 아래 JSON 구조로만 응답하세요:
{
  "instagram": {
    "hook": "팔로워가 멈추게 만드는 첫 문장 (이모지 포함, 30자 이내)",
    "caption": "본문 200-400자 (자연스러운 한국어, 이모지) + 줄바꿈 2번 + 자세한 내용은 + 줄바꿈 + 📲 ${post.url || 'https://m.blog.naver.com/hare_table/글번호'} + 줄바꿈 + (화면 캡처 후 링크를 꾹 누르면 연결 됩니다🫧) + 줄바꿈 2번 + 해시태그 5개",
    "hashtags": ["#태그1", "#태그2", "...딱 5개${s.enabled && s.requiredHashtags.length > 0 ? `, 협찬 필수: ${s.requiredHashtags.join(' ')}` : ''}"],
    "carouselSlides": [{"slideNumber": 1, "headline": "20자 이내", "bodyText": "50-100자"}]
  },
  "cardNews": {
    "placeName": "장소명 (10자 이내)",
    "coverTag": "☕️ 카페/디저트 (이모지+카테고리)",
    "coverHook": "인상적인 훅 (20자 이내)",
    "coverAddress": "간단한 위치 (예: 연남동)",
    "basicInfo": {
      "location": "위치 요약", "locationSub": "보조 설명",
      "hours": "운영 시간", "hoursSub": "휴무일 등",
      "price": "가격대", "priceSub": "대표메뉴",
      "feature": "핵심 특징", "featureSub": "주차, 예약 등"
    },
    "highlightNum": "핵심 숫자 (예: 10)",
    "highlightUnit": "단위 (예: 만원)",
    "highlightHook": "숫자 임팩트 문장",
    "featureTitle": "특징 제목",
    "features": [{"icon": "이모지", "title": "특징명", "desc": "설명"}],
    "benefitTag": "이용/혜택 안내",
    "benefitTitle": "알아두면 좋은 정보",
    "benefits": [{"icon": "이모지", "text": "항목"}],
    "benefitSub": "보조 설명 1줄",
    "reviewTitle": "총평 한줄",
    "reviews": ["포인트1", "포인트2", "포인트3"],
    "closingArea": "지역명",
    "closingTitle": "장소명/카테고리",
    "closingWord": "감성적 마무리 한 마디",
    "closingHashtags": "대표 해시태그 3~4개",
    "captionLong": "긴 버전 본문 300-500자, 마지막에 자세한 내용은 + 📲 블로그URL + (화면 캡처 후 링크를 꾹 누르면 연결 됩니다🫧) + 해시태그 5개${s.enabled ? ', 협찬 문구 포함' : ''}",
    "captionShort": "짧은 버전 본문 100-200자, 마지막에 자세한 내용은 + 📲 블로그URL + (화면 캡처 후 링크를 꾹 누르면 연결 됩니다🫧) + 해시태그 5개${s.enabled ? ', 협찬 문구 포함' : ''}"
  }
}

세부 규칙:
- instagram.carouselSlides: 5-7개
- cardNews.features: 딱 4개
- cardNews.benefits: 3~6개
- cardNews.reviews: 딱 3개
${s.enabled ? '- 협찬 요구사항을 모든 콘텐츠에 자연스럽게 포함' : ''}`
}

export async function convertBlogPost(
  post: BlogPost,
  sponsorship: SponsorshipConfig
): Promise<ConversionResult> {
  const result = await callGeminiJson<AllInOneResult>(allInOnePrompt(post, sponsorship))

  const cardNewsHtml = buildCardNewsHtml(result.cardNews)

  return {
    instagram: result.instagram,
    cardNewsHtml,
  }
}

export async function regenerateSection(
  post: BlogPost,
  sponsorship: SponsorshipConfig,
  type: 'cardnews' | 'instagram'
): Promise<Partial<ConversionResult>> {
  const result = await callGeminiJson<AllInOneResult>(allInOnePrompt(post, sponsorship))

  if (type === 'cardnews') {
    return { cardNewsHtml: buildCardNewsHtml(result.cardNews) }
  } else {
    return { instagram: result.instagram }
  }
}
