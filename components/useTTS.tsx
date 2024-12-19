import { useState } from "react";

export default function useTTS() {
    const [audioUrl, setAudioUrl] = useState<string>('');
    const [audioLoading, setAudioLoading] = useState<boolean>(false);
    const [audioError, setAudioError] = useState<boolean | null>(null);

    const generateAudio = async (text: string, voice: string, settings: Record<string, any>) => {
        setAudioLoading(true);
        setAudioError(null);

        try {
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
            const url = URL.createObjectURL(blob);
            setAudioUrl(url);
            return url; 
        } catch (e) {
            setAudioError(true);
            throw e;
        } finally {
            setAudioLoading(false);
        }
    };

    return { audioUrl, audioLoading, audioError, generateAudio };
};