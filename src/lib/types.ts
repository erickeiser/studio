export interface Player {
  id: string;
  x: number;
  y: number;
  type: 'offense' | 'defense';
}

export interface Route {
  id:string;
  path: string;
  style: 'solid' | 'dashed';
  color: string;
}

export interface Play {
  id: string;
  name: string;
  players: Player[];
  routes: Route[];
}
