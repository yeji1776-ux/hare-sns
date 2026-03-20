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

export interface Scene {
  sceneNumber: number
  sceneDescription: string
  narration: string
  estimatedDuration: string
}

export interface ClipVideoScript {
  scenes: Scene[]
  totalEstimatedDuration: string
}

export interface ClipTextPost {
  mainText: string
  hashtags: string[]
}

export interface ConversionResult {
  instagram: InstagramOutput
  clipVideoScript: ClipVideoScript
  clipTextPost: ClipTextPost
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
  clipVideoScript: ClipVideoScript
  clipTextPost: ClipTextPost
  cardNews: CardNewsData
}

function allInOnePrompt(post: BlogPost, s: SponsorshipConfig): string {
  const content = post.content.slice(0, 3000)
  const sponsor = buildSponsorContext(s)
  return `당신은 블로그 글을 여러 SNS 플랫폼용 콘텐츠로 변환하는 전문가입니다.
아래 블로그 글을 읽고, 인스타그램 + 네이버 클립 + 카드뉴스 콘텐츠를 **한 번에** 생성해주세요.

=== 블로그 원문 ===
제목: ${post.title}
작성자: ${post.author}
내용:
${content}
${sponsor}

반드시 아래 JSON 구조로만 응답하세요:
{
  "instagram": {
    "hook": "팔로워가 멈추게 만드는 첫 문장 (이모지 포함, 30자 이내)",
    "caption": "본문 캡션 (500-800자, 자연스러운 한국어, 줄바꿈, 이모지)",
    "hashtags": ["#태그1", "#태그2", "...딱 5개만 (# 포함)${s.enabled && s.requiredHashtags.length > 0 ? `, 협찬 필수: ${s.requiredHashtags.join(' ')}` : ''}"],
    "carouselSlides": [{"slideNumber": 1, "headline": "20자 이내", "bodyText": "50-100자"}]
  },
  "clipVideoScript": {
    "scenes": [{"sceneNumber": 1, "sceneDescription": "화면 구성", "narration": "구어체 나레이션", "estimatedDuration": "3초"}],
    "totalEstimatedDuration": "약 15초"
  },
  "clipTextPost": {
    "mainText": "300-500자 핵심 요약 + 이모지",
    "hashtags": ["#태그1", "...10-15개${s.enabled && s.requiredHashtags.length > 0 ? `, 협찬 필수: ${s.requiredHashtags.join(' ')}` : ''}"]
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
    "captionLong": "긴 인스타 캡션 (2~3줄 훅, 핵심 정보, 해시태그 5개${s.enabled ? ', 협찬 문구 포함' : ''})",
    "captionShort": "짧은 인스타 캡션 (훅 1줄, 정보 1~2줄, 해시태그 5개${s.enabled ? ', 협찬 문구 포함' : ''})"
  }
}

세부 규칙:
- instagram.carouselSlides: 5-7개
- clipVideoScript.scenes: 3-5개, 총 15초 이내 (네이버 클립은 15초 숏폼)
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
    clipVideoScript: result.clipVideoScript,
    clipTextPost: result.clipTextPost,
    cardNewsHtml,
  }
}

export async function regenerateSection(
  post: BlogPost,
  sponsorship: SponsorshipConfig,
  type: 'cardnews' | 'instagram' | 'clip'
): Promise<Partial<ConversionResult>> {
  const result = await callGeminiJson<AllInOneResult>(allInOnePrompt(post, sponsorship))

  if (type === 'cardnews') {
    return { cardNewsHtml: buildCardNewsHtml(result.cardNews) }
  } else if (type === 'instagram') {
    return { instagram: result.instagram }
  } else {
    return { clipVideoScript: result.clipVideoScript, clipTextPost: result.clipTextPost }
  }
}
