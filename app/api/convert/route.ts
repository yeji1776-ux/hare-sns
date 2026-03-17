import { NextRequest, NextResponse } from 'next/server'
import { scrapeNaverBlog } from '@/lib/scraper'
import { convertBlogPost } from '@/lib/converter'

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()
    if (!url) return NextResponse.json({ error: 'URL이 필요합니다.' }, { status: 400 })

    const post = await scrapeNaverBlog(url)
    const sponsorship = {
      enabled: false,
      rawRequirements: '',
      mandatoryMentions: [],
      requiredHashtags: [],
      links: [],
      prohibitedExpressions: [],
    }
    const result = await convertBlogPost(post, sponsorship)
    return NextResponse.json(result)
  } catch (e) {
    const message = e instanceof Error ? e.message : '변환 중 오류가 발생했습니다.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
