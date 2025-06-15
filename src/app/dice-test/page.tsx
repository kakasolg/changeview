'use client';

import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

// 타입 정의
interface HexagramData {
  _id: string;
  number: number;
  symbol: string;
  name: string;
  koreanName: string;
  description: string;
  summary: string;
  mentalModel?: string;
  keywords?: string[];
  perspectives?: {
    ancient?: {
      title: string;
      content: string;
      keyMessage: string;
      questions: string[];
    };
    physics?: {
      title: string;
      content: string;
      keyMessage: string;
      questions: string[];
    };
    // ... 기타 관점들
  };
}

export default function DiceTestPage() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [dice1Result, setDice1Result] = useState<number | null>(null);
  const [dice2Result, setDice2Result] = useState<number | null>(null);
  const [hexagramNumber, setHexagramNumber] = useState<number | null>(null);
  const [hexagramData, setHexagramData] = useState<HexagramData | null>(null);
  const [isLoadingHexagram, setIsLoadingHexagram] = useState(false);
  const [hexagramError, setHexagramError] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  
  // 나만의 해석/메모 상태
  const [userMemo, setUserMemo] = useState("");
  const [isSavingMemo, setIsSavingMemo] = useState(false);
  const [memoSaveResult, setMemoSaveResult] = useState<string | null>(null);
  
  // 메모 CRUD 상태
  const [username, setUsername] = useState('test');
  const [password, setPassword] = useState('bere625');
  const [memos, setMemos] = useState<any[]>([]);
  const [memoPage, setMemoPage] = useState(1);
  const [memoPageSize] = useState(5);
  const [memoTotal, setMemoTotal] = useState(0);
  const [editId, setEditId] = useState<string | null>(null);
  const [editMemo, setEditMemo] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  let scene: THREE.Scene;
  let camera: THREE.PerspectiveCamera;
  let renderer: THREE.WebGLRenderer;
  let dice1: THREE.Mesh;
  let dice2: THREE.Mesh;
  let animationId: number;

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, 800 / 600, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(800, 600);
    renderer.setClearColor(0x1a1a1a);
    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    scene.add(directionalLight);

    // Create octahedron geometry (8-sided dice)
    const octahedronGeometry = new THREE.OctahedronGeometry(1.5);
    
    // Function to create texture with trigram symbol
    const createTrigramTexture = (symbol: string, baseColor: string) => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const context = canvas.getContext('2d')!;
      
      // Background
      context.fillStyle = baseColor;
      context.fillRect(0, 0, 256, 256);
      
      // Border
      context.strokeStyle = '#ffffff';
      context.lineWidth = 8;
      context.strokeRect(4, 4, 248, 248);
      
      // Trigram symbol
      context.fillStyle = '#ffffff';
      context.font = 'bold 120px Arial';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(symbol, 128, 128);
      
      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      return texture;
    };
    
    // 8 Trigrams symbols
    const trigrams = ['☰', '☱', '☲', '☳', '☴', '☵', '☶', '☷'];
    
    // Create materials with textures for dice 1 (blue base)
    const dice1Materials = trigrams.map(symbol => 
      new THREE.MeshLambertMaterial({ 
        map: createTrigramTexture(symbol, '#3b82f6')
      })
    );
    
    // Create materials with textures for dice 2 (red base)  
    const dice2Materials = trigrams.map(symbol => 
      new THREE.MeshLambertMaterial({ 
        map: createTrigramTexture(symbol, '#ef4444')
      })
    );

    // Create simple dice materials (working version)
    const dice1Material = new THREE.MeshLambertMaterial({ color: 0x3b82f6 }); // Blue
    const dice2Material = new THREE.MeshLambertMaterial({ color: 0xef4444 }); // Red
    
    // Create dice
    dice1 = new THREE.Mesh(octahedronGeometry, dice1Material);
    dice2 = new THREE.Mesh(octahedronGeometry, dice2Material);
    
    // Position dice
    dice1.position.set(-3, 0, 0);
    dice2.position.set(3, 0, 0);
    
    scene.add(dice1);
    scene.add(dice2);

    // Camera position
    camera.position.z = 8;

    // Animation loop
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      
      if (isSpinning) {
        dice1.rotation.x += 0.1;
        dice1.rotation.y += 0.15;
        dice2.rotation.x += 0.12;
        dice2.rotation.y += 0.08;
      }
      
      renderer.render(scene, camera);
    };
    
    animate();

    // Handle window resize
    const handleResize = () => {
      camera.aspect = 800 / 600;
      camera.updateProjectionMatrix();
      renderer.setSize(800, 600);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [isSpinning]);
  
  // MongoDB에서 괘 데이터 가져오기
  const fetchHexagramData = async (hexagramNumber: number) => {
    setIsLoadingHexagram(true);
    setHexagramError(null);
    
    try {
      console.log(`Fetching hexagram data for number: ${hexagramNumber}`);
      
      const response = await fetch(`/api/hexagrams?number=${hexagramNumber}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Hexagram data received:', data);
      
      if (data.success && data.data) {
        setHexagramData(data.data);
      } else {
        throw new Error(data.message || '괘 데이터를 가져오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('Error fetching hexagram data:', error);
      setHexagramError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsLoadingHexagram(false);
    }
  };
  
  const startDiceRoll = () => {
    setIsSpinning(true);
    setDice1Result(null);
    setDice2Result(null);
    setHexagramNumber(null);
    setHexagramData(null);
    setHexagramError(null);
  };

  const stopDiceRoll = () => {
    if (!isSpinning) return;
    
    setIsSpinning(false);
    
    // Generate random results (1-8 for octahedron)
    const result1 = Math.floor(Math.random() * 8) + 1;
    const result2 = Math.floor(Math.random() * 8) + 1;
    
    setDice1Result(result1);
    setDice2Result(result2);
    
    // Calculate hexagram number (1-64)
    // Formula: (상괘-1) * 8 + 하괘
    const hexagram = (result1 - 1) * 8 + result2;
    setHexagramNumber(hexagram);
    
    // MongoDB에서 괘 데이터 가져오기
    fetchHexagramData(hexagram);
    };

  // AI 해석 요청 함수 (systemPrompt 제거, 원래대로 복원)
  const requestAiAnalysis = async () => {
    if (!hexagramNumber || !hexagramData) return;
    setIsAnalyzing(true);
    setAiError(null);
    setAiAnalysis(null);
    try {
      const keywords = hexagramData.keywords || [];
      const prompt = `찰리 멍거라면 64괘 중 ${hexagramNumber}번 괘(${hexagramData.name})의 핵심 키워드(${keywords.join(", ")})를 어떻게 해석할지 알려줘.\n필요하다면 function-calling을 활용하되, 반드시 reasoning(해석)까지 최종 답변을 생성해서 알려줘.`;
      const tools = [
        {
          functionDeclarations: [
            { name: "get_hexagram_info" },
            { name: "search_hexagram_by_keyword" },
            { name: "analyze_user_situation" },
            { name: "calculate_hexagram_compatibility" },
            { name: "select_final_hexagram" }
          ]
        }
      ];
      const response = await fetch("/api/ai/function-calling-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, tools })
      });
      const data = await response.json();
      if (data.error) {
        setAiError(data.error);
        return;
      }
      if (data.response) {
        setAiAnalysis(data.response);
      } else if (data.finalResponse) {
        setAiAnalysis(data.finalResponse);
      } else if (data.analysis && (data.analysis.reasoning || data.analysis.aiResponse)) {
        setAiAnalysis(data.analysis.reasoning || data.analysis.aiResponse);
      } else {
        setAiAnalysis("AI 해석 결과가 없습니다.");
      }
    } catch (error) {
      setAiError(error instanceof Error ? error.message : "알 수 없는 오류");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 메모 목록 조회
  const fetchMemos = async (pageNum = memoPage) => {
    if (!hexagramNumber) return;
    setIsSavingMemo(true);
    try {
      const res = await fetch(`/api/test/user-memo-db?page=${pageNum}&pageSize=${memoPageSize}`);
      const data = await res.json();
      if (data.success) {
        // 현재 괘 번호에 해당하는 메모만 필터링
        const filtered = data.memos.filter((m: any) => m.hexagramNumber === hexagramNumber);
        setMemos(filtered);
        setMemoTotal(filtered.length);
        setMemoPage(pageNum);
      }
    } finally {
      setIsSavingMemo(false);
    }
  };
  React.useEffect(() => {
    if (hexagramNumber) fetchMemos(1);
    // eslint-disable-next-line
  }, [hexagramNumber]);

  // 메모 저장 함수(확장: username/password 포함)
  const saveUserMemo = async () => {
    if (!hexagramNumber || !hexagramData || !userMemo.trim()) return;
    setIsSavingMemo(true);
    setMemoSaveResult(null);
    try {
      const payload = {
        username,
        password,
        date: new Date().toISOString(),
        hexagramNumber,
        keywords: hexagramData.keywords || [],
        memo: userMemo.trim()
      };
      const response = await fetch("/api/test/user-memo-db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (data.success) {
        setMemoSaveResult("메모가 성공적으로 저장되었습니다.");
        setUserMemo("");
        fetchMemos(1);
      } else {
        setMemoSaveResult(data.message || "저장에 실패했습니다.");
      }
    } catch (error) {
      setMemoSaveResult("저장 중 오류가 발생했습니다.");
    } finally {
      setIsSavingMemo(false);
    }
  };

  // 메모 수정
  const startEdit = (id: string, memo: string) => {
    setEditId(id);
    setEditMemo(memo);
  };
  const cancelEdit = () => {
    setEditId(null);
    setEditMemo('');
  };
  const saveEdit = async () => {
    if (!editId || !editMemo.trim()) return;
    setIsSavingMemo(true);
    setMemoSaveResult(null);
    try {
      const payload = {
        id: editId,
        username,
        password,
        memo: editMemo.trim()
      };
      const res = await fetch('/api/test/user-memo-db', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setMemoSaveResult('수정 성공!');
        cancelEdit();
        fetchMemos(memoPage);
      } else {
        setMemoSaveResult('수정 실패: ' + (data.message || '오류'));
      }
    } catch {
      setMemoSaveResult('수정 중 오류 발생');
    } finally {
      setIsSavingMemo(false);
    }
  };

  // 삭제 모달
  const requestDelete = (id: string) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };
  const cancelDelete = () => {
    setDeleteId(null);
    setShowDeleteModal(false);
  };
  const confirmDelete = async () => {
    if (!deleteId) return;
    setShowDeleteModal(false);
    await deleteMemo(deleteId);
    setDeleteId(null);
  };
  const deleteMemo = async (id: string) => {
    setIsSavingMemo(true);
    setMemoSaveResult(null);
    try {
      const payload = { id, username, password };
      const res = await fetch('/api/test/user-memo-db', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setMemoSaveResult('삭제 성공!');
        fetchMemos(memoPage);
      } else {
        setMemoSaveResult('삭제 실패: ' + (data.message || '오류'));
      }
    } catch {
      setMemoSaveResult('삭제 중 오류 발생');
    } finally {
      setIsSavingMemo(false);
    }
  };

  // 8 Trigrams mapping
  const trigrams = [
    '☰', '☱', '☲', '☳', '☴', '☵', '☶', '☷'
  ];
  
  const trigramNames = [
    '건(乾)', '태(兌)', '리(雦)', '진(震)', 
    '손(巽)', '감(坎)', '간(艮)', '곤(坤)'
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">🎲 8면체 주사위 64괘 테스트</h1>
          <p className="text-xl text-gray-300">
            두 개의 8면체 주사위로 64괘를 생성하는 시스템 테스트
          </p>
        </div>

        {/* 3D Scene */}
        <div className="flex justify-center mb-8">
          <div className="border-2 border-gray-600 rounded-lg overflow-hidden">
            <div ref={mountRef} className="w-[800px] h-[600px]" />
          </div>
        </div>

        {/* Controls */}
        <div className="text-center mb-8">
          {!isSpinning ? (
            <button
              onClick={startDiceRoll}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg text-xl transition-colors"
            >
              🎲 주사위 굴리기
            </button>
          ) : (
            <button
              onClick={stopDiceRoll}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded-lg text-xl transition-colors animate-pulse"
            >
              ✋ 정지하기
            </button>
          )}
        </div>

        {/* Results */}
        {dice1Result && dice2Result && hexagramNumber && (
          <div className="bg-gray-800 rounded-lg p-6 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-6">🎯 결과</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Dice 1 - 상괘 */}
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2 text-blue-400">상괘 (上卦)</h3>
                <div className="text-6xl mb-2">{trigrams[dice1Result - 1]}</div>
                <div className="text-lg">{trigramNames[dice1Result - 1]}</div>
                <div className="text-sm text-gray-400">주사위 결과: {dice1Result}</div>
              </div>
              
              {/* Combination */}
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2 text-yellow-400">64괘 조합</h3>
                <div className="text-4xl mb-2">第{hexagramNumber}卦</div>
                <div className="text-lg text-gray-300">
                  {trigrams[dice1Result - 1]} + {trigrams[dice2Result - 1]}
                </div>
                <div className="text-sm text-gray-400 mt-2">
                  계산: ({dice1Result}-1) × 8 + {dice2Result} = {hexagramNumber}
                </div>
              </div>
              
              {/* Dice 2 - 하괘 */}
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2 text-red-400">하괘 (下卦)</h3>
                <div className="text-6xl mb-2">{trigrams[dice2Result - 1]}</div>
                <div className="text-lg">{trigramNames[dice2Result - 1]}</div>
                <div className="text-sm text-gray-400">주사위 결과: {dice2Result}</div>
              </div>
            </div>
            
            {/* MongoDB 괘 데이터 표시 */}
            {isLoadingHexagram && (
              <div className="mt-6 text-center">
                <div className="text-lg text-yellow-400">📖 괘 데이터 로딩 중...</div>
                <div className="animate-spin inline-block w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full mt-2"></div>
              </div>
            )}
            
            {hexagramError && (
              <div className="mt-6 bg-red-900 border border-red-700 rounded-lg p-4 text-center">
                <div className="text-red-400 font-semibold">⚠️ 오류 발생</div>
                <div className="text-red-300 text-sm mt-1">{hexagramError}</div>
              </div>
            )}
            
            {hexagramData && (
              <div className="mt-6 bg-gradient-to-r from-purple-900 to-blue-900 rounded-lg p-6">
                <h3 className="text-2xl font-bold text-center mb-4 text-yellow-400">
                  📜 {hexagramData.name} ({hexagramData.koreanName})
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-lg font-semibold mb-2 text-blue-300">기본 정보</h4>
                    <div className="bg-black bg-opacity-30 rounded-lg p-4 text-sm">
                      <div className="mb-2"><span className="text-gray-400">번호:</span> {hexagramData.number}번 괘</div>
                      <div className="mb-2"><span className="text-gray-400">상징:</span> {hexagramData.symbol}</div>
                      <div className="text-gray-300">{hexagramData.description}</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-lg font-semibold mb-2 text-green-300">정신모델 기반 해석</h4>
                    <div className="bg-black bg-opacity-30 rounded-lg p-4 text-sm text-gray-300">
                      {hexagramData.summary}
                    </div>
                  </div>
                </div>
                
                {hexagramData.mentalModel && (
                  <div className="mt-4 bg-black bg-opacity-30 rounded-lg p-4">
                    <h4 className="text-lg font-semibold mb-2 text-orange-300">🧠 관련 정신 모델</h4>
                    <div className="text-sm text-gray-300">{hexagramData.mentalModel}</div>
                  </div>
                )}
                
                {hexagramData.keywords && hexagramData.keywords.length > 0 && (
                  <div className="mt-4 bg-black bg-opacity-30 rounded-lg p-4">
                    <h4 className="text-lg font-semibold mb-2 text-purple-300">🔑 핵심 키워드</h4>
                    <div className="flex flex-wrap gap-2">
                      {hexagramData.keywords.map((keyword, index) => (
                        <span
                          key={index}
                          className="bg-purple-600 bg-opacity-50 text-purple-200 px-3 py-1 rounded-full text-xs font-medium border border-purple-400"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* 사용자 상황 입력 및 AI 해석 요청 */}
                <div className="mt-8">
                  <button
                    className="bg-pink-600 hover:bg-pink-700 text-white font-bold py-2 px-6 rounded-lg mt-2 disabled:opacity-50"
                    onClick={requestAiAnalysis}
                    disabled={isAnalyzing || !hexagramData}
                  >
                    {isAnalyzing ? "AI 해석 중..." : "AI 해석 요청"}
                  </button>
                  {aiError && (
                    <div className="mt-2 text-red-400 text-sm">⚠️ {aiError}</div>
                  )}
                  {aiAnalysis && (
                    <div className="mt-4 bg-black bg-opacity-40 rounded-lg p-4 text-green-200 whitespace-pre-line">
                      <h5 className="font-bold mb-2">🔮 AI 해석 결과</h5>
                      {aiAnalysis}
                      {/* 나만의 해석/메모 입력 및 저장 */}
                      <div className="mt-6">
                        <h6 className="text-pink-200 font-semibold mb-2">📝 나만의 해석/메모</h6>
                        <div className="flex gap-2 mb-2">
                          <input
                            className="border p-2 w-28 text-black"
                            placeholder="username"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            disabled={isSavingMemo}
                          />
                          <input
                            className="border p-2 w-36 text-black"
                            placeholder="password"
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            disabled={isSavingMemo}
                          />
                        </div>
                        <textarea
                          className="w-full p-3 rounded bg-gray-900 border border-gray-700 text-white mb-2"
                          rows={3}
                          placeholder="이 괘와 해석을 보고 느낀 점, 나만의 해석을 자유롭게 기록하세요."
                          value={userMemo}
                          onChange={e => setUserMemo(e.target.value)}
                          disabled={isSavingMemo}
                        />
                        <button
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg disabled:opacity-50"
                          onClick={saveUserMemo}
                          disabled={isSavingMemo || !userMemo.trim()}
                        >
                          {isSavingMemo ? "저장 중..." : "메모 저장"}
                        </button>
                        {memoSaveResult && (
                          <div className="mt-2 text-sm text-yellow-300">{memoSaveResult}</div>
                        )}
                        {/* 메모 목록 */}
                        <div className="mt-6">
                          <h6 className="text-blue-200 font-semibold mb-2">💾 저장된 메모</h6>
                          <ul className="space-y-2">
                            {memos.map((m, i) => (
                              <li key={m._id || i} className="bg-gray-700 p-2 rounded">
                                <div className="text-xs text-gray-400">{m.date ? new Date(m.date).toLocaleString() : ''}</div>
                                <div>user: {m.username || '-'} / 키워드: {Array.isArray(m.keywords) ? m.keywords.join(', ') : ''}</div>
                                {editId === m._id ? (
                                  <div className="mt-1">
                                    <textarea
                                      className="border p-2 w-full mb-1 text-black"
                                      rows={2}
                                      value={editMemo}
                                      onChange={e => setEditMemo(e.target.value)}
                                    />
                                    <button className="bg-green-600 text-white px-2 py-1 rounded mr-2" onClick={saveEdit} disabled={isSavingMemo || !editMemo.trim()}>저장</button>
                                    <button className="bg-gray-400 text-white px-2 py-1 rounded" onClick={cancelEdit}>취소</button>
                                  </div>
                                ) : (
                                  <>
                                    <div className="text-gray-200 mt-1">{m.memo}</div>
                                    <button className="mt-1 text-xs text-blue-300 underline mr-2" onClick={() => startEdit(m._id, m.memo)}>수정</button>
                                    <button className="mt-1 text-xs text-red-400 underline" onClick={() => requestDelete(m._id)}>삭제</button>
                                  </>
                                )}
                              </li>
                            ))}
                          </ul>
                          {/* 페이징 */}
                          <div className="flex gap-2 mt-4">
                            <button className="px-2 py-1 border rounded" onClick={() => { if (memoPage > 1) { setMemoPage(memoPage - 1); fetchMemos(memoPage - 1); } }} disabled={memoPage === 1}>이전</button>
                            <span className="px-2">{memoPage}</span>
                            <button className="px-2 py-1 border rounded" onClick={() => { setMemoPage(memoPage + 1); fetchMemos(memoPage + 1); }} disabled={memos.length < memoPageSize}>다음</button>
                          </div>
                        </div>
                        {/* 삭제 확인 모달 */}
                        {showDeleteModal && (
                          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
                            <div className="bg-white rounded-lg p-6 shadow-lg max-w-xs w-full">
                              <div className="mb-4 text-gray-800 font-semibold">정말 삭제하시겠습니까?</div>
                              <div className="flex justify-end gap-2">
                                <button className="px-4 py-1 rounded bg-gray-300" onClick={cancelDelete}>취소</button>
                                <button className="px-4 py-1 rounded bg-red-600 text-white" onClick={confirmDelete}>삭제</button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            </div>
        )}

        {/* System Info */}
        <div className="mt-12 bg-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">📊 시스템 정보</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">수학적 원리</h3>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• 8면체 주사위 2개 = 8 × 8 = 64가지 조합</li>
                <li>• 첫 번째 주사위: 상괘 (8가지 기본 상징)</li>
                <li>• 두 번째 주사위: 하괘 (8가지 기본 상징)</li>
                <li>• 조합 공식: (상괘-1) × 8 + 하괘 = 괘 번호</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">8가지 기본 상징 (팔괘)</h3>
              <div className="text-sm text-gray-300 space-y-1">
                {trigramNames.map((name, index) => (
                  <div key={index} className="flex justify-between">
                    <span>{index + 1}. {name}</span>
                    <span>{trigrams[index]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
