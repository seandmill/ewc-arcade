/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useCallback, useEffect } from 'react';
import { useArcade } from '../../context/ArcadeContext';
import { useSound } from '../../hooks/useSound';

// Types
interface MathProblem {
  operandA: number;
  operandB: number;
  operator: '+' | '-' | '×';
  correctAnswer: number;
  choices: number[];
}

type GamePhase = 'companion-select' | 'level-intro' | 'playing' | 'correct' | 'wrong' | 'level-complete';

// Companion mascots - kids can pick their helper!
const COMPANIONS = [
  { id: 'panda', name: 'Penny Panda', image: '/assets/characters/panda.png', encouragement: 'You can do it!' },
  { id: 'penguin', name: 'Pete Penguin', image: '/assets/characters/penguin.png', encouragement: 'Let\'s solve it together!' },
  { id: 'rabbit', name: 'Ruby Rabbit', image: '/assets/characters/rabbit.png', encouragement: 'I believe in you!' },
  { id: 'monkey', name: 'Max Monkey', image: '/assets/characters/monkey.png', encouragement: 'Math is fun!' },
  { id: 'parrot', name: 'Polly Parrot', image: '/assets/characters/parrot.png', encouragement: 'Great thinking!' },
  { id: 'elephant', name: 'Ellie Elephant', image: '/assets/characters/elephant.png', encouragement: 'You\'re so smart!' },
];

// Story prompts for JumpStart-style level intros
const LEVEL_STORIES = [
  { theme: 'village', text: "The village needs supplies! Count the apples to help.", emoji: '🍎' },
  { theme: 'bridge', text: "A bridge is broken! Add the planks to fix it.", emoji: '🌉' },
  { theme: 'bakery', text: "The baker needs help counting cookies!", emoji: '🍪' },
  { theme: 'stars', text: "How many stars are in the sky tonight?", emoji: '⭐' },
  { theme: 'farm', text: "The farmer's sheep escaped! Count them all.", emoji: '🐑' },
  { theme: 'pirate', text: "Pirates found treasure! How many gold coins?", emoji: '💰' },
  { theme: 'space', text: "Help the astronaut count the planets!", emoji: '🚀' },
  { theme: 'wizard', text: "The wizard needs ingredients for a potion!", emoji: '🧙' },
  { theme: 'dragon', text: "Dragons collected gems - count the total!", emoji: '🐉' },
  { theme: 'robot', text: "The robot is learning math - teach it!", emoji: '🤖' },
];

// Button colors for answer choices
const BUTTON_COLORS = [
  { bg: 'from-blue-500 to-blue-600', hover: 'hover:from-blue-400 hover:to-blue-500', image: '/assets/ui/buttons/button_blue_rect.png' },
  { bg: 'from-yellow-500 to-yellow-600', hover: 'hover:from-yellow-400 hover:to-yellow-500', image: '/assets/ui/buttons/button_yellow_rect.png' },
  { bg: 'from-green-500 to-green-600', hover: 'hover:from-green-400 hover:to-green-500', image: '/assets/ui/buttons/button_green_rect.png' },
  { bg: 'from-purple-500 to-purple-600', hover: 'hover:from-purple-400 hover:to-purple-500', image: '/assets/ui/buttons/buttonSquare_blue.png' },
];

// Generate plausible wrong answers
function generateWrongAnswers(correct: number, count: number): number[] {
  const wrong: Set<number> = new Set();
  const candidates = [
    correct + 1, correct - 1, correct + 2, correct - 2,
    correct + 10, correct - 10, Math.abs(correct - 5),
  ].filter(n => n > 0 && n !== correct);

  for (const c of candidates) {
    if (wrong.size < count) wrong.add(c);
  }

  while (wrong.size < count) {
    const offset = Math.floor(Math.random() * 10) - 5;
    if (offset !== 0) wrong.add(Math.max(1, correct + offset));
  }

  return Array.from(wrong).slice(0, count);
}

// Generate a math problem based on level
function generateProblem(level: number): MathProblem {
  let operandA: number, operandB: number, operator: '+' | '-' | '×', correctAnswer: number;

  if (level <= 10) {
    // Addition: easy
    operandA = Math.floor(Math.random() * 9) + 1;
    operandB = Math.floor(Math.random() * 9) + 1;
    operator = '+';
    correctAnswer = operandA + operandB;
  } else if (level <= 20) {
    // Subtraction
    operandA = Math.floor(Math.random() * 15) + 5;
    operandB = Math.floor(Math.random() * Math.min(operandA - 1, 9)) + 1;
    operator = '-';
    correctAnswer = operandA - operandB;
  } else if (level <= 30) {
    // Mixed addition/subtraction
    if (Math.random() < 0.5) {
      operandA = Math.floor(Math.random() * 20) + 10;
      operandB = Math.floor(Math.random() * 9) + 1;
      operator = '+';
      correctAnswer = operandA + operandB;
    } else {
      operandA = Math.floor(Math.random() * 20) + 10;
      operandB = Math.floor(Math.random() * Math.min(operandA - 1, 9)) + 1;
      operator = '-';
      correctAnswer = operandA - operandB;
    }
  } else {
    // Multiplication (simple)
    operandA = Math.floor(Math.random() * 5) + 2;
    operandB = Math.floor(Math.random() * 5) + 2;
    operator = '×';
    correctAnswer = operandA * operandB;
  }

  const wrongAnswers = generateWrongAnswers(correctAnswer, 3);
  const choices = [correctAnswer, ...wrongAnswers].sort(() => Math.random() - 0.5);

  return { operandA, operandB, operator, correctAnswer, choices };
}

// Companion speech bubble component
const CompanionBubble: React.FC<{ companion: typeof COMPANIONS[0]; message: string; emote?: string }> = ({ companion, message, emote }) => (
  <div className="flex items-end gap-3 mb-4">
    <div className="relative">
      <img
        src={companion.image}
        alt={companion.name}
        className="w-20 h-20 object-contain drop-shadow-lg animate-bounce"
        style={{ animationDuration: '2s' }}
      />
      {emote && (
        <img
          src={emote}
          alt="emote"
          className="absolute -top-2 -right-2 w-8 h-8 animate-ping"
          style={{ animationDuration: '1s', animationIterationCount: 2 }}
        />
      )}
    </div>
    <div className="relative bg-white rounded-2xl rounded-bl-none px-4 py-2 shadow-lg max-w-xs">
      <p className="text-gray-800 font-medium text-sm">{message}</p>
      <div className="absolute bottom-0 left-0 transform -translate-x-1 translate-y-1">
        <div className="w-3 h-3 bg-white transform rotate-45" />
      </div>
    </div>
  </div>
);

// Styled game button using Kenney-inspired design
const GameButton: React.FC<{
  onClick: () => void;
  disabled?: boolean;
  colorIndex: number;
  isCorrect?: boolean;
  isWrong?: boolean;
  children: React.ReactNode;
}> = ({ onClick, disabled, colorIndex, isCorrect, isWrong, children }) => {
  const color = BUTTON_COLORS[colorIndex % BUTTON_COLORS.length];

  let bgClass = `bg-gradient-to-b ${color.bg} ${color.hover}`;
  if (isCorrect) bgClass = 'bg-gradient-to-b from-green-400 to-green-600';
  if (isWrong) bgClass = 'bg-gradient-to-b from-red-400 to-red-600';
  if (disabled && !isCorrect && !isWrong) bgClass = 'bg-gradient-to-b from-gray-400 to-gray-500';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative py-6 px-4 text-4xl font-black text-white rounded-2xl
        shadow-[0_6px_0_rgba(0,0,0,0.3)]
        transform transition-all duration-150
        ${bgClass}
        ${!disabled ? 'hover:shadow-[0_4px_0_rgba(0,0,0,0.3)] hover:translate-y-0.5 active:shadow-none active:translate-y-1.5' : ''}
        disabled:cursor-not-allowed
        border-b-4 border-black/20
      `}
    >
      {children}
    </button>
  );
};

// Star display component
const StarDisplay: React.FC<{ earned: number; total?: number; size?: 'sm' | 'md' | 'lg' }> = ({ earned, total = 3, size = 'md' }) => {
  const sizeClass = size === 'sm' ? 'w-8 h-8' : size === 'md' ? 'w-12 h-12' : 'w-16 h-16';
  return (
    <div className="flex justify-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <img
          key={i}
          src={i < earned ? '/assets/ui/star_filled.png' : '/assets/ui/star_empty.png'}
          alt={i < earned ? 'star' : 'empty star'}
          className={`${sizeClass} transition-all duration-300 ${i < earned ? 'animate-pulse' : 'opacity-50'}`}
          style={{ animationDelay: `${i * 100}ms` }}
        />
      ))}
    </div>
  );
};

// Coin display with animation
const CoinReward: React.FC<{ amount: number }> = ({ amount }) => (
  <div className="flex items-center justify-center gap-2 text-2xl font-bold text-yellow-400">
    <img src="/assets/coins/coin_gold.png" alt="coin" className="w-10 h-10 animate-spin" style={{ animationDuration: '3s' }} />
    <span className="animate-pulse">+{amount}</span>
  </div>
);

const MathAdventureGame: React.FC = () => {
  const { state, completeMathLevel, updateMathProgress, addAchievement } = useArcade();
  const { playClick, playSelect, playCorrect, playWrong, playLevelComplete, playPerfect, playStreak } = useSound();

  const [companion, setCompanion] = useState<typeof COMPANIONS[0] | null>(null);
  const [currentLevel, setCurrentLevel] = useState(state.mathProgress.currentLevel);
  const [problem, setProblem] = useState<MathProblem>(() => generateProblem(currentLevel));
  const [phase, setPhase] = useState<GamePhase>('companion-select');
  const [problemsInLevel, setProblemsInLevel] = useState(0);
  const [correctInLevel, setCorrectInLevel] = useState(0);
  const [streak, setStreak] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [companionMessage, setCompanionMessage] = useState('');
  const [currentEmote, setCurrentEmote] = useState<string | undefined>();

  const PROBLEMS_PER_LEVEL = 5;

  // Get current level story
  const currentStory = LEVEL_STORIES[(currentLevel - 1) % LEVEL_STORIES.length];

  // Select companion
  const selectCompanion = (c: typeof COMPANIONS[0]) => {
    setCompanion(c);
    playSelect();
    setCompanionMessage(`Hi! I'm ${c.name}! ${c.encouragement}`);
    setTimeout(() => {
      setPhase('level-intro');
    }, 1500);
  };

  // Start playing the level
  const startLevel = useCallback(() => {
    setProblem(generateProblem(currentLevel));
    setPhase('playing');
    setSelectedAnswer(null);
    setCompanionMessage(companion?.encouragement || 'You can do it!');
    setCurrentEmote('/assets/emotes/idea.png');
    playClick();
  }, [currentLevel, playClick, companion]);

  // Generate new problem
  const nextProblem = useCallback(() => {
    setProblem(generateProblem(currentLevel));
    setPhase('playing');
    setSelectedAnswer(null);
    setCurrentEmote(undefined);
  }, [currentLevel]);

  // Encouragement messages based on streak
  const getStreakMessage = (s: number) => {
    if (s >= 10) return "AMAZING! You're a math superstar!";
    if (s >= 7) return "WOW! You're on fire!";
    if (s >= 5) return "Fantastic streak! Keep going!";
    if (s >= 3) return "Great job! You're doing awesome!";
    return "Nice one!";
  };

  // Handle answer selection
  const handleAnswer = (answer: number) => {
    if (phase !== 'playing') return;

    playClick();
    setSelectedAnswer(answer);

    if (answer === problem.correctAnswer) {
      playCorrect();
      setPhase('correct');
      setCorrectInLevel(c => c + 1);
      const newStreak = streak + 1;
      setStreak(newStreak);

      // Play streak sound at milestones
      if (newStreak === 5 || newStreak === 10) {
        setTimeout(() => playStreak(), 300);
      }

      // Update companion message and emote
      setCompanionMessage(getStreakMessage(newStreak));
      setCurrentEmote(newStreak >= 5 ? '/assets/emotes/hearts.png' : '/assets/emotes/face_happy.png');

      // Check for streak achievement
      if (newStreak >= 10) {
        addAchievement('math-whiz');
      }

      updateMathProgress({
        problemsSolved: state.mathProgress.problemsSolved + 1,
        bestStreak: Math.max(state.mathProgress.bestStreak, newStreak),
      });

      // Check if level complete
      if (problemsInLevel + 1 >= PROBLEMS_PER_LEVEL) {
        setTimeout(() => {
          const isPerfect = correctInLevel + 1 === PROBLEMS_PER_LEVEL;
          if (isPerfect) {
            playPerfect();
            setCompanionMessage("PERFECT SCORE! You're incredible!");
            setCurrentEmote('/assets/emotes/stars_new.png');
          } else {
            playLevelComplete();
            setCompanionMessage("Level complete! Great work!");
            setCurrentEmote('/assets/emotes/laugh.png');
          }
          setPhase('level-complete');
        }, 800);
      } else {
        setTimeout(() => {
          setProblemsInLevel(p => p + 1);
          nextProblem();
        }, 1000);
      }
    } else {
      playWrong();
      setPhase('wrong');
      setStreak(0);
      setCompanionMessage("Oops! That's okay, let's try the next one!");
      setCurrentEmote('/assets/emotes/face_sad.png');

      setTimeout(() => {
        setProblemsInLevel(p => p + 1);
        nextProblem();
      }, 1500);
    }
  };

  // Complete level and move to next
  const handleNextLevel = () => {
    const accuracy = correctInLevel / PROBLEMS_PER_LEVEL;
    const stars = accuracy >= 1 ? 3 : accuracy >= 0.8 ? 2 : 1;
    const coins = correctInLevel * 10 + (stars === 3 ? 50 : stars === 2 ? 25 : 0);

    completeMathLevel(currentLevel, stars, coins);

    // Check achievements
    if (stars === 3) {
      addAchievement('perfectionist');
    }
    if (currentLevel === 1) {
      addAchievement('first-steps');
    }

    setCurrentLevel(l => l + 1);
    setProblemsInLevel(0);
    setCorrectInLevel(0);
    setPhase('level-intro');
    playClick();
  };

  // Calculate stars for current performance
  const currentStars = correctInLevel >= PROBLEMS_PER_LEVEL ? 3 : correctInLevel >= PROBLEMS_PER_LEVEL * 0.8 ? 2 : 1;
  const currentCoins = correctInLevel * 10 + (currentStars === 3 ? 50 : currentStars === 2 ? 25 : 0);

  return (
    <div className="absolute inset-0 bg-gradient-to-b from-indigo-900 via-purple-900 to-pink-900 flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Decorative floating elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute opacity-10"
            style={{
              left: `${10 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
              animation: `float ${3 + i}s ease-in-out infinite`,
              animationDelay: `${i * 0.5}s`,
            }}
          >
            <span className="text-6xl">{['🌟', '✨', '💫', '⭐', '🎯', '🏆'][i]}</span>
          </div>
        ))}
      </div>

      {/* Companion Selection Screen */}
      {phase === 'companion-select' && (
        <div className="text-center max-w-2xl z-10">
          <h2 className="text-4xl font-black text-white mb-2 drop-shadow-lg">Choose Your Math Buddy!</h2>
          <p className="text-cyan-200 mb-8 text-lg">Pick a friend to help you on your math adventure!</p>

          <div className="grid grid-cols-3 gap-4 mb-6">
            {COMPANIONS.map((c) => (
              <button
                key={c.id}
                onClick={() => selectCompanion(c)}
                className="group bg-white/10 backdrop-blur-md rounded-2xl p-4 border-2 border-white/20
                         hover:border-yellow-400 hover:bg-white/20 transition-all transform hover:scale-105
                         focus:outline-none focus:ring-4 focus:ring-yellow-400/50"
              >
                <img
                  src={c.image}
                  alt={c.name}
                  className="w-20 h-20 mx-auto mb-2 group-hover:animate-bounce"
                />
                <p className="text-white font-bold text-sm">{c.name}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Game UI (after companion selection) */}
      {phase !== 'companion-select' && (
        <>
          {/* Header */}
          <div className="absolute top-16 left-4 right-4 flex justify-between items-center z-10">
            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 flex items-center gap-2">
              <img src="/assets/medals/gold.png" alt="level" className="w-6 h-6" />
              <span className="text-white font-bold">Level {currentLevel}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 flex items-center gap-2">
              <img src="/assets/coins/coin_gold.png" alt="coins" className="w-6 h-6" />
              <span className="text-yellow-400 font-bold">{state.mathProgress.totalCoins}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 flex items-center gap-2">
              <span className="text-orange-400 font-bold text-lg">{streak}</span>
              <img src="/assets/emotes/heart.png" alt="streak" className="w-6 h-6" />
            </div>
          </div>

          {/* Progress bar */}
          <div className="absolute top-28 left-4 right-4 z-10">
            <div className="bg-gray-800/80 rounded-full h-4 overflow-hidden border-2 border-white/20">
              <div
                className="bg-gradient-to-r from-cyan-400 to-green-400 h-full transition-all duration-500 ease-out"
                style={{ width: `${(problemsInLevel / PROBLEMS_PER_LEVEL) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-gray-300 text-xs mt-1 px-1">
              <span>Problem {Math.min(problemsInLevel + 1, PROBLEMS_PER_LEVEL)}</span>
              <span>{problemsInLevel} / {PROBLEMS_PER_LEVEL}</span>
            </div>
          </div>

          {/* Companion with speech bubble */}
          {companion && phase !== 'level-complete' && (
            <div className="absolute top-40 left-4 z-10">
              <CompanionBubble companion={companion} message={companionMessage} emote={currentEmote} />
            </div>
          )}

          {/* Level Intro Screen */}
          {phase === 'level-intro' && (
            <div className="text-center max-w-md z-10">
              <div
                className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border-2 border-white/30 shadow-2xl mb-6"
                style={{ backgroundImage: 'url(/assets/ui/panels/panel_beige.png)', backgroundSize: 'cover' }}
              >
                <div className="bg-white/90 rounded-2xl p-6">
                  <h2 className="text-4xl font-black text-gray-800 mb-2">Level {currentLevel}</h2>
                  <div className="text-6xl mb-4">{currentStory.emoji}</div>
                  <p className="text-lg text-gray-700 mb-4">{currentStory.text}</p>
                </div>
              </div>
              <button
                onClick={startLevel}
                className="px-12 py-5 bg-gradient-to-b from-green-400 to-green-600
                         hover:from-green-300 hover:to-green-500
                         text-white text-2xl font-black rounded-2xl
                         shadow-[0_6px_0_rgba(0,0,0,0.3)]
                         hover:shadow-[0_4px_0_rgba(0,0,0,0.3)] hover:translate-y-0.5
                         active:shadow-none active:translate-y-1.5
                         transform transition-all border-b-4 border-green-700"
              >
                Let's Go!
              </button>
            </div>
          )}

          {/* Level Complete Screen */}
          {phase === 'level-complete' && (
            <div className="text-center z-10">
              {companion && (
                <div className="flex justify-center mb-4">
                  <img
                    src={companion.image}
                    alt={companion.name}
                    className="w-24 h-24 animate-bounce"
                  />
                </div>
              )}
              <h2 className="text-5xl font-black text-white mb-4 drop-shadow-lg">
                {correctInLevel === PROBLEMS_PER_LEVEL ? 'PERFECT!' : 'Level Complete!'}
              </h2>

              <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border-2 border-white/30 mb-6">
                <StarDisplay earned={currentStars} size="lg" />

                <p className="text-cyan-300 text-2xl mt-4 mb-2 font-bold">
                  {correctInLevel} / {PROBLEMS_PER_LEVEL} correct
                </p>

                <CoinReward amount={currentCoins} />

                {correctInLevel === PROBLEMS_PER_LEVEL && (
                  <div className="mt-4 flex justify-center">
                    <img src="/assets/medals/gold.png" alt="gold medal" className="w-16 h-16 animate-pulse" />
                  </div>
                )}
              </div>

              <button
                onClick={handleNextLevel}
                className="px-10 py-5 bg-gradient-to-b from-cyan-400 to-blue-600
                         hover:from-cyan-300 hover:to-blue-500
                         text-white text-xl font-black rounded-2xl
                         shadow-[0_6px_0_rgba(0,0,0,0.3)]
                         hover:shadow-[0_4px_0_rgba(0,0,0,0.3)] hover:translate-y-0.5
                         active:shadow-none active:translate-y-1.5
                         transform transition-all border-b-4 border-blue-700"
              >
                Next Level
              </button>
            </div>
          )}

          {/* Playing / Correct / Wrong phases */}
          {(phase === 'playing' || phase === 'correct' || phase === 'wrong') && (
            <div className="z-10 w-full max-w-lg">
              {/* Problem Display */}
              <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 mb-8 border-4 border-white shadow-2xl">
                <div className="text-6xl md:text-7xl font-black text-center tracking-wide">
                  <span className="text-blue-600">{problem.operandA}</span>
                  <span className="text-gray-800 mx-3">{problem.operator}</span>
                  <span className="text-purple-600">{problem.operandB}</span>
                  <span className="text-gray-800 mx-3">=</span>
                  <span className="text-yellow-500">?</span>
                </div>
              </div>

              {/* Answer Choices */}
              <div className="grid grid-cols-2 gap-4 w-full">
                {problem.choices.map((answer, idx) => (
                  <GameButton
                    key={idx}
                    onClick={() => handleAnswer(answer)}
                    disabled={phase !== 'playing'}
                    colorIndex={idx}
                    isCorrect={phase !== 'playing' && answer === problem.correctAnswer}
                    isWrong={phase === 'wrong' && selectedAnswer === answer}
                  >
                    {answer}
                  </GameButton>
                ))}
              </div>

              {/* Feedback Message */}
              {phase === 'correct' && (
                <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex items-center gap-3">
                  <img src="/assets/emotes/face_happy.png" alt="happy" className="w-12 h-12 animate-bounce" />
                  <span className="text-3xl font-bold text-green-400 drop-shadow-lg">Correct!</span>
                </div>
              )}
              {phase === 'wrong' && (
                <div className="absolute bottom-24 left-1/2 -translate-x-1/2 text-center">
                  <p className="text-2xl font-bold text-red-400 drop-shadow-lg">
                    The answer was <span className="text-white">{problem.correctAnswer}</span>
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* CSS for floating animation */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(10deg); }
        }
      `}</style>
    </div>
  );
};

export default MathAdventureGame;
