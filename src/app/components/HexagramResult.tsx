import React from 'react';

interface HexagramResultProps {
  analysisResult: any;
}

const HexagramResult: React.FC<HexagramResultProps> = ({ analysisResult }) => (
  <div className="bg-white/10 backdrop-blur-md rounded-3xl p-10 shadow-2xl border border-white/20">
    <div className="text-center mb-8">
      <span className="text-7xl mb-3 block">
        {analysisResult.selectedHexagram.symbol}
      </span>
      <div className="text-3xl text-cyan-200 mb-3">
        {analysisResult.selectedHexagram.name}
      </div>
      <div className="text-xl opacity-90 italic">
        "{analysisResult.selectedHexagram.coreViewpoint}"
      </div>
    </div>
    <div className="text-center italic opacity-70 my-8 text-lg leading-relaxed">
      "{analysisResult.analysis.summary}"<br />
      {analysisResult.analysis.keywords && (
        <div className="mt-3 text-sm opacity-60">
          <strong>키워드:</strong> {analysisResult.analysis.keywords.join(', ')}
        </div>
      )}
    </div>
  </div>
);

export default HexagramResult;
