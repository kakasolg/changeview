import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();
    
    const ai = new GoogleGenAI({ 
      apiKey: process.env.GOOGLE_API_KEY! 
    });

    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL!,
      contents: message,
      config: {
        maxOutputTokens: 500,
        temperature: 0.7,
      }
    });

    return NextResponse.json({ 
      success: true, 
      response: response.text 
    });
    
  } catch (error) {
    console.error('Gemini API Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}