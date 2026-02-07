import { Button } from '@/components/ui/button';
import { Undo2, Redo2, ImageIcon } from 'lucide-react';

interface HeaderProps {
  onOrder: () => void;
  onTutorial: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function Header({ onOrder, onTutorial, onUndo, onRedo, canUndo, canRedo }: HeaderProps) {
  const actionButtons = [
    { id: 'undo', label: 'Undo', icon: Undo2 },
    { id: 'redo', label: 'Redo', icon: Redo2 },
  ];

  return (
    <header className="h-20 bg-white border-b border-[#e8e5e0] flex items-center justify-between px-6">
      <div className="flex items-center gap-6">
        {actionButtons.map((btn) => {
          const Icon = btn.icon;
          const isUndo = btn.id === 'undo';
          const isRedo = btn.id === 'redo';
          const isDisabled = (isUndo && !canUndo) || (isRedo && !canRedo);

          return (
            <button
              key={btn.id}
              onClick={isUndo ? onUndo : onRedo}
              disabled={isDisabled}
              className="flex flex-col items-center gap-1 hover:opacity-70 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <Icon className="w-5 h-5 text-gray-700" />
              </div>
              <span className="text-[10px] font-medium text-gray-600 uppercase tracking-wide">
                {btn.label}
              </span>
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={onTutorial}
          className="border-primary/20 text-primary hover:bg-primary hover:text-white rounded-lg px-6 py-2 text-sm font-semibold"
        >
          Tutorials
        </Button>
        <Button
          onClick={onOrder}
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-6 py-2 text-sm font-semibold disabled:opacity-50"
        >
          Order
        </Button>
      </div>
    </header>
  );
}
