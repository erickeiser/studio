'use client';

import { useEffect, useState } from 'react';
import { doc } from 'firebase/firestore';
import { useDoc, useFirestore, useUser } from '@/firebase';
import type { SavedPlay, Player, Route } from '@/lib/types';
import { Field } from '@/components/field';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

export default function PrintPlayPage({ params }: { params: { playId: string } }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const [playData, setPlayData] = useState<{ players: Player[], routes: Route[] } | null>(null);

  const playbookId = 'my-playbook';
  const docRef = user ? doc(firestore, 'users', user.uid, 'playbooks', playbookId, 'plays', params.playId) : null;
  const { data: play, isLoading } = useDoc<SavedPlay>(docRef);

  useEffect(() => {
    if (play) {
      try {
        const parsedData = JSON.parse(play.diagram);
        setPlayData(parsedData);
      } catch (e) {
        console.error("Failed to parse play diagram", e);
      }
    }
  }, [play]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading play for printing...</div>;
  }

  if (!play || !playData) {
    return <div className="flex items-center justify-center h-screen">Could not load play.</div>;
  }

  return (
    <div className="p-4 sm:p-8">
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-area, .printable-area * {
            visibility: visible;
          }
          .printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none;
          }
        }
      `}</style>
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-4 no-print">
          <h1 className="text-2xl font-bold">{play.name}</h1>
          <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </header>
         <div className="printable-area border rounded-lg">
           <div className="w-full max-w-md mx-auto p-4">
             <h2 className="text-xl font-bold text-center mb-4 hidden print:block">{play.name}</h2>
              <Field 
                players={playData.players}
                routes={playData.routes}
                drawingPath={null}
                drawingStyle={'solid'}
                drawingColor={''}
                onDrawStart={() => {}}
                onDrawMove={() => {}}
                onDrawEnd={() => {}}
                onPlayerAction={() => {}}
              />
            </div>
         </div>
      </div>
    </div>
  );
}
