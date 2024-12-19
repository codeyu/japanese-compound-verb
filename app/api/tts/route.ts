import { NextResponse } from 'next/server';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import xmlescape from 'xml-escape';

export async function POST(request: Request) {
  try {
    const { text, voice } = await request.json();

    const tts = new MsEdgeTTS();
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);

    const escapedText = xmlescape(text);
    const readable = tts.toStream(escapedText);

    let audioBuffer = Buffer.alloc(0);

    for await (const chunk of readable) {
      audioBuffer = Buffer.concat([audioBuffer, chunk]);
    }

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
      },
    });
  } catch (error) {
    console.error('TTS error:', error);
    return NextResponse.json(
      { error: 'TTS generation failed' },
      { status: 500 }
    );
  }
} 