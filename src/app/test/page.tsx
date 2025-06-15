export default function TailwindTestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            🎨 Tailwind CSS 테스트 페이지
          </h1>
          <p className="text-lg text-gray-600">
            Tailwind CSS 기본 기능들이 제대로 작동하는지 확인해보세요
          </p>
        </div>

        {/* Color Test */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">🌈 색상 테스트</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-red-500 h-20 rounded-lg shadow-md flex items-center justify-center">
              <span className="text-white font-medium">Red</span>
            </div>
            <div className="bg-blue-500 h-20 rounded-lg shadow-md flex items-center justify-center">
              <span className="text-white font-medium">Blue</span>
            </div>
            <div className="bg-green-500 h-20 rounded-lg shadow-md flex items-center justify-center">
              <span className="text-white font-medium">Green</span>
            </div>
            <div className="bg-purple-500 h-20 rounded-lg shadow-md flex items-center justify-center">
              <span className="text-white font-medium">Purple</span>
            </div>
          </div>
        </section>
        
        {/* Button Test */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">🔘 버튼 테스트</h2>
          <div className="flex flex-wrap gap-4">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200">
              Primary Button
            </button>
            <button className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg font-medium transition-colors duration-200">
              Secondary Button
            </button>
            <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200">
              Success Button
            </button>
            <button className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200">
              Danger Button
            </button>
          </div>
        </section>
        
        {/* Card Test */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">🃏 카드 테스트</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
              <div className="w-12 h-12 bg-blue-500 rounded-lg mb-4 flex items-center justify-center">
                <span className="text-white font-bold text-xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">기본 카드</h3>
              <p className="text-gray-600">그림자와 호버 효과가 적용된 기본 카드입니다.</p>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-lg p-6 text-white hover:shadow-xl transition-shadow duration-300">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg mb-4 flex items-center justify-center">
                <span className="text-white font-bold text-xl">✨</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">그래디언트 카드</h3>
              <p className="text-white text-opacity-90">아름다운 그래디언트 배경을 가진 카드입니다.</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-green-200 hover:border-green-400 transition-colors duration-300">
              <div className="w-12 h-12 bg-green-500 rounded-lg mb-4 flex items-center justify-center">
                <span className="text-white font-bold text-xl">✓</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">보더 카드</h3>
              <p className="text-gray-600">보더와 호버 효과가 있는 카드입니다.</p>
            </div>
          </div>
        </section>
        
        {/* Typography & Spacing Test */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">🔤 타이포그래피 & 간격 테스트</h2>
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Heading 1 - 4xl</h1>
            <h2 className="text-3xl font-semibold text-gray-800 mb-4">Heading 2 - 3xl</h2>
            <h3 className="text-2xl font-medium text-gray-700 mb-4">Heading 3 - 2xl</h3>
            <p className="text-lg text-gray-600 mb-4 leading-relaxed">
              이것은 대사이즈 텍스트입니다. Tailwind CSS는 유틸리티 기반의 CSS 프레임워크로, 
              매우 빠르고 효율적인 스타일링을 가능하게 합니다.
            </p>
            <p className="text-base text-gray-600 mb-4">
              이것은 기본 크기의 텍스트입니다. 다양한 크기와 두께를 테스트할 수 있습니다.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              이것은 작은 크기의 텍스트입니다.
            </p>
            
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">Tag 1</span>
              <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">Tag 2</span>
              <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">Tag 3</span>
            </div>
          </div>
        </section>
        
        {/* Status Report */}
        <div className="text-center bg-green-50 border border-green-200 rounded-xl p-6">
          <div className="text-green-600 text-4xl mb-4">✅</div>
          <h3 className="text-xl font-semibold text-green-800 mb-2">테스트 완료!</h3>
          <p className="text-green-700">
            Tailwind CSS가 정상적으로 작동하고 있습니다. 
            색상, 버튼, 카드, 타이포그래피 모든 기능이 제대로 렌더링되고 있습니다.
          </p>
        </div>
        </div>
        </div>
        )
        }
