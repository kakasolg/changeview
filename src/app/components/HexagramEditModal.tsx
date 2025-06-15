'use client';

import { useState, useEffect } from 'react';

interface Hexagram {
  _id: string;
  number: number;
  symbol: string;
  name: string;
  koreanName?: string;
  coreViewpoint: string;
  mentalModels?: string;
  summary: string;
  keywords: string[];
}

interface HexagramEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  hexagram: Hexagram | null;
  onSave: (updatedHexagram: Hexagram) => void;
}

export default function HexagramEditModal({ 
  isOpen, 
  onClose, 
  hexagram, 
  onSave 
}: HexagramEditModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    koreanName: '',
    coreViewpoint: '',
    mentalModels: '',
    summary: '',
    keywords: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 모달이 열릴 때 기존 데이터 로드
  useEffect(() => {
    if (isOpen && hexagram) {
      setFormData({
        name: hexagram.name || '',
        koreanName: hexagram.koreanName || '',
        coreViewpoint: hexagram.coreViewpoint || '',
        mentalModels: hexagram.mentalModels || '',
        summary: hexagram.summary || '',
        keywords: hexagram.keywords?.join(', ') || ''
      });
      setError(null);
    }
  }, [isOpen, hexagram]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hexagram) return;

    setLoading(true);
    setError(null);

    try {
      const updateData = {
        ...formData,
        keywords: formData.keywords.split(',').map(k => k.trim()).filter(k => k.length > 0)
      };

      const response = await fetch(`/api/hexagrams?number=${hexagram.number}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      const result = await response.json();

      if (result.success) {
        // 성공시 업데이트된 데이터로 콜백 호출
        onSave({
          ...hexagram,
          ...updateData,
          keywords: updateData.keywords
        });
        onClose();
      } else {
        setError(result.message || 'Failed to update hexagram');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      setError(null);
    }
  };
  
  console.log('🎭 Modal render - isOpen:', isOpen, 'hexagram:', hexagram?.number);
  
  if (!isOpen) {
    console.log('❌ Modal not open, returning null');
    return null;
  }
  
  console.log('✅ Modal is open, rendering modal...');
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-cyan-300">
            {hexagram?.number}번 괘 수정
          </h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-white transition-colors duration-200 disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-900 bg-opacity-50 border border-red-500 text-red-200 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* 괘 정보 표시 */}
          <div className="bg-gray-700 p-4 rounded-lg">
            <div className="flex items-center space-x-4">
              <span className="text-4xl font-serif text-purple-300">{hexagram?.symbol}</span>
              <div>
                <p className="text-sm text-gray-400">번호: {hexagram?.number}</p>
                <p className="text-sm text-gray-400">기호: {hexagram?.symbol}</p>
              </div>
            </div>
          </div>

          {/* 이름 */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-cyan-300 mb-2">
              괘 이름 *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              placeholder="예: 중천건"
            />
          </div>

          {/* 한자명 */}
          <div>
            <label htmlFor="koreanName" className="block text-sm font-medium text-cyan-300 mb-2">
              한자명
            </label>
            <input
              type="text"
              id="koreanName"
              name="koreanName"
              value={formData.koreanName}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              placeholder="예: 重天乾"
            />
          </div>

          {/* 핵심 관점 */}
          <div>
            <label htmlFor="coreViewpoint" className="block text-sm font-medium text-cyan-300 mb-2">
              핵심 관점 *
            </label>
            <textarea
              id="coreViewpoint"
              name="coreViewpoint"
              value={formData.coreViewpoint}
              onChange={handleInputChange}
              required
              rows={2}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-vertical"
              placeholder="이 괘의 핵심 관점을 입력하세요"
            />
          </div>

          {/* 정신 모델 */}
          <div>
            <label htmlFor="mentalModels" className="block text-sm font-medium text-cyan-300 mb-2">
              연결되는 정신 모델
            </label>
            <input
              type="text"
              id="mentalModels"
              name="mentalModels"
              value={formData.mentalModels}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              placeholder="관련된 정신 모델"
            />
          </div>

          {/* 요약 */}
          <div>
            <label htmlFor="summary" className="block text-sm font-medium text-cyan-300 mb-2">
              한 줄 요약 *
            </label>
            <textarea
              id="summary"
              name="summary"
              value={formData.summary}
              onChange={handleInputChange}
              required
              rows={3}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-vertical"
              placeholder="이 괘에 대한 한 줄 요약"
            />
          </div>

          {/* 키워드 */}
          <div>
            <label htmlFor="keywords" className="block text-sm font-medium text-cyan-300 mb-2">
              키워드
            </label>
            <input
              type="text"
              id="keywords"
              name="keywords"
              value={formData.keywords}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              placeholder="키워드를 쉼표로 구분해서 입력 (예: 창조, 리더십, 시작)"
            />
            <p className="text-xs text-gray-400 mt-1">
              쉼표(,)로 구분해서 여러 키워드를 입력하세요
            </p>
          </div>

          {/* 버튼 */}
          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-6 py-2 border border-gray-600 text-gray-300 rounded-md hover:bg-gray-700 transition-colors duration-200 disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>저장 중...</span>
                </div>
              ) : (
                '저장'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
