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
  
  // 수정 관련 상태
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editCard, setEditCard] = useState({ question: '', answer: '' });

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

  const addCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCard.question.trim() || !newCard.answer.trim()) {
      alert('문제와 답을 모두 입력해주세요.');
      return;
    }
    
    try {
      // API를 통해 카드 추가
      const response = await fetch(`/api/memorize/cards/${subjectId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: newCard.question.trim(),
          answer: newCard.answer.trim()
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '카드 추가에 실패했습니다.');
      }
      
      const newCardData = await response.json();
      
      // 로컬 상태도 업데이트
      setCards([newCardData, ...cards]); // 새 카드를 맨 위에 추가
      setNewCard({ question: '', answer: '' });
      setShowAddForm(false);
      
      alert('문제가 성공적으로 추가되었습니다!');
      
    } catch (error) {
      console.error('카드 추가 실패:', error);
      alert(error instanceof Error ? error.message : '카드 추가에 실패했습니다.');
    }
  };
  
  // 카드 수정 시작
  const startEditCard = (card: any) => {
    setEditingCardId(card._id);
    setEditCard({ question: card.question, answer: card.answer });
  };
  
  // 카드 수정 취소
  const cancelEditCard = () => {
    setEditingCardId(null);
    setEditCard({ question: '', answer: '' });
  };
  
  // 카드 수정 완료
  const updateCard = async (cardId: string) => {
    if (!editCard.question.trim() || !editCard.answer.trim()) {
      alert('문제와 답을 모두 입력해주세요.');
      return;
    }
  
    try {
      const response = await fetch(`/api/memorize/cards/${subjectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cardId,
          question: editCard.question.trim(),
          answer: editCard.answer.trim()
        })
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '카드 수정에 실패했습니다.');
      }
  
      const updatedCard = await response.json();
  
      // 로컬 상태 업데이트
      setCards(cards.map(card => 
        card._id === cardId ? updatedCard : card
      ));
  
      // 수정 모드 종료
      setEditingCardId(null);
      setEditCard({ question: '', answer: '' });
  
      alert('문제가 성공적으로 수정되었습니다!');
  
    } catch (error) {
      console.error('카드 수정 실패:', error);
      alert(error instanceof Error ? error.message : '카드 수정에 실패했습니다.');
    }
  };
  
  // 카드 삭제
  const deleteCard = async (cardId: string) => {
    if (!confirm('정말로 이 문제를 삭제하시겠습니까?')) {
      return;
    }
  
    try {
      const response = await fetch(`/api/memorize/cards/${subjectId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cardId
        })
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '카드 삭제에 실패했습니다.');
      }
  
      // 로컬 상태에서 제거
      setCards(cards.filter(card => card._id !== cardId));
  
      alert('문제가 성공적으로 삭제되었습니다!');
  
    } catch (error) {
      console.error('카드 삭제 실패:', error);
      alert(error instanceof Error ? error.message : '카드 삭제에 실패했습니다.');
    }
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
                  {editingCardId === card._id ? (
                    // 수정 모드
                    <div>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          문제 {index + 1} 수정
                        </label>
                        <textarea
                          value={editCard.question}
                          onChange={(e) => setEditCard({ ...editCard, question: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows={3}
                          required
                        />
                      </div>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          답
                        </label>
                        <textarea
                          value={editCard.answer}
                          onChange={(e) => setEditCard({ ...editCard, answer: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows={2}
                          required
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateCard(card._id)}
                          className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                        >
                          저장
                        </button>
                        <button
                          onClick={cancelEditCard}
                          className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition-colors"
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    // 일반 모드
                    <div>
                      <div className="mb-2">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <span className="text-sm text-gray-500">문제 {index + 1}</span>
                            <p className="font-medium">{card.question}</p>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => startEditCard(card)}
                              className="px-2 py-1 bg-yellow-500 text-white text-xs rounded hover:bg-yellow-600 transition-colors"
                            >
                              수정
                            </button>
                            <button
                              onClick={() => deleteCard(card._id)}
                              className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">답</span>
                        <p className="text-green-700">{card.answer}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
