# 기술적 맥락과 도구

## 개발 환경

### 기본 설정
- **OS**: Windows (CMD 환경)
- **Python**: 3.12+ (requires-python = ">=3.12")
- **프로젝트 루트**: `D:\dev\html-prj\thinking_lenses\change_view\pyproj`
- **패키지 관리**: **uv** (pyproject.toml 기반)
- **원래 목적**: 주역 64괘를 찰리 멍거의 격자틀 정신 모델에 매핑
- **현재 목적**: 8괘 수학적 검증 및 시각화 시스템

### uv 패키지 관리 (pyproject.toml)
```toml
[project]
name = "pyproj"
version = "0.1.0"
description = "주역 8괘-64괘 수학적 매핑 및 검증 시스템"
readme = "README.md"
requires-python = ">=3.12"
dependencies = [
    "flask>=3.1.1",           # 웹 프레임워크
    "matplotlib>=3.10.3",     # 시각화
    "numpy>=2.3.0",           # 수치 계산
    "pandas>=2.3.0",          # 데이터 분석
    "plotly>=6.1.2",          # 인터랙티브 시각화
    "scipy>=1.15.3",          # 과학 계산
    "seaborn>=0.13.2",        # 통계 시각화
    "streamlit>=1.45.1",      # 대체 웹 인터페이스
    "sympy>=1.14.0",          # 기호 수학
    "pymongo[srv]>=4.13.1",   # MongoDB 연결
    "langchain-core>=0.3.65",  # AI/LLM
    "langchain-ollama>=0.3.3", # Ollama 통합
    "networkx>=3.5",          # 그래프 이론
]
```

### 설치 및 실행 명령어
```bash
# 의존성 설치
uv sync

# 가상환경 활성화 및 실행
uv run python app_bagua.py

# 또는 가상환경에서
.venv\Scripts\activate  # Windows
python app_bagua.py
```

### 현재 설치된 도구
- Streamlit (시각화 및 인터페이스)
- MongoDB 연결 기능

## 분석 도구 스택

### 수학적 분석
- **SymPy**: 기호 수학, 방정식 해석
- **NumPy**: 수치 계산
- **SciPy**: 과학 계산, 특수 함수
- **Mathematica/Wolfram**: 고급 수학 분석 (외부 도구)

### AI/ML 분석
- **PyTorch**: 딥러닝 모델 분석
- **TensorFlow**: 대안 프레임워크
- **Transformers (HuggingFace)**: Attention 메커니즘 분석
- **scikit-learn**: 전통적 ML 기법

### 데이터 처리
- **Pandas**: 데이터 조작 및 분석
- **NetworkX**: 그래프 이론 분석
- **NetworkX**: 복잡 네트워크 분석

### 시각화
- **Matplotlib**: 기본 플롯
- **Plotly**: 인터랙티브 시각화
- **Graphviz**: 그래프 구조 시각화
- **Streamlit**: 웹 인터페이스

### 문서화
- **Markdown**: 문서 작성
- **Jupyter**: 분석 노트북
- **LaTeX**: 수학 공식 표현

## 데이터 저장소

### 로컬 파일 시스템
- **Memory Bank**: 프로젝트 context 유지
- **JSON/CSV**: 분석 결과 저장
- **Python Pickle**: 계산 결과 캐싱

### 데이터베이스
- **MongoDB**: 복잡한 구조 데이터 저장
- **SQLite**: 관계형 데이터 (필요시)

## 핵심 기술적 구성요소

### 1. 8괘-64괘 매핑 엔진
```python
class BaguaSystem:
    def __init__(self):
        self.eight_trigrams = {}  # 8괘 정의
        self.sixty_four_hexagrams = {}  # 64괘 생성
    
    def generate_hexagrams(self):
        # 8×8 조합으로 64괘 생성
        pass
    
    def validate_mapping(self, domain):
        # 특정 영역에서의 매핑 검증
        pass
```

### 2. 역분해 분석기
```python
class DecompositionAnalyzer:
    def extract_components(self, theory):
        # 복잡한 이론에서 핵심 요소 추출
        pass
    
    def reduce_to_eight(self, components):
        # 추출된 요소를 8개로 축약
        pass
```

### 3. 교차 검증 시스템
```python
class CrossValidator:
    def compare_domains(self, domain_a, domain_b):
        # 영역 간 8괘 비교
        pass
    
    def find_patterns(self, mappings):
        # 공통 패턴 발견
        pass
```

### 4. 시각화 시스템
```python
class BaguaVisualizer:
    def plot_trigrams(self, data):
        # 8괘 관계 시각화
        pass
    
    def show_mappings(self, mappings):
        # 매핑 관계 시각화
        pass
```

## 외부 API 및 리소스

### 학술 데이터베이스
- **arXiv API**: 최신 논문 검색
- **Google Scholar**: 인용 관계 분석
- **Wolfram Alpha**: 수학적 계산 검증

### 참고 자료
- **OEIS (수열 백과사전)**: 수학적 패턴 검증
- **MathWorld**: 수학 개념 정의
- **Wikipedia API**: 기본 정보 수집

## 현재 아키텍처 (Phase 1 완성)

### 모듈 구조
```
math_core/ (8개 모듈, 총 46.8KB)
├── pi_verification.py        (5.5KB) ✅
├── phi_verification.py       (5.2KB) ✅ 
├── probability_verification.py (4.8KB) ✅
├── calculus_verification.py  (5.1KB) ✅
├── binary_verification.py    (5.3KB) ✅
├── primes_verification.py    (6.3KB) ✅
├── symmetry_verification.py  (7.3KB) ✅
└── e_verification.py         (6.3KB) ✅

web_routes/ 
├── verification_routes.py    ✅ (Flask 라우트 분리)
└── __init__.py               ✅

visualization/ 
├── base64_encoder.py         ✅
└── __init__.py               ✅

utils/
├── config.py                 ✅
└── __init__.py               ✅
```

### API 엔드포인트
- `/api/verification/pi` - π 검증
- `/api/verification/golden-ratio` - φ 검증
- `/api/verification/probability` - 확률론 검증
- `/api/verification/calculus` - 미적분 검증
- `/api/verification/binary` - 이진법 검증
- `/api/verification/primes` - 소수 검증
- `/api/verification/symmetry` - 대칭성 검증
- `/api/verification/e` - 자연상수 e 검증
- `/api/verification/all` - 전체 검증

### 웹 인터페이스
- **verification.html**: 8개 탭 기반 검증 시스템
- **LaTeX.css 스타일링**: 학술적 외관
- **실시간 matplotlib 그래프**: base64 인코딩
- **반응형 디자인**: 모바일 기본 지원

## Phase 1.5 기술 로드맵

### 우선순위 1: 성능 최적화
- **Plotly 통합**: matplotlib → plotly 대화형 그래프
- **캐싱 시스템**: Redis 또는 메모리 캐시
- **병렬 처리**: multiprocessing.Pool 활용
- **WebAssembly**: 고성능 수치 계산 (장기)

### 우선순위 2: 사용자 경험
- **진행률 표시**: WebSocket 실시간 업데이트
- **결과 저장**: JSON/PNG 다운로드 기능
- **즐겨찾기**: 브라우저 localStorage 활용
- **키보드 단축키**: 접근성 개선

### 우선순위 3: 모니터링 & 분석
- **성능 메트릭**: 각 모듈별 실행 시간 추적
- **오차 분석**: 정확도 통계 대시보드
- **사용 패턴**: 사용자 행동 분석
- **A/B 테스트**: 인터페이스 개선 실험
