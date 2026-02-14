import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, Palette, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ColorOption {
  name: string;
  hex: string;
}

interface ColorPickerProps {
  colors: string[];
  selectedColor: string;
  onColorSelect: (color: string) => void;
  productName?: string;
}

const PREDEFINED_COLORS: ColorOption[] = [
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Black', hex: '#111827' },
  { name: 'Gray', hex: '#6B7280' },
  { name: 'Navy', hex: '#1E3A8A' },
  { name: 'Royal Blue', hex: '#3B82F6' },
  { name: 'Red', hex: '#EF4444' },
  { name: 'Burgundy', hex: '#991B1B' },
  { name: 'Green', hex: '#10B981' },
  { name: 'Forest', hex: '#065F46' },
  { name: 'Yellow', hex: '#F59E0B' },
  { name: 'Orange', hex: '#F97316' },
  { name: 'Purple', hex: '#8B5CF6' },
  { name: 'Pink', hex: '#EC4899' },
  { name: 'Brown', hex: '#92400E' },
  { name: 'Beige', hex: '#D4C4B5' },
  { name: 'Teal', hex: '#14B8A6' },
];

export function ColorPicker({ 
  colors, 
  selectedColor, 
  onColorSelect,
  productName 
}: ColorPickerProps) {
  const [activeTab, setActiveTab] = useState<'preset' | 'custom'>('preset');
  const [customColor, setCustomColor] = useState('#000000');

  // Filter to only show colors that exist in the product
  const availablePresetColors = PREDEFINED_COLORS.filter(
    preset => colors.some(color => 
      color.toLowerCase() === preset.hex.toLowerCase() ||
      color.toLowerCase() === preset.name.toLowerCase()
    )
  );

  // Get color name from hex or vice versa
  const getColorDisplay = (color: string) => {
    const preset = PREDEFINED_COLORS.find(
      c => c.hex.toLowerCase() === color.toLowerCase() || 
           c.name.toLowerCase() === color.toLowerCase()
    );
    return preset ? preset.name : color;
  };

  const getColorHex = (color: string) => {
    const preset = PREDEFINED_COLORS.find(
      c => c.name.toLowerCase() === color.toLowerCase()
    );
    return preset ? preset.hex : color;
  };

  return (
    <div className="space-y-4">
      {/* Selected Color Display */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
        <p className="text-[10px] uppercase tracking-wide text-gray-500 font-medium mb-2">
          Selected Color
        </p>
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-lg shadow-inner border-2 border-gray-200"
            style={{ backgroundColor: getColorHex(selectedColor) }}
          />
          <div>
            <div className="text-sm font-bold text-gray-900">
              {getColorDisplay(selectedColor)}
            </div>
            <div className="text-[10px] text-gray-500 font-mono">
              {getColorHex(selectedColor)}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('preset')}
          className={cn(
            "flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2",
            activeTab === 'preset'
              ? "bg-gray-900 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          )}
        >
          <Palette className="w-3.5 h-3.5" />
          Preset Colors
        </button>
        <button
          onClick={() => setActiveTab('custom')}
          className={cn(
            "flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2",
            activeTab === 'custom'
              ? "bg-gray-900 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          )}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Custom
        </button>
      </div>

      {/* Preset Colors */}
      {activeTab === 'preset' && (
        <div className="space-y-3">
          {availablePresetColors.length === 0 ? (
            <div className="text-center py-6 text-gray-400">
              <Palette className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">No preset colors available</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {availablePresetColors.map((color) => {
                const isSelected = selectedColor.toLowerCase() === color.hex.toLowerCase() ||
                                 selectedColor.toLowerCase() === color.name.toLowerCase();
                return (
                  <button
                    key={color.hex}
                    onClick={() => onColorSelect(color.name)}
                    className={cn(
                      "group relative aspect-square rounded-xl transition-all",
                      isSelected 
                        ? "ring-2 ring-primary ring-offset-2 scale-105" 
                        : "hover:scale-105 hover:shadow-md"
                    )}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  >
                    {/* Checkmark for selected */}
                    {isSelected && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-white/90 rounded-full p-1">
                          <Check className="w-3 h-3 text-gray-900" />
                        </div>
                      </div>
                    )}
                    
                    {/* Color name tooltip */}
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      <span className="bg-gray-900 text-white text-[10px] px-2 py-1 rounded">
                        {color.name}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* All Available Colors */}
          {colors.length > availablePresetColors.length && (
            <div className="pt-3 border-t border-gray-100">
              <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-2">
                All Available Colors
              </p>
              <div className="flex flex-wrap gap-2">
                {colors.map((color) => {
                  const isPreset = availablePresetColors.some(
                    c => c.hex.toLowerCase() === color.toLowerCase() ||
                         c.name.toLowerCase() === color.toLowerCase()
                  );
                  if (isPreset) return null;
                  
                  const isSelected = selectedColor.toLowerCase() === color.toLowerCase();
                  return (
                    <button
                      key={color}
                      onClick={() => onColorSelect(color)}
                      className={cn(
                        "h-8 px-3 rounded-full text-xs font-medium transition-all border-2",
                        isSelected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-gray-200 hover:border-gray-300 text-gray-700"
                      )}
                    >
                      {color}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Custom Color */}
      {activeTab === 'custom' && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <div 
                className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded border border-gray-200"
                style={{ backgroundColor: customColor }}
              />
              <Input
                type="text"
                placeholder="#000000"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                className="pl-10 text-sm font-mono"
              />
            </div>
            <Input
              type="color"
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value)}
              className="w-12 h-10 p-1 cursor-pointer"
            />
          </div>
          <Button 
            onClick={() => onColorSelect(customColor)}
            className="w-full"
            variant="secondary"
          >
            Apply Color
          </Button>
        </div>
      )}
    </div>
  );
}
