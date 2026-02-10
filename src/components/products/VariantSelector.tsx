"use client";

import { useState } from "react";
import Image from "next/image";

interface ProductVariant {
  id: number;
  product_id: number;
  color: string;
  image_url: string | null;
}

interface VariantSelectorProps {
  variants: ProductVariant[];
}

export function VariantSelector({ variants }: VariantSelectorProps) {
  const [selectedColor, setSelectedColor] = useState<string>(
    variants.length > 0 ? variants[0].color : "white"
  );

  const colors = [...new Set(variants.map((v) => v.color))];
  const currentVariant = variants.find((v) => v.color === selectedColor);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-6">Select Color</h2>
        <div className="flex flex-wrap gap-3">
          {colors.map((color) => (
            <button
              key={color}
              onClick={() => setSelectedColor(color)}
              className={`relative w-12 h-12 rounded-full border-4 transition-all hover:scale-110 ${
                selectedColor === color 
                  ? "border-gray-800 shadow-lg scale-110" 
                  : "border-gray-300 hover:border-gray-500"
              }`}
              style={{ backgroundColor: color }}
              title={color}
            >
              {selectedColor === color && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full shadow-md" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {currentVariant && currentVariant.image_url && (
        <div className="relative aspect-square overflow-hidden rounded-lg bg-zinc-50 shadow-lg">
          <Image
            src={currentVariant.image_url}
            alt={`${selectedColor} variant`}
            fill
            className="object-cover hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-50/20 to-transparent pointer-events-none" />
        </div>
      )}

      {/* Color Information */}
      <div className="bg-zinc-50 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-foreground mb-2">Selected Color</h3>
        <div className="flex items-center gap-3">
          <div 
            className="w-8 h-8 rounded-full border-2 border-gray-300 shadow-sm"
            style={{ backgroundColor: selectedColor }}
          />
          <span className="text-sm font-medium text-zinc-700 capitalize">{selectedColor}</span>
        </div>
      </div>
    </div>
  );
}
