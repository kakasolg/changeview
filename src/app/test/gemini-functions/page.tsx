'use client';

// A-1 세트: 기본 Function Calling 테스트 페이지
import { useState } from 'react';
import { functionCallingTools } from './lib/function-declarations';
import { handleFunctionCall } from './lib/function-implementations';

interface TestResult {
  prompt: string;
  functionCalls?: any[];
  functionResults?: any[];
  finalResponse?: string;
  error?: string;
  timestamp: string;
}

export default function GeminiFunctionsTestPage() {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [modelStatus, setModelStatus] = useState('Ready');

  // A-1 & A-2 세트 테스트를 위한 예제 프롬프트들
  const examplePrompts = [
    // A-1 세트: 기본 Function Calling 테스트
    "1번 괘에 대해 알려주세요",
    "창조와 관련된 괘를 찾아주세요",
    "리더십에 대한 괘 3개를 추천해주세요",
    "중천건 괘에 대한 정보를 알려주세요",
    
    // A-2 세트: 고도화된 괘 선택 Function Calling 테스트
    "새로운 비지네스 시작하는데 스트레스가 많고 걱정이 많습니다. 어떤 괘이 좋을까요?",
    "비지네스 파트너와 소통이 잘 안 되고 있어 고민입니다. 지혜가 필요해요.",
    "인생의 중요한 결정을 내려야 하는데 찰리 멍거 라면 어떤식으로 조언할까요.",
    "경쟁자가 많이 발생하여 힘든데, 인내하며 기다려야 할지 적극적으로 나서야 할지 모르겠습니다.",
    "비즈니스에서 어려움에 직면해서 스티브 잡스 행동 방식으로 극복하고 싶습니다. 어떤 관점이 도움이 될까요?"
  ];

  /**
   * Gemini API 호출 및 Function Calling 처리
   */
  const testFunctionCalling = async (inputPrompt: string) => {
    if (!inputPrompt.trim()) return;
    
    setIsLoading(true);
    setModelStatus('Processing...');
    
    const result: TestResult = {
      prompt: inputPrompt,
      timestamp: new Date().toISOString()
    };

    try {
      // Gemini API 호출 (첫 번째 단계)
      const response = await fetch('/api/ai/function-calling-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: inputPrompt,
          tools: functionCallingTools
        })
      });

      if (!response.ok) {
        throw new Error(`API 오류: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        result.error = data.error;
        setTestResults(prev => [result, ...prev]);
        return;
      }

      // Function Call이 있는지 확인
      if (data.functionCalls && data.functionCalls.length > 0) {
        result.functionCalls = data.functionCalls;
        setModelStatus('Executing Functions...');
        
        // Function Call 실행
        const functionResults = [];
        for (const functionCall of data.functionCalls) {
          const funcResult = await handleFunctionCall(
            functionCall.name, 
            functionCall.args
          );
          functionResults.push({
            name: functionCall.name,
            args: functionCall.args,
            result: funcResult
          });
        }
        
        result.functionResults = functionResults;
        
        // Function 결과를 다시 Gemini에 전달하여 최종 응답 생성, 여기서 질문 조합해서
        setModelStatus('Generating Final Response...');
        const finalResponse = await fetch('/api/ai/function-calling-test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: inputPrompt,
            tools: functionCallingTools,
            functionResults: functionResults
          })
        });
        
        const finalData = await finalResponse.json();
        result.finalResponse = finalData.response || '최종 응답 생성 실패';
        
      } else {
        // Function Call 없이 직접 응답
        result.finalResponse = data.response || '직접 응답';
      }
      
    } catch (error) {
      console.error('[Test Error]:', error);
      result.error = error instanceof Error ? error.message : '알 수 없는 오류';
    } finally {
      setIsLoading(false);
      setModelStatus('Ready');
      setTestResults(prev => [result, ...prev]);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 p-6">
      <div className="max-w-6xl mx-auto">
        
        {/* 헤더 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🤖 A-1: Gemini Function Calling 테스트
          </h1>
          <p className="text-gray-600 mb-4">
            Google Gemini 2.5의 Function Calling 기능을 테스트합니다.
          </p>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                modelStatus === 'Ready' ? 'bg-green-500' : 
                modelStatus.includes('Error') ? 'bg-red-500' : 'bg-yellow-500'
              }`}></div>
              <span className="text-sm text-gray-600">모델 상태: {modelStatus}</span>
            </div>
            <div className="text-sm text-gray-500">
              사용 모델: gemini-2.5-flash-preview-05-20
            </div>
          </div>
        </div>

        {/* 테스트 입력 영역 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">테스트 입력</h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
                프롬프트 입력
              </label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="예: '1번 괘에 대해 알려주세요' 또는 '창조와 관련된 괘를 찾아주세요'"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows={3}
                disabled={isLoading}
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => testFunctionCalling(prompt)}
                disabled={isLoading || !prompt.trim()}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? '처리 중...' : 'Function Calling 테스트'}
              </button>
              
              <button
                onClick={clearResults}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                결과 지우기
              </button>
            </div>
          </div>
          
          {/* A-1 & A-2 세트 예제 프롬프트 */}
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">테스트 프롬프트 예제</h3>
            
            {/* A-1 세트: 기본 Function Calling */}
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-blue-600 mb-2">📊 A-1 세트: 기본 Function Calling</h4>
              <div className="flex flex-wrap gap-2">
                {examplePrompts.slice(0, 4).map((example, index) => (
                  <button
                    key={index}
                    onClick={() => setPrompt(example)}
                    className="text-xs px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
                  >
                    {example.length > 50 ? example.substring(0, 50) + '...' : example}
                  </button>
                ))}
              </div>
            </div>
            
            {/* A-2 세트: 고도화된 괘 선택 Function Calling */}
            <div>
              <h4 className="text-xs font-semibold text-purple-600 mb-2">🤖 A-2 세트: 고도화된 괘 선택 Function Calling</h4>
              <div className="flex flex-wrap gap-2">
                {examplePrompts.slice(4).map((example, index) => (
                  <button
                    key={index + 4}
                    onClick={() => setPrompt(example)}
                    className="text-xs px-3 py-1.5 bg-purple-50 text-purple-700 rounded-md hover:bg-purple-100 transition-colors"
                  >
                    {example.length > 60 ? example.substring(0, 60) + '...' : example}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 결과 표시 영역 */}
        {testResults.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-800">테스트 결과 ({testResults.length}건)</h2>
            
            {testResults.map((result, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg p-6">
                
                {/* 프롬프트 정보 */}
                <div className="border-b border-gray-200 pb-4 mb-4">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold text-gray-800">테스트 #{testResults.length - index}</h3>
                    <span className="text-sm text-gray-500">
                      {new Date(result.timestamp).toLocaleString('ko-KR')}
                    </span>
                  </div>
                  <p className="text-gray-600 mt-2 bg-gray-50 p-3 rounded-lg">
                    <strong>프롬프트:</strong> {result.prompt}
                  </p>
                </div>
        
                {/* 오류 표시 */}
                {result.error && (
                  <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-4">
                    <div className="flex items-center">
                      <span className="text-red-600 text-sm font-medium">❌ 오류 발생</span>
                    </div>
                    <p className="text-red-700 mt-2">{result.error}</p>
                  </div>
                )}
        
                {/* Function Calls 정보 */}
                {result.functionCalls && result.functionCalls.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-md font-semibold text-gray-800 mb-2 flex items-center">
                      🔧 Function Calls ({result.functionCalls.length}개)
                    </h4>
                    
                    <div className="space-y-3">
                      {result.functionCalls.map((call, callIndex) => (
                        <div key={callIndex} className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-blue-800">{call.name}</span>
                            <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">버림로 호출됨</span>
                          </div>
                          <pre className="text-sm text-blue-700 bg-blue-100 p-2 rounded overflow-x-auto">
                            {JSON.stringify(call.args, null, 2)}
                          </pre>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
        
                {/* Function Results 정보 */}
                {result.functionResults && result.functionResults.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-md font-semibold text-gray-800 mb-2 flex items-center">
                      📊 Function Results
                    </h4>
                    
                    <div className="space-y-3">
                      {result.functionResults.map((funcResult, resultIndex) => (
                        <div key={resultIndex} className="bg-green-50 border border-green-200 p-3 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-green-800">{funcResult.name}</span>
                            <span className={`text-xs px-2 py-1 rounded ${
                                                            funcResult.result?.success || funcResult.success 
                                ? 'text-green-600 bg-green-100' 
                                : 'text-red-600 bg-red-100'
                            }`}>
                                                            {(funcResult.result?.success || funcResult.success) ? '성공' : '실패'}
                            </span>
                          </div>
                          
                          {/* 함수 실행 결과 */}
                          <div className="text-sm">
                                                        {(funcResult.result?.success || funcResult.success) ? (
                              <div className="text-green-700">
                                {funcResult.result.data && (
                                  <pre className="bg-green-100 p-2 rounded overflow-x-auto">
                                    {JSON.stringify(funcResult.result.data, null, 2)}
                                  </pre>
                                )}
                              </div>
                            ) : (
                              <div className="text-red-700">
                                <strong>오류:</strong> {funcResult.result.error}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
        
                {/* 최종 응답 */}
                {result.finalResponse && (
                  <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
                    <h4 className="text-md font-semibold text-purple-800 mb-2 flex items-center">
                      🤖 Gemini 최종 응답
                    </h4>
                    <div className="text-gray-700 whitespace-pre-wrap">
                      {result.finalResponse}
                    </div>
                  </div>
                )}
        
                {/* 테스트 요약 */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span className="flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                      Function Calls: {result.functionCalls?.length || 0}개
                    </span>
                    <span className="flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                            성공적 실행: {result.functionResults?.filter(r => r.result?.success || r.success).length || 0}개
                    </span>
                    <span className="flex items-center">
                      <span className={`w-2 h-2 rounded-full mr-2 ${
                        result.error ? 'bg-red-500' : result.finalResponse ? 'bg-purple-500' : 'bg-gray-500'
                      }`}></span>
                      상태: {result.error ? '오류' : result.finalResponse ? '완료' : '미완료'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* 빈 상태 메시지 */}
        {testResults.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">🤖</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">테스트 결과가 없습니다</h3>
            <p className="text-gray-600">위에서 프롬프트를 입력하고 'Function Calling 테스트' 버튼을 눌러주세요.</p>
          </div>
        )}
        
        {/* Function Declarations 정보 */}
        <div className="mt-8 bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">등록된 Function Declarations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg border">
              <h4 className="font-medium text-gray-800 mb-2">get_hexagram_info</h4>
              <p className="text-sm text-gray-600">특정 번호의 괘 기본 정보를 조회</p>
              <div className="text-xs text-gray-500 mt-2">매개변수: number (1-64)</div>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <h4 className="font-medium text-gray-800 mb-2">search_hexagram_by_keyword</h4>
              <p className="text-sm text-gray-600">키워드로 관련 괘를 검색</p>
              <div className="text-xs text-gray-500 mt-2">매개변수: keyword (string), limit (1-10)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

