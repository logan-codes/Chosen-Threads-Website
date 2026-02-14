"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { 
  Package, 
  Plus, 
  Trash2, 
  Upload, 
  ArrowLeft,
  Palette,
  Eye,
  Save,
  Check,
  X
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type ProductView = 'FRONT' | 'BACK' | 'LEFT' | 'RIGHT';

interface ProductVariant {
  id: number;
  product_id: number;
  view: ProductView;
  color: string;
  image_url: string | null;
  created_at: string;
}

interface Product {
  id: number;
  name: string;
  category: string;
  customizable: boolean;
}

const PREDEFINED_COLORS = [
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Black', hex: '#111827' },
  { name: 'Gray', hex: '#6B7280' },
  { name: 'Navy', hex: '#1E3A8A' },
  { name: 'Blue', hex: '#3B82F6' },
  { name: 'Red', hex: '#EF4444' },
  { name: 'Green', hex: '#10B981' },
  { name: 'Yellow', hex: '#F59E0B' },
  { name: 'Orange', hex: '#F97316' },
  { name: 'Purple', hex: '#8B5CF6' },
  { name: 'Pink', hex: '#EC4899' },
  { name: 'Brown', hex: '#92400E' },
];

const VIEWS: ProductView[] = ['FRONT', 'BACK', 'LEFT', 'RIGHT'];

export default function ProductVariantsPage() {
  const router = useRouter();
  const params = useParams();
  const productId = parseInt(params.id as string);

  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<ProductView>('FRONT');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [customColor, setCustomColor] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [availableColors, setAvailableColors] = useState<string[]>([]);

  // Fetch product and variants
  useEffect(() => {
    if (!productId) return;
    
    const fetchData = async () => {
      setLoading(true);
      
      // Fetch product details
      const { data: productData, error: productError } = await supabase
        .from('Products')
        .select('id, name, category, customizable')
        .eq('id', productId)
        .single();

      if (productError) {
        toast.error('Failed to load product');
        console.error(productError);
      } else {
        setProduct(productData);
      }

      // Fetch variants
      const { data: variantsData, error: variantsError } = await supabase
        .from('ProductVariants')
        .select('*')
        .eq('product_id', productId);

      if (variantsError) {
        toast.error('Failed to load variants');
        console.error(variantsError);
      } else {
        const typedVariants = (variantsData || []) as ProductVariant[];
        setVariants(typedVariants);
        
        // Extract unique colors
        const colors = Array.from(new Set(typedVariants.map(v => v.color)));
        setAvailableColors(colors);
      }

      setLoading(false);
    };

    fetchData();
  }, [productId]);

  // Handle image upload
  const handleImageUpload = async (file: File, view: ProductView, color: string) => {
    if (!file || !color) return;

    setUploading(true);
    const uploadToast = toast.loading('Uploading image...');

    try {
      // Validate file
      if (!file.type.startsWith('image/')) {
        throw new Error('Please upload an image file');
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Image must be less than 5MB');
      }

      // Upload to Supabase Storage
      const fileName = `product-${productId}-${view}-${color}-${Date.now()}.${file.name.split('.').pop()}`;
      const filePath = `product-variants/${productId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      // Create or update variant
      const response = await fetch(`/api/admin/products/${productId}/variants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          view,
          color,
          image_url: publicUrl
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save variant');
      }

      const result = await response.json();
      
      // Update local state
      if (result.updated) {
        setVariants(prev => prev.map(v => 
          v.id === result.variant.id ? result.variant : v
        ));
      } else {
        setVariants(prev => [...prev, result.variant]);
        if (!availableColors.includes(color)) {
          setAvailableColors(prev => [...prev, color]);
        }
      }

      toast.success('Image uploaded successfully', { id: uploadToast });
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload image', { id: uploadToast });
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, view: ProductView, color: string) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file, view, color);
    }
  };

  // Delete variant
  const deleteVariant = async (variantId: number) => {
    if (!confirm('Are you sure you want to delete this variant?')) return;

    try {
      const response = await fetch(
        `/api/admin/products/${productId}/variants?variantId=${variantId}`,
        {
          method: 'DELETE',
          credentials: 'include'
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete variant');
      }

      setVariants(prev => prev.filter(v => v.id !== variantId));
      
      // Update available colors
      const remainingColors = Array.from(new Set(
        variants.filter(v => v.id !== variantId).map(v => v.color)
      ));
      setAvailableColors(remainingColors);

      toast.success('Variant deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete variant');
      console.error(error);
    }
  };

  // Add new color
  const addColor = () => {
    const colorToAdd = customColor || selectedColor;
    if (!colorToAdd) {
      toast.error('Please select or enter a color');
      return;
    }

    if (availableColors.includes(colorToAdd)) {
      toast.error('This color already exists');
      return;
    }

    setAvailableColors(prev => [...prev, colorToAdd]);
    setSelectedColor('');
    setCustomColor('');
    toast.success(`Color "${colorToAdd}" added`);
  };

  // Get variant for specific view and color
  const getVariant = (view: ProductView, color: string) => {
    return variants.find(v => v.view === view && v.color === color);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!product) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Product not found</h3>
          <Button onClick={() => router.push('/admin/products')} className="mt-4">
            Back to Products
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={() => router.push('/admin/products')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Product Variants</h1>
              <p className="text-gray-600">Manage colors and images for {product.name}</p>
            </div>
          </div>
        </div>

        {/* Color Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Palette className="w-5 h-5 mr-2" />
              Color Management
            </CardTitle>
            <CardDescription>Add colors to create variants</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Predefined Colors */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Quick Select</label>
                <div className="flex flex-wrap gap-2">
                  {PREDEFINED_COLORS.map((color) => (
                    <button
                      key={color.hex}
                      onClick={() => setSelectedColor(color.name)}
                      className={cn(
                        "w-10 h-10 rounded-lg border-2 transition-all",
                        selectedColor === color.name 
                          ? "border-primary ring-2 ring-primary/20" 
                          : "border-gray-200 hover:border-gray-300"
                      )}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              {/* Custom Color */}
              <div className="flex items-end space-x-2">
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Custom Color Name
                  </label>
                  <Input
                    placeholder="e.g., Teal, Burgundy, etc."
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                  />
                </div>
                <Button onClick={addColor} disabled={!selectedColor && !customColor}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Color
                </Button>
              </div>

              {/* Available Colors */}
              {availableColors.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Active Colors ({availableColors.length})
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableColors.map((color) => (
                      <Badge 
                        key={color} 
                        variant="secondary"
                        className="text-sm py-1 px-3"
                      >
                        {color}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Variants by View */}
        {availableColors.length > 0 ? (
          <Tabs defaultValue="FRONT" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              {VIEWS.map((view) => (
                <TabsTrigger key={view} value={view}>
                  <Eye className="w-4 h-4 mr-2" />
                  {view}
                </TabsTrigger>
              ))}
            </TabsList>

            {VIEWS.map((view) => (
              <TabsContent key={view} value={view}>
                <Card>
                  <CardHeader>
                    <CardTitle>{view} View Images</CardTitle>
                    <CardDescription>
                      Upload images for each color variant
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {availableColors.map((color) => {
                        const variant = getVariant(view, color);
                        return (
                          <Card key={`${view}-${color}`} className="overflow-hidden">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-3">
                                <Badge variant="outline">{color}</Badge>
                                {variant && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-500 hover:text-red-600"
                                    onClick={() => deleteVariant(variant.id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>

                              {variant?.image_url ? (
                                <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3">
                                  <img
                                    src={variant.image_url}
                                    alt={`${color} ${view}`}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="aspect-square bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center mb-3">
                                  <div className="text-center text-gray-400">
                                    <Package className="w-8 h-8 mx-auto mb-2" />
                                    <span className="text-sm">No image</span>
                                  </div>
                                </div>
                              )}

                              <div className="relative">
                                <Input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleFileChange(e, view, color)}
                                  disabled={uploading}
                                  className="hidden"
                                  id={`upload-${view}-${color}`}
                                />
                                <Button
                                  variant="outline"
                                  className="w-full"
                                  disabled={uploading}
                                  onClick={() => document.getElementById(`upload-${view}-${color}`)?.click()}
                                >
                                  <Upload className="w-4 h-4 mr-2" />
                                  {variant?.image_url ? 'Replace Image' : 'Upload Image'}
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Palette className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Colors Added</h3>
              <p className="text-gray-600 mb-4">
                Add colors above to start creating product variants
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
