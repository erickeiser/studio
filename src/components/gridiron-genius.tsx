'use client';

import type React from 'react';
import { useState, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dices,
  Trash2,
  Save,
  Printer,
  FilePlus,
  Eraser,
  PenLine,
  MousePointer,
  BookOpen,
  ChevronDown,
  X,
  Circle,
  Loader2,
} from 'lucide-react';

import type { Player, Route, Play } from '@/lib/types';
import { suggestPlayBasedOnFormation } from '@/ai/flows/suggest-play-based-on-formation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/field';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const savePlaySchema = z.object({
  name: z.string().min(1, 'Play name is required.'),
});

type Tool = 'cursor' | 'draw-solid' | 'draw-dashed' | 'eraser';

export function GridironGenius() {
  const { toast } = useToast();
  const [players, setPlayers] = useState<Player[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [playbook, setPlaybook] = useState<Play[]>([]);
  const [activeTool, setActiveTool] = useState<Tool>('cursor');
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingPath, setDrawingPath] = useState<string | null>(null);
  const [draggedPlayerId, setDraggedPlayerId] = useState<string | null>(null);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [playToPrint, setPlayToPrint] = useState<Play | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<{ suggestedPlay: string; rationale: string } | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const fieldRef = useRef<HTMLDivElement>(null);
  const saveForm = useForm<z.infer<typeof savePlaySchema>>({
    resolver: zodResolver(savePlaySchema),
    defaultValues: { name: '' },
  });

  const getCoords = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!fieldRef.current) return { x: 0, y: 0 };
    const rect = fieldRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 1200;
    const y = ((e.clientY - rect.top) / rect.height) * 533.33;
    return { x, y };
  };

  const addPlayer = (type: 'offense' | 'defense') => {
    const newPlayer: Player = {
      id: crypto.randomUUID(),
      x: type === 'offense' ? 550 : 650,
      y: 266,
      type,
    };
    setPlayers(prev => [...prev, newPlayer]);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool === 'cursor') return;
    if (activeTool.startsWith('draw')) {
      setIsDrawing(true);
      const { x, y } = getCoords(e);
      setDrawingPath(`M ${x} ${y}`);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { x, y } = getCoords(e);
    if (isDrawing && drawingPath) {
      setDrawingPath(prev => `${prev} L ${x} ${y}`);
    } else if (draggedPlayerId) {
      setPlayers(prev =>
        prev.map(p =>
          p.id === draggedPlayerId
            ? { ...p, x: Math.min(Math.max(x, 15), 1185), y: Math.min(Math.max(y, 15), 518.33) }
            : p
        )
      );
    }
  };

  const handleMouseUp = () => {
    if (isDrawing && drawingPath) {
      const newRoute: Route = {
        id: crypto.randomUUID(),
        path: drawingPath,
        style: activeTool === 'draw-dashed' ? 'dashed' : 'solid',
        color: 'hsl(var(--accent))',
      };
      setRoutes(prev => [...prev, newRoute]);
    }
    setIsDrawing(false);
    setDrawingPath(null);
    setDraggedPlayerId(null);
  };

  const handlePlayerMouseDown = (e: React.MouseEvent<HTMLDivElement>, id: string) => {
    e.stopPropagation();
    if (activeTool === 'cursor') {
      setDraggedPlayerId(id);
    } else if (activeTool === 'eraser') {
      setPlayers(prev => prev.filter(p => p.id !== id));
      setRoutes(prev => prev.filter(r => !isRouteAssociatedWithPlayer(r, id)))
    }
  };
  
  // This is a simplified check. A real implementation might need more complex logic.
  const isRouteAssociatedWithPlayer = (route: Route, playerId: string) => {
      const player = players.find(p => p.id === playerId);
      if (!player) return false;
      const pathStart = route.path.split(' ')[1] + ',' + route.path.split(' ')[2];
      const playerPos = Math.round(player.x) + ',' + Math.round(player.y);
      // A simple proximity check
      const [sx, sy] = route.path.substring(2).split(' L')[0].split(' ').map(Number);
      const dist = Math.sqrt(Math.pow(player.x - sx, 2) + Math.pow(player.y - sy, 2));
      return dist < 30;
  };

  const clearField = () => {
    setPlayers([]);
    setRoutes([]);
  };

  const handleSavePlay = (values: z.infer<typeof savePlaySchema>) => {
    const newPlay: Play = {
      id: crypto.randomUUID(),
      name: values.name,
      players: [...players],
      routes: [...routes],
    };
    setPlaybook(prev => [...prev, newPlay]);
    setIsSaveDialogOpen(false);
    saveForm.reset();
    toast({
      title: 'Play Saved!',
      description: `"${values.name}" has been added to your playbook.`,
    });
  };

  const loadPlay = (play: Play) => {
    setPlayers(play.players);
    setRoutes(play.routes);
    toast({
      title: 'Play Loaded',
      description: `"${play.name}" is now on the field.`,
    });
  };

  const deletePlay = (id: string) => {
    setPlaybook(prev => prev.filter(p => p.id !== id));
    toast({
      title: 'Play Deleted',
      variant: 'destructive',
    });
  };

  const handlePrintPlay = (play: Play) => {
    setPlayToPrint(play);
    setTimeout(() => {
      window.print();
      setPlayToPrint(null);
    }, 100);
  };

  const handleAiSuggest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const opponentFormation = formData.get('opponentFormation') as string;
    if (!opponentFormation) {
      toast({
        title: 'Error',
        description: 'Please enter an opponent formation.',
        variant: 'destructive'
      });
      return;
    }
    
    setIsAiLoading(true);
    setAiSuggestion(null);

    try {
      const result = await suggestPlayBasedOnFormation({ opponentFormation });
      setAiSuggestion(result);
    } catch (error) {
      console.error(error);
      toast({
        title: 'AI Error',
        description: 'Could not get suggestion. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsAiLoading(false);
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

  return (
    <div className="flex h-screen w-screen flex-col bg-background font-body">
      <header className="flex h-16 items-center border-b px-4 shrink-0">
        <h1 className="text-xl font-bold font-headline text-primary">Gridiron Genius</h1>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 border-r overflow-y-auto shrink-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Tools</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <ToolButton tool="cursor" icon={MousePointer} label="Select & Move" />
                  <ToolButton tool="draw-solid" icon={PenLine} label="Draw Route (Solid)" />
                  <ToolButton tool="draw-dashed" icon={PenLine} label="Draw Route (Dashed)" />
                  <ToolButton tool="eraser" icon={Eraser} label="Eraser" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Players</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" size="sm" onClick={() => addPlayer('offense')} className="w-full justify-start"><Circle className="mr-2 h-4 w-4 fill-blue-500 text-blue-500" /> Add Offense</Button>
                  <Button variant="outline" size="sm" onClick={() => addPlayer('defense')} className="w-full justify-start"><X className="mr-2 h-4 w-4 text-red-500" /> Add Defense</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="default" size="sm" onClick={() => setIsSaveDialogOpen(true)} className="w-full"><Save className="mr-2 h-4 w-4" />Save Play</Button>
                  <Button variant="destructive" size="sm" onClick={clearField} className="w-full"><Trash2 className="mr-2 h-4 w-4" />Clear Field</Button>
                </CardContent>
              </Card>

              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between text-lg font-semibold">
                    <div className="flex items-center">
                      <Dices className="mr-2 h-5 w-5 text-accent" /> AI Assistant
                    </div>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="p-2 pt-0">
                   <form onSubmit={handleAiSuggest} className="space-y-3">
                     <Textarea name="opponentFormation" placeholder="e.g., 4-3 Defense, Cover 2..." className="min-h-[60px]" />
                     <Button type="submit" size="sm" className="w-full" disabled={isAiLoading}>
                      {isAiLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Dices className="mr-2 h-4 w-4" />}
                      Suggest Play
                     </Button>
                   </form>
                   {aiSuggestion && (
                     <Alert className="mt-4">
                       <Dices className="h-4 w-4" />
                       <AlertTitle>{aiSuggestion.suggestedPlay}</AlertTitle>
                       <AlertDescription className="text-xs">{aiSuggestion.rationale}</AlertDescription>
                     </Alert>
                   )}
                </CollapsibleContent>
              </Collapsible>
              
              <Collapsible>
                 <CollapsibleTrigger asChild>
                   <Button variant="ghost" className="w-full justify-between text-lg font-semibold">
                     <div className="flex items-center">
                       <BookOpen className="mr-2 h-5 w-5 text-primary" /> Playbook
                     </div>
                     <ChevronDown className="h-4 w-4" />
                   </Button>
                 </CollapsibleTrigger>
                 <CollapsibleContent className="p-2 pt-0 space-y-2">
                    {playbook.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No plays saved yet.</p>
                    ) : (
                      playbook.map(play => (
                        <Card key={play.id} className="p-2">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-sm">{play.name}</p>
                            <div className="flex items-center gap-1">
                               <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => loadPlay(play)}><FilePlus className="h-4 w-4" /></Button>
                               <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handlePrintPlay(play)}><Printer className="h-4 w-4" /></Button>
                               <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deletePlay(play.id)}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                          </div>
                        </Card>
                      ))
                    )}
                 </CollapsibleContent>
               </Collapsible>

            </div>
          </ScrollArea>
        </aside>

        <main className="flex-1 flex items-center justify-center p-4 lg:p-8 bg-muted/40">
           <div className="w-full max-w-7xl" ref={fieldRef}>
            <Field 
              players={players}
              routes={routes}
              drawingPath={drawingPath}
              drawingStyle={activeTool === 'draw-dashed' ? 'dashed' : 'solid'}
              drawingColor="hsl(var(--accent))"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onPlayerMouseDown={handlePlayerMouseDown}
            />
           </div>
        </main>
      </div>

      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Play</DialogTitle>
          </DialogHeader>
          <Form {...saveForm}>
            <form onSubmit={saveForm.handleSubmit(handleSavePlay)} className="space-y-4">
              <FormField
                control={saveForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Play Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Spider 2 Y Banana" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsSaveDialogOpen(false)}>Cancel</Button>
                <Button type="submit">Save</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {playToPrint && (
        <div id="printable-play" className="p-4 bg-white">
           <h2 className="text-2xl font-bold mb-4 text-black">{playToPrint.name}</h2>
           <Field 
              players={playToPrint.players}
              routes={playToPrint.routes}
              drawingPath={null}
              drawingStyle="solid"
              drawingColor="black"
              onMouseDown={()=>{}}
              onMouseMove={()=>{}}
              onMouseUp={()=>{}}
              onPlayerMouseDown={()=>{}}
              printable={true}
            />
        </div>
      )}
    </div>
  );
}
