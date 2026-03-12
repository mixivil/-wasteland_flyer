import { useMemo, useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const MAP_SRC = '/maps/frame-44.svg';
const FINAL_NODE_ID = 'p11';
const FINAL_SECRET_CODE = '1910';
const STORAGE_KEY = 'capital-wasteland-map-state-v2';
const GAME_DURATION_SEC = 7 * 60;
const MAX_CODE_LENGTH = 40;

type Comment = {
  id: string;
  author: string;
  time: string;
  text: string;
  tone?: 'good' | 'bad' | 'neutral';
};

type Location = {
  id: string;
  name: string;
  xPct: number;
  yPct: number;
  question: string;
  description: string;
  comments: Comment[];
};

type Dir = 'up' | 'down' | 'left' | 'right';
type NodeState = 'locked' | 'unlocked';

type PersistedGameState = {
  stateById: Record<string, NodeState>;
  solvedById: Record<string, boolean>;
  selectedId: string | null;
  answerByLoc: Record<string, string>;
  feedbackByLoc: Record<string, string>;
  endAtMs: number | null;
  isStarted: boolean;
  isGameOver: boolean;
};

const LOCATIONS: Location[] = [
  {
    id: 'p1',
    name: 'ATRiUM ACCESS',
    xPct: 10.389,
    yPct: 20.185,
    question: 'Какой самый безопасный путь через атриум?',
    description:
      'Видимость хорошая, но в углах много “слепых” зон. Сканер периодически ловит помехи — возможно, кто-то недавно проходил.',
    comments: [
      { id: 'c1', author: 'Wanderer_13', time: '2h ago', tone: 'neutral', text: 'Тут тихо, но лучше не задерживаться.' },
      { id: 'c2', author: 'VltTecRep', time: '1h ago', tone: 'good', text: 'Держись правой стены — меньше мусора и проще ориентироваться.' }
    ]
  },
  {
    id: 'p2',
    name: 'EAST CORRIDOR',
    xPct: 28.691,
    yPct: 20.185,
    question: 'Что может быть источником помех на частоте?',
    description: 'Длинный коридор с повторяющимися секциями. Датчики показывают скачки энергии каждые 40–60 секунд.',
    comments: [{ id: 'c1', author: 'SignalFox', time: '4h ago', tone: 'neutral', text: 'Похоже на старые терминалы. Срабатывают циклом.' }]
  },
  {
    id: 'p3',
    name: 'NORTH WING',
    xPct: 54.951,
    yPct: 20.185,
    question: 'Почему двери в северном крыле помечены “?”',
    description: 'Разметка отсутствует. На полу следы волочения — будто что-то тащили.',
    comments: [{ id: 'c1', author: 'Archivist', time: '1d ago', tone: 'neutral', text: 'Там раньше была зона хранения.' }]
  },
  {
    id: 'p4',
    name: 'FAR EAST BLOCK',
    xPct: 93.678,
    yPct: 20.185,
    question: 'Что спрятано в восточном блоке?',
    description: 'Внутри сухо и чисто, будто кто-то поддерживает порядок.',
    comments: [{ id: 'c1', author: 'Rust', time: '5h ago', tone: 'neutral', text: 'Пахнет антисептиком. Странно.' }]
  },
  {
    id: 'p5',
    name: 'ARCHIVE ROOM',
    xPct: 10.389,
    yPct: 34.798,
    question: 'Какой сектор архива вскрывать первым?',
    description: 'Стеллажи частично завалены. На двери — следы свежих царапин.',
    comments: [{ id: 'c1', author: 'Mira', time: '6h ago', tone: 'bad', text: 'Слышала шорохи за стеной.' }]
  },
  {
    id: 'p6',
    name: 'TECH SERVICE',
    xPct: 47.436,
    yPct: 37.28,
    question: 'Какие инструменты взять из техслужбы?',
    description: 'Шкафчики, полки, запасные детали. Доступ не заблокирован.',
    comments: [{ id: 'c1', author: 'Fixer', time: '9h ago', tone: 'good', text: 'Ищи предохранители и изоленту.' }]
  },
  {
    id: 'p7',
    name: 'MAINTENANCE BAY',
    xPct: 55.217,
    yPct: 37.28,
    question: 'Как обойти центральную зону без шума?',
    description: 'Пол решётчатый. Любой шаг отдаётся эхом. Есть боковой проход.',
    comments: [{ id: 'c1', author: 'Scout', time: '3h ago', tone: 'neutral', text: 'Шагай по балкам, а не по листам.' }]
  },
  {
    id: 'p8',
    name: 'SERVICE SHAFT',
    xPct: 64.5,
    yPct: 37.28,
    question: 'Стоит ли идти через сервисную шахту?',
    description: 'Сужение прохода, много металлолома. Но можно быстро выйти к развилке.',
    comments: [{ id: 'c1', author: 'Grit', time: '10h ago', tone: 'bad', text: 'Один раз там что-то шевелилось.' }]
  },
  {
    id: 'p9',
    name: 'POWER NODE',
    xPct: 10.389,
    yPct: 44.933,
    question: 'Как стабилизировать питание?',
    description: 'Панель щёлкает раз в минуту. Видны следы недавнего вскрытия.',
    comments: [{ id: 'c1', author: 'DocM', time: '1h ago', tone: 'neutral', text: 'Сначала отключи вторую линию.' }]
  },
  {
    id: 'p10',
    name: 'LOWER HALL',
    xPct: 10.389,
    yPct: 55.067,
    question: 'Что находится внизу по коридору?',
    description: 'Темнее, чем в остальных местах. Сканер ловит холодные пятна.',
    comments: [{ id: 'c1', author: 'OldTimer', time: '2d ago', tone: 'bad', text: 'Если слышишь капли — разворачивайся.' }]
  },
  {
    id: 'p11',
    name: 'EXIT CHAMBER',
    xPct: 8.267,
    yPct: 88.984,
    question: 'Как открыть финальную дверь?',
    description: 'Замок механический, но рядом есть аварийный рычаг.',
    comments: [{ id: 'c1', author: 'CleanHands', time: '30m ago', tone: 'good', text: 'Не дёргай рычаг дважды.' }]
  }
];

const REQUIRED: Record<string, string> = {
  p1: '↑↓↓↑→←',
  p2: '→→↓↑←→',
  p3: '↑→↓←↑↓',
  p4: '↓↓→↑←→',
  p5: '←→←↑↓→',
  p6: '↑↑→↓↓←',
  p7: '↓←↓→↑←',
  p8: '→↓→←↑↓',
  p9: '↑←↑→↓→',
  p10: '↓↓←↑→←',
  p11: '→→↑←↓↑→→↑←↓←↓↑↓↑↑↑'
};

const UNLOCK_ORDER: string[] = ['p1', 'p5', 'p9', 'p10', 'p2', 'p3', 'p6', 'p7', 'p8', 'p4', 'p11'];

const ARROW_TO_SYMBOL: Record<string, string> = {
  ArrowUp: '↑',
  ArrowDown: '↓',
  ArrowLeft: '←',
  ArrowRight: '→'
};

const MASK_INDICES: Record<string, number[]> = {
  p1: [],
  p2: [],
  p3: [1, 3, 5],
  p4: [],
  p5: [],
  p6: [],
  p7: [],
  p8: [],
  p9: [],
  p10: [1, 3, 5],
  p11: []
};

function VaultDwellerIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path
        d="M32 6c7 0 12 5 12 12 0 5-3 9-7 11v5h5c6 0 10 4 10 10v6H12v-6c0-6 4-10 10-10h5v-5c-4-2-7-6-7-11 0-7 5-12 12-12Z"
        stroke="rgba(0,255,0,0.9)"
        strokeWidth="3"
      />
      <path
        d="M24 24c2 2 5 3 8 3s6-1 8-3"
        stroke="rgba(0,255,0,0.6)"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function toneBadge(tone?: Comment['tone']) {
  if (tone === 'good') return 'GOOD';
  if (tone === 'bad') return 'BAD';
  return 'INFO';
}

function getNextLocationId(current: Location, dir: Dir, all: Location[]) {
  const cx = current.xPct;
  const cy = current.yPct;

  const candidates = all.filter((l) => {
    if (l.id === current.id) return false;
    if (dir === 'right') return l.xPct > cx + 0.01;
    if (dir === 'left') return l.xPct < cx - 0.01;
    if (dir === 'down') return l.yPct > cy + 0.01;
    return l.yPct < cy - 0.01;
  });

  if (candidates.length === 0) return null;

  let best = candidates[0];
  let bestScore = Infinity;

  for (const l of candidates) {
    const dx = l.xPct - cx;
    const dy = l.yPct - cy;

    const primary = dir === 'right' ? dx : dir === 'left' ? -dx : dir === 'down' ? dy : -dy;
    const lateral = dir === 'right' || dir === 'left' ? Math.abs(dy) : Math.abs(dx);
    const score = primary * 1.0 + lateral * 0.9;

    if (score < bestScore) {
      bestScore = score;
      best = l;
    }
  }

  return best.id;
}

function maskCode(locId: string, code: string) {
  const hide = new Set(MASK_INDICES[locId] ?? []);
  return code
    .split('')
    .map((ch, i) => (hide.has(i) ? '*' : ch))
    .join('');
}

function formatMMSS(totalSeconds: number) {
  const mm = Math.max(0, Math.floor(totalSeconds / 60));
  const ss = Math.max(0, totalSeconds % 60);
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

export function MapTab() {
  const initialUnlockedId = UNLOCK_ORDER[0] ?? LOCATIONS[0].id;

  const buildInitialStateById = () => {
    const map: Record<string, NodeState> = {};
    for (const l of LOCATIONS) map[l.id] = 'locked';
    map[initialUnlockedId] = 'unlocked';
    return map;
  };

  const buildInitialSolved = () => {
    const map: Record<string, boolean> = {};
    for (const l of LOCATIONS) map[l.id] = false;
    return map;
  };

  const buildFreshState = (): PersistedGameState => ({
    stateById: buildInitialStateById(),
    solvedById: buildInitialSolved(),
    selectedId: initialUnlockedId,
    answerByLoc: {},
    feedbackByLoc: {},
    endAtMs: null,
    isStarted: false,
    isGameOver: false
  });

  const readStoredState = (): PersistedGameState => {
    if (typeof window === 'undefined') return buildFreshState();

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return buildFreshState();

      const parsed = JSON.parse(raw) as Partial<PersistedGameState>;
      const fallback = buildFreshState();

      const endAtMs =
        typeof parsed.endAtMs === 'number' && Number.isFinite(parsed.endAtMs)
          ? parsed.endAtMs
          : null;

      const isStarted = Boolean(parsed.isStarted);
      const isExpired = isStarted && endAtMs !== null ? Date.now() >= endAtMs : false;

      return {
        stateById: parsed.stateById ?? fallback.stateById,
        solvedById: parsed.solvedById ?? fallback.solvedById,
        selectedId: parsed.selectedId ?? fallback.selectedId,
        answerByLoc: parsed.answerByLoc ?? fallback.answerByLoc,
        feedbackByLoc: parsed.feedbackByLoc ?? fallback.feedbackByLoc,
        endAtMs,
        isStarted,
        isGameOver: Boolean(parsed.isGameOver) || isExpired
      };
    } catch {
      return buildFreshState();
    }
  };

  const initialPersisted = readStoredState();

  const [stateById, setStateById] = useState<Record<string, NodeState>>(initialPersisted.stateById);
  const [solvedById, setSolvedById] = useState<Record<string, boolean>>(initialPersisted.solvedById);
  const [selectedId, setSelectedId] = useState<string | null>(initialPersisted.selectedId);
  const [answerByLoc, setAnswerByLoc] = useState<Record<string, string>>(initialPersisted.answerByLoc);
  const [feedbackByLoc, setFeedbackByLoc] = useState<Record<string, string>>(initialPersisted.feedbackByLoc);
  const [endAtMs, setEndAtMs] = useState<number | null>(initialPersisted.endAtMs);
  const [isStarted, setIsStarted] = useState<boolean>(initialPersisted.isStarted);
  const [timeLeftSec, setTimeLeftSec] = useState<number>(() => {
    if (!initialPersisted.isStarted || initialPersisted.endAtMs === null) return GAME_DURATION_SEC;
    return Math.max(0, Math.ceil((initialPersisted.endAtMs - Date.now()) / 1000));
  });
  const [isGameOver, setIsGameOver] = useState<boolean>(initialPersisted.isGameOver);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const tickIntervalRef = useRef<number | null>(null);

  const selected = useMemo(() => LOCATIONS.find((l) => l.id === selectedId) ?? null, [selectedId]);
  const dwellerPos = selected ?? LOCATIONS[0];

  const selectedState: NodeState = selected ? stateById[selected.id] ?? 'locked' : 'locked';
  const isSelectedUnlocked = selectedState === 'unlocked';
  const isFinalNodeSolved = !!solvedById[FINAL_NODE_ID];

  const fullRequiredCode = selected ? (REQUIRED[selected.id] ?? '') : '';
  const displayedCode = selected
    ? isFinalNodeSolved
      ? FINAL_SECRET_CODE
      : maskCode(selected.id, fullRequiredCode)
    : '';

  const currentAnswer = selected ? (answerByLoc[selected.id] ?? '') : '';

  useEffect(() => {
    const safeState: PersistedGameState = {
      stateById,
      solvedById,
      selectedId,
      answerByLoc,
      feedbackByLoc,
      endAtMs,
      isStarted,
      isGameOver
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(safeState));
  }, [stateById, solvedById, selectedId, answerByLoc, feedbackByLoc, endAtMs, isStarted, isGameOver]);

  const playSingleTick = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }

      const ctx = audioCtxRef.current;

      if (ctx.state === 'suspended') {
        void ctx.resume();
      }

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = 'square';
      oscillator.frequency.value = 1200;

      gainNode.gain.setValueAtTime(0.0001, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.02, ctx.currentTime + 0.003);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.06);
    } catch {}
  };

  const startTicking = () => {
    if (tickIntervalRef.current !== null) return;

    playSingleTick();

    tickIntervalRef.current = window.setInterval(() => {
      playSingleTick();
    }, 1000);
  };

  const stopTicking = () => {
    if (tickIntervalRef.current !== null) {
      window.clearInterval(tickIntervalRef.current);
      tickIntervalRef.current = null;
    }
  };

  const handleStart = () => {
    if (isStarted || isGameOver) return;

    const newEndAtMs = Date.now() + GAME_DURATION_SEC * 1000;
    setIsStarted(true);
    setEndAtMs(newEndAtMs);
    setTimeLeftSec(GAME_DURATION_SEC);
    setIsGameOver(false);
  };

  const resetGame = () => {
    const fresh = buildFreshState();

    setStateById(fresh.stateById);
    setSolvedById(fresh.solvedById);
    setSelectedId(fresh.selectedId);
    setAnswerByLoc(fresh.answerByLoc);
    setFeedbackByLoc(fresh.feedbackByLoc);
    setEndAtMs(fresh.endAtMs);
    setIsStarted(fresh.isStarted);
    setIsGameOver(fresh.isGameOver);
    setTimeLeftSec(GAME_DURATION_SEC);

    window.localStorage.removeItem(STORAGE_KEY);
  };

  useEffect(() => {
    if (!isStarted || endAtMs === null) {
      setTimeLeftSec(GAME_DURATION_SEC);
      return;
    }

    const updateLeft = () => {
      const left = Math.max(0, Math.ceil((endAtMs - Date.now()) / 1000));
      setTimeLeftSec(left);

      if (left <= 0) {
        setIsGameOver(true);
      }
    };

    updateLeft();
    if (isGameOver) return;

    const t = window.setInterval(updateLeft, 1000);
    return () => window.clearInterval(t);
  }, [endAtMs, isStarted, isGameOver]);

  useEffect(() => {
    if (!isStarted || isGameOver) {
      stopTicking();
      return;
    }

    startTicking();

    return () => {
      stopTicking();
    };
  }, [isStarted, isGameOver]);

  useEffect(() => {
    return () => {
      stopTicking();

      if (audioCtxRef.current) {
        void audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
    };
  }, []);

  const selectLocation = (id: string) => {
    if (isGameOver) return;
    if ((stateById[id] ?? 'locked') !== 'unlocked') return;
    setSelectedId(id);
  };

  const unlockNextAfter = (locId: string) => {
    const idx = UNLOCK_ORDER.indexOf(locId);
    const nextId = idx >= 0 ? UNLOCK_ORDER[idx + 1] : null;
    if (!nextId) return null;

    setStateById((prev) => {
      if (prev[nextId] === 'unlocked') return prev;
      return { ...prev, [nextId]: 'unlocked' };
    });

    return nextId;
  };

  const handleSubmit = () => {
    if (!isStarted || isGameOver) return;
    if (!selected) return;
    if (!isSelectedUnlocked) return;

    const expected = REQUIRED[selected.id] ?? '';
    const given = (answerByLoc[selected.id] ?? '').trim();

    if (!expected) {
      setFeedbackByLoc((p) => ({ ...p, [selected.id]: 'NO CODE SET' }));
      return;
    }

    if (given === expected) {
      const isFinal = selected.id === FINAL_NODE_ID;

      setFeedbackByLoc((p) => ({
        ...p,
        [selected.id]: isFinal ? 'FINAL ACCESS GRANTED' : 'ACCESS GRANTED'
      }));

      setSolvedById((p) => ({ ...p, [selected.id]: true }));

      if (isFinal) {
        setSelectedId(FINAL_NODE_ID);
        return;
      }

      const nextId = unlockNextAfter(selected.id);
      if (nextId) setSelectedId(nextId);

      return;
    }

    setFeedbackByLoc((p) => ({ ...p, [selected.id]: 'WRONG SEQUENCE' }));
  };

  const getNextUnlockedId = (from: Location, dir: Dir) => {
    let cur = from;
    for (let i = 0; i < LOCATIONS.length; i++) {
      const nextId = getNextLocationId(cur, dir, LOCATIONS);
      if (!nextId) return null;

      const nextLoc = LOCATIONS.find((l) => l.id === nextId);
      if (!nextLoc) return null;

      if ((stateById[nextId] ?? 'locked') === 'unlocked') return nextId;
      cur = nextLoc;
    }
    return null;
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!isStarted || isGameOver) return;

      const key = e.key;
      const code = e.code;
      const isMoveKey = code === 'KeyW' || code === 'KeyA' || code === 'KeyS' || code === 'KeyD';

      if (isMoveKey && selected) {
        e.preventDefault();

        const dir: Dir =
          code === 'KeyW'
            ? 'up'
            : code === 'KeyS'
              ? 'down'
              : code === 'KeyA'
                ? 'left'
                : 'right';

        const nextId = getNextUnlockedId(selected, dir);
        if (nextId) setSelectedId(nextId);
        return;
      }

      if (key in ARROW_TO_SYMBOL) {
        e.preventDefault();
        if (!selected || !isSelectedUnlocked || isFinalNodeSolved) return;

        setAnswerByLoc((p) => {
          const cur = p[selected.id] ?? '';
          if (cur.length >= MAX_CODE_LENGTH) return p;
          return { ...p, [selected.id]: cur + ARROW_TO_SYMBOL[key] };
        });

        setFeedbackByLoc((p) => ({ ...p, [selected.id]: '' }));
        return;
      }

      if (key === 'Backspace') {
        e.preventDefault();
        if (!selected || !isSelectedUnlocked || isFinalNodeSolved) return;

        setAnswerByLoc((p) => {
          const cur = p[selected.id] ?? '';
          return { ...p, [selected.id]: cur.slice(0, -1) };
        });
        setFeedbackByLoc((p) => ({ ...p, [selected.id]: '' }));
        return;
      }

      if (key === 'Enter') {
        e.preventDefault();
        if (isFinalNodeSolved) return;
        handleSubmit();
      }
    };

    window.addEventListener('keydown', onKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', onKeyDown as any);
  }, [selected, isSelectedUnlocked, stateById, answerByLoc, isGameOver, isFinalNodeSolved, isStarted]);

  return (
    <div className="grid grid-cols-3 gap-4 h-full">
      <style>{`
        @keyframes pipPulse {
          0%   { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
          60%  { transform: translate(-50%, -50%) scale(2.8); opacity: 0; }
          100% { transform: translate(-50%, -50%) scale(2.8); opacity: 0; }
        }
        @keyframes pipCoreGlow {
          0%,100% { box-shadow: 0 0 10px rgba(0,255,0,0.6); }
          50%     { box-shadow: 0 0 18px rgba(0,255,0,0.95); }
        }
      `}</style>

      {isGameOver &&
        createPortal(
          <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 999999 }} role="dialog" aria-modal="true">
            <div
              className="absolute inset-0"
              style={{
                background: 'rgba(0,0,0,0.85)',
                backdropFilter: 'blur(3px)'
              }}
            />
            <div
              className="relative border border-green-400/40 bg-black p-8"
              style={{
                width: 520,
                maxWidth: '90vw',
                boxShadow: '0 0 40px rgba(0,255,0,0.25)'
              }}
            >
              <div className="text-4xl tracking-wider mb-3" style={{ textShadow: '0 0 20px rgba(0,255,0,0.6)' }}>
                GAME OVER
              </div>

              <div className="text-xs opacity-70 mb-6">TIME EXPIRED</div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={resetGame}
                  className="text-xs border border-green-400/30 px-4 py-2 hover:opacity-100 opacity-80"
                >
                  RESTART
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      <div className="col-span-2 border border-green-400/30 p-4 relative">
        <div className="flex items-end justify-between gap-3 mb-3">
          <div>
            <div className="text-lg tracking-wider" style={{ textShadow: '0 0 10px rgba(0, 255, 0, 0.5)' }}>
              {'>'} CAPITAL WASTELAND
            </div>
            <div className="mt-1 text-[11px] opacity-70">
              Controls: <span className="opacity-90">WASD / ЦФЫВ</span> move • <span className="opacity-90">Arrow keys</span> enter code •{' '}
              <span className="opacity-90">Backspace</span> delete • <span className="opacity-90">Enter</span> submit
            </div>
          </div>

          <div
            className="border border-green-400/20 px-4 py-2"
            style={{
              fontSize: 28,
              lineHeight: '28px',
              letterSpacing: '0.08em',
              color: 'rgba(190,255,190,0.98)',
              textShadow: '0 0 18px rgba(0,255,0,0.45)',
              opacity: isStarted ? 1 : 0.55
            }}
            title="Time left"
          >
            {formatMMSS(timeLeftSec)}
          </div>
        </div>

        <div className="relative w-full aspect-square border border-green-400/20 bg-black overflow-hidden">
          {!isStarted && !isGameOver ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="border border-green-400/30 bg-black/80 px-8 py-6 text-center">
                <div
                  className="text-xl tracking-wider mb-3"
                  style={{ textShadow: '0 0 12px rgba(0,255,0,0.45)' }}
                >
                  {'>'} READY TO START
                </div>

                <div className="text-xs opacity-70 mb-5">
                  Press START to reveal the map and begin countdown.
                </div>

                <button
                  type="button"
                  onClick={handleStart}
                  className="text-xs border border-green-400/30 px-5 py-2 hover:opacity-100 opacity-80"
                >
                  START
                </button>
              </div>
            </div>
          ) : (
            <>
              <img
                src={MAP_SRC}
                alt="Wasteland Map"
                className="absolute inset-0 w-full h-full object-contain select-none pointer-events-none"
                style={{ filter: 'drop-shadow(0 0 12px rgba(0,255,0,0.25))' }}
              />

              <div className="absolute inset-0">
                {LOCATIONS.map((loc) => {
                  const s: NodeState = stateById[loc.id] ?? 'locked';
                  const isActive = loc.id === selectedId;
                  const isUnlocked = s === 'unlocked';
                  const isSolved = !!solvedById[loc.id];

                  const border = isUnlocked ? '2px solid rgba(180,255,180,0.9)' : '2px solid rgba(255,255,255,0.85)';
                  const bg = isUnlocked
                    ? 'radial-gradient(circle, rgba(0,255,0,1) 0%, rgba(0,255,0,0.8) 40%, rgba(0,120,0,0.4) 100%)'
                    : 'radial-gradient(circle, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.10) 45%, rgba(0,0,0,0) 100%)';

                  return (
                    <button
                      key={loc.id}
                      type="button"
                      onClick={() => selectLocation(loc.id)}
                      className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition"
                      style={{
                        left: `${loc.xPct}%`,
                        top: `${loc.yPct}%`,
                        width: isActive ? 22 : 20,
                        height: isActive ? 22 : 20,
                        cursor: isUnlocked && !isGameOver ? 'pointer' : 'not-allowed',
                        opacity: isUnlocked ? 1 : 0.65
                      }}
                      aria-label={`Open location ${loc.name}`}
                      title={isUnlocked ? `${loc.name}${isSolved ? ' (SOLVED)' : ''}` : 'LOCKED'}
                      disabled={isGameOver}
                    >
                      {isUnlocked && (
                        <span
                          className="absolute left-1/2 top-1/2 rounded-full pointer-events-none"
                          style={{
                            width: 30,
                            height: 30,
                            border: '1px solid rgba(0,255,0,0.7)',
                            animation: 'pipPulse 1.8s ease-out infinite'
                          }}
                        />
                      )}

                      <span
                        className="absolute inset-0 rounded-full"
                        style={{
                          background: bg,
                          border,
                          animation: isUnlocked ? 'pipCoreGlow 2s ease-in-out infinite' : undefined,
                          boxShadow: isUnlocked ? '0 0 8px rgba(0,255,0,0.7), 0 0 20px rgba(0,255,0,0.4)' : 'none'
                        }}
                      />
                    </button>
                  );
                })}

                <div
                  className="absolute -translate-x-1/2 -translate-y-full pointer-events-none"
                  style={{
                    left: `${dwellerPos.xPct}%`,
                    top: `${dwellerPos.yPct}%`,
                    transition: 'left 450ms ease, top 450ms ease',
                    filter: 'drop-shadow(0 0 10px rgba(0,255,0,0.45))'
                  }}
                >
                  <VaultDwellerIcon />
                </div>
              </div>

              <div
                className="absolute inset-0 pointer-events-none opacity-10"
                style={{
                  backgroundImage: 'linear-gradient(to bottom, rgba(0,255,0,0.12) 1px, transparent 1px)',
                  backgroundSize: '100% 6px'
                }}
              />

              <div className="absolute top-2 left-1/2 -translate-x-1/2 text-xs opacity-50">N</div>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs opacity-50">S</div>
              <div className="absolute left-2 top-1/2 -translate-y-1/2 text-xs opacity-50">W</div>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs opacity-50">E</div>
            </>
          )}
        </div>
      </div>

      <div className="border border-green-400/30 p-4 flex flex-col">
        <div className="text-lg mb-4 tracking-wider" style={{ textShadow: '0 0 10px rgba(0, 255, 0, 0.5)' }}>
          {'>'} LOCATION
        </div>

        {selected ? (
          <div className="flex flex-col gap-4 h-full">
            <div className="tracking-wider">
              <div className="text-base flex items-center justify-between gap-2">
                <span>{selected.name}</span>
                <span className="text-[10px] border border-green-400/20 px-2 py-[1px] opacity-80">
                  {selectedState.toUpperCase()}
                  {solvedById[selected.id] ? ' • SOLVED' : ''}
                </span>
              </div>
              <div className="text-xs opacity-60">NODE: {selected.id}</div>
            </div>

            <div className="border border-green-400/20 p-3">
              <div className="text-xs opacity-60 mb-1">QUESTION</div>
              <div className="text-sm leading-snug">{selected.question}</div>
            </div>

            <div className="border border-green-400/20 p-3">
              <div className="text-xs opacity-60 mb-1">DESCRIPTION</div>
              <div className="text-xs leading-relaxed opacity-90">{selected.description}</div>
            </div>

            <div className="border border-green-400/20 p-3">
              <div className="text-xs opacity-60 mb-2">{isFinalNodeSolved ? 'FINAL CODE' : 'CODE'}</div>
              <div
                style={{
                  fontSize: 34,
                  lineHeight: '34px',
                  letterSpacing: '0.28em',
                  color: 'rgba(190,255,190,0.98)',
                  textShadow: '0 0 18px rgba(0,255,0,0.50)',
                  opacity: isFinalNodeSolved ? 1 : isSelectedUnlocked ? 1 : 0.45
                }}
              >
                {displayedCode || '—'}
              </div>
            </div>

            <div className="border border-green-400/20 p-3">
              <div className="text-xs opacity-60 mb-2">YOUR ANSWER</div>

              <div
                className="w-full bg-black/40 border border-green-400/20 px-3 py-3 select-none"
                style={{
                  color: 'rgba(190,255,190,0.95)',
                  minHeight: 56,
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: 28,
                  lineHeight: '28px',
                  letterSpacing: '0.22em',
                  opacity: !isStarted || isFinalNodeSolved ? 0.35 : isSelectedUnlocked ? 1 : 0.35
                }}
                title={
                  !isStarted
                    ? 'Press START first'
                    : isFinalNodeSolved
                      ? 'Final code unlocked'
                      : isSelectedUnlocked
                        ? 'Use arrow keys to input code'
                        : 'Locked'
                }
              >
                {!isStarted ? (
                  <span style={{ opacity: 0.6 }}>PRESS START…</span>
                ) : isFinalNodeSolved ? (
                  <span style={{ opacity: 0.6 }}>FINAL CODE UNLOCKED</span>
                ) : currentAnswer.length ? (
                  <span>{currentAnswer}</span>
                ) : (
                  <span style={{ opacity: 0.6 }}>TYPE ARROWS…</span>
                )}
              </div>

              <div className="mt-2 flex items-center justify-between gap-2">
                <div className="text-[10px] opacity-50">
                  {!isStarted
                    ? 'Press START to begin.'
                    : isFinalNodeSolved
                      ? 'Sequence complete.'
                      : isSelectedUnlocked
                        ? `Arrow keys input code (max ${MAX_CODE_LENGTH}).`
                        : 'Solve previous nodes.'}
                </div>

                <button
                  type="button"
                  className="text-xs border border-green-400/30 px-3 py-1 opacity-80 hover:opacity-100"
                  disabled={!isStarted || !isSelectedUnlocked || isGameOver || isFinalNodeSolved}
                  onClick={handleSubmit}
                  style={{
                    opacity: isStarted && isSelectedUnlocked && !isGameOver && !isFinalNodeSolved ? undefined : 0.35,
                    cursor: isStarted && isSelectedUnlocked && !isGameOver && !isFinalNodeSolved ? 'pointer' : 'not-allowed'
                  }}
                >
                  SUBMIT
                </button>
              </div>

              <div className="mt-2 text-[10px] opacity-70">{feedbackByLoc[selected.id] ? feedbackByLoc[selected.id] : ''}</div>
            </div>

            <div className="border border-green-400/20 p-3 flex-1 overflow-auto">
              <div className="text-xs opacity-60 mb-2">FIELD NOTES</div>
              <div className="flex flex-col gap-2">
                {selected.comments.map((c) => (
                  <div key={c.id} className="border border-green-400/10 p-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-[11px] opacity-80">{c.author}</div>
                      <div className="flex items-center gap-2">
                        <div className="text-[10px] opacity-50">{c.time}</div>
                        <div className="text-[10px] border border-green-400/20 px-2 py-[1px] opacity-70" title={c.tone ?? 'neutral'}>
                          {toneBadge(c.tone)}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs leading-snug opacity-90 mt-1">{c.text}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center opacity-50 text-xs text-center leading-relaxed">
            NO LOCATION DATA
            <br />
            AVAILABLE
          </div>
        )}
      </div>
    </div>
  );
}