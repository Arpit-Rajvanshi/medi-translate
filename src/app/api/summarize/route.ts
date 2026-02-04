import { NextResponse } from 'next/server';
import { genAI } from '@/lib/geminiClient';
import { supabase } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { conversationId } = await request.json();

    if (!conversationId) {
      return NextResponse.json({ error: 'Missing conversationId' }, { status: 400 });
    }

    // 1. Fetch Chat History
    const { data: messages, error } = await supabase
      .from('messages')
      .select('role, original_text, translated_text')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
        console.error("Supabase error:", error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // 2. Check if chat is empty
    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'Conversation is empty. Send a message first!' }, { status: 400 });
    }

    // 3. Format Transcript for AI
    const transcript = messages.map(m => 
      `${m.role.toUpperCase()}: ${m.original_text}`
    ).join('\n');

    // 4. Generate Summary with Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `
      You are an expert medical scribe. Summarize this consultation.
      
      TRANSCRIPT:
      ${transcript}
      
      OUTPUT FORMAT (Markdown):
      ## Chief Complaint
      (Why they are here)
      ## Symptoms
      (List of symptoms)
      ## Diagnosis
      (If applicable)
      ## Plan
      (Next steps)
    `;
    
    const result = await model.generateContent(prompt);
    const summary = result.response.text();

    return NextResponse.json({ summary });

  } catch (error) {
    console.error('Summary API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}