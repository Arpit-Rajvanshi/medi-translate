import { NextResponse } from 'next/server';
import { genAI } from '@/lib/geminiClient';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { text, targetLang } = await request.json();

    if (!text || !targetLang) {
      return NextResponse.json({ error: 'Missing text or language' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    // Simple translation prompt
    const prompt = `You are a medical translator. Translate the following text into ${targetLang}. Only return the translated text, nothing else.\n\nText: "${text}"`;
    
    const result = await model.generateContent(prompt);
    const translation = result.response.text();

    return NextResponse.json({ translation });

  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json({ error: 'Failed to translate' }, { status: 500 });
  }
}