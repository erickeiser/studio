'use client';

import type React from 'react';
import { useState, useRef, useEffect } from 'react';
import {
  Trash2,
  Eraser,
  PenLine,
  MousePointer,
  Circle,
  Save,
  Undo,
} from 'lucide-react';
import { collection } from 'firebase/firestore';

import type { Player, Route, Play, PlayerType } from '@/lib/types';
import { useFirestore, useUser } from '@/firebase';
import { initiateAnonymousSignIn, addDocumentNonBlocking } from '@/firebase';
import { useToast } from "@/hooks/use-toast"

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field } from '@/components/field';
import { SavePlayDialog } from '@/components/save-play-dialog';
import { Separator } from '@/components/ui/separator';

type Tool = 'cursor' | 'draw-solid' | 'draw-dashed' | 'eraser';
type DrawingColor = 'hsl(var(--accent))' | 'hsl(var(--foreground))' | '#ff0000';


let idCounter = 0;
const getUniqueId = () => (idCounter++).toString();


export function GridironGenius() {
  const [history, setHistory] = useState<{ players: Player[]; routes: Route[] }[]>([{ players: [], routes: [] }]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const players = history[historyIndex].players;
  const routes = history[historyIndex].routes;

  const [activeTool, setActiveTool] = useState<Tool>('cursor');
  const [drawingColor, setDrawingColor] = useState<DrawingColor>('hsl(var(--accent))');
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingPath, setDrawingPath] = useState<string | null>(null);
  const [draggedPlayerId, setDraggedPlayerId] = useState<string | null>(null);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);

  const fieldRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    if (!isUserLoading && !user) {
      initiateAnonymousSignIn();
    }
  }, [isUserLoading, user]);

  const updateState = (newPlayers: Player[], newRoutes: Route[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ players: newPlayers, routes: newRoutes });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
    }
  };

  const getCoords = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!fieldRef.current) return { x: 0, y: 0 };
    const rect = fieldRef.current.getBoundingClientRect();
    const fieldWidth = 533.33;
    const fieldHeight = 800;
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = ((clientX - rect.left) / rect.width) * fieldWidth;
    const y = ((clientY - rect.top) / rect.height) * fieldHeight;
    return { x, y };
  };

  const addPlayer = (type: PlayerType) => {
    const newPlayer: Player = {
      id: getUniqueId(),
      x: 533.33 / 2,
      y: 800 / 2,
      type,
    };
    updateState([...players, newPlayer], routes);
  };

  const handleDrawStart = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (activeTool === 'cursor') return;
    if (activeTool.startsWith('draw')) {
      setIsDrawing(true);
      const { x, y } = getCoords(e);
      setDrawingPath(`M ${x} ${y}`);
    }
  };

  const handleDrawMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const { x, y } = getCoords(e);
    if (isDrawing && drawingPath) {
      setDrawingPath(prev => `${prev} L ${x} ${y}`);
    } else if (draggedPlayerId) {
      const fieldWidth = 533.33;
      const fieldHeight = 800;
      const newPlayers = players.map(p =>
        p.id === draggedPlayerId
          ? { ...p, x: Math.min(Math.max(x, 15), fieldWidth - 15), y: Math.min(Math.max(y, 15), fieldHeight - 15) }
          : p
      );
      const currentHistory = [...history];
      currentHistory[historyIndex] = { ...currentHistory[historyIndex], players: newPlayers };
      setHistory(currentHistory);
    }
  };

  const handleDrawEnd = () => {
    if (isDrawing && drawingPath) {
      const newRoute: Route = {
        id: getUniqueId(),
        path: drawingPath,
        style: activeTool === 'draw-dashed' ? 'dashed' : 'solid',
        color: drawingColor,
      };
      updateState(players, [...routes, newRoute]);
    } else if (draggedPlayerId) {
      updateState(players, routes);
    }
    setIsDrawing(false);
    setDrawingPath(null);
    setDraggedPlayerId(null);
  };

  const handlePlayerMouseDown = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>, id: string) => {
    e.stopPropagation();
    if (activeTool === 'cursor') {
      setDraggedPlayerId(id);
    } else if (activeTool === 'eraser') {
      const newPlayers = players.filter(p => p.id !== id);
      updateState(newPlayers, routes);
    }
  };

  const clearField = () => {
    updateState([], []);
  };

  const handleSavePlay = async (playName: string) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to save a play.',
      });
      return;
    }
    
    const playbookId = 'my-playbook';

    const playData = {
      name: playName,
      playbookId,
      diagram: JSON.stringify({ players, routes }),
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    };

    try {
      const playsCollectionRef = collection(firestore, 'users', user.uid, 'playbooks', playbookId, 'plays');
      await addDocumentNonBlocking(playsCollectionRef, playData);
      
      toast({
        title: 'Play Saved!',
        description: `"${playName}" has been saved to your playbook.`,
      });
      setIsSaveDialogOpen(false);
    } catch (error: any) {
      console.error("Error saving play: ", error);
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: error.message || 'There was an error saving your play.',
      });
    }
  };


  const ToolButton = ({ tool, icon: Icon, label }: { tool: Tool; icon: React.ElementType; label: string }) => (
    <Button
      variant={activeTool === tool ? 'secondary' : 'ghost'}
      size="sm"
      onClick={() => setActiveTool(tool)}
      className="w-full justify-start"
    >
      <Icon className="mr-2 h-4 w-4" />
      {label}
    </Button>
  );
  
  const ColorButton = ({ color, label }: { color: DrawingColor, label: string }) => (
    <Button
      variant={drawingColor === color ? 'secondary' : 'ghost'}
      size="sm"
      onClick={() => setDrawingColor(color)}
      className="w-full justify-start"
    >
      <div className="mr-2 h-4 w-4 rounded-full border" style={{ backgroundColor: color }} />
      {label}
    </Button>
  );

  return (
    <>
    <SavePlayDialog
      isOpen={isSaveDialogOpen}
      onClose={() => setIsSaveDialogOpen(false)}
      onSave={handleSavePlay}
    />
    <div className="flex h-screen w-screen flex-col bg-background font-body">
      <header className="flex h-16 items-center border-b px-4 shrink-0">
        <h1 className="text-xl font-bold font-headline text-primary">Gridiron Genius</h1>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 border-r overflow-y-auto shrink-0 p-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tools</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <ToolButton tool="cursor" icon={MousePointer} label="Select & Move" />
              <ToolButton tool="draw-solid" icon={PenLine} label="Draw Route (Solid)" />
              <ToolButton tool="draw-dashed" icon={PenLine} label="Draw Route (Dashed)" />
              <ToolButton tool="eraser" icon={Eraser} label="Eraser" />
              <Separator />
              <ColorButton color="hsl(var(--accent))" label="Orange" />
              <ColorButton color="hsl(var(--foreground))" label="Black" />
              <ColorButton color="#ff0000" label="Red" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Players</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" onClick={() => addPlayer('qb')} className="w-full justify-start">
                <div className="mr-2 h-4 w-4 rounded-full bg-gray-200 border border-black flex items-center justify-center text-xs font-bold">QB</div> Add QB
              </Button>
              <Button variant="outline" size="sm" onClick={() => addPlayer('red')} className="w-full justify-start"><Circle className="mr-2 h-4 w-4 fill-red-500 text-red-500" /> Add Red</Button>
              <Button variant="outline" size="sm" onClick={() => addPlayer('blue')} className="w-full justify-start"><Circle className="mr-2 h-4 w-4 fill-blue-500 text-blue-500" /> Add Blue</Button>
              <Button variant="outline" size="sm" onClick={() => addPlayer('yellow')} className="w-full justify-start"><Circle className="mr-2 h-4 w-4 fill-yellow-400 text-yellow-400" /> Add Yellow</Button>
              <Button variant="outline" size="sm" onClick={() => addPlayer('green')} className="w-full justify-start"><Circle className="mr-2 h-4 w-4 fill-green-500 text-green-500" /> Add Green</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
               <Button variant="outline" size="sm" onClick={handleUndo} className="w-full" disabled={historyIndex === 0}>
                <Undo className="mr-2 h-4 w-4" />
                Undo
              </Button>
              <Button variant="default" size="sm" onClick={() => setIsSaveDialogOpen(true)} className="w-full" disabled={isUserLoading || !user}>
                <Save className="mr-2 h-4 w-4" />
                {isUserLoading ? 'Loading...' : 'Save Play'}
              </Button>
              <Button variant="destructive" size="sm" onClick={clearField} className="w-full"><Trash2 className="mr-2 h-4 w-4" />Clear Field</Button>
            </CardContent>
          </Card>
        </aside>

        <main className="flex-1 flex items-center justify-center p-4 lg:p-8 bg-muted/40">
           <div className="w-full max-w-md" ref={fieldRef}>
            <Field 
              players={players}
              routes={routes}
              drawingPath={drawingPath}
              drawingStyle={activeTool === 'draw-dashed' ? 'dashed' : 'solid'}
              drawingColor={drawingColor}
              onDrawStart={handleDrawStart}
              onDrawMove={handleDrawMove}
              onDrawEnd={handleDrawEnd}
              onPlayerAction={handlePlayerMouseDown}
            />
           </div>
        </main>
      </div>
    </div>
    </>
  );
}
