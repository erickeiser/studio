export type PlayerType = 'qb' | 'red' | 'blue' | 'yellow' | 'green';

export interface Player {
  id: string;
  x: number;
  y: number;
  type: PlayerType;
}

export interface Route {
  id:string;
  path: string;
  style: 'solid' | 'dashed';
  color: string;
}

export interface Play {
  id?: string;
  name: string;
  players: Player[];
  routes: Route[];
}

export interface SavedPlay {
  id: string;
  name: string;
  diagram: string;
  createdAt: string;
  lastModified: string;
}
