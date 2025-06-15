'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function MemorizePage() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSubject, setNewSubject] = useState({ name: '', description: '' });
  const [error, setError] = useState('');
  
  // 주제 목록 로드
  const loadSubjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/memorize/subjects');
      if (response.ok) {
        const data = await response.json();
        setSubjects(data);
      } else {
        setError('주제를 불러올 수 없습니다.');
      }
    } catch (err) {
      console.error(err);
      setError('서버 연결에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };
  
  // 새 주제 추가
  const addSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.name.trim()) {
      setError('주제 이름을 입력해주세요.');
      return;
    }
  
    try {
      setError('');
      const response = await fetch('/api/memorize/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSubject)
      });
  
      if (response.ok) {
        setNewSubject({ name: '', description: '' });
        setShowAddForm(false);
        loadSubjects(); // 목록 새로고침
      } else {
        const errorData = await response.json();
        setError(errorData.error || '주제 생성에 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      setError('서버 연결에 실패했습니다.');
    }
  };
  
  // 주제 삭제 (카드가 없을 때만 가능)
  const deleteSubject = async (subjectId: string, subjectName: string) => {
    if (!confirm(`정말로 '${subjectName}' 주제를 삭제하시겠습니까?`)) {
      return;
    }
  
    try {
      setError('');
      const response = await fetch(`/api/memorize/subjects/${subjectId}`, {
        method: 'DELETE'
      });
  
      if (response.ok) {
        alert('주제가 성공적으로 삭제되었습니다!');
        loadSubjects(); // 목록 새로고침
      } else {
        const errorData = await response.json();
        setError(errorData.error || '주제 삭제에 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      setError('서버 연결에 실패했습니다.');
    }
  };

  useEffect(() => {
    loadSubjects();
  }, []);

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
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            📚 범용 암기장 시스템
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            주제를 만들고 문제와 답을 추가하여 효과적으로 학습하세요
          </p>
          <Link 
            href="/" 
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            🎴 64괘 플래시카드로 돌아가기
          </Link>
        </div>
        
        {/* 오류 메시지 */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}
        
        {/* 주제 추가 버튼 */}
        <div className="text-center mb-6">
          <button
            onClick={() => {
              setShowAddForm(!showAddForm);
              setError(''); // 폼 열고 닫을 때 에러 지우기
            }}
            className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-lg font-semibold"
          >
            {showAddForm ? '취소' : '➕ 새 주제 추가'}
          </button>
        </div>
        
        {/* 주제 추가 폼 */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">새 주제 만들기</h2>
            <form onSubmit={addSubject}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  주제 이름 *
                </label>
                <input
                  type="text"
                  value={newSubject.name}
                  onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="예: 영어 단어, 역사 사건, 수학 공식"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  설명 (선택사항)
                </label>
                <textarea
                  value={newSubject.description}
                  onChange={(e) => setNewSubject({ ...newSubject, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={3}
                  placeholder="이 주제에 대한 간단한 설명을 입력하세요"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  생성
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setError('');
                    setNewSubject({ name: '', description: '' });
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        )}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">주제 목록</h2>
          {subjects.length === 0 ? (
            <p className="text-gray-500 text-center py-8">아직 주제가 없습니다. 첫 주제를 만들어보세요!</p>
          ) : (
            <div className="space-y-3">
              {subjects.map((subject: any) => (
                <div key={subject._id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{subject.name}</h3>
                      {subject.description && (
                        <p className="text-gray-600 text-sm mt-1">{subject.description}</p>
                      )}
                      <div className="text-xs text-gray-500 mt-2">
                        카드 수: {subject.cardCount || 0}개
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <Link
                      href={`/memorize/${subject._id}`}
                      className="flex-1 px-3 py-2 bg-blue-500 text-white text-center rounded-md hover:bg-blue-600 transition-colors text-sm"
                    >
                      학습하기
                    </Link>
                    <Link
                      href={`/memorize/${subject._id}/manage`}
                      className="flex-1 px-3 py-2 bg-gray-500 text-white text-center rounded-md hover:bg-gray-600 transition-colors text-sm"
                    >
                      문제 관리
                    </Link>
                    {/* 카드가 없을 때만 삭제 버튼 표시 */}
                    {(subject.cardCount || 0) === 0 && (
                      <button
                        onClick={() => deleteSubject(subject._id, subject.name)}
                        className="px-3 py-2 bg-red-500 text-white text-center rounded-md hover:bg-red-600 transition-colors text-sm"
                        title="카드가 없을 때만 삭제 가능"
                      >
                        삭제
                      </button>
                    )}
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
