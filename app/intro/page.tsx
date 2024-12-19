import Link from 'next/link'
import { getMarkdownContent } from '@/lib/markdown'

export default async function IntroPage() {
  const content = await getMarkdownContent()
  
  return (
    <div className="container mx-auto px-4 py-8 prose prose-slate dark:prose-invert max-w-none">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/" className="text-muted-foreground hover:text-foreground no-underline">
          ← 戻る
        </Link>
      </div>
      
      <article 
        className="max-w-4xl mx-auto"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  )
} 