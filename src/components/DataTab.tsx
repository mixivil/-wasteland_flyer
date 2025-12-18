import { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';
import { Stats } from '../App';

interface Task {
  id: number;
  title: string;
  description: string;
  question: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  reward: number;
  status: 'locked' | 'available' | 'completed';
  correctAnswer?: string;
  userAnswer?: string;
  type?: 'single' | 'survey';
  questions?: Array<{
    question: string;
    correctAnswer: string;
  }>;
  userAnswers?: string[];
  audioUrl?: string;
}

interface DataTabProps {
  updateStats: (statUpdates: Partial<Stats>) => void;

  // ✅ НОВОЕ: блокируем переключение вкладок в App
  setUiLocked: (locked: boolean) => void;
}

const DATA_VERSION = '4.8';
const LAST_TASK_ID = 7; // ✅ “последнее задание” теперь по id, не по индексу

const defaultTasks: Task[] = [
  {
    id: 1,
    title: 'ТЕСТ НА ПРИГОДНОСТЬ VAULT-TEC',
    description: 'Пройдите обязательный психологический опрос Vault-Tec.',
    question: 'Ответьте на все вопросы для завершения оценки профиля.',
    difficulty: 'EASY',
    reward: 150,
    status: 'available',
    type: 'survey',
    questions: [
      { question: '1. Вы являетесь участником эксперимента?', correctAnswer: 'да' },
      {
        question:
          '2. Вы давали согласие на передачу вашего тела в собственность убежища, в случае несчастного случая?',
        correctAnswer: 'да'
      },
      { question: '3. Как зовут учителя биологии?', correctAnswer: 'коткин кирилл сергеевич' },
      { question: '4. Чем заправляют салат оливье?', correctAnswer: 'майонез' },
      { question: '5. Решите кубическое уравнение: x³ + 3x² — 4x — 12 = 0', correctAnswer: '+-2' }
    ],
    userAnswers: []
  },
  {
    id: 2,
    title: 'WASTELANDFLYER',
    description:
      '11.12 - Перейдите в меню с игрой и пройдите её до конца. Текущий рекорд: 150. В конце должен быть пароль.\n15.08 - Мой максимум: 13\n11.09 - Мой результат: 9',
    question: 'Помогите птичке долететь до конца',
    difficulty: 'MEDIUM',
    reward: 300,
    status: 'locked',
    correctAnswer: '1910'
  },
  {
    id: 3,
    title: 'КРАНИОЛОГИЯ',
    description: 'Помогите ученому в его лаборатории! Кому принадлежит загаданный череп?',
    question: 'Кому принадлежит череп?',
    difficulty: 'EASY',
    reward: 150,
    status: 'locked',
    correctAnswer: 'Кабан'
  },
  {
    id: 4,
    title: 'ЛЕТОПИСЬ',
    description: 'Знание истории ключ ко всему.',
    question: 'Введите цифровой хронологический код.',
    difficulty: 'MEDIUM',
    reward: 250,
    status: 'locked',
    correctAnswer: '1019'
  },
  {
    id: 5,
    title: 'ОТКРЫТИЕ СТОЛЕТИЯ',
    description: 'Ученый нашел загадочное вещество, необходимое для спасение убежища.',
    question: 'Помогите ученому выяснить, что это.',
    difficulty: 'MEDIUM',
    reward: 350,
    status: 'locked',
    correctAnswer: 'Йогурт'
  },
  {
    id: 6,
    title: 'СОДЕРЖИМОЕ КЛЮЧА',
    description: 'Мы много лет ловим таинственный сигнал...',
    question: 'Проиграйте запись сигнала и попробуйте узнать, что произошло.',
    difficulty: 'MEDIUM',
    reward: 300,
    status: 'locked',
    correctAnswer: 'Все любят йогурт',
    audioUrl: '/tracks/signal.mp3'
  },
  {
    id: 7,
    title: 'ВЫБОР ЕСТЬ?',
    description:
      'Если вы дошли до этого этапа, значит вы готовы пользоваться силой демократии для выбора основного смотрителя.',
    question: 'Введите код для разблокировки',
    difficulty: 'HARD',
    reward: 500,
    status: 'locked',
    correctAnswer: '42'
  }
];

export function DataTab({ updateStats, setUiLocked }: DataTabProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [inputAnswer, setInputAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [surveyAnswers, setSurveyAnswers] = useState<string[]>([]);
  const [surveyResults, setSurveyResults] = useState<boolean[]>([]);

  // ✅ финальное модальное окно (нельзя закрыть)
  const [showElectionModal, setShowElectionModal] = useState(false);

  // ✅ audio state
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioVolume, setAudioVolume] = useState(75);

  // ✅ анти-сбросы из таймеров
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearResetTimer = () => {
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => clearResetTimer();
  }, []);

  const [tasks, setTasks] = useState<Task[]>(() => {
    const version = localStorage.getItem('pipboy-data-version');
    if (version !== DATA_VERSION) {
      localStorage.setItem('pipboy-data-version', DATA_VERSION);
      localStorage.removeItem('pipboy-tasks');
      return defaultTasks;
    }
    const saved = localStorage.getItem('pipboy-tasks');
    return saved ? JSON.parse(saved) : defaultTasks;
  });

  useEffect(() => {
    localStorage.setItem('pipboy-tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = Math.min(1, Math.max(0, audioVolume / 100));
    }
  }, [audioVolume]);

  useEffect(() => {
    // Stop audio on task switch
    setIsAudioPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [selectedTask?.id]);

  // ✅ ЛОЧИМ ВЕСЬ UI (навигацию по разделам) пока модалка активна
  useEffect(() => {
    if (showElectionModal) {
      setUiLocked(true);
    }
    // cleanup на случай размонтирования или если ты когда-нибудь решишь закрывать модалку
    return () => {
      setUiLocked(false);
    };
  }, [showElectionModal, setUiLocked]);

  const toggleAudio = async () => {
    const el = audioRef.current;
    if (!el) return;

    try {
      if (el.paused) {
        await el.play();
        setIsAudioPlaying(true);
      } else {
        el.pause();
        setIsAudioPlaying(false);
      }
    } catch {
      setIsAudioPlaying(false);
    }
  };

  const handleSurveySubmit = () => {
    if (!selectedTask || selectedTask.type !== 'survey' || !selectedTask.questions) return;

    clearResetTimer();

    const allAnswered =
      surveyAnswers.length === selectedTask.questions.length &&
      surveyAnswers.every((answer) => answer.trim() !== '');

    if (!allAnswered) return;

    const results = surveyAnswers.map(
      (answer, idx) =>
        answer.trim().toLowerCase() === selectedTask.questions![idx].correctAnswer.trim().toLowerCase()
    );

    setSurveyResults(results);
    const allCorrect = results.every((r) => r);
    setIsCorrect(allCorrect);
    setShowResult(true);

    if (allCorrect) {
      const updatedTasks = tasks.map((task) =>
        task.id === selectedTask.id
          ? { ...task, status: 'completed' as const, userAnswers: surveyAnswers.map((a) => a.trim()) }
          : task
      );

      const currentIndex = tasks.findIndex((t) => t.id === selectedTask.id);
      const unlockedTasks =
        currentIndex < tasks.length - 1 && tasks[currentIndex + 1].status === 'locked'
          ? updatedTasks.map((task, idx) =>
              idx === currentIndex + 1 ? { ...task, status: 'available' as const } : task
            )
          : updatedTasks;

      setTasks(unlockedTasks);

      resetTimerRef.current = setTimeout(() => {
        setShowResult(false);
        setSurveyAnswers([]);
        setSurveyResults([]);
        setSelectedTask(null);
      }, 3000);
    } else {
      setTasks(
        tasks.map((task) =>
          task.id === selectedTask.id ? { ...task, userAnswers: surveyAnswers.map((a) => a.trim()) } : task
        )
      );

      resetTimerRef.current = setTimeout(() => {
        setShowResult(false);
        setSurveyResults([]);
      }, 3000);
    }
  };

  const handleSubmit = () => {
    if (!selectedTask || !inputAnswer.trim()) return;

    clearResetTimer();

    const normalizedInput = inputAnswer.trim().toLowerCase();
    const normalizedCorrect = (selectedTask.correctAnswer ?? '').trim().toLowerCase();
    const correct = normalizedInput === normalizedCorrect;

    setIsCorrect(correct);
    setShowResult(true);

    if (correct) {
      const updatedTasks = tasks.map((task) =>
        task.id === selectedTask.id
          ? { ...task, status: 'completed' as const, userAnswer: inputAnswer.trim() }
          : task
      );

      const currentIndex = tasks.findIndex((t) => t.id === selectedTask.id);

      // ✅ ПОСЛЕДНЕЕ ЗАДАНИЕ определяем по id
      const isLastTask = selectedTask.id === LAST_TASK_ID;

      const unlockedTasks =
        !isLastTask && currentIndex < tasks.length - 1 && tasks[currentIndex + 1].status === 'locked'
          ? updatedTasks.map((task, idx) =>
              idx === currentIndex + 1 ? { ...task, status: 'available' as const } : task
            )
          : updatedTasks;

      setTasks(unlockedTasks);

      // ✅ ПОСЛЕДНЕЕ: показываем незакрываемую модалку и лочим UI
      if (isLastTask) {
        setShowElectionModal(true);
        return;
      }
    } else {
      setTasks(
        tasks.map((task) =>
          task.id === selectedTask.id ? { ...task, userAnswer: inputAnswer.trim() } : task
        )
      );
    }

    resetTimerRef.current = setTimeout(() => {
      setShowResult(false);
      setInputAnswer('');
      if (correct) setSelectedTask(null);
    }, 3000);
  };

  const getDifficultyColor = (difficulty: Task['difficulty']) => {
    switch (difficulty) {
      case 'EASY':
        return 'text-green-400';
      case 'MEDIUM':
        return 'text-green-400/80';
      case 'HARD':
        return 'text-green-400/60';
    }
  };

  const getTaskStatusLabel = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return '[ВЫПОЛНЕНО]';
      case 'locked':
        return '[ЗАБЛОКИРОВАНО]';
      default:
        return '[ДОСТУПНО]';
    }
  };

  const totalRewards = tasks.filter((t) => t.status === 'completed').reduce((sum, t) => sum + t.reward, 0);
  const completedCount = tasks.filter((t) => t.status === 'completed').length;

  return (
    <div className="h-full flex flex-col relative">
      {/* ✅ НЕЗАКРЫВАЕМОЕ МОДАЛЬНОЕ ОКНО + блок ввода */}
      {showElectionModal && (
        <div className="absolute inset-0 z-50">
          <div className="absolute inset-0 bg-black/95" />

          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage: 'linear-gradient(to bottom, rgba(0,255,0,0.18) 1px, transparent 1px)',
              backgroundSize: '100% 6px'
            }}
          />
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(rgba(0,255,0,0.12) 1px, transparent 1px)',
              backgroundSize: '3px 3px'
            }}
          />

          <div className="absolute inset-0 flex items-center justify-center p-6">
            <div
              className="w-full max-w-3xl border border-green-400/60 bg-black/80 p-6 md:p-8"
              style={{
                boxShadow: '0 0 40px rgba(0,255,0,0.25), inset 0 0 30px rgba(0,255,0,0.08)'
              }}
            >
              <div className="text-xs opacity-70 mb-3 tracking-widest" style={{ textShadow: '0 0 10px rgba(0,255,0,0.35)' }}>
                {'>'} SYSTEM ALERT
              </div>

              <div className="text-2xl md:text-3xl tracking-wider text-green-400 animate-pulse" style={{ textShadow: '0 0 16px rgba(0,255,0,0.75)' }}>
                ВНИМАНИЕ
              </div>

              <div className="mt-4 border border-green-400/30 p-4">
                <div className="text-lg md:text-xl leading-relaxed tracking-wide" style={{ textShadow: '0 0 10px rgba(0,255,0,0.35)' }}>
                  ИНИЦИИРОВАН ЗАПУСК ГОЛОСОВАНИЯ
                  <br />
                  ПО СМЕНЕ СМОТРИТЕЛЯ
                </div>
              </div>

              <div className="mt-6 text-xs opacity-70 tracking-widest">
                {'>'} INPUT LOCKED <span className="inline-block ml-2 animate-pulse">▮</span>
              </div>
            </div>
          </div>

          {/* блокируем клики полностью */}
          <div className="absolute inset-0" />
        </div>
      )}

      <div className="flex justify-between items-start mb-4">
        <div className="text-lg tracking-wider" style={{ textShadow: '0 0 10px rgba(0, 255, 0, 0.5)' }}>
          {'>'} ТЕРМИНАЛЬНЫЕ ЗАДАЧИ
        </div>
        <div className="text-right text-sm">
          <div className="opacity-70">ВЫПОЛНЕНО: {completedCount}/{tasks.length}</div>
          <div className="opacity-70">КРЫШЕК ЗАРАБОТАНО: {totalRewards}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 flex-1">
        {/* Task List */}
        <div className="space-y-2 overflow-auto">
          {tasks.map((task) => (
            <button
              key={task.id}
              onClick={() => {
                clearResetTimer();

                if (task.status === 'available') {
                  setSelectedTask(task);
                  setInputAnswer(task.userAnswer || '');
                  setShowResult(false);

                  if (task.type === 'survey' && task.questions) {
                    setSurveyAnswers(task.userAnswers || new Array(task.questions.length).fill(''));
                    setSurveyResults([]);
                  }

                  setIsAudioPlaying(false);
                  if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current.currentTime = 0;
                  }
                }
              }}
              disabled={task.status === 'locked'}
              className={`w-full text-left p-3 border transition-all ${
                selectedTask?.id === task.id
                  ? 'border-green-400 bg-green-400/10'
                  : task.status === 'locked'
                  ? 'border-green-400/20 opacity-40 cursor-not-allowed'
                  : 'border-green-400/30 hover:border-green-400/50'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="text-sm tracking-wider">{task.title}</div>
                <div className={`text-xs ${getDifficultyColor(task.difficulty)}`}>{task.difficulty}</div>
              </div>
              <div className="text-xs opacity-60 mb-2">{task.description}</div>
              <div className="flex justify-between items-center text-xs">
                <span className={task.status === 'completed' ? 'text-green-400' : 'opacity-50'}>
                  {getTaskStatusLabel(task.status)}
                </span>
                <span className="opacity-70">{task.reward} CAPS</span>
              </div>
            </button>
          ))}
        </div>

        {/* Task Details */}
        <div className="border border-green-400/30 p-4 flex flex-col">
          {selectedTask ? (
            <div className="space-y-4 flex-1 flex flex-col">
              <div>
                <div className="text-lg tracking-wider mb-2" style={{ textShadow: '0 0 10px rgba(0, 255, 0, 0.5)' }}>
                  {selectedTask.title}
                </div>
                <div className="text-xs opacity-60 mb-4">{selectedTask.description}</div>
              </div>

              <div className="border border-green-400/30 p-3 mb-2">
                <div className="text-xs opacity-70 mb-2">ЗАДАЧА:</div>
                <div className="text-sm leading-relaxed">{selectedTask.question}</div>
              </div>

              {selectedTask.audioUrl && (
                <div className="border border-green-400/30 p-3">
                  <div className="text-xs opacity-70 mb-2">АУДИО:</div>

                  <audio ref={audioRef} src={selectedTask.audioUrl} onEnded={() => setIsAudioPlaying(false)} preload="metadata" />

                  <div className="flex items-center gap-3">
                    <button
                      onClick={toggleAudio}
                      className="p-2 border border-green-400/50 hover:bg-green-400/10 transition-all"
                      title={isAudioPlaying ? 'Пауза' : 'Воспроизвести'}
                    >
                      {isAudioPlaying ? <Pause size={18} /> : <Play size={18} />}
                    </button>

                    <div className="flex items-center gap-2 flex-1">
                      <Volume2 size={18} className="opacity-80" />
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={audioVolume}
                        onChange={(e) => setAudioVolume(Number(e.target.value))}
                        className="radio-range"
                        aria-label="Volume"
                      />
                      <div className="text-xs opacity-70 w-10 text-right">{audioVolume}%</div>
                    </div>
                  </div>

                  <div className="text-xs opacity-50 mt-2">ФАЙЛ: {selectedTask.audioUrl}</div>
                </div>
              )}

              {showResult ? (
                <div
                  className={`border p-4 ${
                    isCorrect ? 'border-green-400 bg-green-400/20' : 'border-green-400/50 bg-green-400/5'
                  }`}
                  style={{ boxShadow: isCorrect ? '0 0 20px rgba(0, 255, 0, 0.3)' : 'none' }}
                >
                  <div className="text-xl mb-2 animate-pulse text-center" style={{ textShadow: '0 0 10px rgba(0, 255, 0, 0.7)' }}>
                    {isCorrect ? '>>> ВСЁ ВЕРНО <<<' : '>>> ЕСТЬ ОШИБКИ <<<'}
                  </div>

                  {selectedTask.type === 'survey' && surveyResults.length > 0 && (
                    <div className="space-y-2 mb-3 text-left">
                      {surveyResults.map((result, idx) => (
                        <div
                          key={idx}
                          className={`text-xs p-2 border ${
                            result
                              ? 'border-green-400/50 bg-green-400/10 text-green-400'
                              : 'border-green-400/30 bg-green-400/5 text-green-400/70'
                          }`}
                        >
                          Вопрос {idx + 1}: {result ? '✓ ВЕРНО' : '✗ НЕВЕРНО'}
                        </div>
                      ))}
                    </div>
                  )}

                  {isCorrect && <div className="text-sm opacity-80 mb-2">+{selectedTask.reward} КРЫШЕК ПОЛУЧЕНО</div>}
                  {!isCorrect && <div className="text-xs opacity-70 mt-2">ПОПРОБУЙТЕ ЕЩЁ РАЗ</div>}
                </div>
              ) : (
                <>
                  {selectedTask.type === 'survey' && selectedTask.questions ? (
                    <div className="flex-1 flex flex-col">
                      <div className="space-y-3 mb-4 flex-1 overflow-auto">
                        {selectedTask.questions.map((q, idx) => (
                          <div key={idx} className="border border-green-400/20 p-3">
                            <div className="text-sm mb-2 opacity-80">{q.question}</div>
                            <input
                              type="text"
                              value={surveyAnswers[idx] || ''}
                              onChange={(e) => {
                                const newAnswers = [...surveyAnswers];
                                newAnswers[idx] = e.target.value;
                                setSurveyAnswers(newAnswers);
                              }}
                              placeholder="TYPE HERE..."
                              className="w-full bg-black border border-green-400/30 p-2 text-green-400 font-mono placeholder:text-green-400/30 focus:border-green-400/70 focus:outline-none text-sm"
                              style={{ textShadow: '0 0 5px rgba(0, 255, 0, 0.3)' }}
                            />
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={handleSurveySubmit}
                        disabled={
                          surveyAnswers.length !== selectedTask.questions.length ||
                          surveyAnswers.some((answer) => !answer || answer.trim() === '')
                        }
                        className="w-full p-3 border border-green-400/50 hover:bg-green-400/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        ОТПРАВИТЬ ОТВЕТЫ
                      </button>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col">
                      <div className="flex-1">
                        <label className="block text-xs opacity-70 mb-2">ВВЕДИТЕ ОТВЕТ:</label>
                        <input
                          type="text"
                          value={inputAnswer}
                          onChange={(e) => setInputAnswer(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                          placeholder="ВВЕДИТЕ ТЕКСТ..."
                          className="w-full bg-black border border-green-400/30 p-3 text-green-400 font-mono placeholder:text-green-400/30 focus:border-green-400/70 focus:outline-none mb-4"
                          style={{ textShadow: '0 0 5px rgba(0, 255, 0, 0.3)' }}
                        />
                      </div>
                      <button
                        onClick={handleSubmit}
                        disabled={!inputAnswer.trim()}
                        className="w-full p-3 border border-green-400/50 hover:bg-green-400/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        ОТПРАВИТЬ ОТВЕТ
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center opacity-50 text-sm">ВЫБЕРИТЕ ЗАДАНИЕ</div>
          )}
        </div>
      </div>
    </div>
  );
}
