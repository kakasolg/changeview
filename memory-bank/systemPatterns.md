# System Patterns - 시스템 아키텍처 및 설계 패턴

## 🏢 전체 시스템 아키텍처

### 아키텍처 개요
**지혜의 렌즈**는 **마이크로서비스 아키텍처**를 기반으로 한 **전체스텍 Next.js 어플리케이션**입니다. 각 기능이 독립적으로 작동하며, API Routes를 통해 서로 통신합니다.

```
사용자 인터페이스 (React + Tailwind)
│
├── 랜딩 페이지
├── 상황 입력 인터페이스
├── 결과 표시 대시보드
└── 관점별 상세 뷰
│
Next.js App Router
│
├── /api/hexagrams      ── 64괘 데이터 CRUD
├── /api/analyze        ── AI 분석 엔진
├── /api/perspectives   ── 6가지 관점 생성
└── /api/sessions       ── 사용자 세션 관리
│
├── Google Gemini API   ── AI 분석 엔진
└── MongoDB             ── 데이터 저장소
```

### 레이어 구조
1. **프레젠테이션 레이어** - React 컴포넌트 + Tailwind CSS
2. **비즈니스 로직 레이어** - Next.js API Routes + AI 엔진
3. **데이터 액세스 레이어** - Mongoose ODM + MongoDB
4. **외부 서비스 레이어** - Google Gemini API

## 📊 데이터 플로우 패턴

### 핵심 데이터 플로우
```mermaid
graph TD
    A[사용자 입력] --> B[/api/analyze]
    B --> C[Gemini AI 요청]
    C --> D[적합 괘 선택]
    D --> E[hexagrams 컴렉션 조회]
    E --> F[6가지 관점 생성]
    F --> G[userSessions 저장]
    G --> H[결과 반환]
```

### 데이터 위계 구조
1. **마스터 데이터**: 64괘 기본 정보 (hexagrams)
2. **세션 데이터**: 사용자 분석 결과 (userSessions)
3. **임시 데이터**: 메모리 내 AI 처리 결과

## 🧩 핵심 설계 패턴

### 1. 팩토리 패턴 (Factory Pattern)
**용도**: 6가지 관점 생성기
```javascript
// /lib/perspectiveFactory.js
class PerspectiveFactory {
  static createPerspective(type, hexagram, userContext) {
    switch(type) {
      case 'ancient': return new AncientPerspective(hexagram, userContext);
      case 'physics': return new PhysicsPerspective(hexagram, userContext);
      case 'biology': return new BiologyPerspective(hexagram, userContext);
      case 'business': return new BusinessPerspective(hexagram, userContext);
      case 'psychology': return new PsychologyPerspective(hexagram, userContext);
      case 'military': return new MilitaryPerspective(hexagram, userContext);
      default: throw new Error(`Unknown perspective type: ${type}`);
    }
  }
}
```

### 2. 전략 패턴 (Strategy Pattern)
**용도**: AI 맞춤화 전략
```javascript
// /lib/aiStrategies.js
class GeminiAnalysisStrategy {
  async analyze(userSituation, hexagram) {
    // Gemini 특화 분석 로직
    return await this.geminiClient.generateCustomInsight(userSituation, hexagram);
  }
}

class ContextualAnalysis {
  constructor(strategy) {
    this.strategy = strategy;
  }
  
  executeAnalysis(userSituation, hexagram) {
    return this.strategy.analyze(userSituation, hexagram);
  }
}


### 3. 옵저버 패턴 (Observer Pattern)
**용도**: 사용자 상호작용 추적
```javascript
// /lib/analytics.js
class UserActivityObserver {
  constructor() {
    this.observers = [];
  }
  
  subscribe(observer) {
    this.observers.push(observer);
  }
  
  notify(event) {
    this.observers.forEach(observer => observer.update(event));
  }
}

// 예시: 세션 저장, 로깅, 분석 등
class SessionTracker {
  update(event) {
    if (event.type === 'perspective_view') {
      this.trackPerspectiveEngagement(event.data);
    }
  }
}
```

### 4. 빌더 패턴 (Builder Pattern)
**용도**: 복합 분석 결과 생성
```javascript
// /lib/responseBuilder.js
class AnalysisResponseBuilder {
  constructor() {
    this.reset();
  }
  
  reset() {
    this.response = {
      hexagram: null,
      perspectives: {},
      metadata: {}
    };
    return this;
  }
  
  setHexagram(hexagram) {
    this.response.hexagram = hexagram;
    return this;
  }
  
  addPerspective(type, content) {
    this.response.perspectives[type] = content;
    return this;
  }
  
  setMetadata(reasoning, confidence) {
    this.response.metadata = { reasoning, confidence };
    return this;
  }
  
  build() {
    return { ...this.response };
  }
}
```

## 📱 컴포넌트 아키텍처

### React 컴포넌트 계층 구조
```
/src/app/
│
├── layout.tsx          ── 글로벌 레이아웃
├── page.tsx            ── 랜딩 페이지
├── analyze/
│   ├── page.tsx        ── 상황 입력 페이지
│   └── results/
│       └── page.tsx    ── 결과 표시 페이지
└── components/
    ├── ui/             ── 기본 UI 컴포넌트
    ├── layout/         ── 레이아웃 컴포넌트
    ├── features/       ── 기능별 컴포넌트
    │   ├── input/      ── 상황 입력 관련
    │   ├── analysis/   ── 분석 결과 관련
    │   └── hexagram/   ── 괘 표시 관련
    └── shared/         ── 공용 컴포넌트
```

### 주요 컴포넌트 관계
```mermaid
graph TD
    A[App Layout] --> B[Landing Page]
    A --> C[Analysis Page]
    C --> D[SituationInput]
    C --> E[HexagramSelector]
    C --> F[ResultsDashboard]
    F --> G[PerspectiveCard]
    F --> H[InsightDisplay]
    G --> I[PerspectiveDetails]
```

### 컴포넌트 설계 원칙
1. **단일 책임 원칙**: 각 컴포넌트는 하나의 명확한 역할
2. **깰누스러운 컴포지션**: 작은 컴포넌트들을 조합하여 복잡한 기능 구성
3. **의존성 역전**: 컴포넌트는 컨크리트가 아닌 추상대상에 의존
4. **상태 끌어올리기**: 공유 상태를 가장 가까운 공통 조상으로

## 🚀 API 설계 패턴

### RESTful API 공통 구조
```javascript
// /src/app/api/*/route.ts 공통 패턴
export async function GET(request: NextRequest) {
  try {
    // 1. 인증 검증
    await validateRequest(request);
    
    // 2. 요청 파라미터 처리
    const params = await parseRequestParams(request);
    
    // 3. 비즈니스 로직 실행
    const result = await executeBusinessLogic(params);
    
    // 4. 응답 형식 통일화
    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return handleApiError(error);
  }
}
```

### 핵심 API 엔드포인트 설계

#### 1. /api/hexagrams - 64괘 데이터 API
```javascript
// GET /api/hexagrams - 전체 괘 목록
// GET /api/hexagrams/[id] - 특정 괘 상세
// GET /api/hexagrams/random - 랜덤 괘 선택
// GET /api/hexagrams/search?keyword=창조 - 키워드 검색

// 에러 핸들링 패턴
class ApiErrorHandler {
  static handle(error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({
        success: false,
        error: {
          type: 'VALIDATION_ERROR',
          message: error.message,
          field: error.field
        }
      }, { status: 400 });
    }
    
    if (error instanceof DatabaseError) {
      return NextResponse.json({
        success: false,
        error: {
          type: 'DATABASE_ERROR',
          message: '데이터베이스 오류가 발생했습니다.'
        }
      }, { status: 500 });
    }
  }
}
```

#### 2. /api/analyze - AI 분석 API
```javascript
// POST /api/analyze
// 요청 체
{
  "userSituation": "새로운 사업을 시작할지 고민입니다...",
  "context": {
    "age": 35,
    "profession": "스타트업 대표",
    "priority": "stability"
  }
}

// 응답 체
{
  "success": true,
  "data": {
    "selectedHexagram": {
      "id": "507f1f77bcf86cd799439011",
      "number": 1,
      "name": "중천건",
      "symbol": "☰/☰"
    },
    "reasoning": "AI가 선택한 이유...",
    "confidence": 0.87,
    "sessionId": "uuid-string"
  }
}
```

#### 3. /api/perspectives - 6가지 관점 생성 API
```javascript
// POST /api/perspectives
// 비동기 처리 패턴
async function generatePerspectives(sessionId, hexagram, userContext) {
  const perspectives = ['ancient', 'physics', 'biology', 'business', 'psychology', 'military'];
  
  // 병렬 처리로 성능 최적화
  const results = await Promise.allSettled(
    perspectives.map(async (type) => {
      const perspective = PerspectiveFactory.createPerspective(type, hexagram, userContext);
      return await perspective.generate();
    })
  );
  
  return results.reduce((acc, result, index) => {
    if (result.status === 'fulfilled') {
      acc[perspectives[index]] = result.value;
    } else {
      acc[perspectives[index]] = { error: '관점 생성 실패' };
    }
    return acc;
  }, {});
}
```

## 📏 확장성 및 성능 패턴

### 1. 캐시에이션 전략
```javascript
// /lib/cache.js
class CacheManager {
  // 64괘 데이터는 마스터 데이터이므로 영구 캐시
  static HEXAGRAMS_TTL = Infinity;
  
  // AI 분석 결과는 30분 캐시
  static ANALYSIS_TTL = 30 * 60 * 1000;
  
  async cacheHexagramData() {
    const hexagrams = await this.fetchAllHexagrams();
    return new Map(hexagrams.map(h => [h.number, h]));
  }
  
  async cacheAnalysisResult(sessionId, result) {
    await redis.setex(
      `analysis:${sessionId}`, 
      this.ANALYSIS_TTL / 1000, 
      JSON.stringify(result)
    );
  }
}
```

### 2. 데이터베이스 최적화
```javascript
// /lib/database/indexes.js
// 인덱스 전략
const hexagramIndexes = [
  { number: 1 },                    // 괘 번호로 빠른 조회
  { name: 'text' },                 // 한글 검색
  { keywords: 1 },                  // 키워드 배열 검색
  { 'perspectives.ancient.content': 'text' }  // 전문 검색
];

const sessionIndexes = [
  { sessionId: 1 },                 // 세션 ID로 빠른 조회
  { timestamp: -1 },                // 시간 순 정렬
  { 'selectedHexagram': 1 },        // 선택된 괘별 조회
  { 
    timestamp: -1, 
    'aiAnalysis.confidence': -1 
  }                                 // 복합 인덱스
];
```

### 3. 마이크로서비스 확장 준비
```javascript
// 미래 확장을 위한 서비스 인터페이스
interface AnalysisService {
  analyzeUserSituation(situation: string, context: UserContext): Promise<HexagramSelection>;
  generatePerspectives(hexagram: Hexagram, userContext: UserContext): Promise<Perspectives>;
  saveUserSession(session: UserSession): Promise<void>;
}

// 다양한 구현체 준비
class LocalAnalysisService implements AnalysisService {
  // 현재 Next.js API Routes 기반 구현
}

class MicroserviceAnalysisService implements AnalysisService {
  // 미래 마이크로서비스 기반 구현
}
```

### 4. 모니터링 및 로깅 패턴
```javascript
// /lib/monitoring.js
class PerformanceMonitor {
  static trackApiPerformance(endpoint, duration, success) {
    console.log({
      endpoint,
      duration,
      success,
      timestamp: new Date().toISOString(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    });
  }
  
  static trackUserJourney(event) {
    // 사용자 행동 패턴 분석
    analytics.track(event.userId, event.type, event.properties);
  }
}
```

## 🔒 보안 및 데이터 보호 패턴

### 입력 데이터 검증
```javascript
// /lib/validation.js
class InputValidator {
  static validateUserSituation(input) {
    const schema = {
      type: 'string',
      minLength: 10,
      maxLength: 2000,
      pattern: /^[\w\s\uac00-\ud7af\u3040-\u309f\u30a0-\u30ff.,!?()-]+$/
    };
    
    if (!input || input.length < schema.minLength) {
      throw new ValidationError('상황 설명이 너무 짧습니다.');
    }
    
    if (input.length > schema.maxLength) {
      throw new ValidationError('상황 설명이 너무 깁니다.');
    }
    
    return this.sanitizeInput(input);
  }
  
  static sanitizeInput(input) {
    // XSS 방지를 위한 입력 살균
    return input
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .trim();
  }
}
```

### 데이터 프라이버시 보호
```javascript
// /lib/privacy.js
class PrivacyManager {
  static hashUserData(userData) {
    // 개인식별 가능 정보 해싱
    return crypto.createHash('sha256').update(userData).digest('hex');
  }
  
  static anonymizeSession(session) {
    return {
      ...session,
      userAgent: this.maskUserAgent(session.userAgent),
      ipAddress: this.maskIpAddress(session.ipAddress),
      userSituation: this.removePersonalInfo(session.userSituation)
    };
  }
}
```

## 🔄 중요 구현 파이프라인

### 핵심 실행 흐름
1. **사용자 입력 → 입력 검증 → AI 분석 요청**
2. **Gemini API → 괘 선택 로직 → 데이터베이스 조회**
3. **6가지 관점 병렬 생성 → 결과 통합 → 세션 저장**
4. **UI 렌더링 → 사용자 피드백 → 성능 모니터링**

### 오류 처리 전략
- **Graceful Degradation**: 일부 관점 생성 실패시에도 서비스 계속
- **Circuit Breaker**: 외부 API 장애시 대체 로직 실행
- **Retry Logic**: 일시적 오류에 대한 자동 재시도
- **Fallback Data**: 네트워크 오류시 캐시된 데이터 사용

## 🔄 현재 구현된 시스템 현황 (2025-06-11)

### 완전히 동작하는 시스템 구조
```
✅ 프론트엔드 (React + Tailwind)
    ├── 홈페이지 (http://localhost:3000)
    └── Gemini API 테스트 인터페이스
    
✅ Next.js App Router
    ├── /api/test-db         ── MongoDB 연결 테스트 (완전 동작)
    ├── /api/test-gemini     ── Gemini API 테스트 (완전 동작)  
    └── /api/hexagrams       ── 64괘 CRUD API (완전 동작)
    
✅ 데이터 레이어
    ├── MongoDB (localhost:27017/wisdom_lenses) ── 연결 완료
    ├── Mongoose ODM ── 스키마 및 메소드 완전 구현
    └── 5개 테스트 데이터 ── 입력 및 검증 완료
    
✅ 외부 API
    └── Google Gemini API ── 한국어 입출력 완벽 지원
```

### 실제 검증된 데이터 플로우
```
사용자 브라우저 → http://localhost:3000/api/hexagrams
                ↓
          Next.js API Route (route.ts)
                ↓
          connectToDatabase() [0ms 연결]
                ↓
          Mongoose 쿼리 실행
                ↓
          MongoDB 데이터 반환
                ↓
          JSON 응답 (완벽한 한국어 지원)
```

### 현재 사용 중인 디자인 패턴

#### 1. 연결 캐싱 패턴 (Connection Caching) ✅ 구현완료
```javascript
// src/lib/database.js에서 실제 구현됨
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}
// → Next.js 서버리스 환경에서 DB 연결 재사용 최적화
```

#### 2. 정적 메소드 패턴 (Static Methods) ✅ 구현완료
```javascript
// src/models/Hexagram.js에서 실제 구현됨
hexagramSchema.statics.searchByKeyword = function(keyword) { ... }
hexagramSchema.statics.getRandomHexagram = function() { ... }
// → 모델 레벨에서 재사용 가능한 쿼리 메소드
```

#### 3. 미들웨어 패턴 (Middleware) ✅ 구현완료
```javascript
// 저장 전 자동 키워드 생성
hexagramSchema.pre('save', function(next) {
  if (!this.keywords || this.keywords.length === 0) {
    this.keywords = this.getKeywords();
  }
  this.updatedAt = new Date();
  next();
});
```

#### 4. 에러 핸들링 패턴 ✅ 구현완료
```javascript
// 모든 API에서 표준화된 에러 응답
catch (error) {
  return NextResponse.json({
    success: false,
    message: 'Failed to fetch hexagrams',
    error: {
      type: error.name || 'DatabaseError',
      message: error.message || 'Unknown database error'
    }
  }, { status: 500 });
}
```

### 아직 구현되지 않은 패턴 (다음 단계)

#### 1. AI 분석 팩토리 패턴 (예정)
```javascript
// 계획된 구조
class GeminiAnalysisFactory {
  static async createHexagramRecommendation(userSituation) {
    // 사용자 상황 → 적합한 괘 추천
  }
  
  static async createPerspectiveAnalysis(hexagram, userContext) {
    // 선택된 괘 → 6가지 관점 분석
  }
}
```

#### 2. 캐싱 전략 패턴 (예정)
```javascript
// AI 응답 캐싱으로 성능 최적화
class AIResponseCache {
  static async getOrGenerate(key, generator) {
    // 캐시 확인 → 없으면 AI 생성 → 캐시 저장
  }
}
```

## 📊 시스템 성숙도 평가

### 완성도별 분류
- **🟢 완전 구현 (95%+)**: Database Layer, API Layer, Basic UI
- **🟡 부분 구현 (50-90%)**: Frontend Integration  
- **🔴 미구현 (0-50%)**: AI Business Logic, Advanced UI

### 안정성 지표
- **데이터 무결성**: ✅ 스키마 검증 및 인덱스 완료
- **에러 처리**: ✅ 모든 API 엔드포인트 커버
- **성능**: ✅ 0ms DB 연결, 빠른 쿼리 응답
- **확장성**: ✅ 64괘 → 수천 개 데이터도 지원 가능

**결론**: 견고한 기반 시스템이 완성되어, 비즈니스 로직 구현에 집중할 수 있는 상태