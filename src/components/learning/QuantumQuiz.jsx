import React, { useState, useEffect } from 'react';
import { QUANTUM_QUESTIONS } from '../../data/quantumQuestions';
import { ProgressService } from '../../services/ProgressService';
import { CheckCircle2, HelpCircle, Zap, Trophy, XCircle, ArrowRight, RotateCcw, BookOpen } from 'lucide-react';

export default function QuantumQuiz() {
  const [difficulty, setDifficulty] = useState(null); // 'Beginner', 'Intermediate', 'Advanced'
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  // Initialize a quiz session
  const startQuiz = (level) => {
    const pool = QUANTUM_QUESTIONS.filter(q => q.difficulty === level);
    // Shuffle and pick 10
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 10);
    
    setDifficulty(level);
    setQuestions(selected);
    setCurrentIdx(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setXpEarned(0);
    setQuizFinished(false);
  };

  const handleAnswer = (idx) => {
    if (isAnswered) return;
    setSelectedOption(idx);
    setIsAnswered(true);

    const currentQ = questions[currentIdx];
    const isCorrect = idx === currentQ.correctAnswer;

    if (isCorrect) {
      setScore(s => s + 1);
      const xp = currentQ.xp || 50;
      setXpEarned(x => x + xp);
      ProgressService.addXP(xp);
    }
    
    ProgressService.recordAnswer(isCorrect, currentQ.conceptId || 'quantum_basics', currentQ);
  };

  const nextQuestion = () => {
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx(currentIdx + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setQuizFinished(true);
    }
  };

  if (!difficulty) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-[#030511] overflow-y-auto">
        <div className="max-w-2xl w-full space-y-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-cyan-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-cyan-500/20 shadow-[0_0_30px_rgba(0,242,254,0.15)]">
              <Trophy className="w-8 h-8 text-cyan-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white font-['Space_Grotesk'] tracking-tight">
              Quantum Mastery Quizzes
            </h1>
            <p className="text-gray-400 text-lg max-w-xl mx-auto leading-relaxed">
              Test your knowledge, reinforce theoretical concepts, and earn valuable XP. Select a difficulty level to begin your 10-question challenge.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12">
            {[
              { id: 'Beginner', title: 'Beginner', desc: 'Foundations & Qubits', color: 'emerald' },
              { id: 'Intermediate', title: 'Intermediate', desc: 'Gates & Entanglement', color: 'cyan' },
              { id: 'Advanced', title: 'Advanced', desc: 'Algorithms & Protocols', color: 'purple' }
            ].map(level => (
              <button
                key={level.id}
                onClick={() => startQuiz(level.id)}
                className={`group relative p-6 rounded-3xl bg-[#0a0718] border border-${level.color}-500/20 hover:border-${level.color}-500/50 transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-${level.color}-500/20 text-left overflow-hidden flex flex-col`}
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-${level.color}-500/10 blur-[50px] rounded-full pointer-events-none group-hover:bg-${level.color}-500/20 transition-all`} />
                <h3 className={`text-2xl font-bold text-white font-['Space_Grotesk'] mb-2 group-hover:text-${level.color}-400 transition-colors relative z-10`}>
                  {level.title}
                </h3>
                <p className="text-sm text-gray-400 relative z-10">
                  {level.desc}
                </p>
                <div className="mt-8 flex items-center justify-between relative z-10">
                  <span className="text-xs font-mono text-gray-500">10 Questions</span>
                  <ArrowRight className={`w-5 h-5 text-${level.color}-500/50 group-hover:text-${level.color}-400 transition-colors group-hover:translate-x-1`} />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (quizFinished) {
    const percentage = Math.round((score / questions.length) * 100);
    let message = "Keep studying!";
    if (percentage >= 80) message = "Excellent work!";
    else if (percentage >= 50) message = "Good job!";

    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-[#030511]">
        <div className="max-w-md w-full p-8 rounded-3xl bg-[#0a0718] border border-cyan-500/30 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 pointer-events-none" />
          
          <div className="w-24 h-24 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(0,242,254,0.3)]">
            <Trophy className="w-12 h-12 text-black" />
          </div>
          
          <h2 className="text-3xl font-black text-white font-['Space_Grotesk'] mb-2">
            Quiz Complete!
          </h2>
          <p className="text-cyan-400 font-mono text-lg mb-6">{message}</p>
          
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-sm text-gray-400 mb-1">Score</div>
              <div className="text-2xl font-bold text-white">{score} <span className="text-gray-500 text-base">/ {questions.length}</span></div>
            </div>
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
              <div className="text-sm text-amber-400/70 mb-1">XP Earned</div>
              <div className="text-2xl font-bold text-amber-400 flex items-center justify-center gap-1">
                <Zap className="w-5 h-5" />
                +{xpEarned}
              </div>
            </div>
          </div>
          
          <button
            onClick={() => setDifficulty(null)}
            className="w-full py-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition-all border border-white/10 flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Back to Quiz Menu
          </button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) return null;

  const currentQ = questions[currentIdx];

  return (
    <div className="w-full h-full flex flex-col p-4 sm:p-8 bg-[#030511] overflow-y-auto">
      <div className="max-w-3xl w-full mx-auto flex-1 flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setDifficulty(null)}
              className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-white font-['Space_Grotesk']">
                {difficulty} Quiz
              </h2>
              <p className="text-xs text-gray-400 font-mono">
                Question {currentIdx + 1} of {questions.length}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono text-sm">
            <Zap className="w-4 h-4" />
            <span>{score * (currentQ.xp || 50)} XP</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-white/5 rounded-full mb-8 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-500 ease-out"
            style={{ width: `${((currentIdx) / questions.length) * 100}%` }}
          />
        </div>

        {/* Question Area */}
        <div className="flex-1">
          <div className="mb-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/5 text-gray-400 text-xs font-mono uppercase tracking-wider">
            <BookOpen className="w-3.5 h-3.5" />
            {currentQ.conceptName}
          </div>
          
          <h3 className="text-2xl sm:text-3xl font-bold text-white mb-8 leading-relaxed font-['Space_Grotesk']">
            {currentQ.question}
          </h3>

          <div className="space-y-3">
            {currentQ.options.map((opt, idx) => {
              let btnClass = "border-white/10 bg-white/[0.02] text-gray-200 hover:bg-white/[0.06] hover:border-white/20";
              let icon = null;

              if (isAnswered) {
                if (idx === currentQ.correctAnswer) {
                  btnClass = "border-emerald-500/50 bg-emerald-500/20 text-emerald-100 shadow-[0_0_15px_rgba(16,185,129,0.15)]";
                  icon = <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
                } else if (selectedOption === idx) {
                  btnClass = "border-rose-500/50 bg-rose-500/20 text-rose-100";
                  icon = <XCircle className="w-5 h-5 text-rose-400" />;
                } else {
                  btnClass = "border-white/5 text-gray-500 opacity-50";
                }
              }

              return (
                <button
                  key={idx}
                  disabled={isAnswered}
                  onClick={() => handleAnswer(idx)}
                  className={`w-full p-4 sm:p-5 rounded-2xl border text-left text-sm sm:text-base font-medium transition-all duration-200 flex items-center justify-between ${btnClass}`}
                >
                  <span className="flex items-start gap-4">
                    <span className="font-mono text-gray-500 mt-0.5">{String.fromCharCode(65 + idx)}.</span>
                    <span>{opt}</span>
                  </span>
                  {icon}
                </button>
              );
            })}
          </div>

          {/* Explanation Area */}
          {isAnswered && (
            <div className="mt-8 p-6 rounded-2xl bg-cyan-900/20 border border-cyan-500/30 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-start gap-3">
                <HelpCircle className="w-6 h-6 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-cyan-300 mb-1 font-['Space_Grotesk']">Explanation</h4>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {currentQ.explanation}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-8 pt-6 border-t border-white/10 flex justify-end">
          {isAnswered && (
            <button
              onClick={nextQuestion}
              className="py-3 px-8 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-bold flex items-center gap-2 hover:shadow-[0_0_20px_rgba(0,242,254,0.4)] transition-all animate-in zoom-in duration-300"
            >
              <span>{currentIdx + 1 === questions.length ? 'Finish Quiz' : 'Next Question'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
