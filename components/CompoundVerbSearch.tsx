'use client'

import React, { useState, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Moon, Sun, Settings, Volume2 } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

import verbsData from '@/data/verbs.json'
import indexData from '@/data/index.json'
import useTTS from '@/components/useTTS';

type Verb = {
  headword_id: number
  headword1: string
  reading: string
  romaji: string
  senses: Array<{
    definition: string
    examples: Array<{
      example: string
      example_en: string
    }>
  }>
}

type Index = {
  [key: string]: {
    start: number
    end: number
    count: number
  }
}

const verbs = verbsData as Verb[]
const index = indexData as Index

export default function CompoundVerbSearch() {
  const [searchTerm, setSearchTerm] = useState('')
  const [displayMode, setDisplayMode] = useState<'card' | 'list'>('card')
  const [darkMode, setDarkMode] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const filteredVerbs = verbs.filter((verb: Verb) =>
    verb.headword1.includes(searchTerm) ||
    verb.reading.includes(searchTerm) ||
    verb.romaji.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const indexedVerbs = selectedIndex && index[selectedIndex]
    ? verbs.slice(index[selectedIndex].start, index[selectedIndex].end + 1)
    : filteredVerbs

  const totalPages = Math.ceil(indexedVerbs.length / itemsPerPage)
  const paginatedVerbs = indexedVerbs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )
  const [audioState, setAudioState] = useState<'idle' | 'loading' | 'playing' | 'paused'>('idle');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { generateAudio } = useTTS();
  const playAudio = async (text: string) => {
    if (audioState === 'playing') {
      audioRef.current?.pause();
      setAudioState('paused');
      return;
    }

    if (audioState === 'paused') {
      audioRef.current?.play();
      setAudioState('playing');
      return;
    }

    setAudioState('loading');
    const voice = 'ja-JP-NanamiNeural';
    try {
      const url = await generateAudio(text, voice, { pitch: 0, rate: 0 });
      const audio = new Audio(url);
      audioRef.current = audio;
      
      audio.onended = () => {
        setAudioState('idle');
        URL.revokeObjectURL(url);
      };

      audio.onerror = (e) => {
        console.error('音频播放错误:', e);
        setAudioState('idle');
        URL.revokeObjectURL(url);
      };

      await audio.play();
      setAudioState('playing');
    } catch (error) {
      console.error('生成或播放音频失败:', error);
      setAudioState('idle');
    }
  }
  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="bg-background text-foreground min-h-screen p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">見出し検索</h1>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon">
                <Settings className="h-[1.2rem] w-[1.2rem]" />
                <span className="sr-only">設定を開く</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">表示モード</h4>
                  <div className="flex space-x-2">
                    <Button
                      variant={displayMode === 'card' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setDisplayMode('card')}
                    >
                      カード
                    </Button>
                    <Button
                      variant={displayMode === 'list' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setDisplayMode('list')}
                    >
                      リスト
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">表示件数</h4>
                  <div className="flex space-x-2">
                    {[10, 20, 50].map((num) => (
                      <Button
                        key={num}
                        variant={itemsPerPage === num ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setItemsPerPage(num)}
                      >
                        {num}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">テーマ</h4>
                  <div className="flex items-center space-x-2">
                    <Sun className="h-[1.2rem] w-[1.2rem]" />
                    <Switch
                      checked={darkMode}
                      onCheckedChange={setDarkMode}
                      aria-label="ダークモード切替"
                    />
                    <Moon className="h-[1.2rem] w-[1.2rem]" />
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex space-x-4 mb-4">
          <Input
            type="search"
            placeholder="漢字・かな・ローマ字..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-grow"
          />
          <Select onValueChange={setSelectedIndex}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="五十音索引" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(index).map((key) => (
                <SelectItem key={key} value={key}>{key}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className={`grid gap-4 ${displayMode === 'card' ? 'md:grid-cols-2 lg:grid-cols-3' : ''}`}>
          {paginatedVerbs.map((verb: Verb) => (
            displayMode === 'card' ? (
              <Card key={verb.headword_id}>
                <CardHeader>
                  <div className="flex items-center">
                    <CardTitle>{verb.headword1}</CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => playAudio(verb.headword1)}
                      aria-label={`Play pronunciation for ${verb.headword1}`}
                      className="ml-1 p-0 h-auto"
                      disabled={audioState === 'loading'}
                    >
                      <Volume2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                  <CardDescription>{verb.reading}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="mb-2">{verb.senses[0].definition}</p>
                  {verb.senses[0].examples && verb.senses[0].examples[0] && (
                    <div>
                      <p className="text-sm text-muted-foreground">例文：</p>
                      <div className="flex items-center">
                        <p>{verb.senses[0].examples[0].example}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => playAudio(verb.senses[0].examples[0].example)}
                          aria-label="Play example sentence"
                          className="ml-1 p-0 h-auto"
                          disabled={audioState === 'loading'}
                        >
                          <Volume2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">{verb.senses[0].examples[0].example_en}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div key={verb.headword_id} className="border-b pb-2">
                <div className="flex items-center">
                  <h3 className="font-bold">{verb.headword1} ({verb.reading})</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => playAudio(verb.headword1)}
                    aria-label={`Play pronunciation for ${verb.headword1}`}
                    className="ml-1 p-0 h-auto"
                  >
                    <Volume2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
                <p>{verb.senses[0].definition}</p>
                {verb.senses[0].examples && verb.senses[0].examples[0] && (
                  <div className="text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <p>例文: {verb.senses[0].examples[0].example}</p>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => playAudio(verb.senses[0].examples[0].example)}
                        aria-label="Play example sentence"
                        className="ml-1 p-0 h-auto"
                      >
                        <Volume2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                    <p>{verb.senses[0].examples[0].example_en}</p>
                  </div>
                )}
              </div>
            )
          ))}
        </div>
        <div className="mt-4 flex justify-center items-center space-x-2">
          <Button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            前へ
          </Button>
          <span>{currentPage} / {totalPages}</span>
          <Button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            次へ
          </Button>
        </div>
      </div>
    </div>
  )
}

