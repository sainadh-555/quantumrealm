import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/layout/Sidebar';
import SimulationWorkspace from './components/simulation/SimulationWorkspace';
import LearningWorkspace from './components/learning/LearningWorkspace';
import StudentDashboard from './components/dashboard/StudentDashboard';
import InstructorDashboard from './components/dashboard/InstructorDashboard';
import LandingPage from './components/home/LandingPage';

export default function App() {
  // Global Application State
  const [activeWorkspace, setActiveWorkspace] = useState('home'); // 'home' | 'simulation' | 'learning'
  const [simulationTool, setSimulationTool] = useState('circuit'); 
  const [learningTool, setLearningTool] = useState('learn');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);

  // Cross-workspace context (e.g., from game to simulation)
  const [injectedLabConcept, setInjectedLabConcept] = useState(null);
  const [activeChallenge, setActiveChallenge] = useState(null);

  // KEEP-ALIVE PING for Render Free Tier Backend
  React.useEffect(() => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://quantumrealm.onrender.com';
    const pingBackend = async () => {
      try {
        await fetch(`${backendUrl}/health`);
      } catch (e) {
        // Silently ignore ping errors
      }
    };
    
    // Initial ping to wake it up on load
    pingBackend();
    
    // Ping every 5 minutes (300,000 ms) to keep it awake while the app is open
    const interval = setInterval(pingBackend, 300000);
    return () => clearInterval(interval);
  }, []);

  // Helper to jump to a simulation tool with a specific concept
  const handleJumpToSimulation = (tool, concept, challenge = null) => {
    if (concept) setInjectedLabConcept(concept);
    if (challenge) setActiveChallenge(challenge);
    setSimulationTool(tool);
    setActiveWorkspace('simulation');
  };

  // 1. Home / Landing Page
  if (activeWorkspace === 'home') {
    return (
      <LandingPage onSelectWorkspace={setActiveWorkspace} />
    );
  }

  // 2. Main Workspaces (Simulation / Learning)
  return (
    <div className="h-screen bg-[#030511] text-gray-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black overflow-hidden">
      
      {/* Top Header Navigation */}
      <Navbar
        activeWorkspace={activeWorkspace}
        setActiveWorkspace={setActiveWorkspace}
        onOpenDashboard={() => setIsDashboardOpen(true)}
      />

      {/* Main Desktop Area */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        
        {/* Context-Aware Sidebar */}
        {activeWorkspace !== 'simulation' && (
          <Sidebar
            activeWorkspace={activeWorkspace}
            activeTool={activeWorkspace === 'simulation' ? simulationTool : learningTool}
            setActiveTool={activeWorkspace === 'simulation' ? setSimulationTool : setLearningTool}
            isCollapsed={isSidebarCollapsed}
            setIsCollapsed={setIsSidebarCollapsed}
          />
        )}

        {/* Primary Workspace View */}
        <main className="flex-1 relative overflow-hidden min-h-0 flex flex-col">
          {activeWorkspace === 'simulation' && (
            <SimulationWorkspace
              activeTool={simulationTool}
              setActiveTool={setSimulationTool}
              initialConcept={injectedLabConcept}
              activeChallenge={activeChallenge}
              onCircuitUpdate={() => {}}
              onNavigateTo3D={() => { setActiveWorkspace('learning'); setLearningTool('3d'); }}
            />
          )}

          {activeWorkspace === 'learning' && (
            <LearningWorkspace
              activeTool={learningTool}
              setActiveTool={setLearningTool}
              setActiveWorkspace={setActiveWorkspace}
              setSimulationTool={handleJumpToSimulation}
              onNavigateTo3D={() => { setActiveWorkspace('learning'); setLearningTool('3d'); }}
            />
          )}

          {activeWorkspace === 'instructor' && (
            <InstructorDashboard />
          )}
        </main>
      </div>

      {/* Overlays */}
      <StudentDashboard
        isOpen={isDashboardOpen}
        onClose={() => setIsDashboardOpen(false)}
        onJumpToLab={(concept) => {
          setIsDashboardOpen(false);
          handleJumpToSimulation('circuit', concept);
        }}
      />

    </div>
  );
}
