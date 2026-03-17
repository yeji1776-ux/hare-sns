import axios from 'axios'
import * as cheerio from 'cheerio'

export interface BlogPost {
  title: string
  content: string
  images: string[]
  author: string
  url: string
}

function toMobileUrl(url: string): string {
  // Legacy: PostView.nhn?blogId=xxx&logNo=yyy
  const legacyMatch = url.match(/blogId=([^&]+)&logNo=([^&]+)/)
  if (legacyMatch) {
    return `https://m.blog.naver.com/${legacyMatch[1]}/${legacyMatch[2]}`
  }
  // Modern: blog.naver.com/blogId/postNo
  const modernMatch = url.match(/blog\.naver\.com\/([^/?]+)\/(\d+)/)
  if (modernMatch) {
    return `https://m.blog.naver.com/${modernMatch[1]}/${modernMatch[2]}`
  }
  // Already mobile
  if (url.includes('m.blog.naver.com')) return url
  return url
}

export async function scrapeNaverBlog(url: string): Promise<BlogPost> {
  const mobileUrl = toMobileUrl(url)

  const response = await axios.get(mobileUrl, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8',
      Referer: 'https://m.blog.naver.com/',
    },
    timeout: 15000,
  })

  const $ = cheerio.load(response.data)

  const title =
    $('meta[property="og:title"]').attr('content') ||
    $('title').text().trim() ||
    $('.se-title-text').text().trim() ||
    ''

  const author =
    $('meta[property="og:article:author"]').attr('content') ||
    $('.blog_name').text().trim() ||
    $('.nick').text().trim() ||
    ''

  let content = ''
  const selectors = ['.se-main-container', '.post-view', '.se_component_wrap', '#postViewArea', '.post_ct']
  for (const selector of selectors) {
    if ($(selector).length > 0) {
      const texts: string[] = []
      $(selector)
        .find('p, h1, h2, h3, h4, .se-text-paragraph, .se-heading-text')
        .each((_, el) => {
          const text = $(el).text().trim()
          if (text.length > 0) texts.push(text)
        })
      if (texts.length > 0) {
        content = texts.join('\n')
        break
      }
      content = $(selector).text().trim()
      if (content.length > 50) break
    }
  }
  if (content.length < 50) {
    content = $('body').text().trim().replace(/\s+/g, ' ')
  }

  const images: string[] = []
  const imgSelectors = ['.se-main-container img', '.post-view img', '#postViewArea img', 'article img']
  for (const selector of imgSelectors) {
    $(selector).each((_, el) => {
      const src = $(el).attr('src') || $(el).attr('data-lazy-src') || $(el).attr('data-src')
      if (src && !src.includes('data:') && !images.includes(src)) {
        const width = parseInt($(el).attr('width') || '0')
        if (width === 0 || width > 100) images.push(src)
      }
    })
    if (images.length > 0) break
  }

  return {
    title: title.replace(' : 네이버 블로그', '').trim(),
    content,
    images: images.slice(0, 20),
    author,
    url: mobileUrl,
  }
}
