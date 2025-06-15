import React from 'react';

interface AnalysisTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const tabContents = {
  ancient: (
    <div>
      <h3 className="text-xl mb-4">📜 고대의 지혜</h3>
      <p><strong>하늘에 구름이 가득한 모습</strong></p>
      <p className="mt-3">'수천수'의 이미지는 하늘(乾) 위에 물(坎), 즉 구름이 가득 찬 모습입니다. 비(생명수, 결과)가 내릴 잠재력은 충분하지만 아직은 때가 아닙니다.</p>
      <p className="mt-3">이 괘의 핵심 지혜는, 강력한 힘(乾)을 가졌음에도 불구하고 눈앞의 위험(坎)을 보고 맹목적으로 돌진하지 않고, 때를 기다리는 것입니다.</p>
    </div>
  ),
  physics: (
    <div>
      <h3 className="text-xl mb-4">⚛️ 물리학: 포텐셜 에너지</h3>
      <p>시스템이 에너지를 방출하기 직전, 내부에 최대한으로 축적하고 있는 상태입니다. 댐에 가득 찬 물, 압축된 스프링처럼 강력한 잠재력을 가지고 있지만, 방출의 조건을 기다리고 있습니다.</p>
      <p className="mt-3"><strong>기다림은 잠재력을 극대화하는 과정입니다.</strong></p>
    </div>
  ),
  biology: (
    <div>
      <h3 className="text-xl mb-4">🌱 생물학: 휴면기</h3>
      <p>씨앗이 싹을 틔우기 전 땅속에서, 또는 동물이 겨울잠을 자며 봄을 기다리는 상태입니다. 외부 환경이 생존에 불리할 때, 성급하게 활동을 시작하는 대신 내부의 생명력을 보존하며 최적의 시기를 기다립니다.</p>
      <p className="mt-3"><strong>기다림은 생존을 위한 최고의 전략입니다.</strong></p>
    </div>
  ),
  business: (
    <div>
      <h3 className="text-xl mb-4">💼 경영학: 워런 버핏의 인내</h3>
      <p>"좋은 공이 올 때까지 기다리는 것이 투자의 핵심"이라고 말했습니다. 자본금이라는 힘을 가졌더라도, 시장의 불확실성 앞에서 섣불리 투자하지 않습니다.</p>
      <p className="mt-3"><strong>기다림은 리스크를 관리하는 기술입니다.</strong></p>
    </div>
  ),
  psychology: (
    <div>
      <h3 className="text-xl mb-4">🧠 심리학: 만족 지연</h3>
      <p>'마시멜로 테스트'에서 눈앞의 마시멜로를 즉시 먹지 않고 더 큰 보상을 위해 기다리는 아이의 모습과 같습니다. 단기적 유혹이나 어려움 앞에서 자신의 목표를 위해 충동을 제어하고 인내하는 능력입니다.</p>
      <p className="mt-3"><strong>기다림은 더 큰 성취를 위한 자기 통제력입니다.</strong></p>
    </div>
  ),
  military: (
    <div>
      <h3 className="text-xl mb-4">⚔️ 군사학: 매복 전술</h3>
      <p>아군의 전력이 충분하더라도, 적의 이동 경로라는 험지 앞에서 섣불리 공격하지 않고, 적이 가장 취약해지는 결정적인 순간을 위해 은폐·엄폐하며 기다리는 것입니다.</p>
      <p className="mt-3"><strong>기다림은 승리의 확률을 높이는 전술입니다.</strong></p>
    </div>
  ),
};

const AnalysisTabs: React.FC<AnalysisTabsProps> = ({ activeTab, setActiveTab }) => (
  <>
    <div className="flex justify-center my-8 flex-wrap gap-3">
      {[
        { id: 'ancient', label: '고대의 지혜' },
        { id: 'physics', label: '물리학' },
        { id: 'biology', label: '생물학' },
        { id: 'business', label: '경영학' },
        { id: 'psychology', label: '심리학' },
        { id: 'military', label: '군사학' }
      ].map((tab) => (        <div
          key={tab.id}
          className={`py-3 px-5 border border-white/20 rounded-full cursor-pointer transition-all duration-300 text-sm ${
            activeTab === tab.id 
              ? 'bg-gradient-to-r from-indigo-500 to-purple-600 border-transparent' 
              : 'bg-white/10'
          }`}
          onClick={() => setActiveTab(tab.id)}
          tabIndex={0}
          aria-label={`${tab.label} 탭`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setActiveTab(tab.id);
            }
          }}
        >
          {tab.label}
        </div>
      ))}
    </div>    <div className="bg-black/20 rounded-2xl p-6 my-5 fade-in">
      {tabContents[activeTab as keyof typeof tabContents]}
    </div>
  </>
);

export default AnalysisTabs;
