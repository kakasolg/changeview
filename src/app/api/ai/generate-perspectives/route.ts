import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai"; // Updated import
import { connectToDatabase } from '@/lib/database';
import Hexagram from '@/models/Hexagram';

/**
 * 6가지 관점 생성 API
 * POST /api/ai/generate-perspectives
 */
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { hexagramNumber, userSituation, perspective } = await request.json();
    
    // 입력 검증
    if (!hexagramNumber || !userSituation) {
      return NextResponse.json({
        success: false,
        message: 'hexagramNumber and userSituation are required'
      }, { status: 400 });
    }
    
    // 괘 데이터 조회
    const hexagram = await Hexagram.findOne({ number: hexagramNumber });
    if (!hexagram) {
      return NextResponse.json({
        success: false,
        message: `Hexagram ${hexagramNumber} not found`
      }, { status: 404 });
    }
    
    // Gemini AI 초기화
    const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY! }); 
    
    let result;
    
    if (perspective && perspective !== 'all') {
      // 특정 관점만 생성
      result = await generateSinglePerspective(genAI, hexagram, userSituation, perspective);
    } else {
      // 6가지 관점 모두 생성
      result = await generateAllPerspectives(genAI, hexagram, userSituation);
    }
    
    return NextResponse.json({
      success: true,
      data: result,
      hexagram: {
        number: hexagram.number,
        name: hexagram.name,
        symbol: hexagram.symbol,
        coreViewpoint: hexagram.coreViewpoint
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ Generate perspectives error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to generate perspectives',
      error: {
        type: error.name || 'AIError',
        message: error.message || 'Unknown AI error'
      }
    }, { status: 500 });
  }
}

// 단일 관점 생성 함수
async function generateSinglePerspective(
  genAI: GoogleGenAI,
  hexagram: any,
  userSituation: string,
  perspective: string
) {
  const prompt = getPerspectivePrompt(perspective as PerspectivePromptKey, hexagram, userSituation);
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash-preview-05-20';

  const generationConfig = {
    temperature: 0.9,
    topK: 1,
    topP: 1,
    maxOutputTokens: 2048,
  };
  const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  ];

  // Corrected usage: genAI.models.generateContent()
  const result = await genAI.models.generateContent({
    model: modelName, 
    contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
      systemInstruction: "Your name is Neko.",
      ...generationConfig, // 여기에 generationConfig 객체를 풀어서 넣습니다.
    }, 
    // safety_settings: safetySettings,
  });

  // The response from generateContent is GenerateContentResponse
  // Access the text property through candidates[0].content.parts[0].text
  const analysis = result.candidates?.[0]?.content?.parts?.[0]?.text || '';

  return {
    perspective,
    analysis: parseAnalysisResponse(analysis, perspective as PerspectiveKey)
  };
}

// 6가지 관점 모두 생성 함수
async function generateAllPerspectives(
  genAI: GoogleGenAI,
  hexagram: any,
  userSituation: string
) {
  const perspectives = ['ancient', 'physics', 'biology', 'business', 'psychology', 'military'] as const;
  const results: { [key: string]: any } = {};

  for (const p of perspectives) {
    try {
      const prompt = getPerspectivePrompt(p, hexagram, userSituation);
      const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash-preview-05-20';

      const generationConfig = {
        temperature: 0.9,
        topK: 1,
        topP: 1,
        maxOutputTokens: 2048,
      };
      const safetySettings = [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      ];

      const result = await genAI.models.generateContent({
        model: modelName, // model identifier is usually passed here or via getGenerativeModel
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: generationConfig,
        // safety_settings: safetySettings,
      });

      const analysis = result.candidates?.[0]?.content?.parts?.[0]?.text || '';

      results[p] = parseAnalysisResponse(analysis, p);

      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error: any) {
      console.error(`Error generating ${p} perspective:`, error);
      results[p] = {
        title: getPerspectiveTitle(p),
        content: `${p} 관점 분석 중 오류가 발생했습니다. 다시 시도해주세요.`,
        keyMessage: '분석을 다시 요청해주세요.',
        questions: ['이 관점에서 다시 분석을 요청하시겠습니까?'] as string[]
      };
    }
  }

  return results;
}

// 관점별 타이틀 반환
const titles = {
  ancient: '📜 고대의 지혜',
  physics: '⚙️ 물리학 관점',
  biology: '🌱 생물학 관점',
  business: '💼 경영학 관점',
  psychology: '🧠 심리학 관점',
  military: '⚔️ 군사학 관점'
} as const;
type PerspectiveKey = keyof typeof titles;

function getPerspectiveTitle(perspective: PerspectiveKey): string {
  return titles[perspective] || '문서 관점';
}

// 관점별 프롬프트 생성
const perspectivePrompts = {
  ancient: (hexagram: any, userSituation: string) => `
 괘 정보:
 - 이름: ${hexagram.name} (${hexagram.number}번)
 - 상징: ${hexagram.symbol}
 - 핵심 관점: ${hexagram.coreViewpoint}
 - 요약: ${hexagram.summary}
 
 사용자 상황: ${userSituation}
 
 당신은 동양 철학과 역경(易經)의 전문가입니다. 위 괘의 고대 지혜를 바탕으로 사용자의 상황을 분석해주세요.
 
 다음 형식으로 반드시 답변해주세요:
 
 **고대의 지혜**
 
 [역경의 고전적 해석과 음양오행 원리를 통한 3-4문장의 심층 분석]
 
 **핵심 메시지**: [한 줄로 요약된 핵심 통찰]
 
 **전략적 질문**:
 1. [사용자 상황과 관련된 구체적 질문]
 2. [내면 성찰을 도는 질문]
 3. [실행 방향에 대한 질문]`,

  physics: (hexagram: any, userSituation: string) => `
 괘 정보:
 - 이름: ${hexagram.name} (${hexagram.number}번)
 - 상징: ${hexagram.symbol}
 - 핵심 관점: ${hexagram.coreViewpoint}
 - 요약: ${hexagram.summary}
 
 사용자 상황: ${userSituation}

 당신은 물리학자입니다. 에너지, 시스템, 힘의 균형, 열역학 법칙 등을 이용해 사용자 상황을 분석해주세요.
 
 다음 형식으로 반드시 답변해주세요:
 
 **물리학 관점**
 
 [에너지 보존 법칙, 엔트로피, 평형 상태, 시스템 역학 등 물리학적 원리로 3-4문장 분석]
 
 **핵심 메시지**: [물리학적 원리로 요약된 핵심 통찰]
 
 **전략적 질문**:
 1. [에너지 효율성과 관련된 질문]
 2. [시스템 안정성에 대한 질문]
 3. [힘의 균형과 최적화에 대한 질문]`,

  biology: (hexagram: any, userSituation: string) => `
 괘 정보:
 - 이름: ${hexagram.name} (${hexagram.number}번)
 - 상징: ${hexagram.symbol}
 - 핵심 관점: ${hexagram.coreViewpoint}
 - 요약: ${hexagram.summary}
 
 사용자 상황: ${userSituation}

 당신은 생물학자입니다. 진화, 적응, 생태계, 생존 전략, 자연 선택 등의 원리로 사용자 상황을 분석해주세요.
 
 다음 형식으로 반드시 답변해주세요:
 
 **생물학 관점**
 
 [진화론, 생태학, 적응 전략, 생존 기제 등 생물학적 원리로 3-4문장 분석]
 
 **핵심 메시지**: [생물학적 원리로 요약된 핵심 통찰]
 
 **전략적 질문**:
 1. [적응과 진화에 대한 질문]
 2. [생태계 내 역할과 관련된 질문]
 3. [생존 전략과 지속가능성에 대한 질문]`,

  business: (hexagram: any, userSituation: string) => `
 괘 정보:
 - 이름: ${hexagram.name} (${hexagram.number}번)
 - 상징: ${hexagram.symbol}
 - 핵심 관점: ${hexagram.coreViewpoint}
 - 요약: ${hexagram.summary}
 
 사용자 상황: ${userSituation}

 당신은 경영 전략 컨설턴트입니다. 전략 기획, 리더십, 조직 관리, 리스크 관리, 성과 최적화 등의 경영학 원리로 사용자 상황을 분석해주세요.
 
 다음 형식으로 반드시 답변해주세요:
 
 **경영학 관점**
 
 [전략 경영, 리더십 이론, 조직 행동론, 학습조직 등 경영학 이론으로 3-4문장 분석]
 
 **핵심 메시지**: [경영학적 관점에서 요약된 핵심 통찰]
 
 **전략적 질문**:
 1. [전략적 의사결정과 관련된 질문]
 2. [리더십과 조직 관리에 대한 질문]
 3. [성과 측정과 개선에 대한 질문]`,

  psychology: (hexagram: any, userSituation: string) => `
 괘 정보:
 - 이름: ${hexagram.name} (${hexagram.number}번)
 - 상징: ${hexagram.symbol}
 - 핵심 관점: ${hexagram.coreViewpoint}
 - 요약: ${hexagram.summary}
 
 사용자 상황: ${userSituation}

 당신은 심리학자입니다. 인지 심리학, 행동 심리학, 동기 이론, 감정 조절, 성격 심리학 등의 원리로 사용자 상황을 분석해주세요.
 
 다음 형식으로 반드시 답변해주세요:
 
 **심리학 관점**
 
 [인지 편향, 동기 이론, 감정 조절, 학습 이론, 성격 이론 등 심리학 이론으로 3-4문장 분석]
 
 **핵심 메시지**: [심리학적 관점에서 요약된 핵심 통찰]
 
 **전략적 질문**:
 1. [내적 동기와 가치관에 대한 질문]
 2. [감정 관리와 인지 처리에 대한 질문]
 3. [행동 변화와 습관 형성에 대한 질문]`,

  military: (hexagram: any, userSituation: string) => `
 괘 정보:
 - 이름: ${hexagram.name} (${hexagram.number}번)
 - 상징: ${hexagram.symbol}
 - 핵심 관점: ${hexagram.coreViewpoint}
 - 요약: ${hexagram.summary}
 
 사용자 상황: ${userSituation}

 당신은 군사 전략 전문가입니다. 손자병법, 클라우제비츠, 마키아벨리 전략, 현대 군사 전략 등을 바탕으로 사용자 상황을 분석해주세요.
 
 다음 형식으로 반드시 답변해주세요:
 
 **군사학 관점**
 
 [전략과 전술, 리스크 관리, 정보 수집, 자원 배분, 승리 조건 등 군사학 원리로 3-4문장 분석]
 
 **핵심 메시지**: [군사학적 관점에서 요약된 핵심 통찰]
 
 **전략적 질문**:
 1. [전략적 위치와 우위 확보에 대한 질문]
 2. [리스크 평가와 대응 능력에 대한 질문]
 3. [승리 조건과 자원 활용에 대한 질문]`
} as const;
type PerspectivePromptKey = keyof typeof perspectivePrompts;

function getPerspectivePrompt(perspective: PerspectivePromptKey, hexagram: any, userSituation: string): string {
  const promptGenerator = perspectivePrompts[perspective];
  return promptGenerator(hexagram, userSituation);
}

// AI 응답 파싱 함수
function parseAnalysisResponse(analysisText: string, perspective: PerspectiveKey): any {
  try {
    const result = {
      title: '',
      content: '',
      keyMessage: '',
      questions: [] as string[]
    };

    const titleMatch = analysisText.match(/\\*\\*(.*?)\\*\\*/);
    if (titleMatch && titleMatch[1]) {
      result.title = titleMatch[1].trim();
    } else {
      result.title = getPerspectiveTitle(perspective); // Fallback title
    }

    const keyMessageMatch = analysisText.match(/\\*\\*핵심 메시지\\*\\*:\\s*(.*)/);
    if (keyMessageMatch && keyMessageMatch[1]) {
      result.keyMessage = keyMessageMatch[1].trim();
    }

    // Crude content extraction
    let contentStartIndex = 0;
    if (titleMatch && titleMatch.index !== undefined) {
        contentStartIndex = titleMatch.index + titleMatch[0].length;
    }
    
    let contentEndIndex = analysisText.length;
    if (keyMessageMatch && keyMessageMatch.index !== undefined) {
        contentEndIndex = keyMessageMatch.index;
    } else if (analysisText.includes('\\n\\n**전략적 질문**:')) {
        contentEndIndex = analysisText.indexOf('\\n\\n**전략적 질문**:');
    }


    result.content = analysisText.substring(contentStartIndex, contentEndIndex).replace(/\\*\\*.*\\*\\*:\\s*/, '').trim();


    const questionSectionMatch = analysisText.match(/\\*\\*전략적 질문\\*\\*:\\s*\\n([\s\\S]*)/);
    if (questionSectionMatch && questionSectionMatch[1]) {
        const questionLines = questionSectionMatch[1].trim().split('\\n');
        result.questions = questionLines.map(line => line.replace(/^\\s*\\d+\\.\\s*/, '').trim()).filter(q => q.length > 0);
    }
    
    if (result.questions.length === 0) {
      result.questions = [
        '이 관점에서 가장 중요한 고려사항은 무엇인가요?',
        '다음 단계로 어떤 행동을 취하는 것이 좋을까요?',
        '이 상황에서 주의해야 할 위험 요소는 무엇인가요?',
      ];
    }
    
    if (!result.content && !result.keyMessage) {
        // If parsing fails for content and keyMessage, put raw text in content
        result.content = analysisText;
        if(!result.title) result.title = getPerspectiveTitle(perspective);
        result.keyMessage = '분석 결과를 확인해주세요.';
    }


    return result;
  } catch (error) {
    console.error('Error parsing AI response:', error);
    return {
      title: getPerspectiveTitle(perspective), // Fallback title
      content: analysisText,
      keyMessage: 'AI 응답을 파싱하는 중 오류가 발생했습니다.',
      questions: [
        '결과를 다시 생성하시겠습니까?',
      ] as string[]
    };
  }
}