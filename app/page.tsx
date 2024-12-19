import Link from 'next/link'
import { HelpCircle } from 'lucide-react'
import CompoundVerbSearch from '../components/CompoundVerbSearch'

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <h1 className="text-3xl font-bold">日本語複合動詞</h1>
        <Link 
          href="/intro"
          className="inline-flex items-center text-muted-foreground hover:text-foreground"
          title="データベースについて"
        >
          <HelpCircle className="h-6 w-6" />
          <span className="sr-only">データベースについて</span>
        </Link>
      </div>
      <CompoundVerbSearch />
    </div>
  )
}

