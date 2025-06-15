// A-1 세트: Function Calling 테스트용 API 엔드포인트
// 최신 @google/genai 방식 사용

import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

// 최신 GoogleGenAI 인스턴스 초기화
const ai = new GoogleGenAI({ 
  apiKey: process.env.GOOGLE_API_KEY! 
});

export async function POST(request: NextRequest) {
  try {
    const { prompt, tools, functionResults } = await request.json();
    
    if (!prompt) {
      return NextResponse.json({ error: '프롬프트가 필요합니다.' }, { status: 400 });
    }

    console.log('[Function Calling Test] Starting with:', {
      prompt: prompt.substring(0, 100) + '...',
      hasTools: !!tools,
      hasFunctionResults: !!functionResults
    });

    // Function Results가 있는 경우 = 두 번째 호출 (최종 응답 생성)
    if (functionResults && functionResults.length > 0) {
      return await generateFinalResponse(prompt, functionResults, tools);
    }
    
    // 첫 번째 호출: Function Calling 요청
    return await generateWithFunctionCalling(prompt, tools);
    
  } catch (error) {
    console.error('[Function Calling Test Error]:', error);
    return NextResponse.json(
      { error: 'API 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * Function Calling을 포함한 첫 번째 Gemini 호출 (최신 방식)
 */
async function generateWithFunctionCalling(prompt: string, tools: any[]) {
  try {
    const contents = [
      {
        role: 'user',
        parts: [{ text: prompt }]
      }
    ];

    const config: any = {};
    
    if (tools && tools.length > 0) {
      config.tools = tools;
    }

    console.log('[Gemini Request]:', {
      model: 'gemini-2.5-flash-preview-05-20',
      hasTools: !!config.tools
    });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-05-20',
      contents: contents,
      config: config
    });

    console.log('[Gemini Response]:', {
      hasFunctionCalls: !!(response.functionCalls && response.functionCalls.length > 0),
      functionCallsCount: response.functionCalls?.length || 0
    });

    // Function Call 확인
    if (response.functionCalls && response.functionCalls.length > 0) {
      console.log('[Function Calls Detected]:', response.functionCalls.map(fc => fc.name));
      return NextResponse.json({
        success: true,
        functionCalls: response.functionCalls,
        rawResponse: response
      });
    } else {
      // Function Call 없이 직접 응답
      return NextResponse.json({
        success: true,
        response: response.text || '응답을 생성할 수 없습니다.',
        functionCalls: []
      });
    }
    
  } catch (error) {
    console.error('[Generation Error]:', error);
    throw error;
  }
}

/**
 * Function 실행 결과를 바탕으로 최종 응답 생성 (최신 방식)
 */
async function generateFinalResponse(originalPrompt: string, functionResults: any[], tools: any[]) {
  try {
    // Function 결과를 포함한 문맥 구성
    const functionResultsText = functionResults.map(fr => 
      `함수 ${fr.name} 실행 결과:\n${JSON.stringify(fr.result, null, 2)}`
    ).join('\n\n');

    const finalPrompt = `사용자 요청: ${originalPrompt}

다음 함수들이 실행되었습니다:
${functionResultsText}

위 정보를 바탕으로 사용자에게 도움이 되는 응답을 생성해주세요. 함수 실행 결과를 자연스럽게 해석하고 설명해주세요.`;

    const contents = [
      {
        role: 'user',
        parts: [{ text: finalPrompt }]
      }
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-05-20',
      contents: contents,
      config: {} // 최종 응답에서는 tools 빠짐
    });
    
    return NextResponse.json({
      success: true,
      response: response.text || '최종 응답을 생성할 수 없습니다.',
      context: {
        originalPrompt,
        functionResults: functionResults.length
      }
    });
    
  } catch (error) {
    console.error('[Final Response Error]:', error);
    throw error;
  }
}

/**
 * GET 메서드: 테스트 상태 확인
 */
export async function GET() {
  return NextResponse.json({
    status: 'ready',
    model: 'gemini-2.5-flash-preview-05-20',
    apiVersion: '@google/genai (latest)',
    features: ['function-calling', 'a1-test-set'],
    timestamp: new Date().toISOString()
  });
}

