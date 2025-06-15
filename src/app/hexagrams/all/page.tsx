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
  // Add other fields if necessary
}

export default function HexagramsTablePage() {
  const [hexagrams, setHexagrams] = useState<Hexagram[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null); // Renamed from error to avoid conflict

  // Inline editing state
  const [editingHexagramId, setEditingHexagramId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Omit<Hexagram, 'keywords'> & { keywords: string }>>({});
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);


  useEffect(() => {
    const fetchAllHexagrams = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/hexagrams/all');
        const data = await response.json();
        if (data.success) {
          setHexagrams(data.data);
        } else {
          setPageError(data.message || 'Failed to load hexagrams.');
        }
      } catch (err: any) {
        setPageError(err.message || 'An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    };

    fetchAllHexagrams();
  }, []);
  
  const handleStartEdit = (hexagram: Hexagram) => {
    setEditingHexagramId(hexagram._id);
    setEditFormData({
      ...hexagram,
      keywords: hexagram.keywords.join(', '), // Convert keywords array to comma-separated string for editing
    });
    setEditError(null); // Clear previous edit errors
  };

  const handleCancelEdit = () => {
    setEditingHexagramId(null);
    setEditFormData({});
    setEditError(null);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveEdit = async (originalHexagramNumber: number) => {
    if (!editingHexagramId) return;

    setEditLoading(true);
    setEditError(null);

    try {
      const keywordsArray = typeof editFormData.keywords === 'string' 
        ? editFormData.keywords.split(',').map(k => k.trim()).filter(k => k) 
        : [];

      const updateData = {
        name: editFormData.name,
        koreanName: editFormData.koreanName,
        coreViewpoint: editFormData.coreViewpoint,
        mentalModels: editFormData.mentalModels,
        summary: editFormData.summary,
        keywords: keywordsArray,
      };
      
      // Ensure only defined fields are sent, to avoid overwriting with undefined
      const payload: Partial<typeof updateData> = {};
      (Object.keys(updateData) as Array<keyof typeof updateData>).forEach(key => {
        if (updateData[key] !== undefined) {
          // @ts-ignore
          payload[key] = updateData[key];
        }
      });


      const response = await fetch(`/api/hexagrams?number=${originalHexagramNumber}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        setHexagrams(prev =>
          prev.map(h =>
            h._id === editingHexagramId ? { ...h, ...result.data } : h // Use result.data as it's the updated record from DB
          )
        );
        setEditingHexagramId(null);
        setEditFormData({});
      } else {
        setEditError(result.message || 'Failed to update hexagram.');
      }
    } catch (err: any) {
      setEditError(err.message || 'An unexpected error occurred while saving.');
    } finally {
      setEditLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900 text-white">
        <p className="text-2xl">Loading hexagrams...</p>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900 text-white">
        <p className="text-2xl text-red-500">Error: {pageError}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4 sm:p-8 text-gray-100">
      <header className="text-center mb-8 sm:mb-12">
        <h1 className="text-4xl sm:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">
          64괘 전체 목록 (Inline Edit)
        </h1>
      </header>

      {editError && (
        <div className="mb-4 p-3 bg-red-800 text-white rounded-md text-center">
          Save Error: {editError}
        </div>
      )}

      {hexagrams.length === 0 ? (
        <p className="text-center text-xl">No hexagrams found.</p>
      ) : (
        <div className="overflow-x-auto shadow-2xl rounded-lg">
          <table className="min-w-full divide-y divide-gray-700 bg-gray-800 bg-opacity-80 backdrop-blur-md">
            <thead className="bg-gray-700 bg-opacity-50">
              <tr>
                <th scope="col" className="px-4 py-3 sm:px-6 sm:py-4 text-left text-xs sm:text-sm font-medium text-cyan-300 uppercase tracking-wider">번호</th>
                <th scope="col" className="px-4 py-3 sm:px-6 sm:py-4 text-left text-xs sm:text-sm font-medium text-cyan-300 uppercase tracking-wider">괘상</th>
                <th scope="col" className="px-4 py-3 sm:px-6 sm:py-4 text-left text-xs sm:text-sm font-medium text-cyan-300 uppercase tracking-wider">이름</th>
                <th scope="col" className="px-4 py-3 sm:px-6 sm:py-4 text-left text-xs sm:text-sm font-medium text-cyan-300 uppercase tracking-wider">한자명</th>
                <th scope="col" className="px-4 py-3 sm:px-6 sm:py-4 text-left text-xs sm:text-sm font-medium text-cyan-300 uppercase tracking-wider">핵심 관점</th>
                <th scope="col" className="px-4 py-3 sm:px-6 sm:py-4 text-left text-xs sm:text-sm font-medium text-cyan-300 uppercase tracking-wider">정신 모델</th>
                <th scope="col" className="px-4 py-3 sm:px-6 sm:py-4 text-left text-xs sm:text-sm font-medium text-cyan-300 uppercase tracking-wider">요약</th>
                <th scope="col" className="px-4 py-3 sm:px-6 sm:py-4 text-left text-xs sm:text-sm font-medium text-cyan-300 uppercase tracking-wider">키워드</th>
                <th scope="col" className="px-4 py-3 sm:px-6 sm:py-4 text-center text-xs sm:text-sm font-medium text-cyan-300 uppercase tracking-wider">편집</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {hexagrams.map((hexagram) => (
                editingHexagramId === hexagram._id ? (
                  // Edit mode row
                  <tr key={`${hexagram._id}-edit`} className="bg-gray-750">{/* Different bg for edit row */}<td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-sm sm:text-base font-medium text-gray-200">{hexagram.number}</td>
                    <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-2xl sm:text-3xl font-serif text-purple-300">{hexagram.symbol}</td>
                    <td className="px-4 py-3 sm:px-6 sm:py-4"><input type="text" name="name" value={editFormData.name || ''} onChange={handleFormChange} className="bg-gray-600 text-white p-1 rounded w-full" /></td>
                    <td className="px-4 py-3 sm:px-6 sm:py-4"><input type="text" name="koreanName" value={editFormData.koreanName || ''} onChange={handleFormChange} className="bg-gray-600 text-white p-1 rounded w-full" /></td>
                    <td className="px-4 py-3 sm:px-6 sm:py-4"><textarea name="coreViewpoint" value={editFormData.coreViewpoint || ''} onChange={handleFormChange} className="bg-gray-600 text-white p-1 rounded w-full" rows={2}/></td>
                    <td className="px-4 py-3 sm:px-6 sm:py-4"><input type="text" name="mentalModels" value={editFormData.mentalModels || ''} onChange={handleFormChange} className="bg-gray-600 text-white p-1 rounded w-full" /></td>
                    <td className="px-4 py-3 sm:px-6 sm:py-4"><textarea name="summary" value={editFormData.summary || ''} onChange={handleFormChange} className="bg-gray-600 text-white p-1 rounded w-full" rows={3}/></td>
                    <td className="px-4 py-3 sm:px-6 sm:py-4"><input type="text" name="keywords" value={editFormData.keywords || ''} onChange={handleFormChange} className="bg-gray-600 text-white p-1 rounded w-full" placeholder="쉼표로 구분"/></td>
                    <td className="px-4 py-3 sm:px-6 sm:py-4 text-center space-x-2">
                      <button onClick={() => handleSaveEdit(hexagram.number)} disabled={editLoading} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-sm disabled:opacity-50">
                        {editLoading ? '저장중...' : '저장'}
                      </button>
                      <button onClick={handleCancelEdit} disabled={editLoading} className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded-md text-sm disabled:opacity-50">
                        취소
                      </button>
                    </td>
                  </tr>
                ) : (
                  // View mode row
                  <tr key={hexagram._id} className="hover:bg-gray-700 hover:bg-opacity-50 transition-colors duration-150"><td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-sm sm:text-base font-medium text-gray-200">{hexagram.number}</td>
                    <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-2xl sm:text-3xl font-serif text-purple-300">{hexagram.symbol}</td>
                    <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-sm sm:text-base text-gray-200">{hexagram.name}</td>
                    <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-sm sm:text-base text-gray-200">{hexagram.koreanName}</td>
                    <td className="px-4 py-3 sm:px-6 sm:py-4 text-sm text-gray-300 max-w-xs truncate hover:whitespace-normal hover:max-w-none">{hexagram.coreViewpoint}</td>
                    <td className="px-4 py-3 sm:px-6 sm:py-4 text-sm text-gray-300 max-w-xs truncate hover:whitespace-normal hover:max-w-none">{hexagram.mentalModels}</td>
                    <td className="px-4 py-3 sm:px-6 sm:py-4 text-sm text-gray-400 max-w-md truncate hover:whitespace-normal hover:max-w-none">{hexagram.summary}</td>
                    <td className="px-4 py-3 sm:px-6 sm:py-4 text-sm text-gray-400 max-w-sm">{hexagram.keywords.join(', ')}</td>
                    <td className="px-4 py-3 sm:px-6 sm:py-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(hexagram)}
                        className="bg-cyan-600 hover:bg-cyan-700 text-white px-3 py-1 rounded-md text-sm transition-colors duration-200 inline-flex items-center space-x-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span>편집</span>
                      </button>
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Modal no longer rendered here */}
    </div>
  );
}
