import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Package, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
  customizable: boolean;
}

interface ProductSelectorProps {
  products: Product[];
  currentProduct: Product | null;
  onProductChange: (id: number) => void;
  recentlyViewed?: number[];
}

export function ProductSelector({ 
  products, 
  currentProduct, 
  onProductChange,
  recentlyViewed = []
}: ProductSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category));
    return ['all', ...Array.from(cats).sort()];
  }, [products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  // Get recently viewed products
  const recentProducts = useMemo(() => {
    return recentlyViewed
      .map(id => products.find(p => p.id === id))
      .filter((p): p is Product => p !== undefined && p.id !== currentProduct?.id)
      .slice(0, 3);
  }, [recentlyViewed, products, currentProduct]);

  return (
    <div className="space-y-4">
      {/* Current Product */}
      {currentProduct && (
        <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-4 border border-primary/20">
          <p className="text-[10px] uppercase tracking-wide text-primary font-semibold mb-2">
            Currently Customizing
          </p>
          <div className="flex items-center gap-3">
            {currentProduct.image && (
              <div className="relative h-14 w-14 overflow-hidden rounded-lg bg-white shadow-sm">
                <Image
                  src={currentProduct.image}
                  alt={currentProduct.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-gray-900 truncate">
                {currentProduct.name}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-[10px]">
                  {currentProduct.category}
                </Badge>
                <span className="text-xs font-semibold text-primary">
                  ₹{currentProduct.price}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-10 text-sm"
        />
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-1.5">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={cn(
              "px-3 py-1.5 rounded-full text-[11px] font-medium transition-all",
              selectedCategory === category
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            {category === 'all' ? 'All' : category}
          </button>
        ))}
      </div>

      {/* Recently Viewed */}
      {recentProducts.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-wide text-gray-400 font-medium">
            Recently Viewed
          </p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {recentProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => onProductChange(product.id)}
                className="flex-shrink-0 group"
              >
                <div className="relative h-16 w-16 overflow-hidden rounded-lg bg-gray-100 group-hover:ring-2 ring-primary transition-all">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <p className="text-[10px] text-gray-600 mt-1 truncate w-16">
                  {product.name}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Product List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-wide text-gray-400 font-medium">
            {filteredProducts.length} Product{filteredProducts.length !== 1 ? 's' : ''}
          </p>
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="text-[10px] text-primary hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">No products found</p>
            </div>
          ) : (
            filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => onProductChange(product.id)}
                className={cn(
                  "w-full flex items-center gap-3 rounded-lg p-2 text-left transition-all",
                  currentProduct?.id === product.id
                    ? "bg-primary/10 border border-primary/30"
                    : "hover:bg-gray-50 border border-transparent"
                )}
              >
                <div className="relative h-12 w-12 overflow-hidden rounded-md bg-gray-100 flex-shrink-0">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={cn(
                    "text-xs font-semibold truncate",
                    currentProduct?.id === product.id ? "text-primary" : "text-gray-900"
                  )}>
                    {product.name}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-gray-500">
                      {product.category}
                    </span>
                    <span className="text-[10px] font-medium text-gray-700">
                      ₹{product.price}
                    </span>
                  </div>
                </div>
                <ChevronRight className={cn(
                  "w-4 h-4 flex-shrink-0",
                  currentProduct?.id === product.id ? "text-primary" : "text-gray-300"
                )} />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
