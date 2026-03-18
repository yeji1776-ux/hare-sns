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
  cardNewsHtmlV2: string
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

function instagramPrompt(post: BlogPost, s: SponsorshipConfig): string {
  const content = post.content.slice(0, 3000)
  const sponsor = buildSponsorContext(s)
  return `당신은 인스타그램 콘텐츠 전문가입니다. 아래 네이버 블로그 글을 인스타그램 게시물로 변환해주세요.

=== 블로그 원문 ===
제목: ${post.title}
작성자: ${post.author}
내용:
${content}
${sponsor}

=== 변환 규칙 ===
1. hook: 팔로워가 멈추게 만드는 강력한 첫 문장 (이모지 포함, 30자 이내)
2. caption: 본문 캡션 (500-800자, 자연스러운 한국어, 줄바꿈 활용, 이모지 사용)
3. hashtags: 해시태그 20-30개 (# 포함)${s.enabled && s.requiredHashtags.length > 0 ? `\n   협찬 필수 해시태그 반드시 포함: ${s.requiredHashtags.join(' ')}` : ''}
4. carouselSlides: 5-7개 슬라이드 (slideNumber, headline 20자 이내, bodyText 50-100자)

반드시 아래 JSON 형식으로만 응답하세요:
{
  "hook": "string",
  "caption": "string",
  "hashtags": ["#태그1"],
  "carouselSlides": [{"slideNumber": 1, "headline": "string", "bodyText": "string"}]
}`
}

function clipVideoPrompt(post: BlogPost, s: SponsorshipConfig): string {
  const content = post.content.slice(0, 3000)
  const sponsor = buildSponsorContext(s)
  return `당신은 숏폼 영상 스크립트 전문가입니다. 아래 블로그 글을 네이버 클립(숏폼) 영상 스크립트로 변환해주세요.

=== 블로그 원문 ===
제목: ${post.title}
작성자: ${post.author}
내용:
${content}
${sponsor}

=== 변환 규칙 ===
- 전체 영상 길이: 60-90초, 장면 수: 5-8개
- 각 장면: sceneNumber, sceneDescription(화면 구성), narration(구어체 한국어), estimatedDuration
${s.enabled ? '- 협찬 요구사항을 나레이션에 자연스럽게 포함' : ''}

반드시 아래 JSON 형식으로만 응답하세요:
{
  "scenes": [{"sceneNumber": 1, "sceneDescription": "string", "narration": "string", "estimatedDuration": "8초"}],
  "totalEstimatedDuration": "string"
}`
}

function clipTextPrompt(post: BlogPost, s: SponsorshipConfig): string {
  const content = post.content.slice(0, 3000)
  const sponsor = buildSponsorContext(s)
  return `당신은 네이버 클립 텍스트 게시글 전문가입니다. 아래 블로그 글을 네이버 클립 텍스트 게시글로 변환해주세요.

=== 블로그 원문 ===
제목: ${post.title}
작성자: ${post.author}
내용:
${content}
${sponsor}

=== 변환 규칙 ===
1. mainText: 300-500자, 핵심 요약 + 시청 유도 + 이모지
2. hashtags: 10-15개${s.enabled && s.requiredHashtags.length > 0 ? `\n   협찬 필수 해시태그 반드시 포함: ${s.requiredHashtags.join(' ')}` : ''}

반드시 아래 JSON 형식으로만 응답하세요:
{
  "mainText": "string",
  "hashtags": ["#태그1"]
}`
}

import { generateCardNewsData, buildCardNewsHtml, buildCardNewsHtmlV2 } from './cardnews'

export async function convertBlogPost(
  post: BlogPost,
  sponsorship: SponsorshipConfig
): Promise<ConversionResult> {
  const [instagram, clipVideoScript, clipTextPost, cardNewsData] = await Promise.all([
    callGeminiJson<InstagramOutput>(instagramPrompt(post, sponsorship)),
    callGeminiJson<ClipVideoScript>(clipVideoPrompt(post, sponsorship)),
    callGeminiJson<ClipTextPost>(clipTextPrompt(post, sponsorship)),
    generateCardNewsData(post, sponsorship),
  ])

  const cardNewsHtml = buildCardNewsHtml(cardNewsData)
  const cardNewsHtmlV2 = buildCardNewsHtmlV2(cardNewsData, post.images)

  return { instagram, clipVideoScript, clipTextPost, cardNewsHtml, cardNewsHtmlV2 }
}
