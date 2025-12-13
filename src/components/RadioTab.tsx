import { Radio, Play, Pause, Volume2, Signal } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface Station {
  id: number;
  name: string;
  frequency: string;
  signal: number;
  description: string;
  streamUrl: string;
}

export function RadioTab() {
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(75);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stations: Station[] = [
    {
      id: 1,
      name: 'Lost FM',
      frequency: '101.9 FM',
      signal: 95,
      description: 'Are you remember?',
      streamUrl: '/tracks/1.mp3',
    },
 
  ];

  // Громкость
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  const handleSelectStation = (station: Station) => {
    setSelectedStation(station);
    setIsPlaying(false);

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const handlePlayPause = async () => {
    if (!selectedStation || !audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        console.error('Error playing audio:', error);
        setIsPlaying(false);
      }
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Аудио-элемент */}
      <audio
        ref={audioRef}
        src={selectedStation?.streamUrl || ''}
        preload="auto"
        loop
        onEnded={() => setIsPlaying(false)}
      />

      <div
        className="text-lg mb-4 tracking-wider"
        style={{ textShadow: '0 0 10px rgba(0, 255, 0, 0.5)' }}
      >
        {'>'} РАДИО СТАНЦИИ
      </div>

      {/* Список станций */}
      <div className="flex-1 space-y-2 mb-6 overflow-auto">
        {stations.map((station) => (
          <button
            key={station.id}
            onClick={() => handleSelectStation(station)}
            className={`w-full text-left p-4 border transition-all ${
              selectedStation?.id === station.id
                ? 'border-green-400 bg-green-400/10'
                : 'border-green-400/30 hover:border-green-400/50'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4" />
                <div>
                  <div className="text-sm tracking-wider">{station.name}</div>
                  <div className="text-xs opacity-60 mt-1">
                    {station.frequency}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Signal className="w-3 h-3 opacity-50" />
                <span className="text-xs opacity-60">{station.signal}%</span>
              </div>
            </div>

            {/* Signal Strength Bar */}
            <div className="w-full h-1 bg-green-400/10 mt-2">
              <div
                className="h-full bg-green-400 transition-all"
                style={{
                  width: `${station.signal}%`,
                  boxShadow: '0 0 5px rgba(0, 255, 0, 0.5)',
                }}
              />
            </div>
          </button>
        ))}
      </div>

      {/* Панель управления */}
      <div className="border-t border-green-400/30 pt-4 space-y-4">
        {selectedStation ? (
          <>
            <div className="text-sm opacity-80 leading-relaxed">
              {selectedStation.description}
            </div>

            {/* Now Playing */}
            <div className="border border-green-400/30 p-3">
              <div className="text-xs opacity-60 mb-1">NOW TUNED TO:</div>
              <div className="tracking-wider">{selectedStation.name}</div>
              <div className="text-xs opacity-60 mt-1">
                {selectedStation.frequency}
              </div>
            </div>

            {/* Кнопка Play/Pause */}
            <div className="flex items-center gap-4">
              <button
                onClick={handlePlayPause}
                disabled={!selectedStation}
                className="flex-1 p-3 border border-green-400/50 hover:bg-green-400/10 disabled:opacity-40 disabled:hover:bg-transparent transition-all flex items-center justify-center gap-2"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4" />
                    <span>PAUSE</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>PLAY</span>
                  </>
                )}
              </button>
            </div>

            {/* Громкость */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4" />
                  <span>VOLUME</span>
                </div>
                <span>{volume}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-full h-2 appearance-none bg-green-400/10 outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-green-400 [&::-webkit-slider-thumb]:cursor-pointer"
                style={{
                  background: `linear-gradient(to right, rgba(0, 255, 0, 0.3) 0%, rgba(0, 255, 0, 0.3) ${volume}%, rgba(0, 255, 0, 0.1) ${volume}%, rgba(0, 255, 0, 0.1) 100%)`,
                }}
              />
            </div>

            {/* Статус */}
            {isPlaying && (
              <div className="flex items-center gap-2 text-xs opacity-70 animate-pulse">
                <div
                  className="w-2 h-2 bg-green-400 rounded-full"
                  style={{
                    boxShadow: '0 0 5px rgba(0, 255, 0, 0.7)',
                  }}
                />
                <span>BROADCASTING</span>
              </div>
            )}
          </>
        ) : (
          <div className="h-32 flex items-center justify-center opacity-50 text-sm">
            SELECT A STATION
          </div>
        )}
      </div>
    </div>
  );
}
