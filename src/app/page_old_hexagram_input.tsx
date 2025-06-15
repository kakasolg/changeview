'use client';

import { useState, useEffect } from 'react';
import HexagramInput from './components/HexagramInput';
import HexagramResult from './components/HexagramResult';

interface HexagramAnalysis {
  selectedHexagram: {
    number: number;
    name: string;
    symbol: string;
    coreViewpoint: string;
  };
  analysis: {
    summary: string;
    keywords: string[];
    confidence: number;
  };
}

// 64괘 기본 데이터 (더미 데이터용)
const hexagramsData = [
  { number: 1, name: '건위천', symbol: '☰ / ☰', coreViewpoint: '창조와 주도의 관점' },
  { number: 2, name: '곤위지', symbol: '☷ / ☷', coreViewpoint: '포용과 수용의 관점' },
  { number: 3, name: '수뢰둔', symbol: '☵ / ☳', coreViewpoint: '시작의 어려움 관점' },
  { number: 4, name: '산수몽', symbol: '☶ / ☵', coreViewpoint: '배움과 깨달음 관점' },
  { number: 5, name: '수천수', symbol: '☵ / ☰', coreViewpoint: '전략적 기다림의 관점' },
  { number: 6, name: '천수송', symbol: '☰ / ☵', coreViewpoint: '갈등 해결의 관점' },
  { number: 7, name: '지수사', symbol: '☷ / ☵', coreViewpoint: '조직과 리더십 관점' },
  { number: 8, name: '수지비', symbol: '☵ / ☷', coreViewpoint: '협력과 단합의 관점' },
  { number: 9, name: '풍천소축', symbol: '☴ / ☰', coreViewpoint: '작은 성취의 관점' },
  { number: 10, name: '천택리', symbol: '☰ / ☱', coreViewpoint: '예의와 절제의 관점' },
  { number: 11, name: '지천태', symbol: '☷ / ☰', coreViewpoint: '조화와 평화의 관점' },
  { number: 12, name: '천지비', symbol: '☰ / ☷', coreViewpoint: '막힘과 침체의 관점' },
  { number: 13, name: '천화동인', symbol: '☰ / ☲', coreViewpoint: '동지와 협력의 관점' },
  { number: 14, name: '화천대유', symbol: '☲ / ☰', coreViewpoint: '풍요와 번영의 관점' },
  { number: 15, name: '지산겸', symbol: '☷ / ☶', coreViewpoint: '겸손과 절약의 관점' },
  { number: 16, name: '뢰지예', symbol: '☳ / ☷', coreViewpoint: '기쁨과 즐거움 관점' },
  { number: 17, name: '택뢰수', symbol: '☱ / ☳', coreViewpoint: '따름과 순응의 관점' },
  { number: 18, name: '산풍고', symbol: '☶ / ☴', coreViewpoint: '개혁과 혁신의 관점' },
  { number: 19, name: '지택림', symbol: '☷ / ☱', coreViewpoint: '접근과 친밀함 관점' },
  { number: 20, name: '풍지관', symbol: '☴ / ☷', coreViewpoint: '관찰과 성찰의 관점' },
  { number: 21, name: '화뢰서합', symbol: '☲ / ☳', coreViewpoint: '결단과 처벌의 관점' },
  { number: 22, name: '산화비', symbol: '☶ / ☲', coreViewpoint: '아름다움과 품격 관점' },
  { number: 23, name: '산지박', symbol: '☶ / ☷', coreViewpoint: '쇠퇴와 변화의 관점' },
  { number: 24, name: '지뢰복', symbol: '☷ / ☳', coreViewpoint: '회복과 재생의 관점' },
  { number: 25, name: '천뢰무망', symbol: '☰ / ☳', coreViewpoint: '순수함과 정직함 관점' },
  { number: 26, name: '산천대축', symbol: '☶ / ☰', coreViewpoint: '대성취와 축적 관점' },
  { number: 27, name: '산뢰이', symbol: '☶ / ☳', coreViewpoint: '양육과 보살핌 관점' },
  { number: 28, name: '택풍대과', symbol: '☱ / ☴', coreViewpoint: '과도함과 극한 관점' },
  { number: 29, name: '감위수', symbol: '☵ / ☵', coreViewpoint: '위험과 도전의 관점' },
  { number: 30, name: '리위화', symbol: '☲ / ☲', coreViewpoint: '밝음과 명료함 관점' },
  { number: 31, name: '산택손', symbol: '☶ / ☱', coreViewpoint: '상호 감응의 관점' },
  { number: 32, name: '뢰풍항', symbol: '☳ / ☴', coreViewpoint: '지속과 항구함 관점' },
  { number: 33, name: '천산둔', symbol: '☰ / ☶', coreViewpoint: '은둔과 후퇴의 관점' },
  { number: 34, name: '뢰천대장', symbol: '☳ / ☰', coreViewpoint: '위대한 힘의 관점' },
  { number: 35, name: '화지진', symbol: '☲ / ☷', coreViewpoint: '발전과 전진의 관점' },
  { number: 36, name: '지화명이', symbol: '☷ / ☲', coreViewpoint: '암흑과 시련의 관점' },
  { number: 37, name: '풍화가인', symbol: '☴ / ☲', coreViewpoint: '가정과 화목의 관점' },
  { number: 38, name: '화택규', symbol: '☲ / ☱', coreViewpoint: '대립과 차이의 관점' },
  { number: 39, name: '수산건', symbol: '☵ / ☶', coreViewpoint: '어려움과 장애 관점' },
  { number: 40, name: '뢰수해', symbol: '☳ / ☵', coreViewpoint: '해결과 해소의 관점' },
  { number: 41, name: '산택손', symbol: '☶ / ☱', coreViewpoint: '감소와 절약의 관점' },
  { number: 42, name: '풍뢰익', symbol: '☴ / ☳', coreViewpoint: '증익과 확장의 관점' },
  { number: 43, name: '택천쾌', symbol: '☱ / ☰', coreViewpoint: '결단과 돌파의 관점' },
  { number: 44, name: '천풍구', symbol: '☰ / ☴', coreViewpoint: '만남과 조우의 관점' },
  { number: 45, name: '택지취', symbol: '☱ / ☷', coreViewpoint: '모임과 결집의 관점' },
  { number: 46, name: '지풍승', symbol: '☷ / ☴', coreViewpoint: '상승과 발전의 관점' },
  { number: 47, name: '택수곤', symbol: '☱ / ☵', coreViewpoint: '곤경과 시련의 관점' },
  { number: 48, name: '수풍정', symbol: '☵ / ☴', coreViewpoint: '우물과 근본의 관점' },
  { number: 49, name: '택화혁', symbol: '☱ / ☲', coreViewpoint: '혁명과 변혁의 관점' },
  { number: 50, name: '화풍정', symbol: '☲ / ☴', coreViewpoint: '안정과 정착의 관점' },
  { number: 51, name: '진위뢰', symbol: '☳ / ☳', coreViewpoint: '충격과 각성의 관점' },
  { number: 52, name: '간위산', symbol: '☶ / ☶', coreViewpoint: '정지와 숙고의 관점' },
  { number: 53, name: '풍산점', symbol: '☴ / ☶', coreViewpoint: '점진적 발전 관점' },
  { number: 54, name: '뢰택귀매', symbol: '☳ / ☱', coreViewpoint: '귀속과 결합의 관점' },
  { number: 55, name: '뢰화풍', symbol: '☳ / ☲', coreViewpoint: '풍성함과 번영 관점' },
  { number: 56, name: '화산려', symbol: '☲ / ☶', coreViewpoint: '여행과 탐험의 관점' },
  { number: 57, name: '손위풍', symbol: '☴ / ☴', coreViewpoint: '순종과 겸손의 관점' },
  { number: 58, name: '태위택', symbol: '☱ / ☱', coreViewpoint: '기쁨과 즐거움 관점' },
  { number: 59, name: '풍수환', symbol: '☴ / ☵', coreViewpoint: '분산과 흩어짐 관점' },
  { number: 60, name: '수택절', symbol: '☵ / ☱', coreViewpoint: '절제와 규율의 관점' },
  { number: 61, name: '풍택중부', symbol: '☴ / ☱', coreViewpoint: '진실과 신뢰의 관점' },
  { number: 62, name: '뢰산소과', symbol: '☳ / ☶', coreViewpoint: '작은 과도함 관점' },
  { number: 63, name: '수화기제', symbol: '☵ / ☲', coreViewpoint: '완성과 성취의 관점' },
  { number: 64, name: '화수미제', symbol: '☲ / ☵', coreViewpoint: '미완성과 가능성 관점' }
];

// 랜덤 괘 선택 함수
const getRandomHexagram = () => {
  const randomIndex = Math.floor(Math.random() * hexagramsData.length);
  return hexagramsData[randomIndex];
};

// MongoDB에서 실제 괘 데이터를 가져오는 함수
const fetchHexagramData = async (hexagramNumber: number) => {
  try {
    const response = await fetch(`/api/hexagrams?number=${hexagramNumber}`);
    const data = await response.json();
    
    if (data.success) {
      return {
        selectedHexagram: {
          number: data.data.number,
          name: data.data.name,
          symbol: data.data.symbol,
          coreViewpoint: data.data.coreViewpoint
        },
        analysis: {
          summary: data.data.summary,
          keywords: data.data.keywords || [],
          confidence: 0.9 // MongoDB 데이터는 신뢰도 높음
        }
      };
    } else {
      // API 오류시 기본 데이터 반환
      const fallbackData = hexagramsData.find(h => h.number === hexagramNumber) || hexagramsData[0];
      return {
        selectedHexagram: {
          number: fallbackData.number,
          name: fallbackData.name,
          symbol: fallbackData.symbol,
          coreViewpoint: fallbackData.coreViewpoint
        },
        analysis: {
          summary: `${fallbackData.coreViewpoint}에 따른 지혜를 제공합니다.`,
          keywords: ['지혜', '관점', '통찰'],
          confidence: 0.7
        }
      };
    }
  } catch (error) {
    console.error('괘 데이터 가져오기 오류:', error);
    // 오류시 기본 데이터 반환
    const fallbackData = hexagramsData.find(h => h.number === hexagramNumber) || hexagramsData[0];
    return {
      selectedHexagram: {
        number: fallbackData.number,
        name: fallbackData.name,
        symbol: fallbackData.symbol,
        coreViewpoint: fallbackData.coreViewpoint
      },
      analysis: {
        summary: `${fallbackData.coreViewpoint}에 따른 지혜를 제공합니다.`,
        keywords: ['지혜', '관점', '통찰'],
        confidence: 0.7
      }
    };
  }
};


export default function Home() {
  const [userSituation, setUserSituation] = useState('');
  const [analysisResult, setAnalysisResult] = useState<HexagramAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  // 별 생성 효과
  useEffect(() => {
    createStars();
    createFloatingElements();
  }, []);

  const createStars = () => {
    const starsContainer = document.getElementById('stars');
    if (starsContainer) {
      for (let i = 0; i < 100; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.animationDelay = Math.random() * 3 + 's';
        starsContainer.appendChild(star);
      }
    }
  };

  const createFloatingElements = () => {
    const symbols = ['☰', '☱', '☲', '☳', '☴', '☵', '☶', '☷'];
    const container = document.getElementById('floatingElements');
    
    if (container) {
      setInterval(() => {
        const element = document.createElement('div');
        element.className = 'floating-symbol';
        element.textContent = symbols[Math.floor(Math.random() * symbols.length)];
        element.style.left = Math.random() * 100 + '%';
        element.style.animationDuration = (Math.random() * 10 + 15) + 's';
        container.appendChild(element);
        
        setTimeout(() => {
          if (element.parentNode) {
            element.parentNode.removeChild(element);
          }
        }, 25000);
      }, 3000);
    }
  };

  const generateLens = async () => {
    if (!userSituation.trim()) {
      alert('고민하는 상황을 입력해 주세요.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userSituation,
          userContext: {}
        }),
      });

      const data = await res.json();
      
      if (data.success) {
        setAnalysisResult(data.data);
      } else {
        // MongoDB에서 실제 데이터 가져오기 (AI 응답 실패시)
        const randomHexagram = getRandomHexagram();
        const hexagramData = await fetchHexagramData(randomHexagram.number);
        setAnalysisResult(hexagramData);
      }
    } catch (error) {
      // MongoDB에서 실제 데이터 가져오기 (에러 발생시)
      const randomHexagram = getRandomHexagram();
      const hexagramData = await fetchHexagramData(randomHexagram.number);
      setAnalysisResult(hexagramData);
    } finally {
      setLoading(false);
      // 결과 표시 시 fade-in 효과 적용
      setTimeout(() => {
        const resultElement = document.querySelector('.bg-white\\/10:last-child');
        if (resultElement) {
          resultElement.classList.add('fade-in');
        }
      }, 100);
    }
  };

  return (
    <>
      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Noto Sans KR', sans-serif;
          background: linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #2d1b69 100%);
          color: white;
          overflow-x: hidden;
        }
        
        .stars {
          position: fixed;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
          z-index: -1;
        }
        
        .star {
          position: absolute;
          width: 2px;
          height: 2px;
          background: white;
          border-radius: 50%;
          animation: twinkle 3s infinite;
        }
        
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        
        .floating-elements {
          position: absolute;
          width: 100%;
          height: 100%;
          pointer-events: none;
          overflow: hidden;
        }
        
        .floating-symbol {
          position: absolute;
          font-size: 2rem;
          opacity: 0.1;
          animation: float 20s infinite linear;
        }
        
        @keyframes float {
          0% {
            transform: translateY(100vh) rotate(0deg);
          }
          100% {
            transform: translateY(-100px) rotate(360deg);
          }
        }

        /* 페이드인 애니메이션 */
        .fade-in {
          animation: fadeIn 0.8s ease-in-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* 접근성 개선 */
        button:focus,
        textarea:focus {
          outline: 2px solid #06b6d4;
          outline-offset: 2px;
        }

        /* 로딩 애니메이션 */
        .loading {
          position: relative;
          overflow: hidden;
        }

        .loading::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          animation: shimmer 1.5s infinite;
        }

        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 100%; }
        }

        /* 모바일 반응형 */
        @media (max-width: 768px) {
          .max-w-6xl {
            padding: 15px;
          }

          h1 {
            font-size: 2.5rem !important;
            margin-bottom: 15px !important;
          }

          .text-xl {
            font-size: 1rem !important;
          }

          .bg-white\\/10 {
            padding: 25px !important;
            margin-bottom: 25px !important;
            border-radius: 15px !important;
          }

          .text-2xl {
            font-size: 1.3rem !important;
            margin-bottom: 15px !important;
          }

          textarea {
            height: 100px !important;
            padding: 15px !important;
            font-size: 0.95rem !important;
            border-radius: 12px !important;
            margin-bottom: 15px !important;
          }

          button {
            padding: 15px !important;
            font-size: 1.1rem !important;
            border-radius: 40px !important;
          }

          .text-7xl {
            font-size: 3rem !important;
            margin-bottom: 8px !important;
          }

          .text-3xl {
            font-size: 1.5rem !important;
            margin-bottom: 8px !important;
          }

          .text-xl {
            font-size: 1rem !important;
          }

          .text-lg {
            font-size: 1rem !important;
            margin: 20px 0 !important;
          }

          .flex-wrap {
            gap: 8px !important;
            margin: 20px 0 !important;
          }

          .py-3 {
            padding: 10px 15px !important;
            font-size: 0.8rem !important;
            border-radius: 20px !important;
          }

          .bg-black\\/20 {
            padding: 20px !important;
            margin: 15px 0 !important;
            border-radius: 12px !important;
          }

          .bg-white\\/5 {
            padding: 15px !important;
            margin-top: 15px !important;
            border-radius: 0 8px 8px 0 !important;
          }
        }

        @media (max-width: 480px) {
          .max-w-6xl {
            padding: 10px !important;
          }

          h1 {
            font-size: 2rem !important;
          }

          .bg-white\\/10 {
            padding: 20px !important;
          }

          .flex-wrap {
            flex-direction: column !important;
            align-items: center !important;
          }

          .py-3 {
            width: 200px !important;
            text-align: center !important;
          }

          .text-7xl {
            font-size: 2.5rem !important;
          }

          .text-3xl {
            font-size: 1.3rem !important;
          }
        }
      `}</style>

      <div className="stars" id="stars"></div>
      <div className="floating-elements" id="floatingElements"></div>
      
      <div className="max-w-6xl mx-auto p-5 min-h-screen relative">
        {/* Header */}
        <div className="text-center mb-15 pt-10">
          <h1 className="text-6xl font-light mb-5 text-shadow-lg bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent">
            지혜의 렌즈
          </h1>
          <p className="text-xl opacity-80 font-light">
            64가지 관점으로 바라보는 세상의 모든 문제
          </p>
        </div>
        {/* Input Section */}
        <HexagramInput
          userSituation={userSituation}
          setUserSituation={setUserSituation}
          onGenerate={generateLens}
          loading={loading}
        />
        {/* Result Section */}
        {analysisResult && (
          <HexagramResult
            analysisResult={analysisResult}
          />
        )}
      </div>
    </>
  );
}
