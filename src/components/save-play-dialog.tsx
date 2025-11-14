'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SavePlayDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (playName: string) => void;
}

export function SavePlayDialog({ isOpen, onClose, onSave }: SavePlayDialogProps) {
  const [playName, setPlayName] = useState('');
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!playName.trim()) {
      setError('Play name cannot be empty.');
      return;
    }
    onSave(playName);
    setPlayName('');
    setError('');
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      setPlayName('');
      setError('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Save Play</DialogTitle>
          <DialogDescription>
            Give your play a name to save it to your playbook.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="play-name" className="text-right">
              Play Name
            </Label>
            <Input
              id="play-name"
              value={playName}
              onChange={(e) => {
                setPlayName(e.target.value);
                if (error) setError('');
              }}
              className="col-span-3"
              placeholder="e.g., 'Spider 2 Y Banana'"
            />
          </div>
          {error && <p className="col-span-4 text-center text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
          <Button type="submit" onClick={handleSave}>Save Play</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
