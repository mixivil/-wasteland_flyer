import { useState } from 'react';

const MAP_SRC = '/maps/frame-44.svg'; // SVG лежит в public/maps

export function MapTab() {
  // оставляем состояние, если позже понадобится
  const [hasSelection] = useState(false);

  return (
    <div className="grid grid-cols-3 gap-4 h-full">
      {/* Map Display */}
      <div className="col-span-2 border border-green-400/30 p-4 relative">
        <div
          className="text-lg mb-4 tracking-wider"
          style={{ textShadow: '0 0 10px rgba(0, 255, 0, 0.5)' }}
        >
          {'>'} CAPITAL WASTELAND
        </div>

        {/* Map Container */}
        <div className="relative w-full aspect-square border border-green-400/20 bg-black overflow-hidden">
          {/* SVG Map */}
          <img
            src={MAP_SRC}
            alt="Wasteland Map"
            className="absolute inset-0 w-full h-full object-contain select-none pointer-events-none"
            style={{
              filter: 'drop-shadow(0 0 12px rgba(0,255,0,0.25))'
            }}
          />

          {/* Scanline overlay (Pip-Boy vibe) */}
          <div
            className="absolute inset-0 pointer-events-none opacity-10"
            style={{
              backgroundImage:
                'linear-gradient(to bottom, rgba(0,255,0,0.12) 1px, transparent 1px)',
              backgroundSize: '100% 6px'
            }}
          />

          {/* Compass */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 text-xs opacity-50">N</div>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs opacity-50">S</div>
          <div className="absolute left-2 top-1/2 -translate-y-1/2 text-xs opacity-50">W</div>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs opacity-50">E</div>
        </div>
      </div>

      {/* Info Panel */}
      <div className="border border-green-400/30 p-4">
        <div
          className="text-lg mb-4 tracking-wider"
          style={{ textShadow: '0 0 10px rgba(0, 255, 0, 0.5)' }}
        >
          {'>'} LOCATION
        </div>

        {hasSelection ? (
          <div />
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
