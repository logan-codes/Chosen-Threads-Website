import { cn } from '@/lib/utils';

interface RightSidebarProps {
  productViews: ('FRONT' | 'BACK' | 'RIGHT' | 'LEFT')[];
  selectedView: 'FRONT' | 'BACK' | 'RIGHT' | 'LEFT';
  onSelectView: (view: 'FRONT' | 'BACK' | 'RIGHT' | 'LEFT') => void;
  renderShirtSVG: (view: 'FRONT' | 'BACK' | 'RIGHT' | 'LEFT', color: string) => string;
  selectedColor: string;
}

export function RightSidebar({ productViews, selectedView, onSelectView, renderShirtSVG, selectedColor }: RightSidebarProps) {
  return (
    <aside className="w-64 bg-white border-l border-[#e8e5e0] flex flex-col items-center py-6 px-4 align-middle ">
      <div className="space-y-4 my-auto">
        {productViews.map((view) => {
          const isSelected = selectedView === view;
          return (
            <button
              key={view}
              onClick={() => onSelectView(view)}
              className={cn(
                "flex flex-col items-center gap-2 transition-all",
                isSelected && "scale-105"
              )}
            >
              <div
                className={cn(
                  "w-20 h-20 rounded-full border-2 overflow-hidden bg-gray-100 flex items-center justify-center",
                  isSelected
                    ? "border-blue-500 shadow-lg"
                    : "border-gray-300"
                )}
              >
                <div
                  className="relative h-14 w-14"
                  dangerouslySetInnerHTML={{
                    __html: renderShirtSVG(view, selectedColor),
                  }}
                />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-700">
                {view}
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
