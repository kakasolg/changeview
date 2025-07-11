import mongoose from 'mongoose';

// 64괘 데이터 스키마 정의
const hexagramSchema = new mongoose.Schema({
  // 기본 정보
  number: {
    type: Number,
    required: true,
    unique: true,
    min: 1,
    max: 64,
    index: true  // 빠른 조회를 위한 인덱스
  },
  
  symbol: {
    type: String,
    required: true,
    description: '괘상 기호 (예: ☰/☰)'
  },
  
  name: {
    type: String,
    required: true,
    index: 'text',  // 한글 검색을 위한 텍스트 인덱스
    description: '괘 이름 (예: 중천건)'
  },
  
  coreViewpoint: {
    type: String,
    required: true,
    description: '핵심 관점 (Core Viewpoint)'
  },
  
  mentalModels: {
    type: String,
    description: '연결되는 정신 모델 (Connected Mental Models)'
  },
  
  summary: {
    type: String,
    required: true,
    description: '한 줄 요약'
  },
  
  // 키워드 배열 (검색용)
  keywords: {
    type: [String],
    index: true,
    description: '검색을 위한 키워드 배열'
  },
  
  // 6가지 관점 (나중에 추가될 예정)
  perspectives: {
    ancient: {
      title: { type: String, default: '고대의 지혜' },
      content: { type: String },
      keyMessage: { type: String },
      questions: [String]
    },
    physics: {
      title: { type: String, default: '물리학 관점' },
      content: { type: String },
      keyMessage: { type: String },
      questions: [String]
    },
    biology: {
      title: { type: String, default: '생물학 관점' },
      content: { type: String },
      keyMessage: { type: String },
      questions: [String]
    },
    business: {
      title: { type: String, default: '경영학 관점' },
      content: { type: String },
      keyMessage: { type: String },
      questions: [String]
    },
    psychology: {
      title: { type: String, default: '심리학 관점' },
      content: { type: String },
      keyMessage: { type: String },
      questions: [String]
    },
    military: {
      title: { type: String, default: '군사학 관점' },
      content: { type: String },
      keyMessage: { type: String },
      questions: [String]
    }
  },
  
  // 메타데이터
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  // 스키마 옵션
  timestamps: true,  // createdAt, updatedAt 자동 관리
  collection: 'hexagrams'  // 컴렉션 이름 명시적 지정
});

// 검색을 위한 복합 인덱스
hexagramSchema.index({ 
  name: 'text', 
  coreViewpoint: 'text', 
  summary: 'text',
  keywords: 'text'
});

// 검색 도우미 메소드
hexagramSchema.methods.getKeywords = function() {
  const keywords = [];
  
  // 괘 이름에서 키워드 추출
  keywords.push(this.name);
  
  // 핵심 관점에서 키워드 추출
  if (this.coreViewpoint) {
    const viewpointWords = this.coreViewpoint.match(/[\uac00-\ud7af\w]+/g);
    if (viewpointWords) keywords.push(...viewpointWords);
  }
  
  // 정신 모델에서 키워드 추출
  if (this.mentalModels) {
    const modelWords = this.mentalModels.match(/[\uac00-\ud7af\w]+/g);
    if (modelWords) keywords.push(...modelWords);
  }
  
  return [...new Set(keywords)];
};

// 저장 전에 키워드 자동 생성
hexagramSchema.pre('save', function(next) {
  if (!this.keywords || this.keywords.length === 0) {
    this.keywords = this.getKeywords();
  }
  this.updatedAt = new Date();
  next();
});

// 상세 정보 조회 메소드
hexagramSchema.methods.getFullInfo = function() {
  return {
    number: this.number,
    symbol: this.symbol,
    name: this.name,
    coreViewpoint: this.coreViewpoint,
    mentalModels: this.mentalModels,
    summary: this.summary,
    keywords: this.keywords,
    perspectives: this.perspectives,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

// 램덤 괘 선택 정적 메소드
hexagramSchema.statics.getRandomHexagram = function() {
  return this.aggregate([
    { $sample: { size: 1 } }
  ]).then(result => result[0]);
};

// 키워드로 검색 정적 메소드
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

// 모델 생성 (이미 생성된 경우 기존 모델 반환)
const Hexagram = mongoose.models.Hexagram || mongoose.model('Hexagram', hexagramSchema);

export default Hexagram;