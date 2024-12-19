import { remark } from 'remark'
import html from 'remark-html'
import fs from 'fs'
import path from 'path'

export async function getMarkdownContent() {
  const fullPath = path.join(process.cwd(), 'intro.md')
  const fileContents = fs.readFileSync(fullPath, 'utf8')

  const processedContent = await remark()
    .use(html)
    .process(fileContents)
  
  return processedContent.toString()
} 