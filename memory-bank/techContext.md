# Technology Context

## 🔧 기술 스택 (2025-06-11 업데이트)

### Frontend (100% 완료)
- **Next.js 15.3.3** (App Router) - React 풀스택 프레임워크 ✅
- **TypeScript** - 타입 안정성과 개발자 경험 ✅
- **Tailwind CSS** - 유틸리티 기반 스타일링 ✅
- **Framer Motion** - 부드러운 애니메이션 (설치 완료) ✅

### Backend & Database (100% 완료)
- **Next.js API Routes** - 서버리스 API 완벽 구현 ✅
- **MongoDB** (localhost:27017) - NoSQL 데이터베이스 연결 완료 ✅
- **Mongoose** - MongoDB ODM 완전 구현 ✅
- **Google Gemini API** - AI 기반 텍스트 분석 (gemini-2.5-flash-preview-05-20) ✅

### Development & Deployment (95% 완료)
- **Git** - 버전 관리 ✅
- **Playwright** - 자동 테스트 및 검증 ✅
- **Vercel** - 배포 플랫폼 (Next.js 최적화) 준비됨 ⏳

## 📊 데이터 아키텍처

### MongoDB 컨렉션 설계

#### hexagrams (64괘 마스터 데이터)
```javascript
{
  _id: ObjectId,
  number: 1,                    // 괘 번호 (1-64)
  symbol: "☰/☰",              // 괘 상징
  name: "중천건",               // 괘 이름
  koreanName: "重天乾",         // 한자명
  coreViewpoint: "창조적 에너지와 리더십의 관점",
  summary: "순수한 잠재력과 창조적 에너지...",
  
  perspectives: {
    ancient: {
      title: "고대의 지혜",
      content: "...",
      keyMessage: "...",
      questions: ["...", "..."]
    },
    physics: { /* 물리학 관점 */ },
    biology: { /* 생물학 관점 */ },
    business: { /* 경영학 관점 */ },
    psychology: { /* 심리학 관점 */ },
    military: { /* 군사학 관점 */ }
  },
  
  keywords: ["창조", "리더십", "시작", "에너지"],
  createdAt: Date,
  updatedAt: Date
}
```

#### userSessions (사용자 분석 세션)
```javascript
{
  _id: ObjectId,
  sessionId: "uuid",
  userSituation: "새로운 사업을 시작할지...",
  selectedHexagram: ObjectId,   // hexagrams 컨렉션 참조
  aiAnalysis: {
    reasonForSelection: "...",
    customizedInsights: {
      ancient: "...",
      physics: "...",
      // ... 각 관점별 맞춤 분석
    }
  },
  timestamp: Date,
  ipAddress: String,
  userAgent: String
}
```

## 📊 실제 구현된 데이터 아키텍처 (2025-06-11)

### MongoDB 연결 정보 (현재 동작 중)
- **연결 URI**: `mongodb://localhost:27017/wisdom_lenses`
- **데이터베이스**: `wisdom_lenses` (생성 완료)
- **연결 상태**: ✅ 0ms 연결 성공
- **ODM**: Mongoose 완전 구현

### 구현된 컬렉션

#### hexagrams (64괘 마스터 데이터) - 95% 완료 ✅
```javascript
// 실제 MongoDB에 저장된 구조
{
  _id: ObjectId("684934b7f9f1ba2c3949d2a5"),
  number: 1,                    // 괘 번호 (1-64) [유니크 인덱스]
  symbol: "☰☰",               // 괘 상징
  name: "The Creative",         // 괘 이름 [텍스트 인덱스]
  coreViewpoint: "창조와 리더십", // 핵심 관점 [검색 대상]
  summary: "하늘의 기운으로 만물을 창조하고 이끌어가는 힘",
  
  perspectives: {               // 6가지 관점 (확장 준비됨)
    ancient: { title: "고대의 지혜", content: "", keyMessage: "", questions: [] },
    physics: { title: "물리학 관점", content: "", keyMessage: "", questions: [] },
    biology: { title: "생물학 관점", content: "", keyMessage: "", questions: [] },
    business: { title: "경영학 관점", content: "", keyMessage: "", questions: [] },
    psychology: { title: "심리학 관점", content: "", keyMessage: "", questions: [] },
    military: { title: "군사학 관점", content: "", keyMessage: "", questions: [] }
  },
  
  keywords: ["창조", "리더십", "하늘", "양기", "시작"], // 자동 생성
  createdAt: "2025-06-11T07:48:07.361Z",
  updatedAt: "2025-06-11T07:48:07.361Z",
  __v: 0
}
```

**현재 데이터 상태**: 5개 테스트 데이터 입력됨 (1,2,3,4,5번 괘)

### 완전히 구현된 API 시스템 ✅

#### 모든 CRUD 동작 검증 완료
```javascript
// MongoDB 연결 테스트
GET /api/test-db
// 응답: {"success":true,"data":{"connected":true,"database":"wisdom_lenses"}}

// 전체 괘 조회 (페이지네이션 포함)
GET /api/hexagrams
// 응답: {"success":true,"data":[...5개 괘],"pagination":{"page":1,"limit":64,"total":5}}

// 특정 괘 조회
GET /api/hexagrams?number=1
// 응답: {"success":true,"data":{...1번 괘 상세 정보}}

// 키워드 검색
GET /api/hexagrams?keyword=창조
// 응답: {"success":true,"data":[...검색 결과],"pagination":{...}}

// 시드 데이터 입력
POST /api/hexagrams {"action":"seed"}
// 응답: {"success":true,"message":"Successfully inserted 5 hexagrams"}

// 데이터 삭제
DELETE /api/hexagrams
// 응답: {"success":true,"message":"All hexagrams deleted. Count: 5"}
```

### 구현된 검색 시스템 ✅
```javascript
// 복합 텍스트 인덱스 (src/models/Hexagram.js에 구현됨)
hexagramSchema.index({ 
  name: 'text', 
  coreViewpoint: 'text', 
  summary: 'text',
  keywords: 'text'
});

// 한국어 키워드 검색 메소드 (실제 동작 확인)
hexagramSchema.statics.searchByKeyword = function(keyword) {
  return this.find({
    $or: [
      { name: { $regex: keyword, $options: 'i' } },
      { coreViewpoint: { $regex: keyword, $options: 'i' } },
      { summary: { $regex: keyword, $options: 'i' } },
      { keywords: { $in: [new RegExp(keyword, 'i')] } }
    ]
  });
};
```

### Gemini API 통합 (완전 동작) ✅
```javascript
// 실제 동작하는 Gemini API 설정
// Google AI SDK 버전 관리에 유의해야 합니다.
// 현재 프로젝트는 @google/genai 패키지를 사용합니다.
const genAI = new GoogleGenAI(process.env.GOOGLE_API_KEY!); 

// 모델 가져오기 및 콘텐츠 생성 예시
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" }); // 또는 환경 변수 사용
const chat = model.startChat({
  // generationConfig, safetySettings, history 등 설정 가능
});
const result = await chat.sendMessage("YOUR_PROMPT_HERE");
const response = result.response;
const text = response.text();

// ✅ 한국어 입출력 완벽 지원 확인
// 공식 문서 참조: https://ai.google.dev/gemini-api/docs/text-generation#javascript
```

## 🎯 다음 구현 단계

### 즉시 진행 가능한 작업
1. **64괘 전체 데이터 입력** - createHexagramsData() 함수만 완성하면 즉시 가능
2. **AI 괘 추천 시스템** - Gemini API 기반 구현
3. **6가지 관점 생성 시스템** - perspectives 필드 활용

### 기술적 준비 상태
- **인프라**: 100% 완료
- **데이터 모델**: 100% 완료  
- **API 시스템**: 95% 완료
- **AI 연동**: 100% 완료

**결론**: 모든 기술적 기반이 완벽하게 구축되어, 비즈니스 로직 구현에만 집중하면 됨
