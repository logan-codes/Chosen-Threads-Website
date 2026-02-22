'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface TutorialProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Tutorial: React.FC<TutorialProps> = ({ isOpen, setIsOpen }) => {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>How to Customize Your Product</DialogTitle>
          <DialogDescription>
            Follow these simple steps to create your unique design.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 text-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-800 text-white font-bold">1</div>
            <p><strong>Choose Your Product:</strong> Use the menu on the left to select an item and pick your favorite color.</p>
          </div>
          <div className="flex items-start gap-4">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-800 text-white font-bold">2</div>
            <p><strong>Upload Your Design:</strong> Click the 'Upload' button to add your own image. You can also reuse previously uploaded designs.</p>
          </div>
          <div className="flex items-start gap-4">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-800 text-white font-bold">3</div>
            <p><strong>Adjust Your Design:</strong> Click on your uploaded image to move, resize, or rotate it. Use the controls in the left sidebar for fine-tuning.</p>
          </div>
          <div className="flex items-start gap-4">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-800 text-white font-bold">4</div>
            <p><strong>Switch Views:</strong> Use the view selector at the bottom to customize the front, back, and sides of your product.</p>
          </div>
          <div className="flex items-start gap-4">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-800 text-white font-bold">5</div>
            <p><strong>Place Your Order:</strong> Happy with your creation? Click the 'Order' button to review your summary and proceed to checkout.</p>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => setIsOpen(false)}>Got it!</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default Tutorial;
