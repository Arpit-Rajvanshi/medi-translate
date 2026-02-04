import { NextResponse } from 'next/server';
import { genAI, fileManager } from '@/lib/geminiClient';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';
import os from 'os';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('file') as File;
    const targetLang = formData.get('targetLang') as string || 'English';

    if (!audioFile) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // 1. Save file temporarily
    const buffer = Buffer.from(await audioFile.arrayBuffer());
    const tempFilePath = path.join(os.tmpdir(), `upload_${Date.now()}.mp3`);
    await writeFile(tempFilePath, buffer);

    try {
      // 2. Upload to Gemini
      const uploadResponse = await fileManager.uploadFile(tempFilePath, {
        mimeType: audioFile.type || 'audio/webm',
        displayName: 'User Audio',
      });

      // 3. Prompt Gemini for Transcription + Translation
      // We use JSON mode to get structured data back reliably
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        generationConfig: { responseMimeType: "application/json" } 
      });

      const prompt = `
        You are a medical translator.
        1. Transcribe the audio file exactly as spoken.
        2. Translate the transcription into ${targetLang}.
        3. If the audio is silent or unclear, return null for both.
        
        Return a JSON object with this schema:
        {
          "text": "original transcription here",
          "translation": "translated text here"
        }
      `;

      const result = await model.generateContent([
        {
          fileData: {
            mimeType: uploadResponse.file.mimeType,
            fileUri: uploadResponse.file.uri,
          },
        },
        { text: prompt },
      ]);

      const responseText = result.response.text();
      const parsedData = JSON.parse(responseText);

      // 4. Cleanup
      await unlink(tempFilePath);
      
      // 5. Return structured data to frontend
      return NextResponse.json({ 
        text: parsedData.text || "(Unintelligible)", 
        translation: parsedData.translation || "(No translation available)" 
      });

    } catch (uploadError) {
      console.error("Gemini processing error:", uploadError);
      return NextResponse.json({ error: 'Failed to process with Gemini' }, { status: 500 });
    }

  } catch (error) {
    console.error('Error processing audio:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}