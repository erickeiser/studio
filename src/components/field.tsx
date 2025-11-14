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
  printable?: boolean;
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
  printable = false,
}: FieldProps) {
  const FieldSVG = () => (
    <svg
      className="absolute inset-0 h-full w-full"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1200 533.33"
      preserveAspectRatio="xMidYMid meet"
    >
      <rect width="1200" height="533.33" fill={printable ? 'white' : 'hsl(var(--primary))'} />
      {/* Endzones */}
      <rect width="100" height="533.33" fill={printable ? '#e0e0e0' : 'hsl(var(--primary) / 0.8)'} />
      <rect x="1100" width="100" height="533.33" fill={printable ? '#e0e0e0' : 'hsl(var(--primary) / 0.8)'} />
      
      {/* Yard Lines */}
      {[...Array(19)].map((_, i) => {
        const x = 150 + i * 50;
        const isMajor = (i + 1) % 2 === 0;
        return (
          <line
            key={i}
            x1={x}
            y1="0"
            x2={x}
            y2="533.33"
            stroke={printable ? 'black' : "hsl(var(--primary-foreground))"}
            strokeWidth={isMajor ? "2" : "1"}
            strokeOpacity={isMajor ? "0.7" : "0.5"}
          />
        );
      })}

      {/* Yard Numbers */}
      {[10, 20, 30, 40, 50, 40, 30, 20, 10].map((num, i) => {
        const x = 200 + i * 100;
        return (
          <g key={i}>
            <text x={x} y="50" textAnchor="middle" fontSize="32" fill={printable ? 'black' : "hsl(var(--primary-foreground))"} fontWeight="bold" opacity="0.7">{num}</text>
            <text x={x} y="493.33" textAnchor="middle" fontSize="32" fill={printable ? 'black' : "hsl(var(--primary-foreground))"} fontWeight="bold" opacity="0.7" transform={`rotate(180, ${x}, 493.33)`}>{num}</text>
          </g>
        )
      })}

      {/* Hash marks */}
      {[...Array(100)].map((_, i) => {
        const x = 100 + i * 10;
        return (
          <g key={`hash-${i}`}>
            <line x1={x} y1="1" x2={x} y2="10" stroke={printable ? 'black' : "hsl(var(--primary-foreground))"} strokeWidth="2" opacity="0.6" />
            <line x1={x} y1="523.33" x2={x} y2="532.33" stroke={printable ? 'black' : "hsl(var(--primary-foreground))"} strokeWidth="2" opacity="0.6" />
            <line x1={x} y1="177.77" x2={x} y2="187.77" stroke={printable ? 'black' : "hsl(var(--primary-foreground))"} strokeWidth="2" opacity="0.6" />
            <line x1={x} y1="345.56" x2={x} y2="355.56" stroke={printable ? 'black' : "hsl(var(--primary-foreground))"} strokeWidth="2" opacity="0.6" />
          </g>
        )
      })}
    </svg>
  );

  return (
    <div
      className="relative w-full aspect-[120/53.33] touch-none select-none bg-primary rounded-lg overflow-hidden shadow-lg"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      <FieldSVG />
      <svg
        className="absolute inset-0 h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1200 533.33"
        preserveAspectRatio="xMidYMid meet"
      >
        {routes.map(route => (
          <path
            key={route.id}
            d={route.path}
            stroke={printable ? 'black' : route.color}
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
            stroke={printable ? 'black' : drawingColor}
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
          printable={printable}
        />
      ))}
    </div>
  );
}
