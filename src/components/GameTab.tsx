import { useState, useEffect, useRef } from 'react';
import { Bird, Trophy, RotateCcw, Zap } from 'lucide-react';

interface Pipe {
  id: number;
  x: number;
  gapY: number;
  passed: boolean;
}

interface BirdState {
  y: number;
  velocity: number;
}

export function GameTab() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [score, setScore] = useState(0);

  // Sticky drawer снизу
  const [showSecretModal, setShowSecretModal] = useState(false);

  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('pipboy-flappy-highscore');
    return saved ? parseInt(saved) : 0;
  });

  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const BIRD_SIZE = 20;
  const PIPE_WIDTH = 60;
  const PIPE_GAP = 150;
  const GRAVITY = 0.5;
  const JUMP_STRENGTH = -8;
  const PIPE_SPEED = 3;
  const GROUND_HEIGHT = 50;

  const animationFrameRef = useRef<number>();
  const pipeIdRef = useRef(0);
  const scoreRef = useRef(0);

  // Показать ачивку только один раз за раунд
  const achievementShownRef = useRef(false);

  const birdRef = useRef<BirdState>({ y: CANVAS_HEIGHT / 2, velocity: 0 });
  const pipesRef = useRef<Pipe[]>([]);
  const lastPipeTimeRef = useRef(0);

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    scoreRef.current = 0;

    achievementShownRef.current = false;
    setShowSecretModal(false);

    birdRef.current = { y: CANVAS_HEIGHT / 2, velocity: 0 };
    pipesRef.current = [];
    lastPipeTimeRef.current = 0;
    pipeIdRef.current = 0;
  };

  const handleJump = () => {
    if (gameState === 'playing') {
      birdRef.current.velocity = JUMP_STRENGTH;
    }
  };

  const handleCanvasClick = () => {
    if (gameState === 'playing') handleJump();
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' && gameState === 'playing') {
        e.preventDefault();
        handleJump();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState]);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameCount = 0;

    const gameLoop = () => {
      frameCount++;

      // Clear canvas
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Update bird physics
      birdRef.current.velocity += GRAVITY;
      birdRef.current.y += birdRef.current.velocity;

      // Draw bird
      ctx.fillStyle = '#00ff00';
      ctx.fillRect(100 - BIRD_SIZE / 2, birdRef.current.y - BIRD_SIZE / 2, BIRD_SIZE, BIRD_SIZE);

      // Draw bird eye
      ctx.fillStyle = '#000000';
      ctx.fillRect(
        100 - BIRD_SIZE / 4,
        birdRef.current.y - BIRD_SIZE / 4,
        BIRD_SIZE / 4,
        BIRD_SIZE / 4
      );

      // Spawn new pipes
      if (frameCount - lastPipeTimeRef.current > 90) {
        const gapY = Math.random() * (CANVAS_HEIGHT - PIPE_GAP - GROUND_HEIGHT - 100) + 50;
        pipesRef.current.push({
          id: pipeIdRef.current++,
          x: CANVAS_WIDTH,
          gapY,
          passed: false,
        });
        lastPipeTimeRef.current = frameCount;
      }

      // Update and draw pipes
      pipesRef.current = pipesRef.current.filter((pipe) => {
        pipe.x -= PIPE_SPEED;

        // Pipe passed
        if (!pipe.passed && pipe.x + PIPE_WIDTH < 100) {
          pipe.passed = true;

          const newScore = scoreRef.current + 1;
          scoreRef.current = newScore;
          setScore(newScore);

          // Открываем sticky drawer при достижении 15
          if (newScore >= 15 && !achievementShownRef.current) {
            achievementShownRef.current = true;
            setShowSecretModal(true);
          }
        }

        // Draw top pipe
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.gapY);
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.strokeRect(pipe.x, 0, PIPE_WIDTH, pipe.gapY);

        // Draw bottom pipe
        ctx.fillRect(
          pipe.x,
          pipe.gapY + PIPE_GAP,
          PIPE_WIDTH,
          CANVAS_HEIGHT - pipe.gapY - PIPE_GAP - GROUND_HEIGHT
        );
        ctx.strokeRect(
          pipe.x,
          pipe.gapY + PIPE_GAP,
          PIPE_WIDTH,
          CANVAS_HEIGHT - pipe.gapY - PIPE_GAP - GROUND_HEIGHT
        );

        return pipe.x > -PIPE_WIDTH;
      });

      // Draw ground
      ctx.fillStyle = '#00ff00';
      ctx.fillRect(0, CANVAS_HEIGHT - GROUND_HEIGHT, CANVAS_WIDTH, GROUND_HEIGHT);

      // Ground pattern
      for (let i = 0; i < CANVAS_WIDTH; i += 20) {
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(i, CANVAS_HEIGHT - GROUND_HEIGHT);
        ctx.lineTo(i, CANVAS_HEIGHT);
        ctx.stroke();
      }

      // Collisions
      let collision = false;

      if (
        birdRef.current.y - BIRD_SIZE / 2 < 0 ||
        birdRef.current.y + BIRD_SIZE / 2 > CANVAS_HEIGHT - GROUND_HEIGHT
      ) {
        collision = true;
      }

      pipesRef.current.forEach((pipe) => {
        const birdLeft = 100 - BIRD_SIZE / 2;
        const birdRight = 100 + BIRD_SIZE / 2;
        const birdTop = birdRef.current.y - BIRD_SIZE / 2;
        const birdBottom = birdRef.current.y + BIRD_SIZE / 2;

        if (birdRight > pipe.x && birdLeft < pipe.x + PIPE_WIDTH) {
          if (birdTop < pipe.gapY || birdBottom > pipe.gapY + PIPE_GAP) {
            collision = true;
          }
        }
      });

      if (collision) {
        setGameState('gameover');

        if (scoreRef.current > highScore) {
          setHighScore(scoreRef.current);
          localStorage.setItem('pipboy-flappy-highscore', scoreRef.current.toString());
        }
        return;
      }

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [
    gameState,
    highScore,
    CANVAS_WIDTH,
    CANVAS_HEIGHT,
    BIRD_SIZE,
    PIPE_WIDTH,
    PIPE_GAP,
    GRAVITY,
    JUMP_STRENGTH,
    PIPE_SPEED,
    GROUND_HEIGHT,
  ]);

  return (
    <div className="h-full flex flex-col relative">
      <div
        className="text-lg mb-4 tracking-wider"
        style={{ textShadow: '0 0 10px rgba(0, 255, 0, 0.5)' }}
      >
        {'>'} WASTELAND FLYER
      </div>

      {/* Game Info */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="border border-green-400/30 p-3 text-center">
          <div className="text-xs opacity-60 mb-1">SCORE</div>
          <div className="text-xl tracking-wider">{score}</div>
        </div>
        <div className="border border-green-400/30 p-3 text-center">
          <div className="text-xs opacity-60 mb-1">HIGH SCORE</div>
          <div className="text-xl tracking-wider">{highScore}</div>
        </div>
      </div>

      {/* Game Canvas */}
      <div className="flex-1 flex items-center justify-center border border-green-400/30 p-4 relative">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onClick={handleCanvasClick}
          className="border border-green-400/20 cursor-crosshair max-w-full max-h-full"
          style={{ backgroundColor: '#000', imageRendering: 'pixelated' }}
        />

        {/* Menu Overlay */}
        {gameState === 'menu' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="text-center space-y-6 p-8 border border-green-400/50 bg-black">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Bird className="w-8 h-8" />
                <div
                  className="text-2xl tracking-wider"
                  style={{ textShadow: '0 0 10px rgba(0, 255, 0, 0.7)' }}
                >
                  WASTELAND FLYER
                </div>
              </div>

              <div className="text-sm opacity-80 leading-relaxed max-w-md">
                <p className="mb-3">Navigate through the radioactive wasteland!</p>
                <div className="text-xs space-y-1 text-left border border-green-400/20 p-3">
                  <div className="flex items-start gap-2">
                    <Zap className="w-3 h-3 mt-0.5" />
                    <span>Click or press SPACE to fly</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Bird className="w-3 h-3 mt-0.5" />
                    <span>Avoid obstacles and the ground</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Trophy className="w-3 h-3 mt-0.5" />
                    <span>Each obstacle passed: +1 point</span>
                  </div>
                </div>
              </div>

              <button
                onClick={startGame}
                className="w-full p-4 border border-green-400/50 hover:bg-green-400/10 transition-all"
              >
                START GAME
              </button>
            </div>
          </div>
        )}

        {/* Game Over Overlay */}
        {gameState === 'gameover' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="text-center space-y-6 p-8 border border-green-400/50 bg-black">
              <div
                className="text-2xl tracking-wider mb-4 animate-pulse"
                style={{ textShadow: '0 0 10px rgba(0, 255, 0, 0.7)' }}
              >
                GAME OVER
              </div>

              <div className="space-y-3">
                <div className="border border-green-400/30 p-4">
                  <div className="text-xs opacity-60 mb-1">FINAL SCORE</div>
                  <div className="text-3xl tracking-wider">{score}</div>
                </div>

                {score === highScore && score > 0 && (
                  <div className="text-sm opacity-80 flex items-center justify-center gap-2">
                    <Trophy className="w-4 h-4" />
                    <span>NEW HIGH SCORE!</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <button
                  onClick={startGame}
                  className="w-full p-3 border border-green-400/50 hover:bg-green-400/10 transition-all flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>PLAY AGAIN</span>
                </button>
                <button
                  onClick={() => setGameState('menu')}
                  className="w-full p-3 border border-green-400/30 hover:bg-green-400/10 transition-all"
                >
                  BACK TO MENU
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sticky bottom drawer (НЕ меняет layout) */}
      <div className="pointer-events-none sticky bottom-0 left-0 right-0 mt-4">
        <div
          className={[
            'pointer-events-auto border border-green-400/40 bg-black/95',
            'transition-all duration-300 ease-out',
            showSecretModal ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0',
          ].join(' ')}
          style={{
            // при закрытом состоянии сдвигаем вниз, но элемент остаётся sticky
            // чтобы не толкать layout — он уже вне потока благодаря sticky + отсутствию max-h трюков
            boxShadow: '0 0 20px rgba(0, 255, 0, 0.25)',
          }}
        >
          {/* Содержимое drawer — когда закрыто, клики не нужны */}
          <div className={showSecretModal ? 'p-4' : 'p-0'}>

            {showSecretModal && (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div
                      className="text-sm tracking-wider"
                      style={{ textShadow: '0 0 10px rgba(0, 255, 0, 0.6)' }}
                    >
                      {'>>>'} ACHIEVEMENT UNLOCKED {'<<<'}
                    </div>
                    <div className="text-xs opacity-70 mt-2">
                      You&apos;ve successfully navigated through the wasteland. Secret code revealed:
                    </div>
                  </div>

                  <button
                    onClick={() => setShowSecretModal(false)}
                    className="shrink-0 px-4 py-2 border border-green-400/60 hover:bg-green-400/10 transition-all text-xs"
                  >
                    CLOSE
                  </button>
                </div>

                <div className="mt-4 border border-green-400/30 p-4 bg-green-400/5">
                  <div className="text-xs opacity-60 mb-2">SECRET CODE:</div>
                  <div
                    className="text-4xl tracking-widest font-bold"
                    style={{ textShadow: '0 0 15px rgba(0, 255, 0, 0.8)' }}
                  >
                    1910
                  </div>
                  <div className="text-xs opacity-60 mt-3">This code may be useful for terminal tasks...</div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Instructions */}
      {gameState === 'playing' && (
        <div className="mt-4 text-xs opacity-60 text-center">
          Click or press SPACE to fly - avoid the obstacles!
        </div>
      )}
    </div>
  );
}
