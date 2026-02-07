import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { Shirt, ImageIcon, ShoppingCart } from 'lucide-react';

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
  const navItems = [
    { id: 'products', label: 'Products', icon: Shirt },
    { id: 'image', label: 'Image', icon: ImageIcon },
    { id: 'order', label: 'Order', icon: ShoppingCart },
  ];

  const buttonRefs = React.useRef<Record<string, HTMLButtonElement | null>>({});

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
          className="absolute left-full w-80 bg-white border-r border-[#e8e5e0] shadow-xl overflow-y-auto z-50"
          style={{
            top: `80px`, // Position below the header
            maxHeight: 'calc(100vh - 100px)', // Adjust height to fit
          }}
        >
          <div className="p-4">
            {selectedNavItem === "products" && (
              <div className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                  Product
                </h3>
                {currentProduct ? (
                  <div className="flex items-center gap-3 mb-3">
                    {currentProduct.image && (
                      <div className="relative h-10 w-10 overflow-hidden rounded-md bg-gray-100">
                        <Image
                          src={currentProduct.image}
                          alt={currentProduct.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        {currentProduct.name}
                      </div>
                      <div className="text-[11px] uppercase tracking-wide text-gray-400">
                        {currentProduct.category}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 mb-3">
                    Loading product details...
                  </p>
                )}

                {products.length > 1 && (
                  <div className="space-y-2">
                    <p className="text-[11px] uppercase tracking-wide text-gray-400">
                      Switch product
                    </p>
                    <div className="max-h-56 overflow-y-auto space-y-1">
                      {products.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => onProductChange(p.id)}
                          className={cn(
                            "w-full flex items-center gap-2 rounded-md px-2 py-2 text-left text-xs hover:bg-gray-50",
                            currentProduct && currentProduct.id === p.id
                              ? "bg-gray-100 font-semibold"
                              : "text-gray-600"
                          )}
                        >
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-gray-100 text-[10px] font-semibold">
                            #{p.id}
                          </span>
                          <span className="truncate">{p.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-3 border-t border-[#f3f0ea] space-y-2">
                  <p className="text-[11px] uppercase tracking-wide text-gray-400">
                    Colors
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {availableColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => onColorSelect(color)}
                        className={cn(
                          "h-8 w-8 rounded-full border-2 border-transparent ring-2 ring-transparent transition-all",
                          selectedColor === color &&
                            "ring-gray-900 ring-offset-2 ring-offset-white"
                        )}
                        style={{ backgroundColor: color }}
                        aria-label={`Select color ${color}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {selectedNavItem === "order" && (
              <div className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                  Order
                </h3>
                <div className="space-y-3">
                  <p className="text-sm text-gray-700">
                    Review your customizations and place your order.
                  </p>
                  <Button
                    onClick={onOrder}
                    className="w-full bg-black text-white hover:bg-zinc-800 rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50"
                  >
                    Place Order
                  </Button>
                </div>
              </div>
            )}

            {selectedNavItem === "image" && (
              <div className="space-y-4 h-full overflow-y-auto">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                  Artwork
                </h3>
                <div className="space-y-2">
                  <label className="text-[11px] uppercase tracking-wide text-gray-400">
                    Choose image
                  </label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={onFileSelect}
                  />
                  <p className="text-[11px] text-gray-400">
                    PNG or JPG, up to 5MB.
                  </p>
                  
                  {selectedFilePreview && (
                    <div className="space-y-2">
                      <div className="relative h-24 w-full overflow-hidden rounded-md border border-dashed border-gray-200 bg-gray-50">
                        <Image
                          src={selectedFilePreview}
                          alt="Selected file preview"
                          fill
                          className="object-contain"
                        />
                      </div>
                      <Button
                        onClick={onAddImageToCanvas}
                        disabled={isUploading}
                        className="w-full bg-black text-white hover:bg-zinc-800 rounded-lg px-4 py-2 text-xs font-semibold disabled:opacity-50"
                      >
                        {isUploading ? "Adding..." : "Add to Canvas"}
                      </Button>
                    </div>
                  )}
                  
                  {isUploading && !selectedFilePreview && (
                    <p className="text-[11px] text-gray-500">
                      Uploading image...
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-[#f3f0ea] space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] uppercase tracking-wide text-gray-400">
                      Selected Image
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
                    <div className="relative h-24 w-full overflow-hidden rounded-md border border-dashed border-gray-200 bg-gray-50">
                      <Image
                        src={currentCustomization.blobUrl!}
                        alt="Current placement"
                        fill
                        className="object-contain"
                      />
                    </div>
                  ) : viewCustomizations[selectedView].length > 0 ? (
                    <div className="flex h-24 w-full items-center justify-center rounded-md border border-dashed border-gray-200 bg-gray-50 text-[11px] text-gray-400">
                      Select an image on the canvas to edit it.
                    </div>
                  ) : (
                    <div className="flex h-24 w-full items-center justify-center rounded-md border border-dashed border-gray-200 bg-gray-50 text-[11px] text-gray-400">
                      No image selected yet.
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
