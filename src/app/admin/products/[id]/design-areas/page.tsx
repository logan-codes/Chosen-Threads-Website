"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { 
  ArrowLeft, 
  Package, 
  Plus, 
  Trash2, 
  Save, 
  Move,
  Maximize,
  Eye,
  GripVertical,
  Copy
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type ProductView = 'FRONT' | 'BACK' | 'LEFT' | 'RIGHT';

interface DesignArea {
  id: number;
  product_id: number;
  view: ProductView;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Product {
  id: number;
  name: string;
  category: string;
  customizable: boolean;
  image: string;
}

interface ProductVariant {
  id: number;
  product_id: number;
  view: ProductView;
  color: string;
  image_url: string | null;
}

const VIEWS: ProductView[] = ['FRONT', 'BACK', 'LEFT', 'RIGHT'];

export default function DesignAreasPage() {
  const router = useRouter();
  const params = useParams();
  const productId = parseInt(params.id as string);

  const [product, setProduct] = useState<Product | null>(null);
  const [designAreas, setDesignAreas] = useState<DesignArea[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<ProductView>('FRONT');
  const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showPreview, setShowPreview] = useState(true);
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Default design area values
  const defaultDesignArea = {
    x: 0.25,
    y: 0.3,
    width: 0.5,
    height: 0.3
  };

  // Fetch product, variants, and design areas
  useEffect(() => {
    if (!productId) return;
    
    const fetchData = async () => {
      setLoading(true);
      
      // Fetch product details
      const { data: productData, error: productError } = await supabase
        .from('Products')
        .select('id, name, category, customizable, image')
        .eq('id', productId)
        .single();

      if (productError) {
        toast.error('Failed to load product');
        console.error(productError);
      } else {
        setProduct(productData);
      }

      // Fetch design areas
      const { data: areasData, error: areasError } = await supabase
        .from('DesignAreas')
        .select('*')
        .eq('product_id', productId);

      if (areasError) {
        toast.error('Failed to load design areas');
        console.error(areasError);
      } else {
        setDesignAreas(areasData || []);
      }

      // Fetch variants for image preview
      const { data: variantsData, error: variantsError } = await supabase
        .from('ProductVariants')
        .select('*')
        .eq('product_id', productId)
        .eq('view', 'FRONT');

      if (variantsError) {
        console.error('Failed to load variants:', variantsError);
      } else {
        setVariants(variantsData || []);
      }

      setLoading(false);
    };

    fetchData();
  }, [productId]);

  // Get design areas for current view
  const getDesignAreasForView = useCallback((view: ProductView) => {
    return designAreas.filter(area => area.view === view);
  }, [designAreas]);

  // Get preview image for current view
  const getPreviewImage = useCallback((view: ProductView) => {
    const variant = variants.find(v => v.view === view && v.image_url);
    return variant?.image_url || product?.image;
  }, [variants, product]);

  // Add new design area
  const addDesignArea = async () => {
    try {
      const response = await fetch(`/api/admin/products/${productId}/design-areas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          view: selectedView,
          ...defaultDesignArea
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create design area');
      }

      const result = await response.json();
      setDesignAreas(prev => [...prev, result.designArea]);
      setSelectedAreaId(result.designArea.id);
      toast.success('Design area created');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create design area');
      console.error(error);
    }
  };

  // Update design area
  const updateDesignArea = async (areaId: number, updates: Partial<DesignArea>) => {
    try {
      const response = await fetch(`/api/admin/products/${productId}/design-areas`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          designAreaId: areaId,
          ...updates
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update design area');
      }

      const result = await response.json();
      setDesignAreas(prev => prev.map(area => 
        area.id === areaId ? result.designArea : area
      ));
    } catch (error: any) {
      toast.error(error.message || 'Failed to update design area');
      console.error(error);
    }
  };

  // Delete design area
  const deleteDesignArea = async (areaId: number) => {
    if (!confirm('Are you sure you want to delete this design area?')) return;

    try {
      const response = await fetch(
        `/api/admin/products/${productId}/design-areas?designAreaId=${areaId}`,
        {
          method: 'DELETE',
          credentials: 'include'
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete design area');
      }

      setDesignAreas(prev => prev.filter(area => area.id !== areaId));
      if (selectedAreaId === areaId) {
        setSelectedAreaId(null);
      }
      toast.success('Design area deleted');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete design area');
      console.error(error);
    }
  };

  // Copy design area to another view
  const copyToView = async (area: DesignArea, targetView: ProductView) => {
    try {
      const response = await fetch(`/api/admin/products/${productId}/design-areas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          view: targetView,
          x: area.x,
          y: area.y,
          width: area.width,
          height: area.height
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to copy design area');
      }

      const result = await response.json();
      setDesignAreas(prev => [...prev, result.designArea]);
      toast.success(`Design area copied to ${targetView}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to copy design area');
      console.error(error);
    }
  };

  // Mouse event handlers for drag and resize
  const handleMouseDown = (e: React.MouseEvent, area: DesignArea, action: 'drag' | 'resize') => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedAreaId(area.id);
    
    if (action === 'drag') {
      setIsDragging(true);
    } else {
      setIsResizing(true);
    }
    
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging && !isResizing) return;
    if (!selectedAreaId || !containerRef.current) return;

    const area = designAreas.find(a => a.id === selectedAreaId);
    if (!area) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    
    const deltaX = (e.clientX - dragStart.x) / rect.width;
    const deltaY = (e.clientY - dragStart.y) / rect.height;

    if (isDragging) {
      const newX = Math.max(0, Math.min(1 - area.width, area.x + deltaX));
      const newY = Math.max(0, Math.min(1 - area.height, area.y + deltaY));
      
      // Update locally for smooth UI
      setDesignAreas(prev => prev.map(a => 
        a.id === selectedAreaId ? { ...a, x: newX, y: newY } : a
      ));
    } else if (isResizing) {
      const newWidth = Math.max(0.1, Math.min(1 - area.x, area.width + deltaX));
      const newHeight = Math.max(0.1, Math.min(1 - area.y, area.height + deltaY));
      
      setDesignAreas(prev => prev.map(a => 
        a.id === selectedAreaId ? { ...a, width: newWidth, height: newHeight } : a
      ));
    }

    setDragStart({ x: e.clientX, y: e.clientY });
  }, [isDragging, isResizing, selectedAreaId, designAreas, dragStart]);

  const handleMouseUp = useCallback(() => {
    if ((isDragging || isResizing) && selectedAreaId) {
      // Save final position to database
      const area = designAreas.find(a => a.id === selectedAreaId);
      if (area) {
        updateDesignArea(selectedAreaId, {
          x: area.x,
          y: area.y,
          width: area.width,
          height: area.height
        });
      }
    }
    
    setIsDragging(false);
    setIsResizing(false);
  }, [isDragging, isResizing, selectedAreaId, designAreas]);

  // Add mouse event listeners
  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  // Handle precision input changes
  const handlePrecisionChange = (areaId: number, field: keyof DesignArea, value: number) => {
    setDesignAreas(prev => prev.map(area => 
      area.id === areaId ? { ...area, [field]: value } : area
    ));
  };

  const savePrecisionChanges = (areaId: number) => {
    const area = designAreas.find(a => a.id === areaId);
    if (area) {
      updateDesignArea(areaId, {
        x: area.x,
        y: area.y,
        width: area.width,
        height: area.height
      });
      toast.success('Changes saved');
    }
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

  const currentAreas = getDesignAreasForView(selectedView);
  const previewImage = getPreviewImage(selectedView);

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
              <h1 className="text-3xl font-bold text-gray-900">Design Areas</h1>
              <p className="text-gray-600">Configure customization zones for {product.name}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
            >
              <Eye className="w-4 h-4 mr-2" />
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </Button>
          </div>
        </div>

        {/* View Tabs */}
        <Tabs value={selectedView} onValueChange={(v) => setSelectedView(v as ProductView)}>
          <TabsList className="grid w-full grid-cols-4">
            {VIEWS.map((view) => (
              <TabsTrigger key={view} value={view}>
                <Eye className="w-4 h-4 mr-2" />
                {view}
                {getDesignAreasForView(view).length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {getDesignAreasForView(view).length}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {VIEWS.map((view) => (
            <TabsContent key={view} value={view}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Visual Editor */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Visual Editor - {view}</span>
                      <Button onClick={addDesignArea} size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Area
                      </Button>
                    </CardTitle>
                    <CardDescription>
                      Drag to move, resize handle to adjust size
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div 
                      ref={containerRef}
                      className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden"
                      onClick={() => setSelectedAreaId(null)}
                    >
                      {showPreview && previewImage ? (
                        <img
                          src={previewImage}
                          alt={`${view} view`}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                          <Package className="w-16 h-16" />
                        </div>
                      )}

                      {/* Grid overlay */}
                      <div className="absolute inset-0 pointer-events-none opacity-10">
                        <div className="w-full h-full" style={{
                          backgroundImage: `
                            linear-gradient(to right, #000 1px, transparent 1px),
                            linear-gradient(to bottom, #000 1px, transparent 1px)
                          `,
                          backgroundSize: '10% 10%'
                        }} />
                      </div>

                      {/* Design Areas */}
                      {getDesignAreasForView(view).map((area, index) => (
                        <div
                          key={area.id}
                          className={cn(
                            "absolute border-2 cursor-move transition-all",
                            selectedAreaId === area.id 
                              ? "border-primary bg-primary/10 shadow-lg" 
                              : "border-blue-400 bg-blue-400/20 hover:bg-blue-400/30"
                          )}
                          style={{
                            left: `${area.x * 100}%`,
                            top: `${area.y * 100}%`,
                            width: `${area.width * 100}%`,
                            height: `${area.height * 100}%`,
                            zIndex: selectedAreaId === area.id ? 10 : 1
                          }}
                          onMouseDown={(e) => handleMouseDown(e, area, 'drag')}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAreaId(area.id);
                          }}
                        >
                          {/* Area Label */}
                          <div className="absolute -top-6 left-0 bg-primary text-white text-xs px-2 py-1 rounded">
                            Area {index + 1}
                          </div>

                          {/* Resize Handle */}
                          <div
                            className="absolute -bottom-2 -right-2 w-4 h-4 bg-primary rounded-full cursor-se-resize shadow-md hover:scale-110 transition-transform"
                            onMouseDown={(e) => handleMouseDown(e, area, 'resize')}
                          />

                          {/* Center Point */}
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-primary rounded-full" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Properties Panel */}
                <Card>
                  <CardHeader>
                    <CardTitle>Properties</CardTitle>
                    <CardDescription>
                      {currentAreas.length} area(s) configured
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {currentAreas.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Maximize className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No design areas yet</p>
                        <p className="text-xs">Add an area to get started</p>
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        {currentAreas.map((area, index) => (
                          <Card 
                            key={area.id} 
                            className={cn(
                              "cursor-pointer transition-all",
                              selectedAreaId === area.id && "ring-2 ring-primary"
                            )}
                            onClick={() => setSelectedAreaId(area.id)}
                          >
                            <CardContent className="p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">Area {index + 1}</span>
                                <div className="flex space-x-1">
                                  {/* Copy to other views */}
                                  <select
                                    className="text-xs border rounded px-2 py-1"
                                    onChange={(e) => {
                                      if (e.target.value) {
                                        copyToView(area, e.target.value as ProductView);
                                        e.target.value = '';
                                      }
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <option value="">Copy to...</option>
                                    {VIEWS.filter(v => v !== view).map(v => (
                                      <option key={v} value={v}>{v}</option>
                                    ))}
                                  </select>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-500 hover:text-red-600 h-8 w-8 p-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteDesignArea(area.id);
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>

                              {/* Coordinate Inputs */}
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <Label className="text-xs">X Position</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="1"
                                    value={area.x.toFixed(2)}
                                    onChange={(e) => handlePrecisionChange(area.id, 'x', parseFloat(e.target.value))}
                                    onBlur={() => savePrecisionChanges(area.id)}
                                    className="text-sm h-8"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Y Position</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="1"
                                    value={area.y.toFixed(2)}
                                    onChange={(e) => handlePrecisionChange(area.id, 'y', parseFloat(e.target.value))}
                                    onBlur={() => savePrecisionChanges(area.id)}
                                    className="text-sm h-8"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Width</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0.1"
                                    max="1"
                                    value={area.width.toFixed(2)}
                                    onChange={(e) => handlePrecisionChange(area.id, 'width', parseFloat(e.target.value))}
                                    onBlur={() => savePrecisionChanges(area.id)}
                                    className="text-sm h-8"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Height</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0.1"
                                    max="1"
                                    value={area.height.toFixed(2)}
                                    onChange={(e) => handlePrecisionChange(area.id, 'height', parseFloat(e.target.value))}
                                    onBlur={() => savePrecisionChanges(area.id)}
                                    className="text-sm h-8"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Quick Tips */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <Move className="w-4 h-4 mr-2 mt-0.5 text-primary" />
                <span><strong>Drag</strong> design areas to reposition them on the product image</span>
              </li>
              <li className="flex items-start">
                <Maximize className="w-4 h-4 mr-2 mt-0.5 text-primary" />
                <span><strong>Resize</strong> by dragging the bottom-right corner handle</span>
              </li>
              <li className="flex items-start">
                <Copy className="w-4 h-4 mr-2 mt-0.5 text-primary" />
                <span><strong>Copy</strong> design areas to other views using the dropdown in each area card</span>
              </li>
              <li className="flex items-start">
                <Save className="w-4 h-4 mr-2 mt-0.5 text-primary" />
                <span><strong>Precision</strong> adjustments can be made using the coordinate inputs on the right panel</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
