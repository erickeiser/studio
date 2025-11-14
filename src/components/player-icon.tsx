import type React from 'react';
import { Player } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Circle } from 'lucide-react';

interface PlayerIconProps {
  player: Player;
  onPlayerAction: (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>, id: string) => void;
}

export function PlayerIcon({ player, onPlayerAction }: PlayerIconProps) {
  const fieldWidth = 533.33;
  const fieldHeight = 800;

  const style = {
    left: `${(player.x / fieldWidth) * 100}%`,
    top: `${(player.y / fieldHeight) * 100}%`,
  };

  const commonClasses = 'absolute -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center cursor-pointer select-none';
  const sizeClasses = 'w-8 h-8';

  const typeStyles = {
    qb: 'bg-gray-200 border-2 border-black text-black text-sm font-bold',
    red: 'bg-red-500 border-2 border-red-300 text-white',
    blue: 'bg-blue-500 border-2 border-blue-300 text-white',
    yellow: 'bg-yellow-400 border-2 border-yellow-200 text-black',
    green: 'bg-green-500 border-2 border-green-300 text-white',
  };

  return (
    <div
      style={style}
      className={cn(commonClasses, sizeClasses, 'shadow-md transition-shadow hover:shadow-xl', typeStyles[player.type])}
      onMouseDown={(e) => onPlayerAction(e, player.id)}
      onTouchStart={(e) => onPlayerAction(e, player.id)}
    >
      {player.type === 'qb' ? (
        'QB'
      ) : (
        <Circle className="w-6 h-6 fill-current" />
      )}
    </div>
  );
}
