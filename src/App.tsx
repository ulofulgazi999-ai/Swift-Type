/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Keyboard, 
  RotateCcw, 
  Timer, 
  Trophy, 
  Settings2, 
  ChevronRight,
  BarChart3,
  Languages,
  Info
} from 'lucide-react';
import { cn } from './lib/utils';
import { ENGLISH_TEXTS, ENGLISH_PARAGRAPHS, BENGALI_TEXTS, BENGALI_PARAGRAPHS, Language, TestDuration, TestMode } from './constants';

export default function App() {
  // State
  const [language, setLanguage] = useState<Language>('english');
  const [mode, setMode] = useState<TestMode>('sentence');
  const [duration, setDuration] = useState<TestDuration>(60);
  const [timeLeft, setTimeLeft] = useState<number>(duration);
  const [isActive, setIsActive] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [targetText, setTargetText] = useState('');
  const [userInput, setUserInput] = useState('');
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [mistakes, setMistakes] = useState(0);
  const [totalChars, setTotalChars] = useState(0);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize test
  const initTest = useCallback(() => {
    let texts: string[] = [];
    if (language === 'english') {
      texts = mode === 'sentence' ? ENGLISH_TEXTS : ENGLISH_PARAGRAPHS;
    } else {
      texts = mode === 'sentence' ? BENGALI_TEXTS : BENGALI_PARAGRAPHS;
    }
    
    const randomText = texts[Math.floor(Math.random() * texts.length)];
    setTargetText(randomText);
    setUserInput('');
    setTimeLeft(duration);
    setIsActive(false);
    setIsFinished(false);
    setWpm(0);
    setAccuracy(100);
    setMistakes(0);
    setTotalChars(0);
    if (inputRef.current) inputRef.current.focus();
  }, [language, duration, mode]);

  useEffect(() => {
    initTest();
  }, [initTest]);

  // Timer logic
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      finishTest();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft]);

  const startTest = () => {
    if (!isActive && !isFinished) {
      setIsActive(true);
    }
  };

  const finishTest = () => {
    setIsActive(false);
    setIsFinished(true);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (isFinished) return;

    const val = e.target.value;
    if (!isActive && val.length > 0) {
      startTest();
    }

    // Calculate mistakes and accuracy
    let currentMistakes = 0;
    const inputChars = val.split('');
    const targetChars = targetText.split('');

    inputChars.forEach((char, index) => {
      if (char !== targetChars[index]) {
        currentMistakes++;
      }
    });

    setUserInput(val);
    setMistakes(currentMistakes);
    setTotalChars(val.length);

    // Calculate Accuracy
    if (val.length > 0) {
      const acc = ((val.length - currentMistakes) / val.length) * 100;
      setAccuracy(Math.max(0, Math.round(acc)));
    }

    // Calculate WPM (Words Per Minute)
    // Standard formula: (characters / 5) / (time in minutes)
    const timeElapsed = duration - timeLeft;
    if (timeElapsed > 0) {
      const wordsTyped = val.length / 5;
      const minutesElapsed = timeElapsed / 60;
      setWpm(Math.round(wordsTyped / minutesElapsed));
    }

    // Auto-finish if text is completed
    if (val.length === targetText.length) {
      finishTest();
    }
  };

  const resetTest = () => {
    initTest();
  };

  const renderText = () => {
    const targetChars = targetText.split('');
    const inputChars = userInput.split('');

    return targetChars.map((char, index) => {
      let status = 'pending';
      if (index < inputChars.length) {
        status = inputChars[index] === char ? 'correct' : 'incorrect';
      }

      return (
        <span
          key={index}
          className={cn(
            "relative transition-colors duration-150",
            status === 'correct' && "char-correct",
            status === 'incorrect' && "char-incorrect",
            status === 'pending' && "char-pending",
            index === inputChars.length && isActive && "after:content-[''] after:absolute after:left-0 after:bottom-0 after:w-full after:h-0.5 after:bg-indigo-500 after:animate-pulse"
          )}
        >
          {char}
        </span>
      );
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-bottom border-slate-200 py-4 px-6 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Keyboard className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">SwiftType</h1>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-4 text-sm font-medium text-slate-500">
              <button 
                onClick={() => { setLanguage('english'); initTest(); }}
                className={cn("hover:text-indigo-600 transition-colors", language === 'english' && "text-indigo-600")}
              >
                English
              </button>
              <button 
                onClick={() => { setLanguage('bengali'); initTest(); }}
                className={cn("hover:text-indigo-600 transition-colors", language === 'bengali' && "text-indigo-600")}
              >
                বাংলা
              </button>
            </div>
            <button className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <Settings2 className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12">
        <AnimatePresence mode="wait">
          {!isFinished ? (
            <motion.div
              key="test"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Stats Bar */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard 
                  icon={<Timer className="w-5 h-5" />} 
                  label="Time Left" 
                  value={`${timeLeft}s`} 
                  color="text-amber-600"
                  bgColor="bg-amber-50"
                />
                <StatCard 
                  icon={<BarChart3 className="w-5 h-5" />} 
                  label="WPM" 
                  value={wpm} 
                  color="text-indigo-600"
                  bgColor="bg-indigo-50"
                />
                <StatCard 
                  icon={<Trophy className="w-5 h-5" />} 
                  label="Accuracy" 
                  value={`${accuracy}%`} 
                  color="text-emerald-600"
                  bgColor="bg-emerald-50"
                />
                <StatCard 
                  icon={<Info className="w-5 h-5" />} 
                  label="Mistakes" 
                  value={mistakes} 
                  color="text-rose-600"
                  bgColor="bg-rose-50"
                />
              </div>

              {/* Controls Bar - Mode & Duration */}
              <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">Mode:</span>
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    {(['sentence', 'paragraph'] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => { setMode(m); initTest(); }}
                        className={cn(
                          "px-4 py-1.5 rounded-lg text-sm font-semibold transition-all capitalize",
                          mode === m 
                            ? "bg-white text-indigo-600 shadow-sm" 
                            : "text-slate-500 hover:text-slate-700"
                        )}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">Duration:</span>
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    {([15, 30, 60, 120] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => { setDuration(t); setTimeLeft(t); initTest(); }}
                        className={cn(
                          "px-4 py-1.5 rounded-lg text-sm font-semibold transition-all",
                          duration === t 
                            ? "bg-white text-indigo-600 shadow-sm" 
                            : "text-slate-500 hover:text-slate-700"
                        )}
                      >
                        {t}s
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Typing Area */}
              <div className="relative bg-white rounded-2xl shadow-sm border border-slate-200 p-8 md:p-12 min-h-[300px] flex flex-col">
                <div 
                  className="text-2xl md:text-3xl font-mono leading-relaxed select-none cursor-text"
                  onClick={() => inputRef.current?.focus()}
                >
                  {renderText()}
                </div>

                <textarea
                  ref={inputRef}
                  value={userInput}
                  onChange={handleInputChange}
                  className="absolute inset-0 opacity-0 cursor-default resize-none"
                  autoFocus
                  spellCheck={false}
                />

                {!isActive && userInput.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[2px] rounded-2xl pointer-events-none">
                    <div className="flex flex-col items-center gap-4">
                      <p className="text-slate-500 font-medium">Click here or start typing to begin</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex justify-center gap-4">
                <button
                  onClick={resetTest}
                  className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset Test
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden"
            >
              <div className="bg-indigo-600 p-12 text-center text-white">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <Trophy className="w-16 h-16 mx-auto mb-4 text-indigo-200" />
                  <h2 className="text-3xl font-bold mb-2">Test Completed!</h2>
                  <p className="text-indigo-100">Great job! Here's how you performed.</p>
                </motion.div>
              </div>

              <div className="p-12">
                <div className="grid grid-cols-2 gap-8 mb-12">
                  <div className="text-center">
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Speed</p>
                    <p className="text-5xl font-bold text-slate-900">{wpm} <span className="text-xl font-normal text-slate-400">WPM</span></p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Accuracy</p>
                    <p className="text-5xl font-bold text-slate-900">{accuracy}<span className="text-xl font-normal text-slate-400">%</span></p>
                  </div>
                </div>

                <div className="space-y-4 mb-12">
                  <ResultRow label="Total Characters" value={totalChars} />
                  <ResultRow label="Correct Characters" value={totalChars - mistakes} />
                  <ResultRow label="Incorrect Characters" value={mistakes} />
                  <ResultRow label="Test Duration" value={`${duration}s`} />
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={resetTest}
                    className="flex-1 flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                  >
                    <RotateCcw className="w-5 h-5" />
                    Try Again
                  </button>
                  <button
                    className="flex-1 flex items-center justify-center gap-2 px-8 py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                  >
                    <BarChart3 className="w-5 h-5" />
                    Detailed Stats
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-sm">
            © 2024 SwiftType. Built for speed and accuracy.
          </p>
          <div className="flex items-center gap-6 text-sm font-medium text-slate-400">
            <a href="#" className="hover:text-indigo-600 transition-colors">Privacy</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Terms</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function StatCard({ icon, label, value, color, bgColor }: { 
  icon: React.ReactNode, 
  label: string, 
  value: string | number,
  color: string,
  bgColor: string
}) {
  return (
    <div className={cn("p-4 rounded-2xl border border-transparent transition-all", bgColor)}>
      <div className="flex items-center gap-3 mb-1">
        <div className={color}>{icon}</div>
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span>
      </div>
      <div className={cn("text-2xl font-bold", color)}>{value}</div>
    </div>
  );
}

function ResultRow({ label, value }: { label: string, value: string | number }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-50">
      <span className="text-slate-600 font-medium">{label}</span>
      <span className="text-slate-900 font-bold">{value}</span>
    </div>
  );
}
