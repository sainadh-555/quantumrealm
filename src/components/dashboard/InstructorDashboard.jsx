import React, { useState, useEffect } from 'react';
import { Users, BookOpen, Target, Activity, ArrowUpRight, Filter, AlertTriangle } from 'lucide-react';
import { ProgressService } from '../../services/ProgressService';

export default function InstructorDashboard() {
  const [stats, setStats] = useState(ProgressService.getState());

  useEffect(() => {
    const unsubscribe = ProgressService.subscribe(setStats);
    return () => unsubscribe();
  }, []);

  // Mock class data combining real local user data with simulated students
  const classData = {
    totalStudents: 42,
    activeThisWeek: 38,
    averageScore: 82,
    completedModules: 145,
    weakestConcept: stats.lastRecommendedConcept || 'Entanglement',
    students: [
      { id: '1', name: 'You (Local)', level: stats.level, xp: stats.xp, weak: stats.lastRecommendedConcept },
      { id: '2', name: 'Alex M.', level: 3, xp: 850, weak: 'Phase Gates' },
      { id: '3', name: 'Sarah J.', level: 5, xp: 2100, weak: 'Shor Algorithm' },
      { id: '4', name: 'Michael T.', level: 2, xp: 450, weak: 'Superposition' },
      { id: '5', name: 'Emma W.', level: 4, xp: 1600, weak: 'Bell States' }
    ]
  };

  return (
    <div className="flex-1 w-full h-full bg-[#030511] text-gray-100 overflow-y-auto p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-6">
          <div>
            <h1 className="text-3xl font-black text-white font-['Space_Grotesk'] tracking-tight">
              Instructor Dashboard
            </h1>
            <p className="text-gray-400 mt-2 font-mono text-sm">
              Quantum Realm Class Analytics & Performance Tracking
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 text-sm font-mono transition-colors">
            <Filter className="w-4 h-4" /> Export Report
          </button>
        </div>

        {/* Top KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Students', value: classData.totalStudents, icon: Users, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
            { label: 'Avg Assessment Score', value: `${classData.averageScore}%`, icon: Target, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { label: 'Modules Completed', value: classData.completedModules, icon: BookOpen, color: 'text-purple-400', bg: 'bg-purple-500/10' },
            { label: 'Class Weak Point', value: classData.weakestConcept, icon: AlertTriangle, color: 'text-rose-400', bg: 'bg-rose-500/10' }
          ].map((kpi, idx) => (
            <div key={idx} className="p-6 rounded-2xl bg-[#0a0718] border border-white/5 flex flex-col gap-4 shadow-xl">
              <div className="flex justify-between items-start">
                <div className={`p-3 rounded-xl ${kpi.bg}`}>
                  <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white mb-1">{kpi.value}</div>
                <div className="text-xs text-gray-500 font-mono uppercase tracking-wider">{kpi.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Roster / Student List */}
          <div className="lg:col-span-2 rounded-3xl bg-[#0a0718] border border-white/10 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <h3 className="font-bold font-['Space_Grotesk'] text-gray-200">Student Roster</h3>
              <button className="text-xs text-cyan-400 hover:text-cyan-300 font-mono">View All</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 text-gray-400 font-mono text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3 font-medium">Student Name</th>
                    <th className="px-6 py-3 font-medium">Level</th>
                    <th className="px-6 py-3 font-medium">XP</th>
                    <th className="px-6 py-3 font-medium">Struggling With</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {classData.students.map(student => (
                    <tr key={student.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 font-semibold text-gray-200">{student.name}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded bg-cyan-500/10 text-cyan-300 text-xs font-mono border border-cyan-500/20">
                          Lv. {student.level}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-amber-400">{student.xp}</td>
                      <td className="px-6 py-4">
                        <span className="text-rose-400 text-xs flex items-center gap-1.5">
                          <AlertTriangle className="w-3 h-3" />
                          {student.weak}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Actionable Insights */}
          <div className="rounded-3xl bg-[#0a0718] border border-purple-500/20 p-6 flex flex-col shadow-[0_0_30px_rgba(168,85,247,0.05)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-[50px] rounded-full pointer-events-none" />
            <h3 className="font-bold font-['Space_Grotesk'] text-purple-300 mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5" /> Recommended Actions
            </h3>
            
            <div className="space-y-4 flex-1">
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-purple-500/30 transition-colors cursor-pointer group">
                <h4 className="text-sm font-bold text-gray-200 group-hover:text-purple-300 transition-colors">Assign Bell States Module</h4>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">4 students are failing the entanglement quiz. Push a refresher module.</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-purple-500/30 transition-colors cursor-pointer group">
                <h4 className="text-sm font-bold text-gray-200 group-hover:text-purple-300 transition-colors">Review Qumi Logs</h4>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">Multiple students asked Qumi "What is a phase kickback?" today.</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-purple-500/30 transition-colors cursor-pointer group">
                <h4 className="text-sm font-bold text-gray-200 group-hover:text-purple-300 transition-colors">Host Custom Coding Challenge</h4>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">Class average is high enough to introduce Grover's search challenge.</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
