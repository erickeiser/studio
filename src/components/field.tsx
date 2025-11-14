import type React from 'react';
import type { Player, Route } from '@/lib/types';
import { PlayerIcon } from '@/components/player-icon';

interface FieldProps {
  players: Player[];
  routes: Route[];
  drawingPath: string | null;
  drawingStyle: 'solid' | 'dashed';
  drawingColor: string;
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseUp: (e: React.MouseEvent<HTMLDivElement>) => void;
  onPlayerMouseDown: (e: React.MouseEvent<HTMLDivElement>, id: string) => void;
}

export function Field({
  players,
  routes,
  drawingPath,
  drawingStyle,
  drawingColor,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onPlayerMouseDown,
}: FieldProps) {
  const fieldWidth = 533.33;
  const fieldHeight = 800;

  const FieldSVG = () => (
    <svg
      className="absolute inset-0 h-full w-full"
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${fieldWidth} ${fieldHeight}`}
      preserveAspectRatio="xMidYMid meet"
    >
      <rect width={fieldWidth} height={fieldHeight} fill={'hsl(var(--primary))'} />
      
      {/* Yard Lines */}
      {[...Array(15)].map((_, i) => {
        const y = 50 + i * 50;
        const isMajor = (i + 1) % 2 !== 0; // Every 10 yards
        return (
          <line
            key={i}
            x1="0"
            y1={y}
            x2={fieldWidth}
            y2={y}
            stroke={"hsl(var(--primary-foreground))"}
            strokeWidth={isMajor ? "2" : "1"}
            strokeOpacity={isMajor ? "0.7" : "0.5"}
          />
        );
      })}
    </svg>
  );

  return (
    <div
      className="relative w-full aspect-[53.33/80] touch-none select-none bg-primary rounded-lg overflow-hidden shadow-lg"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      <FieldSVG />
      <svg
        className="absolute inset-0 h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
        viewBox={`0 0 ${fieldWidth} ${fieldHeight}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {routes.map(route => (
          <path
            key={route.id}
            d={route.path}
            stroke={route.color}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={route.style === 'dashed' ? '10,10' : 'none'}
          />
        ))}
        {drawingPath && (
          <path
            d={drawingPath}
            stroke={drawingColor}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={drawingStyle === 'dashed' ? '10,10' : 'none'}
          />
        )}
      </svg>
      {players.map(player => (
        <PlayerIcon
          key={player.id}
          player={player}
          onMouseDown={onPlayerMouseDown}
        />
      ))}
    </div>
  );
}
