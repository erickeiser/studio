import type React from 'react';
import { Player } from '@/lib/types';
import { cn } from '@/lib/utils';
import { X, Circle } from 'lucide-react';

interface PlayerIconProps {
  player: Player;
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>, id: string) => void;
  printable?: boolean;
}

export function PlayerIcon({ player, onMouseDown, printable = false }: PlayerIconProps) {
  const style = {
    left: `${(player.x / 1200) * 100}%`,
    top: `${(player.y / 533.33) * 100}%`,
  };

  const commonClasses = 'absolute -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center cursor-pointer select-none';
  const sizeClasses = 'w-7 h-7';

  if (printable) {
    return (
      <div style={style} className={cn(commonClasses, sizeClasses, 'border-2 border-black bg-white')}>
        {player.type === 'offense' ? (
          <Circle className="w-5 h-5 text-black" />
        ) : (
          <X className="w-5 h-5 text-black" />
        )}
      </div>
    );
  }

  return (
    <div
      style={style}
      className={cn(commonClasses, sizeClasses, 'shadow-md transition-shadow hover:shadow-xl', {
        'bg-blue-500 border-2 border-blue-300 text-white': player.type === 'offense',
        'bg-red-500 border-2 border-red-300 text-white': player.type === 'defense',
      })}
      onMouseDown={(e) => onMouseDown(e, player.id)}
    >
      {player.type === 'offense' ? (
        <Circle className="w-5 h-5 fill-current" />
      ) : (
        <X className="w-5 h-5" />
      )}
    </div>
  );
}
