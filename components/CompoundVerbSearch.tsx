'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Moon, Sun, Settings, Volume2 } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

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
    definition_en: string
    definition_kr: string
    definition_sc: string
    definition_tc: string
    examples: Array<{
      example: string
      example_en: string
      example_kr: string
      example_sc: string
      example_tc: string
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

type TranslationLanguage = 'en' | 'kr' | 'sc' | 'tc';

const verbs = verbsData as Verb[]
const index = indexData as Index

export default function CompoundVerbSearch() {
  const [searchTerm, setSearchTerm] = useState('')
  const [displayMode, setDisplayMode] = useState<'card' | 'list'>('card')
  const [darkMode, setDarkMode] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [audioState, setAudioState] = useState<'idle' | 'loading' | 'playing' | 'paused'>('idle');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { generateAudio, cleanup } = useTTS();
  const [currentPlayingText, setCurrentPlayingText] = useState<string | null>(null);
  const [translationLang, setTranslationLang] = useState<TranslationLanguage>('en');

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  useEffect(() => {
    console.log('Audio state changed:', audioState);
  }, [audioState]);

  const playAudio = async (text: string) => {
    if (audioState === 'loading') {
      return;
    }

    if (text === currentPlayingText) {
      if (audioState === 'playing' && audioRef.current) {
        audioRef.current.pause();
        setAudioState('paused');
        return;
      }

      if (audioState === 'paused' && audioRef.current) {
        try {
          await audioRef.current.play();
          setAudioState('playing');
        } catch (error) {
          console.error('恢复放失败:', error);
          setAudioState('idle');
          audioRef.current = null;
          setCurrentPlayingText(null);
        }
        return;
      }
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    setAudioState('loading');
    setCurrentPlayingText(text);
    const voice = 'ja-JP-NanamiNeural';
    
    try {
      const { url, audio } = await generateAudio(text, voice);
      
      audio.onplay = () => {
        setAudioState('playing');
      };
      
      audio.onpause = () => {
        setAudioState('paused');
      };
      
      audio.onended = () => {
        setAudioState('idle');
        audioRef.current = null;
        setCurrentPlayingText(null);
        URL.revokeObjectURL(url);
      };

      audio.onerror = (e) => {
        console.error('音频播放错误:', e);
        setAudioState('idle');
        audioRef.current = null;
        setCurrentPlayingText(null);
        URL.revokeObjectURL(url);
      };

      audioRef.current = audio;
      await audio.play();
    } catch (error) {
      console.error('生成或播放音频失败:', error);
      setAudioState('idle');
      audioRef.current = null;
      setCurrentPlayingText(null);
    }
  };

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

  const getTranslation = (sense: Verb['senses'][0], type: 'definition' | 'example') => {
    const suffix = translationLang;
    if (type === 'definition') {
      return sense[`definition_${suffix}`];
    }
    return sense.examples[0]?.[`example_${suffix}`];
  };

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="bg-background text-foreground min-h-screen p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">見出し検索</h1>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon">
                <Settings className="h-[1.2rem] w-[1.2rem]" />
                <span className="sr-only">��定を開く</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96">
              <div className="grid gap-4">
                <div className="flex justify-between gap-4">
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
                  <h4 className="font-medium leading-none">翻訳言語</h4>
                  <div className="flex gap-2">
                    <Button
                      variant={translationLang === 'en' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTranslationLang('en')}
                    >
                      English
                    </Button>
                    <Button
                      variant={translationLang === 'sc' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTranslationLang('sc')}
                    >
                      简体中文
                    </Button>
                    <Button
                      variant={translationLang === 'tc' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTranslationLang('tc')}
                    >
                      繁體中文
                    </Button>
                    <Button
                      variant={translationLang === 'kr' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTranslationLang('kr')}
                    >
                      한국어
                    </Button>
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
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                五十音索引
                {selectedIndex && <span className="ml-2">{selectedIndex}</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="grid gap-4">
                <h4 className="font-medium leading-none">五十音索引</h4>
                <div className="grid grid-cols-5 gap-2">
                  {Object.entries(index).map(([key, value]) => (
                    <TooltipProvider key={key} delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant={selectedIndex === key ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => {
                              setSelectedIndex(selectedIndex === key ? null : key);
                              setCurrentPage(1);
                            }}
                            className="w-full"
                          >
                            {key}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p>{value.count}語</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
                {selectedIndex && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedIndex(null);
                      setCurrentPage(1);
                    }}
                    className="mt-2"
                  >
                    クリア
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
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
                      disabled={
                        audioState === 'loading' || 
                        audioState === 'playing' || 
                        (audioState === 'paused' && currentPlayingText !== verb.headword1)
                      }
                      data-state={currentPlayingText === verb.headword1 ? audioState : 'idle'}
                    >
                      <Volume2 className={`h-4 w-4 ${
                        currentPlayingText === verb.headword1 && audioState === 'playing' 
                          ? 'text-primary' 
                          : 'text-muted-foreground'
                      }`} />
                    </Button>
                  </div>
                  <CardDescription>{verb.reading}</CardDescription>
                </CardHeader>
                <CardContent>
                  {verb.senses.map((sense, index) => (
                    <div key={index} className="mb-4">
                      <div className="mb-2">
                        <div className="flex items-start gap-2">
                          <span className="text-sm font-medium text-muted-foreground">
                            {index + 1}.
                          </span>
                          <div>
                            <p>{sense.definition}</p>
                            <p className="text-sm text-muted-foreground">
                              {getTranslation(sense, 'definition')}
                            </p>
                          </div>
                        </div>
                      </div>

                      {sense.examples && sense.examples[0] && (
                        <div className="ml-5">
                          <p className="text-sm text-muted-foreground">例文：</p>
                          <div className="flex items-center">
                            <p>{sense.examples[0].example}</p>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => playAudio(sense.examples[0].example)}
                              aria-label="Play example sentence"
                              className="ml-1 p-0 h-auto"
                              disabled={
                                audioState === 'loading' || 
                                audioState === 'playing' ||
                                (audioState === 'paused' && currentPlayingText !== sense.examples[0].example)
                              }
                              data-state={currentPlayingText === sense.examples[0].example ? audioState : 'idle'}
                            >
                              <Volume2 className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {getTranslation(sense, 'example')}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
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
                    disabled={
                      audioState === 'loading' || 
                      audioState === 'playing' ||
                      (audioState === 'paused' && currentPlayingText !== verb.headword1)
                    }
                    data-state={currentPlayingText === verb.headword1 ? audioState : 'idle'}
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
                        disabled={
                          audioState === 'loading' || 
                          audioState === 'playing' ||
                          (audioState === 'paused' && currentPlayingText !== verb.senses[0].examples[0].example)
                        }
                        data-state={currentPlayingText === verb.senses[0].examples[0].example ? audioState : 'idle'}
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

