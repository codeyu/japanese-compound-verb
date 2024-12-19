import { useState } from "react";
import { getFromCache, saveToCache } from "@/lib/indexedDB";

export default function useTTS() {
    const [audioUrl, setAudioUrl] = useState<string>('');
    const [audioLoading, setAudioLoading] = useState<boolean>(false);
    const [audioError, setAudioError] = useState<boolean | null>(null);

    const generateAudio = async (text: string, voice: string) => {
        setAudioLoading(true);
        setAudioError(null);

        try {
            // 生成缓存键
            const cacheKey = `${voice}:${text}`;
            
            // 检查缓存
            const cachedAudio = await getFromCache(cacheKey);
            if (cachedAudio) {
                // 预先创建 Audio 对象并加载
                const url = URL.createObjectURL(cachedAudio);
                const audio = new Audio(url);
                await audio.load(); // 预加载音频
                setAudioUrl(url);
                setAudioLoading(false);
                return { url, audio }; // 返回预加载的音频对象
            }

            // 如果没有缓存，从API获取
            const response = await fetch('/api/tts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text, voice }),
            });

            if (!response.ok) {
                throw new Error('TTS request failed');
            }

            const blob = await response.blob();
            await saveToCache(cacheKey, blob);
            
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            await audio.load(); // 预加载音频
            setAudioUrl(url);
            return { url, audio }; // 返回预加载的音频对象
        } catch (e) {
            console.error('TTS error:', e);
            setAudioError(true);
            throw e;
        } finally {
            setAudioLoading(false);
        }
    };

    const cleanup = () => {
        if (audioUrl) {
            URL.revokeObjectURL(audioUrl);
        }
    };

    return { 
        audioUrl, 
        audioLoading, 
        audioError, 
        generateAudio,
        cleanup 
    };
};