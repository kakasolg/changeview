import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";
import { connectToDatabase } from '@/lib/database';
import Hexagram from '@/models/Hexagram';

/**
 * AI 괘 추천 시스템
 * POST /api/analyze
 * 
 * 사용자 상황 → Gemini AI 분석 → 적합한 괘 추천
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔮 AI 괘 추천 분석 시작...');
    
    // 1. 요청 데이터 파싱
    const { userSituation, userContext } = await request.json();
    
    if (!userSituation || userSituation.trim().length < 10) {
      return NextResponse.json({
        success: false,
        message: '상황 설명을 최소 10자 이상 입력해주세요.',
        error: { type: 'VALIDATION_ERROR', field: 'userSituation' }
      }, { status: 400 });
    }

    // 2. MongoDB 연결 및 64괘 데이터 로드
    await connectToDatabase();
    const allHexagrams = await Hexagram.find({}).select('number name symbol coreViewpoint summary keywords').lean();
    
    if (allHexagrams.length === 0) {
      return NextResponse.json({
        success: false,
        message: '괘 데이터를 찾을 수 없습니다. 먼저 시드 데이터를 입력해주세요.',
        error: { type: 'DATA_ERROR' }
      }, { status: 500 });
    }

    console.log(`📊 ${allHexagrams.length}개 괘 데이터 로드 완료`);

    // 3. Gemini AI 초기화 (테스트 페이지와 동일한 방식)
    const ai = new GoogleGenAI({ 
      apiKey: process.env.GOOGLE_API_KEY! 
    });
    
    // 4. AI 프롬프트 생성
    const prompt = createAnalysisPrompt(userSituation, allHexagrams, userContext);
    
    console.log('🤖 Gemini AI 분석 요청 중...');
    // 5. Gemini AI 분석 요청 (테스트 페이지와 동일한 방식)
    const contents = [
      {
        role: 'user',
        parts: [{ text: prompt }]
      }
    ];
    
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL!,
      contents: contents,
      config: {
        maxOutputTokens: 500,
        temperature: 0.7
      }
    });
    console.log('📊 AI 응답 수신, 응답 객체 키:', Object.keys(response));
    const aiResponseText = response.text;
    if (!aiResponseText) {
      return NextResponse.json({
        success: false,
        message: 'AI 응답이 비어있습니다. 다시 시도해주세요.',
        error: { type: 'EMPTY_AI_RESPONSE' },
        debug: { 
          prompt: prompt,
          responseKeys: Object.keys(response)
        }
      }, { status: 500 });
    }
    
    console.log('✅ Gemini AI 응답 받음');
    
    // 주사위 시스템: 괘가 이미 선택되어 있음
    if (userContext?.hexagramNumber) {
      const selectedHexagram = allHexagrams.find(h => h.number === userContext.hexagramNumber);
      
      if (!selectedHexagram) {
        return NextResponse.json({
          success: false,
          message: `선택된 괘(${userContext.hexagramNumber}번)를 찾을 수 없습니다.`,
          error: { type: 'HEXAGRAM_NOT_FOUND' }
        }, { status: 404 });
      }
      
      // 주사위 시스템 성공 응답
      return NextResponse.json({
        success: true,
        analysis: {
          reasoning: aiResponseText,
          aiResponse: aiResponseText
        },
        selectedHexagram: {
          number: selectedHexagram.number,
          name: selectedHexagram.name,
          symbol: selectedHexagram.symbol
        },
        userSituation: userSituation,
        timestamp: new Date().toISOString()
      });
    }

    // 6. AI 응답 파싱하여 괘 번호 추출
    const selectedHexagramNumber = parseHexagramFromAIResponse(aiResponseText);
    
    if (!selectedHexagramNumber) {
      return NextResponse.json({
        success: false,
        message: 'AI가 적절한 괘를 선택하지 못했습니다. 다시 시도해주세요.',
        error: { type: 'AI_PARSING_ERROR' },
        debug: { aiResponse: aiResponseText }
      }, { status: 500 });
    }

    // 7. 선택된 괘 상세 정보 조회
    const selectedHexagram = await Hexagram.findOne({ number: selectedHexagramNumber });
    
    if (!selectedHexagram) {
      return NextResponse.json({
        success: false,
        message: `선택된 괘(${selectedHexagramNumber}번)를 데이터베이스에서 찾을 수 없습니다.`,
        error: { type: 'DATABASE_ERROR' }
      }, { status: 500 });
    }

    console.log(`🎯 선택된 괘: ${selectedHexagram.number}번 ${selectedHexagram.name}`);

    // 8. 세션 ID 생성 (나중에 userSessions 컬렉션 구현시 사용)
    const sessionId = generateSessionId();

    // 9. AI 분석 이유 추출
    const reasoning = extractReasoningFromAIResponse(aiResponseText);
    const confidence = calculateConfidenceScore(aiResponseText);

    // 10. 성공 응답 반환
    return NextResponse.json({
      success: true,
      data: {
        selectedHexagram: {
          id: selectedHexagram._id,
          number: selectedHexagram.number,
          name: selectedHexagram.name,
          symbol: selectedHexagram.symbol,
          coreViewpoint: selectedHexagram.coreViewpoint,
          summary: selectedHexagram.summary,
          keywords: selectedHexagram.keywords
        },
        analysis: {
          reasoning: reasoning,
          confidence: confidence,
          aiResponse: aiResponseText
        },
        sessionId: sessionId,
        userSituation: userSituation,
        timestamp: new Date().toISOString()
      }
    });  } catch (error) {
    console.error('❌ AI 괘 추천 분석 오류:', error);
    console.error('❌ 오류 상세:', {
      name: (error as Error).name,
      message: (error as Error).message,
      stack: (error as Error).stack?.substring(0, 500)
    });
    
    return NextResponse.json({
      success: false,
      message: 'AI 분석 중 오류가 발생했습니다.',
      error: {
        type: (error as Error).name || 'ANALYSIS_ERROR',
        message: (error as Error).message || 'Unknown analysis error'
      }
    }, { status: 500 });
  }
}

/**
 * Gemini AI용 분석 프롬프트 생성 (주사위 시스템용)
 */
function createAnalysisPrompt(userSituation: string, hexagrams: any[], userContext?: any) {
  // 주사위로 선택된 괘 번호가 있는 경우
  if (userContext?.hexagramNumber) {
    const selectedHexagram = hexagrams.find(h => h.number === userContext.hexagramNumber);
    if (selectedHexagram) {
      return `${selectedHexagram.number}번 겮 ${selectedHexagram.name}에 대해 사용자 상황에 맞는 조언을 제공해주세요. 사용자 상황: ${userSituation}. 200자 이내로 작성해주세요.`;
    }
    }
    
    // 기존 방식 (괘 선택용)
  const selectedHexagrams = hexagrams.slice(0, 3);
  const hexagramList = selectedHexagrams.map(h => 
    `${h.number}. ${h.name}`
  ).join('\n');

  return `상황: ${userSituation}

겮 목록:
${hexagramList}

가장 적합한 괘 번호를 선택하세요.
SELECTED_HEXAGRAM: [번호]`;
}

/**
 * AI 응답에서 괘 번호 추출
 */
function parseHexagramFromAIResponse(aiResponse: string): number | null {
  // SELECTED_HEXAGRAM: 숫자 패턴 찾기
  const hexagramMatch = aiResponse.match(/SELECTED_HEXAGRAM:\s*(\d+)/i);
  if (hexagramMatch) {
    const hexagramNumber = parseInt(hexagramMatch[1]);
    if (hexagramNumber >= 1 && hexagramNumber <= 64) {
      return hexagramNumber;
    }
  }
  
  // 백업: 첫 번째 나타나는 1-64 사이의 숫자 찾기
  const numberMatches = aiResponse.match(/\b([1-9]|[1-5][0-9]|6[0-4])\b/g);
  if (numberMatches) {
    for (const match of numberMatches) {
      const num = parseInt(match);
      if (num >= 1 && num <= 64) {
        return num;
      }
    }
  }
  
  return null;
}

/**
 * AI 응답에서 선택 이유 추출
 */
function extractReasoningFromAIResponse(aiResponse: string): string {
  const reasoningMatch = aiResponse.match(/REASONING:\s*([^]*?)(?=INSIGHT:|CONFIDENCE:|$)/i);
  if (reasoningMatch) {
    return reasoningMatch[1].trim();
  }
  
  // 백업: 전체 응답의 일부 반환
  return aiResponse.substring(0, 300) + '...';
}

/**
 * AI 응답에서 신뢰도 점수 추출
 */
function calculateConfidenceScore(aiResponse: string): number {
  const confidenceMatch = aiResponse.match(/CONFIDENCE:\s*(\d+)/i);
  if (confidenceMatch) {
    const score = parseInt(confidenceMatch[1]);
    return Math.min(Math.max(score, 1), 10) / 10; // 0.1 ~ 1.0 범위로 정규화
  }
  
  // 기본값
  return 0.7;
}

/**
 * 세션 ID 생성
 */
function generateSessionId(): string {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}
