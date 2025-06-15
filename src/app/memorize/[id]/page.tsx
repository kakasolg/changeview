'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
// 이미지 파일 import
import cardFrontImage from '../../card_front.png';
import cardBackImage from '../../card_back.png';

interface Subject {
  _id: string;
  name: string;
  description: string;
}

interface Card {
  _id: string;
  question: string;
  answer: string;
}

export default function LearnPage() {
  const params = useParams();
  const subjectId = params.id as string;
  
  const [subject, setSubject] = useState<Subject | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 주제 정보 가져오기
        const subjectResponse = await fetch(`/api/memorize/subjects/${subjectId}`);
        if (!subjectResponse.ok) {
          throw new Error('주제 정보를 불러올 수 없습니다.');
        }
        const subjectData = await subjectResponse.json();
        setSubject(subjectData);
        
        // 카드 정보 가져오기
        const cardsResponse = await fetch(`/api/memorize/cards/${subjectId}`);
        if (!cardsResponse.ok) {
          throw new Error('카드 정보를 불러올 수 없습니다.');
        }
        const cardsData = await cardsResponse.json();
        setCards(cardsData);
        
      } catch (error) {
        console.error('데이터 로드 실패:', error);
        // 에러 발생 시 에러 상태를 표시할 수 있도록 설정
        setSubject(null);
        setCards([]);
      } finally {
        setLoading(false);
      }
    };
    
    if (subjectId) {
      fetchData();
    }
  }, [subjectId]);

  const currentCard = cards[currentCardIndex];

  const handleCardClick = () => {
    setIsFlipped(!isFlipped);
  };

  const handleDifficultySelect = (difficulty: 'again' | 'soon' | 'later' | 'mastered') => {
    setIsFlipped(false);
    if (currentCardIndex < cards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    } else {
      setCurrentCardIndex(0);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">로딩 중...</div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            📚 {subject?.name} - 학습하기
          </h1>
          <div className="bg-white rounded-lg shadow-lg p-8">
            <p className="text-gray-500 text-lg mb-6">아직 학습할 문제가 없습니다.</p>
            <div className="flex gap-4 justify-center">
              <Link href="/memorize" className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors">
                ← 주제 목록으로
              </Link>
              <Link href={`/memorize/${subjectId}/manage`} className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                문제 추가하기
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            📚 {subject?.name} - 학습하기
          </h1>
          <p className="text-gray-600 mb-4">문제 {currentCardIndex + 1} / {cards.length}</p>
          <div className="flex gap-4 justify-center mb-6">
            <Link href="/memorize" className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors">
              ← 주제 목록으로
            </Link>
            <Link href={`/memorize/${subjectId}/manage`} className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
              문제 관리
            </Link>
          </div>
        </div>

        <div className="flex justify-center mb-8">
          <div style={{ perspective: '1000px' }}>
            <div 
              className="relative w-96 h-64 transition-transform duration-700 cursor-pointer"
              style={{
                transformStyle: 'preserve-3d',
                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
              }}
              onClick={handleCardClick}
            >
              <div className="absolute inset-0 w-full h-full" style={{ backfaceVisibility: 'hidden' }}>
                <div className="relative w-full h-full">
                  <Image src={cardBackImage} alt="카드 앞면" fill style={{ objectFit: 'cover' }} className="rounded-lg" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text">
                    <div className="text-center max-w-sm">
                      <h2 className="text-xl font-bold mb-4">문제</h2>
                      <p className="text-lg leading-relaxed">{currentCard.question}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute inset-0 w-full h-full" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                <div className="relative w-full h-full">
                  <Image src={cardFrontImage} alt="카드 뒷면" fill style={{ objectFit: 'cover' }} className="rounded-lg" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text">
                    <div className="text-center max-w-sm">
                      <h2 className="text-xl font-bold mb-4">답</h2>
                      <p className="text-lg leading-relaxed">{currentCard.answer}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {!isFlipped && (
          <div className="text-center mb-6">
            <p className="text-gray-600">카드를 클릭하여 답을 확인하세요</p>
          </div>
        )}

        {isFlipped && (
          <div className="flex justify-center gap-4 mb-6">
            <button onClick={() => handleDifficultySelect('again')} className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
              again🐣
            </button>
            <button onClick={() => handleDifficultySelect('soon')} className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
              soon🐥
            </button>
            <button onClick={() => handleDifficultySelect('later')} className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
              later🦉
            </button>
            <button onClick={() => handleDifficultySelect('mastered')} className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
              mastered🧠
            </button>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">💡 사용법:</h3>
          <p className="text-blue-700 text-sm">
            문제를 보고 대답을 생각해본 후 카드를 클릭하여 답을 확인하세요. 
            난이도를 평가하면 다음 문제로 넘어갑니다.
          </p>
        </div>
      </div>
    </div>
  );
}
