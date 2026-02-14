import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Eye, RotateCcw } from 'lucide-react';

interface RightSidebarProps {
  productViews: ('FRONT' | 'BACK' | 'RIGHT' | 'LEFT')[];
  selectedView: 'FRONT' | 'BACK' | 'RIGHT' | 'LEFT';
  onSelectView: (view: 'FRONT' | 'BACK' | 'RIGHT' | 'LEFT') => void;
  renderShirtSVG: (view: 'FRONT' | 'BACK' | 'RIGHT' | 'LEFT', color: string) => string;
  selectedColor: string;
  viewCustomizations?: Record<string, any[]>;
}

const VIEW_DESCRIPTIONS: Record<string, string> = {
  FRONT: 'Front View',
  BACK: 'Back View',
  RIGHT: 'Right Side',
  LEFT: 'Left Side'
};

export function RightSidebar({ 
  productViews, 
  selectedView, 
  onSelectView, 
  renderShirtSVG, 
  selectedColor,
  viewCustomizations = {}
}: RightSidebarProps) {
  return (
    <aside className="w-64 bg-white border-l border-[#e8e5e0] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[#e8e5e0]">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-900">Product Views</h3>
        </div>
        <p className="text-[11px] text-gray-500 mt-1">
          Select a view to customize
        </p>
      </div>

      {/* View Selection */}
      <div className="flex-1 py-4 px-3 space-y-3 overflow-y-auto">
        {productViews.map((view) => {
          const isSelected = selectedView === view;
          const customizationCount = viewCustomizations[view]?.length || 0;
          
          return (
            <button
              key={view}
              onClick={() => onSelectView(view)}
              className={cn(
                "w-full group relative rounded-xl transition-all duration-200",
                isSelected
                  ? "bg-primary/5 ring-2 ring-primary"
                  : "hover:bg-gray-50"
              )}
            >
              <div className="p-3">
                {/* View Preview */}
                <div
                  className={cn(
                    "relative w-full aspect-square rounded-lg border-2 overflow-hidden bg-gray-100 flex items-center justify-center transition-all",
                    isSelected
                      ? "border-primary shadow-md"
                      : "border-gray-200 group-hover:border-gray-300"
                  )}
                >
                  <div
                    className="relative w-3/4 h-3/4"
                    dangerouslySetInnerHTML={{
                      __html: renderShirtSVG(view, selectedColor),
                    }}
                  />
                  
                  {/* Customization Indicator */}
                  {customizationCount > 0 && (
                    <div className="absolute top-2 right-2">
                      <Badge 
                        variant="default" 
                        className="h-5 min-w-5 flex items-center justify-center text-[10px] bg-primary text-white"
                      >
                        {customizationCount}
                      </Badge>
                    </div>
                  )}

                  {/* Selected Indicator */}
                  {isSelected && (
                    <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
                  )}
                </div>

                {/* View Label */}
                <div className="mt-2 text-center">
                  <span className={cn(
                    "text-[11px] font-semibold uppercase tracking-wide transition-colors",
                    isSelected ? "text-primary" : "text-gray-600"
                  )}>
                    {VIEW_DESCRIPTIONS[view]}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Tips */}
      <div className="p-4 border-t border-[#e8e5e0] bg-gray-50">
        <div className="flex items-start gap-2">
          <RotateCcw className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
          <p className="text-[10px] text-gray-500 leading-relaxed">
            Click any view to switch. Your customizations are saved per view.
          </p>
        </div>
      </div>
    </aside>
  );
}
