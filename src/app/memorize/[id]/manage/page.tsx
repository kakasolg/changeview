'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function ManagePage() {
  const params = useParams();
  const subjectId = params.id as string;
  
  const [subject, setSubject] = useState<any>(null);
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCard, setNewCard] = useState({ question: '', answer: '' });

  useEffect(() => {
    // 데이터 로드 시뮬레이션
    setTimeout(() => {
      setSubject({ _id: subjectId, name: '샘플 주제', description: '예시 주제입니다.' });
      setCards([]);
      setLoading(false);
    }, 500);
  }, [subjectId]);

  const addCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCard.question.trim() || !newCard.answer.trim()) {
      alert('문제와 답을 모두 입력해주세요.');
      return;
    }
    
    // 임시로 로컬 상태에 추가
    const newCardData = {
      _id: Date.now().toString(),
      question: newCard.question,
      answer: newCard.answer,
      subjectId,
      createdAt: new Date().toISOString()
    };
    
    setCards([...cards, newCardData]);
    setNewCard({ question: '', answer: '' });
    setShowAddForm(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            📝 {subject?.name} - 문제 관리
          </h1>
          <div className="flex gap-4 justify-center">
            <Link 
              href="/memorize" 
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              ← 주제 목록으로
            </Link>
          </div>
        </div>

        <div className="text-center mb-6">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-lg font-semibold"
          >
            {showAddForm ? '취소' : '➕ 새 문제 추가'}
          </button>
        </div>

        {showAddForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">새 문제 만들기</h2>
            <form onSubmit={addCard}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  문제 *
                </label>
                <textarea
                  value={newCard.question}
                  onChange={(e) => setNewCard({ ...newCard, question: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="문제를 입력하세요"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  답 *
                </label>
                <textarea
                  value={newCard.answer}
                  onChange={(e) => setNewCard({ ...newCard, answer: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="답을 입력하세요"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  추가
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">문제 목록 ({cards.length}개)</h2>
          {cards.length === 0 ? (
            <p className="text-gray-500 text-center py-8">아직 문제가 없습니다. 첫 문제를 만들어보세요!</p>
          ) : (
            <div className="space-y-4">
              {cards.map((card: any, index: number) => (
                <div key={card._id} className="border rounded-lg p-4">
                  <div className="mb-2">
                    <span className="text-sm text-gray-500">문제 {index + 1}</span>
                    <p className="font-medium">{card.question}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">답</span>
                    <p className="text-green-700">{card.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
