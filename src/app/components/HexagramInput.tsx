import React from 'react';

interface HexagramInputProps {
  userSituation: string;
  setUserSituation: (val: string) => void;
  onGenerate: () => void;
  loading: boolean;
}

const HexagramInput: React.FC<HexagramInputProps> = ({ userSituation, setUserSituation, onGenerate, loading }) => (
  <div className="bg-white/10 backdrop-blur-md rounded-3xl p-10 mb-10 shadow-2xl border border-white/20">
    <h2 className="text-2xl mb-5 text-center text-cyan-200">
      당신이 고민하는 상황을 알려주세요
    </h2>    <textarea
      className="w-full h-32 bg-white/10 border-2 border-white/20 rounded-2xl p-5 text-white text-lg resize-none font-inherit mb-5 placeholder-white/60"
      placeholder="예: 새로운 사업을 시작할지 말지 고민하고 있습니다. 안정적인 직장을 그만두고 창업을 해야 할까요?"
      value={userSituation}
      onChange={(e) => setUserSituation(e.target.value)}
      aria-label="고민하는 상황을 입력하세요"
    />
    <button
      className={`w-full py-5 bg-gradient-to-r from-indigo-500 to-purple-600 border-none rounded-full text-white text-xl font-medium cursor-pointer transition-all duration-300 shadow-lg hover:transform hover:-translate-y-1 hover:shadow-xl disabled:opacity-50 ${loading ? 'loading' : ''}`}
      onClick={onGenerate}
      disabled={loading}
      aria-label="관점 생성하기"
    >
      {loading ? '관점을 생성하고 있습니다...' : '관점 생성하기'}
    </button>
  </div>
);

export default HexagramInput;
