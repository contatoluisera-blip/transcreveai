import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    // O Next.js Request nos dá um File compatível com o OpenAI SDK
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      response_format: 'verbose_json',
    });

    const segments = (transcription as any).segments;
    
    if (segments && segments.length > 0) {
      const htmlOutput = segments.map((s: any) => {
        const formatTime = (seconds: number) => {
          const h = Math.floor(seconds / 3600);
          const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
          const sec = Math.floor(seconds % 60).toString().padStart(2, '0');
          return h > 0 ? `${h}:${m}:${sec}` : `${m}:${sec}`;
        };
        return `<p style="margin-bottom: 1rem; line-height: 1.6;">
                  <strong style="color: #a8b2d1;">[${formatTime(s.start)} - ${formatTime(s.end)}]</strong> 
                  <span style="color: #e2e8f0;">${s.text}</span>
                </p>`;
      }).join('\n');
      
      return NextResponse.json({ result: `<div class="transcription-literal">${htmlOutput}</div>` });
    }

    // Fallback if no segments
    return NextResponse.json({ result: `<p>${transcription.text}</p>` });
  } catch (error: any) {
    console.error('Erro no processamento do áudio:', error);
    return NextResponse.json({ error: error?.message || 'Erro ao processar o arquivo de áudio.' }, { status: 500 });
  }
}
