import React from 'react';
import LearningHub from './LearningHub';
import QuantumRush from '../game/QuantumRush';
import QuantumAlgorithms from '../algorithms/QuantumAlgorithms';
import Learning3D from '../threeD/Learning3D';
import ELibrary from '../library/ELibrary';
import QumiWorkspace from '../ai/QumiWorkspace';
import QuantumQuiz from './QuantumQuiz';

export default function LearningWorkspace({
  activeTool,
  setActiveTool,
  setActiveWorkspace,
  setSimulationTool,
  onNavigateTo3D
}) {
  const handlePlayConceptInRush = () => {
    setActiveTool('rush');
  };

  const handleExploreInLab = (conceptId) => {
    setSimulationTool('circuit', conceptId, null);
    setActiveWorkspace('simulation');
  };

  const handleStartChallenge = (challenge) => {
    setSimulationTool('circuit', null, challenge);
    setActiveWorkspace('simulation');
  };

  return (
    <div className="flex-1 flex flex-col w-full h-full bg-[#030511] overflow-hidden min-h-0">
      {activeTool === 'learn' && (
        <LearningHub
          onPlayConcept={handlePlayConceptInRush}
          onExploreInLab={handleExploreInLab}
          onStartChallenge={handleStartChallenge}
        />
      )}

      {activeTool === 'quizzes' && (
        <div className="w-full h-full">
          <QuantumQuiz />
        </div>
      )}

      {activeTool === 'rush' && (
        <div className="w-full h-full">
          <QuantumRush
            onExploreInLab={handleExploreInLab}
            onNavigateLearn={() => setActiveTool('learn')}
          />
        </div>
      )}

      {activeTool === 'algorithms' && (
        <QuantumAlgorithms
          onOpenInLab={handleExploreInLab}
        />
      )}

      {activeTool === '3d' && (
        <Learning3D
          onNavigateBack={() => setActiveTool('learn')}
          onOpenInLab={handleExploreInLab}
        />
      )}

      {activeTool === 'library' && (
        <ELibrary 
          onExploreInLab={handleExploreInLab}
          onAskQumi={() => setActiveTool('qumi')}
        />
      )}

      {activeTool === 'qumi' && (
        <div className="w-full h-full p-6">
          <QumiWorkspace 
            mode="tutor" 
            onCircuitAction={handleExploreInLab}
            onNavigate={onNavigateTo3D}
          />
        </div>
      )}
    </div>
  );
}
