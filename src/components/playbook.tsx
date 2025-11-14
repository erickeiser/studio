'use client';

import { useMemo } from 'react';
import { collection, query, orderBy } from 'firebase/firestore';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import type { SavedPlay } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, FolderOpen, Printer } from 'lucide-react';
import Link from 'next/link';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PlaybookProps {
  onLoadPlay: (play: SavedPlay) => void;
}

export function Playbook({ onLoadPlay }: PlaybookProps) {
  const { user } = useUser();
  const firestore = useFirestore();

  const playbookId = 'my-playbook';

  const playsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, 'users', user.uid, 'playbooks', playbookId, 'plays'),
      orderBy('lastModified', 'desc')
    );
  }, [user, firestore]);
  

  const { data: plays, isLoading } = useCollection<SavedPlay>(playsQuery);

  const handlePrint = (playId: string) => {
    window.open(`/print/${playId}`, '_blank');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Saved Plays</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <p className="ml-2">Loading plays...</p>
          </div>
        )}
        {!isLoading && plays && plays.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No plays saved yet.
          </p>
        )}
        {!isLoading && plays && plays.length > 0 && (
          <ScrollArea className="h-48">
            <div className="space-y-2">
              {plays.map((play) => (
                <div key={play.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                  <span className="text-sm font-medium truncate flex-1" title={play.name}>{play.name}</span>
                  <div className="flex items-center gap-1">
                     <Button variant="ghost" size="icon" onClick={() => onLoadPlay(play)} title="Load Play">
                        <FolderOpen className="h-4 w-4" />
                     </Button>
                     <Button variant="ghost" size="icon" onClick={() => handlePrint(play.id)} title="Print Play">
                       <Printer className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
