import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { Shirt, ImageIcon, ShoppingCart, History, Sparkles } from 'lucide-react';
import { ProductSelector } from './ProductSelector';
import { ColorPicker } from './ColorPicker';

interface LeftSidebarProps {
  selectedNavItem: string | null;
  onNavItemClick: (itemId: string, buttonElement: HTMLButtonElement | null) => void;
  menuTop: number;
  currentProduct: any;
  products: any[];
  onProductChange: (id: number) => void;
  availableColors: string[];
  selectedColor: string;
  onColorSelect: (color: string) => void;
  onOrder: () => void;
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  selectedFilePreview: string | null;
  onAddImageToCanvas: () => void;
  isUploading: boolean;
  viewCustomizations: any;
  selectedView: 'FRONT' | 'BACK' | 'RIGHT' | 'LEFT';
  onDeleteCurrentImage: () => void;
  currentCustomization: any;
  onScaleChange: (value: number[]) => void;
  uploadedImages: any[];
  onSelectExistingImage: (image: any) => void;
}

export function LeftSidebar({ 
  selectedNavItem, onNavItemClick, menuTop, currentProduct, products, onProductChange, 
  availableColors, selectedColor, onColorSelect, onOrder, onFileSelect, selectedFilePreview, 
  onAddImageToCanvas, isUploading, viewCustomizations, selectedView, onDeleteCurrentImage, 
  currentCustomization, onScaleChange, uploadedImages, onSelectExistingImage 
}: LeftSidebarProps) {
  const [recentlyViewed, setRecentlyViewed] = useState<number[]>([]);
  
  const navItems = [
    { id: 'products', label: 'Products', icon: Shirt },
    { id: 'image', label: 'Artwork', icon: ImageIcon },
    { id: 'order', label: 'Order', icon: ShoppingCart },
  ];

  const buttonRefs = React.useRef<Record<string, HTMLButtonElement | null>>({});

  // Track recently viewed products
  useEffect(() => {
    if (currentProduct?.id) {
      setRecentlyViewed(prev => {
        const filtered = prev.filter(id => id !== currentProduct.id);
        return [currentProduct.id, ...filtered].slice(0, 5);
      });
    }
  }, [currentProduct?.id]);

  return (
    <div className="relative flex">
      <aside className="w-64 bg-[#f5f3f0] border-r border-[#e8e5e0] flex flex-col">
        <div className="p-6 border-b border-[#e8e5e0]">
          <Link href="/">
            <Image src="/logo.jpg" alt="Chosen Threads Logo" width={100} height={100} />
          </Link>
        </div>
        <nav className="flex-1 py-4 px-2 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = selectedNavItem === item.id;
              return (
                <li key={item.id}>
                  <button
                    ref={(el) => { buttonRefs.current[item.id] = el; }}
                    onClick={(e) => onNavItemClick(item.id, e.currentTarget)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors",
                      isActive
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:bg-white/50"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium">
                      {item.label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {selectedNavItem && (
        <div 
          className="absolute left-full w-96 bg-white border-r border-[#e8e5e0] shadow-xl overflow-y-auto z-50"
          style={{
            top: `80px`,
            maxHeight: 'calc(100vh - 100px)',
          }}
        >
          <div className="p-5">
            {selectedNavItem === "products" && (
              <div className="space-y-5">
                {/* Enhanced Product Selection */}
                <ProductSelector
                  products={products}
                  currentProduct={currentProduct}
                  onProductChange={onProductChange}
                  recentlyViewed={recentlyViewed}
                />

                {/* Enhanced Color Selection */}
                {availableColors.length > 0 && (
                  <div className="pt-5 border-t border-gray-100">
                    <ColorPicker
                      colors={availableColors}
                      selectedColor={selectedColor}
                      onColorSelect={onColorSelect}
                      productName={currentProduct?.name}
                    />
                  </div>
                )}
              </div>
            )}

            {selectedNavItem === "order" && (
              <div className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                  Order Summary
                </h3>
                
                {currentProduct && (
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      {currentProduct.image && (
                        <div className="relative h-14 w-14 overflow-hidden rounded-lg bg-white">
                          <Image
                            src={currentProduct.image}
                            alt={currentProduct.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-bold text-gray-900">
                          {currentProduct.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {selectedColor}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                      <span className="text-sm text-gray-600">Price</span>
                      <span className="text-lg font-bold text-gray-900">
                        ₹{currentProduct.price}
                      </span>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Review your customizations and place your order.
                  </p>
                  <Button
                    onClick={onOrder}
                    className="w-full bg-black text-white hover:bg-zinc-800 rounded-lg px-4 py-3 text-sm font-semibold disabled:opacity-50 h-12"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Place Order
                  </Button>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <p className="text-[10px] text-gray-400 leading-relaxed">
                    By placing an order, you agree to our terms of service. 
                    Custom orders may take 5-7 business days to process.
                  </p>
                </div>
              </div>
            )}

            {selectedNavItem === "image" && (
              <div className="space-y-4 h-full overflow-y-auto">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                  Artwork
                </h3>
                
                {/* Upload Section */}
                <div className="space-y-3">
                  <label className="text-[11px] uppercase tracking-wide text-gray-400">
                    Upload Image
                  </label>
                  <div className="relative">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={onFileSelect}
                      className="cursor-pointer"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400">
                    PNG, JPG or SVG, up to 5MB
                  </p>
                  
                  {selectedFilePreview && (
                    <div className="space-y-3">
                      <div className="relative h-32 w-full overflow-hidden rounded-lg border border-dashed border-gray-200 bg-gray-50">
                        <Image
                          src={selectedFilePreview}
                          alt="Selected file preview"
                          fill
                          className="object-contain p-2"
                        />
                      </div>
                      <Button
                        onClick={onAddImageToCanvas}
                        disabled={isUploading}
                        className="w-full bg-black text-white hover:bg-zinc-800 rounded-lg px-4 py-2 text-xs font-semibold disabled:opacity-50"
                      >
                        {isUploading ? (
                          <>
                            <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Add to Design
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Current Selection */}
                <div className="pt-4 border-t border-[#f3f0ea] space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] uppercase tracking-wide text-gray-400">
                      Current Selection
                    </p>
                    {viewCustomizations[selectedView].length > 0 && (
                      <button
                        onClick={onDeleteCurrentImage}
                        className="text-[11px] text-red-500 hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  
                  {currentCustomization ? (
                    <div className="space-y-3">
                      <div className="relative h-32 w-full overflow-hidden rounded-lg border border-dashed border-gray-200 bg-gray-50">
                        <Image
                          src={currentCustomization.blobUrl!}
                          alt="Current placement"
                          fill
                          className="object-contain p-2"
                        />
                      </div>
                      
                      {/* Scale Control */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs text-gray-600">Size</label>
                          <span className="text-xs text-gray-400">
                            {Math.round((currentCustomization.scale || 1) * 100)}%
                          </span>
                        </div>
                        <Slider
                          value={[currentCustomization.scale || 1]}
                          onValueChange={onScaleChange}
                          min={0.1}
                          max={3}
                          step={0.1}
                        />
                      </div>
                    </div>
                  ) : viewCustomizations[selectedView].length > 0 ? (
                    <div className="flex h-24 w-full items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 text-[11px] text-gray-400">
                      Select an image on the canvas to edit it
                    </div>
                  ) : (
                    <div className="flex h-24 w-full items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 text-[11px] text-gray-400">
                      No image added yet
                    </div>
                  )}
                </div>

                {/* Layer Count */}
                {viewCustomizations[selectedView].length > 0 && (
                  <div className="pt-3 border-t border-[#f3f0ea]">
                    <p className="text-[11px] text-gray-500">
                      {viewCustomizations[selectedView].length} image{viewCustomizations[selectedView].length !== 1 ? 's' : ''} on {selectedView.toLowerCase()} view
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
