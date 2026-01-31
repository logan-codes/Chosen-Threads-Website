import { Button } from '@/components/ui/button';
import { Undo2, Redo2, ImageIcon } from 'lucide-react';

interface HeaderProps {
  onOrder: () => void;
  onTutorial: () => void;
}

export function Header({ onOrder, onTutorial }: HeaderProps) {
  const actionButtons = [
    { id: 'undo', label: 'Undo', icon: Undo2 },
    { id: 'redo', label: 'Redo', icon: Redo2 },
  ];

  return (
    <header className="h-20 bg-white border-b border-[#e8e5e0] flex items-center justify-between px-6">
      <div className="flex items-center gap-6">
        {actionButtons.map((btn) => {
          const Icon = btn.icon;
          return (
            <button
              key={btn.id}
              className="flex flex-col items-center gap-1 hover:opacity-70 transition-opacity"
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
          className="bg-gray-800 text-white hover:bg-gray-700 rounded-lg px-6 py-2 text-sm font-semibold"
        >
          Tutorials
        </Button>
        <Button
          onClick={onOrder}
          className="bg-orange-500 text-white hover:bg-orange-600 rounded-lg px-6 py-2 text-sm font-semibold disabled:opacity-50"
        >
          Order
        </Button>
      </div>
    </header>
  );
}
