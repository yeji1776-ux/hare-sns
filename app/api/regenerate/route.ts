import { NextRequest, NextResponse } from 'next/server'
import { scrapeNaverBlog } from '@/lib/scraper'
import { regenerateSection } from '@/lib/converter'

const defaultSponsorship = {
  enabled: false,
  rawRequirements: '',
  mandatoryMentions: [],
  requiredHashtags: [],
  links: [],
  prohibitedExpressions: [],
}

export async function POST(req: NextRequest) {
  try {
    const { url, type } = await req.json()
    if (!url || !type) return NextResponse.json({ error: '파라미터가 필요합니다.' }, { status: 400 })
    if (!['cardnews', 'instagram', 'clip'].includes(type)) {
      return NextResponse.json({ error: '유효하지 않은 type입니다.' }, { status: 400 })
    }

    const post = await scrapeNaverBlog(url)
    const result = await regenerateSection(post, defaultSponsorship, type)
    return NextResponse.json(result)
  } catch (e) {
    const message = e instanceof Error ? e.message : '재생성 중 오류가 발생했습니다.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
