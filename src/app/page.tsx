'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image'; // Image 컴포넌트 임포트
// 이미지 파일을 직접 import 합니다.
import cardFrontImage from './card_front.png';
import cardBackImage from './card_back.png';
import { IHexagram } from '@/models/Hexagram';

const HomePage = () => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [hexagram, setHexagram] = useState<IHexagram | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [username] = useState('test'); // 고정된 사용자
  
  // 메모 관련 상태
  const [userMemo, setUserMemo] = useState('');
  const [currentDifficulty, setCurrentDifficulty] = useState<string>('');
  const [showMemoInput, setShowMemoInput] = useState(false);
  const [memoText, setMemoText] = useState('');
  const [savingMemo, setSavingMemo] = useState(false);

  const fetchRandomHexagram = useCallback(async () => {
    setLoading(true);
    setError(null);
    setIsFlipped(false); // 새로운 괘를 가져올 때 카드 뒤집기 상태 초기화
    try {
      const response = await fetch('/api/hexagrams?random=true');
      const data = await response.json();
      if (data.success) {
        setHexagram(data.data);
        // 새로운 괘가 로드되면 해당 괘의 메모와 난이도 정보 가져오기
        await fetchHexagramMemoAndProgress(data.data.number);
      } else {
        setError(data.message || 'Failed to fetch hexagram');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  // 특정 괘의 메모와 진도 정보 가져오기
  const fetchHexagramMemoAndProgress = useCallback(async (hexagramNumber: number) => {
    try {
      // 메모 가져오기
      const memoResponse = await fetch(`/api/test/user-memo-db?hexagramNumber=${hexagramNumber}&username=${username}`);
      const memoData = await memoResponse.json();
      if (memoData.success && memoData.memos.length > 0) {
        // 가장 최근 메모 사용
        setUserMemo(memoData.memos[0].memo || '');
      } else {
        setUserMemo('');
      }

      // 진도 정보 가져오기
      const progressResponse = await fetch(`/api/flash-card/difficulty?username=${username}&hexagramNumber=${hexagramNumber}`);
      const progressData = await progressResponse.json();
      if (progressData.success && progressData.progress.length > 0) {
        setCurrentDifficulty(progressData.progress[0].difficulty);
      } else {
        setCurrentDifficulty('');
      }
    } catch (error) {
      console.error('Error fetching memo and progress:', error);
      setUserMemo('');
      setCurrentDifficulty('');
    }
  }, [username]);

  // 메모 저장 함수
  const saveMemo = useCallback(async () => {
    if (!hexagram || !memoText.trim()) return;

    setSavingMemo(true);
    try {
      const payload = {
        username,
        password: 'bere625', // 기존 시스템과 호환을 위해
        date: new Date().toISOString(),
        hexagramNumber: hexagram.number,
        keywords: hexagram.keywords,
        memo: memoText.trim()
      };

      const response = await fetch('/api/test/user-memo-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (result.success) {
        setUserMemo(memoText.trim());
        setMemoText('');
        setShowMemoInput(false);
        console.log('Memo saved successfully');
      } else {
        console.error('Failed to save memo:', result.message);
      }
    } catch (error) {
      console.error('Error saving memo:', error);
    } finally {
      setSavingMemo(false);
    }
  }, [hexagram, memoText, username]);

  // 난이도 기록 함수
  const recordDifficulty = useCallback(async (difficulty: 'again' | 'soon' | 'later' | 'mastered') => {
    if (!hexagram) return;
    
    try {
      const response = await fetch('/api/flash-card/difficulty', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          hexagramNumber: hexagram.number,
          difficulty
        })
      });
      
      const result = await response.json();
      if (result.success) {
        console.log(`Difficulty "${difficulty}" recorded for hexagram ${hexagram.number}`);
        setCurrentDifficulty(difficulty);
        // 난이도 기록 후 다음 괘로 이동
        fetchRandomHexagram();
      } else {
        console.error('Failed to record difficulty:', result.message);
        // 실패해도 다음 괘로 이동
        fetchRandomHexagram();
      }
    } catch (error) {
      console.error('Error recording difficulty:', error);
      // 에러가 발생해도 다음 괘로 이동
      fetchRandomHexagram();
    }
  }, [hexagram, username, fetchRandomHexagram]);

  useEffect(() => {
    fetchRandomHexagram();
  }, [fetchRandomHexagram]);

  const handleCardClick = () => {
    setIsFlipped(!isFlipped);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">🎴 지혜의 렌즈</h1>
          <p className="text-xl text-gray-700">64괘 플래시카드 학습 시스템</p>
          <p className="text-lg text-gray-600 mt-2">괘 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-100 p-4">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">🎴 지혜의 렌즈</h1>
        <p className="text-xl text-red-500">오류: {error}</p>
        <button
          onClick={fetchRandomHexagram}
          className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 transition-colors"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (!hexagram) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-100 p-4">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">🎴 지혜의 렌즈</h1>
        <p className="text-xl text-gray-700">표시할 괘가 없습니다.</p>
        <button
          onClick={fetchRandomHexagram}
          className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 transition-colors"
        >
          새로운 괘 불러오기
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-gray-100 p-4">
      {/* 페이지 제목 */}
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">🎴 지혜의 렌즈</h1>
        <p className="text-lg text-gray-600">64괘 플래시카드 학습 시스템</p>
        <p className="text-sm text-gray-500 mt-1">카드를 클릭하여 뒤집고, 학습 난이도를 평가하세요</p>
      </div>

      <div className="flip-card w-[600px] h-[337px] border border-gray-200 perspective-1000 cursor-pointer" onClick={handleCardClick}>
        <div className={`flip-card-inner relative w-full h-full text-center transition-transform duration-600 transform-style-preserve-3d ${isFlipped ? 'is-flipped' : ''}`}>
          <div className="flip-card-front absolute w-full h-full backface-hidden rounded-xl flex justify-center items-center text-2xl text-white font-bold relative">
            {/* 앞면: 문제/질문 - 괘상, 이름, 핵심관점 */}
            <Image
              src={cardBackImage} /* cardBackImage를 앞면에 표시 (카드 뒷면 디자인) */
              alt="Card Front"
              fill
              className="rounded-xl object-cover"
            />
            <div className="relative z-10 p-4 m-4 text-center bg-black bg-opacity-50 rounded-lg">
              <p className="text-4xl mb-2">{hexagram.symbol}</p>
              <p className="text-3xl mb-2">{hexagram.name} ({hexagram.koreanName})</p>
              <p className="text-xl">{hexagram.coreViewpoint}</p>
            </div>
          </div>
          <div className="flip-card-back absolute w-full h-full backface-hidden rounded-xl flex justify-center items-center text-2xl text-white font-bold relative">
            {/* 뒷면: 답/설명 - 요약, 키워드 */}
            <Image
              src={cardFrontImage} /* cardFrontImage를 뒷면에 표시 (카드 앞면 디자인) */
              alt="Card Back"
              fill
              className="rounded-xl object-cover"
            />
            <div className="relative z-10 p-4 m-4 text-center bg-black bg-opacity-50 rounded-lg">
              <p className="text-base mb-2">{hexagram.summary}</p>
              <p className="text-sm">키워드: {hexagram.keywords.join(', ')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 현재 난이도 표시 */}
      {currentDifficulty && (
        <div className="mt-4 px-3 py-1 bg-gray-200 rounded-lg">
          <span className="text-sm text-gray-700">
            현재 난이도: <span className="font-semibold">{currentDifficulty}</span>
            {currentDifficulty === 'again' && ' 🐣'}
            {currentDifficulty === 'soon' && ' 🐥'}
            {currentDifficulty === 'later' && ' 🦉'}
            {currentDifficulty === 'mastered' && ' 🧠'}
          </span>
        </div>
      )}

      {/* 사용자 메모 표시 */}
      {userMemo && (
        <div className="mt-4 max-w-[600px] p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-800 mb-2">내 메모:</h4>
          <p className="text-sm text-blue-700">{userMemo}</p>
        </div>
      )}

      {/* 메모 입력 섹션 */}
      {showMemoInput ? (
        <div className="mt-4 max-w-[600px] w-full">
          <textarea
            value={memoText}
            onChange={(e) => setMemoText(e.target.value)}
            placeholder="이 괘에 대한 메모를 작성하세요..."
            className="w-full p-3 border border-gray-300 rounded-lg resize-none h-24"
            rows={3}
          />
          <div className="flex space-x-2 mt-2">
            <button
              onClick={saveMemo}
              disabled={savingMemo || !memoText.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {savingMemo ? '저장 중...' : '메모 저장'}
            </button>
            <button
              onClick={() => {
                setShowMemoInput(false);
                setMemoText('');
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              취소
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowMemoInput(true)}
          className="mt-4 px-4 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500"
        >
          📝 메모 {userMemo ? '수정' : '추가'}
        </button>
      )}

      <div className="mt-6 flex space-x-4">
        <button
          onClick={() => recordDifficulty('again')}
          className="px-4 py-2 bg-red-400 text-white rounded-lg shadow hover:bg-red-500 transition-colors text-base"
        >
          again🐣
        </button>
        <button
          onClick={() => recordDifficulty('soon')}
          className="px-4 py-2 bg-yellow-400 text-white rounded-lg shadow hover:bg-yellow-500 transition-colors text-base"
        >
          soon🐥
        </button>
        <button
          onClick={() => recordDifficulty('later')}
          className="px-4 py-2 bg-blue-400 text-white rounded-lg shadow hover:bg-blue-500 transition-colors text-base"
        >
          later🦉
        </button>
        <button
          onClick={() => recordDifficulty('mastered')}
          className="px-4 py-2 bg-green-400 text-white rounded-lg shadow hover:bg-green-500 transition-colors text-base"
        >
          mastered🧠
        </button>
      </div>

      {/* 하단 추가 정보 */}
      <div className="mt-8 text-center text-sm text-gray-500 max-w-[600px]">
        <p className="mb-2">💡 <strong>사용법:</strong> 카드를 보고 기억해낸 후 클릭하여 정답을 확인하세요</p>
        <p>📊 학습 난이도를 평가하면 개인 맞춤형 복습 시스템이 작동합니다</p>
      </div>
    </div>
  );
};

export default HomePage;
