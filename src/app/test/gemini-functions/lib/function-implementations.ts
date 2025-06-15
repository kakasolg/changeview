// A-1 & A-2 세트: Function Calling 테스트 + MongoDB 연동 강화
// Function Implementations (실제 동작 코드)

// MongoDB 연동 추가
const HEXAGRAMS_API_BASE = 'http://localhost:3000/api/hexagrams';

/**
 * 괘 정보 조회 함수 구현
 * @param number - 괘 번호 (1-64)
 * @returns 괘 기본 정보
 */
export async function getHexagramInfo(number: number) {
  try {
    console.log(`[Function Call] get_hexagram_info(number=${number})`);
    
    // 기본 유효성 검사
    if (!number || number < 1 || number > 64) {
      return {
        success: false,
        error: "잘못된 괘 번호입니다. 1-64 범위의 숫자를 입력해주세요."
      };
    }

    // MongoDB API 호출로 실제 데이터 조회
    try {
      const response = await fetch(`${HEXAGRAMS_API_BASE}?number=${number}`);
      const apiResult = await response.json();
      
      if (apiResult.success && apiResult.data) {
        const hexagram = apiResult.data; // 배열이 아닌 단일 객체
        return {
          success: true,
          data: {
            number: hexagram.number,
            name: hexagram.name,
            symbol: hexagram.symbol, // API에서 직접 symbol 제공
            meaning: hexagram.summary,
            keywords: hexagram.keywords,
            mentalModels: hexagram.mentalModels, // 찰리 멍거 정신 모델 추가
            description: hexagram.coreViewpoint, // API에서 coreViewpoint 사용
            timestamp: new Date().toISOString(),
            source: "MongoDB"
          }
        };
      } else {
        return {
          success: false,
          error: `${number}번 괘를 찾을 수 없습니다.`
        };
      }
    } catch (mongoError) {
      console.warn('[MongoDB Error]', mongoError);
      
      // MongoDB 실패시 기본 정보 제공
      return {
        success: true,
        data: {
          number,
          name: `괘 ${number}번`,
          symbol: "☰", 
          meaning: "데이터베이스 연결 중 - 기본 정보",
          mentalModels: "찰리 멍거 정신 모델 (연결 중)", // Fallback에도 정신 모델 추가
          timestamp: new Date().toISOString(),
          source: "Fallback"
        }
      };
    }
    
    } catch (error) {
    console.error('[Function Error] get_hexagram_info:', error);
    return {
      success: false,
      error: "괘 정보 조회 중 오류가 발생했습니다."
    };
  }
}

/**
 * 괘 키워드 검색 함수 구현
 * @param keyword - 검색 키워드
 * @param limit - 결과 개수 제한
 * @returns 검색 결과 배열
 */
export async function searchHexagramByKeyword(keyword: string, limit: number = 3) {
  try {
    console.log(`[Function Call] search_hexagram_by_keyword(keyword="${keyword}", limit=${limit})`);
    
    // 기본 유효성 검사
    if (!keyword || keyword.trim().length === 0) {
      return {
        success: false,
        error: "검색 키워드를 입력해주세요."
      };
    }

    // MongoDB API 호출로 실제 키워드 검색
    try {
      const response = await fetch(`${HEXAGRAMS_API_BASE}?keyword=${encodeURIComponent(keyword)}&limit=${limit}`);
      const apiResult = await response.json();
      
      if (apiResult.success && apiResult.data?.length > 0) {
        const results = apiResult.data.map((hexagram: any) => ({
          number: hexagram.number,
          name: hexagram.name,
          symbol: hexagram.symbol, // API에서 직접 symbol 제공
          meaning: hexagram.summary,
          keywords: hexagram.keywords,
          mentalModels: hexagram.mentalModels, // 찰리 멍거 정신 모델 추가
          relevantKeywords: hexagram.keywords.filter((k: string) => 
            k.toLowerCase().includes(keyword.toLowerCase()) || 
            keyword.toLowerCase().includes(k.toLowerCase())
          )
        }));
        
        return {
          success: true,
          data: {
            keyword,
            results,
            count: results.length,
            source: "MongoDB"
          }
        };
      } else {
        return {
          success: true,
          data: {
            keyword,
            results: [],
            count: 0,
            message: `"${keyword}"와 일치하는 괘를 찾을 수 없습니다.`,
            source: "MongoDB"
          }
        };
      }
    } catch (mongoError) {
      console.warn('[MongoDB Error in search]', mongoError);
      
      // MongoDB 실패시 기본 검색 제공
      const fallbackResults = [];
      
      const keywordMap: { [key: string]: {number: number, name: string, meaning: string, mentalModels: string}[] } = {
        "창조": [{number: 1, name: "중천건", meaning: "창조의 힘", mentalModels: "활성화 에너지 (Activation Energy)"}],
        "리더십": [{number: 1, name: "중천건", meaning: "창조의 힘", mentalModels: "활성화 에너지 (Activation Energy)"}],
        "변화": [{number: 3, name: "수룰둔", meaning: "시작의 어려움", mentalModels: "마찰과 점성 (Friction & Viscosity)"}],
        "수용": [{number: 2, name: "공지곴", meaning: "수용의 덕", mentalModels: "네트워크 효과 (Network Effects)"}]
      };
      
      for (const [key, hexagrams] of Object.entries(keywordMap)) {
        if (key.includes(keyword) || keyword.includes(key)) {
          fallbackResults.push(...hexagrams.slice(0, limit));
        }
      }
      
      return {
        success: true,
        data: {
          keyword,
          results: fallbackResults.slice(0, limit),
          count: Math.min(fallbackResults.length, limit),
          message: fallbackResults.length > 0 ? "기본 검색 결과" : `"${keyword}"와 일치하는 괘를 찾을 수 없습니다.`,
          source: "Fallback"
        }
      };
    }
  } catch (error) {
    console.error('[Function Error] search_hexagram_by_keyword:', error);
    return {
      success: false,
      error: "괘 검색 중 오류가 발생했습니다."
    };
  }
}

/**
 * Function Call 처리 로직
 * Gemini에서 반환된 function call을 실제 함수로 매핑
 */
export async function handleFunctionCall(functionName: string, args: any) {
  console.log(`[Function Handler] ${functionName} called with args:`, args);
  
  switch (functionName) {
    // A-1 세트: 기본 Function Calling
    case "get_hexagram_info":
      return await getHexagramInfo(args.number);
      
    case "search_hexagram_by_keyword":
      return await searchHexagramByKeyword(args.keyword, args.limit);
      
    // A-2 세트: 고도화된 괘 선택 Function Calling
    case "analyze_user_situation":
      return await analyzeUserSituation(args.userInput);
      
    case "calculate_hexagram_compatibility":
      return await calculateHexagramCompatibility(args.emotions, args.situation, args.keywords);
      
    case "select_final_hexagram":
      return await selectFinalHexagram(args.compatibilityScores, args.userAnalysis);
      
  default:
      return {
        success: false,
        error: `알 수 없는 함수: ${functionName}`
      };
  }
}

/**
 * 타입 정의
 */
export interface FunctionCallResult {
  success: boolean;
  data?: any;
  error?: string;
}

// =============================================================================
// A-2 세트: 고도화된 괘 선택 Function Calling 구현
// =============================================================================

/**
 * 사용자 상황 분석 함수 구현
 * @param userInput - 사용자 입력 텍스트
 * @returns 감정, 상황, 키워드 추출 결과
 */
export async function analyzeUserSituation(userInput: string) {
  console.log('[Function] analyze_user_situation called with:', userInput.substring(0, 100) + '...');
  
  try {
    // 기본 유효성 검사
    if (!userInput || userInput.trim().length === 0) {
      return {
        success: false,
        error: "분석할 텍스트를 입력해주세요."
      };
    }

    // 간단한 텍스트 분석 로직 (예시)
    const text = userInput.toLowerCase();
    
    // 감정 분석 - 키워드 기반
    const emotions = [];
    if (text.includes('걱정') || text.includes('불안') || text.includes('두려워')) emotions.push('불안');
    if (text.includes('기쁘') || text.includes('행복') || text.includes('좋아')) emotions.push('기쁨');
    if (text.includes('화나') || text.includes('짜증') || text.includes('억울')) emotions.push('분노');
    if (text.includes('슬프') || text.includes('울전') || text.includes('시련')) emotions.push('슬픔');
    if (text.includes('어려운') || text.includes('힘든') || text.includes('곤란')) emotions.push('어려움');
    if (text.includes('열정') || text.includes('흥미') || text.includes('목표')) emotions.push('열정');
    
    // 기본 감정이 없으면 중립 추가
    if (emotions.length === 0) emotions.push('중립');
    
    // 상황 분석 - 대카테고리화
    let situation = '일반적 상황';
    if (text.includes('직장') || text.includes('업무') || text.includes('회사')) situation = '직장 및 업무 관련';
    else if (text.includes('사랑') || text.includes('연인') || text.includes('결혼')) situation = '인간관계 및 사랑';
    else if (text.includes('가족') || text.includes('부모') || text.includes('자녀')) situation = '가족 문제';
    else if (text.includes('돈') || text.includes('재정') || text.includes('투자')) situation = '재정 및 경제 문제';
    else if (text.includes('건강') || text.includes('병') || text.includes('아프')) situation = '건강 문제';
    else if (text.includes('진로') || text.includes('꾸름') || text.includes('목표')) situation = '인생 방향 및 목표';
    
    // 키워드 추출 - 단순한 단어 추출
    const keywords = [];
    const commonKeywords = [
      '창조', '변화', '리더십', '성장', '축적', '인내', '열정', '노력',
      '지혜', '결단', '협력', '소통', '균형', '안정', '진전', '대담',
      '세심', '정확', '독립', '협력', '평화', '치유', '신뢰', '예지'
    ];
    
    commonKeywords.forEach(keyword => {
      if (text.includes(keyword)) keywords.push(keyword);
    });
    
    // 기본 키워드가 없으면 '개인적 성장' 추가
    if (keywords.length === 0) keywords.push('개인적 성장');
    
    return {
      success: true,
      data: {
        emotions,
        situation,
        keywords,
        originalText: userInput.substring(0, 200) // 원문 단축본
      }
    };
    
  } catch (error) {
    console.error('[Function Error] analyze_user_situation:', error);
    return {
      success: false,
      error: "사용자 상황 분석 중 오류가 발생했습니다."
    };
  }
}

/**
 * 괘 적합도 계산 함수 구현
 * @param emotions - 감정 배열
 * @param situation - 상황 설명
 * @param keywords - 키워드 배열
 * @returns 64괘 각각의 적합도 점수
 */
export async function calculateHexagramCompatibility(emotions: string[], situation: string, keywords: string[]) {
  console.log('[Function] calculate_hexagram_compatibility called with:', { emotions, situation, keywords });
  
  try {
    // MongoDB에서 전체 64괘 데이터 가져오기
    let allHexagrams = [];
    try {
      const response = await fetch(`${HEXAGRAMS_API_BASE}`);
      const apiResult = await response.json();
      
      if (apiResult.success && apiResult.data?.length > 0) {
        allHexagrams = apiResult.data;
        console.log(`[MongoDB] ${allHexagrams.length}개의 괘 데이터 로드 완료`);
      } else {
        console.warn('[MongoDB Warning] 괘 데이터를 찾을 수 없어 기본 데이터 사용');
        // 기본 데이터 사용
        allHexagrams = [
          {number: 1, name: '중천건', keywords: ['창조', '리더십', '시작', '열정'], summary: '창조의 힘'},
          {number: 2, name: '공지곤', keywords: ['인내', '수용', '부드러움', '조화'], summary: '수용의 덕'},
          {number: 3, name: '수룰둔', keywords: ['노력', '성장', '축적', '인내'], summary: '시작의 어려움'}
        ];
      }
    } catch (mongoError) {
      console.warn('[MongoDB Error in compatibility]', mongoError);
      // MongoDB 실패시 기본 데이터
      allHexagrams = [
        {number: 1, name: '중천건', keywords: ['창조', '리더십', '시작', '열정'], summary: '창조의 힘'},
        {number: 2, name: '공지곤', keywords: ['인내', '수용', '부드러움', '조화'], summary: '수용의 덕'},
        {number: 3, name: '수룰둔', keywords: ['노력', '성장', '축적', '인내'], summary: '시작의 어려움'}
      ];
    }
    
    const compatibilityScores = [];
    
    // 실제 MongoDB 데이터를 활용한 점수 계산 로직
    for (const hexagram of allHexagrams) {
      let score = 0.1; // 기본 점수
      let reason = '기본 점수';
      const reasons = [];
      
      // 키워드 매칭 점수
      const hexKeywords = hexagram.keywords || [];
      const matchingKeywords = keywords.filter(k => 
        hexKeywords.some((hk: string) => 
          hk.toLowerCase().includes(k.toLowerCase()) || 
          k.toLowerCase().includes(hk.toLowerCase())
        )
      );
      
      if (matchingKeywords.length > 0) {
        const keywordScore = matchingKeywords.length * 0.3;
        score += keywordScore;
        reasons.push(`키워드 매칭(${keywordScore.toFixed(1)}): ${matchingKeywords.join(', ')}`);
      }
      
      // 감정 적합도 (향상된 로직)
      emotions.forEach(emotion => {
        // 감정과 괘 키워드 매칭
        if (hexKeywords.some((k: string) => k.includes(emotion))) {
          score += 0.4;
          reasons.push(`감정 매칭(0.4): ${emotion}`);
        }
        
        // 특정 감정-괘 매칭
        if (emotion === '열정' && hexKeywords.some((k: string) => ['창조', '리더십', '열정'].includes(k))) {
          score += 0.3;
          reasons.push('열정성 성향 가점');
        }
        if (emotion === '불안' && hexKeywords.some((k: string) => ['안정', '인내', '진정'].includes(k))) {
          score += 0.3;
          reasons.push('불안 완화 가점');
        }
      });
      
      // 상황 매칭
      const situationLower = situation.toLowerCase();
      let situationBonus = 0;
      
      if (situationLower.includes('직장') || situationLower.includes('업무')) {
        if (hexKeywords.some((k: string) => ['리더십', '질서', '경영', '성과'].includes(k))) {
          situationBonus = 0.25;
          reasons.push('직장/업무 상황 매칭');
        }
      }
      
      if (situationLower.includes('사랑') || situationLower.includes('인간관계')) {
        if (hexKeywords.some((k: string) => ['조화', '사랑', '소통', '관계'].includes(k))) {
          situationBonus = 0.25;
          reasons.push('인간관계 상황 매칭');
        }
      }
      
      score += situationBonus;
      
      // 최종 내용 조합
      reason = reasons.length > 0 ? reasons.join(' + ') : '기본 점수';
      
      compatibilityScores.push({
        number: hexagram.number,
        name: hexagram.name,
        score: Math.round(score * 100) / 100, // 소수점 2자리
        reason,
        keywords: hexKeywords,
        summary: hexagram.summary || hexagram.description?.substring(0, 50) || '설명 없음'
      });
    }
    
    // 점수 높은 순으로 정렬
    compatibilityScores.sort((a, b) => b.score - a.score);
    
    return {
      success: true,
      data: {
        totalHexagrams: allHexagrams.length,
        analyzedKeywords: keywords,
        analyzedEmotions: emotions,
        analyzedSituation: situation,
        topScores: compatibilityScores.slice(0, 10), // 상위 10개
        allScores: compatibilityScores,
        source: allHexagrams.length === 64 ? "MongoDB" : "Fallback"
      }
    };
    
  } catch (error) {
    console.error('[Function Error] calculate_hexagram_compatibility:', error);
    return {
      success: false,
      error: "괘 적합도 계산 중 오류가 발생했습니다."
    };
  }
}

/**
 * 최종 괘 선택 함수 구현
 * @param compatibilityScores - 적합도 점수 배열
 * @param userAnalysis - 사용자 분석 결과
 * @returns 최종 선택된 괘과 근거
 */
export async function selectFinalHexagram(compatibilityScores: any[], userAnalysis: any) {
  console.log('[Function] select_final_hexagram called with:', { 
    scoresCount: compatibilityScores?.length, 
    userAnalysis 
  });
  
  try {
    if (!compatibilityScores || compatibilityScores.length === 0) {
      return {
        success: false,
        error: "적합도 점수 데이터가 필요합니다."
      };
    }
    
    // 최고 점수 괘 선택
    const topHexagram = compatibilityScores[0];
    
    // MongoDB에서 실제 괘 데이터 가져오기 시도
    let hexagramData = null;
    try {
      const response = await fetch(`http://localhost:3000/api/hexagrams?number=${topHexagram.number}`);
      if (response.ok) {
        const data = await response.json();
        hexagramData = data.hexagrams?.[0];
      }
    } catch (fetchError) {
      console.log('[Info] MongoDB에서 데이터를 가져오지 못했습니다. 기본 데이터를 사용합니다.');
    }
    
    // 기본 괘 데이터 (MongoDB 데이터 없을 때)
    const fallbackData = {
      1: { name: '건乾 창조', symbol: '乾乾乾', coreViewpoint: '강력한 의지로 시작하라' },
      2: { name: '곝均 수용', symbol: '均均均', coreViewpoint: '부드러움으로 대응하라' },
      3: { name: '둥屯 어려움', symbol: '均乾均', coreViewpoint: '인내하며 기초를 닦아라' }
    };
    
    const selectedHexagram = hexagramData || fallbackData[topHexagram.number as keyof typeof fallbackData] || {
      name: `${topHexagram.number}번 괘`,
      symbol: '乾乾乾',
      coreViewpoint: '지혜로운 결정을 내리라'
    };
    
    // 선택 근거 작성
    const reasoning = `
사용자 상황 분석:
- 감정: ${userAnalysis.emotions?.join(', ') || '중립'}
- 상황: ${userAnalysis.situation || '일반적 상황'}
- 키워드: ${userAnalysis.keywords?.join(', ') || '없음'}

선택된 괘: ${selectedHexagram.name}
점수: ${topHexagram.score}/1.0
선택 이유: ${topHexagram.reason}

이 괘은 현재 상황에서 가장 적합한 관점을 제시합니다.
    `.trim();
    
    return {
      success: true,
      data: {
        selectedHexagram: {
          number: topHexagram.number,
          name: selectedHexagram.name,
          symbol: selectedHexagram.symbol,
          coreViewpoint: selectedHexagram.coreViewpoint,
          score: topHexagram.score
        },
        reasoning,
        userAnalysis,
        alternativeHexagrams: compatibilityScores.slice(1, 4) // 대안 3개
      }
    };
    
  } catch (error) {
    console.error('[Function Error] select_final_hexagram:', error);
    return {
      success: false,
      error: "최종 괘 선택 중 오류가 발생했습니다."
    };
  }
}
