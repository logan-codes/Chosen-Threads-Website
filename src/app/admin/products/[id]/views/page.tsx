"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { 
  ArrowLeft, 
  Package, 
  Eye,
  Save,
  Shirt,
  Check,
  AlertCircle
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type ProductView = 'FRONT' | 'BACK' | 'LEFT' | 'RIGHT';

interface ViewConfig {
  id: ProductView;
  name: string;
  description: string;
  icon: React.ReactNode;
}

const VIEW_CONFIGS: ViewConfig[] = [
  { 
    id: 'FRONT', 
    name: 'Front View', 
    description: 'Main front-facing view of the product',
    icon: <Shirt className="w-6 h-6" />
  },
  { 
    id: 'BACK', 
    name: 'Back View', 
    description: 'Rear view of the product',
    icon: <Shirt className="w-6 h-6 rotate-180" />
  },
  { 
    id: 'LEFT', 
    name: 'Left Side', 
    description: 'Left side profile view',
    icon: <Eye className="w-6 h-6" />
  },
  { 
    id: 'RIGHT', 
    name: 'Right Side', 
    description: 'Right side profile view',
    icon: <Eye className="w-6 h-6" />
  },
];

const PRODUCT_TEMPLATES = [
  { 
    name: 'T-Shirt / Top', 
    views: ['FRONT', 'BACK'] as ProductView[],
    description: 'Standard apparel with front and back customization'
  },
  { 
    name: 'Full Garment', 
    views: ['FRONT', 'BACK', 'LEFT', 'RIGHT'] as ProductView[],
    description: '360° customizable with all four views'
  },
  { 
    name: 'Pants / Bottom', 
    views: ['FRONT', 'BACK'] as ProductView[],
    description: 'Bottom wear with front and back views'
  },
  { 
    name: 'Accessories', 
    views: ['FRONT'] as ProductView[],
    description: 'Single view for accessories and small items'
  },
];

export default function ProductViewsPage() {
  const router = useRouter();
  const params = useParams();
  const productId = parseInt(params.id as string);

  const [product, setProduct] = useState<any>(null);
  const [selectedViews, setSelectedViews] = useState<ProductView[]>(['FRONT', 'BACK']);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (!productId) return;
    fetchData();
  }, [productId]);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch product
    const { data: productData } = await supabase
      .from('Products')
      .select('id, name, category, customizable')
      .eq('id', productId)
      .single();

    if (productData) {
      setProduct(productData);
    }

    // Fetch configured views
    try {
      const response = await fetch(`/api/admin/products/${productId}/views`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setSelectedViews(data.configuredViews.length > 0 ? data.configuredViews : ['FRONT', 'BACK']);
      }
    } catch (error) {
      console.error('Error fetching views:', error);
    }

    setLoading(false);
  };

  const toggleView = (view: ProductView) => {
    setSelectedViews(prev => {
      const exists = prev.includes(view);
      if (exists) {
        // Don't allow removing the last view
        if (prev.length === 1) {
          toast.error('At least one view is required');
          return prev;
        }
        return prev.filter(v => v !== view);
      } else {
        // Add view maintaining order
        const newViews = [...prev, view];
        const order = ['FRONT', 'BACK', 'LEFT', 'RIGHT'];
        return newViews.sort((a, b) => order.indexOf(a) - order.indexOf(b));
      }
    });
    setHasChanges(true);
  };

  const applyTemplate = (views: ProductView[]) => {
    setSelectedViews(views);
    setHasChanges(true);
    toast.success('Template applied');
  };

  const saveViews = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/products/${productId}/views`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ views: selectedViews })
      });

      if (!response.ok) throw new Error('Failed to save views');

      toast.success('Views configuration saved');
      setHasChanges(false);
    } catch (error) {
      toast.error('Failed to save views');
      console.error(error);
    }
    setSaving(false);
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
              <h1 className="text-3xl font-bold text-gray-900">Configure Views</h1>
              <p className="text-gray-600">Set which views are available for {product.name}</p>
            </div>
          </div>
          {hasChanges && (
            <Button onClick={saveViews} disabled={saving}>
              {saving ? (
                <>
                  <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          )}
        </div>

        {/* Quick Templates */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Templates</CardTitle>
            <CardDescription>Choose a preset configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {PRODUCT_TEMPLATES.map((template) => (
                <button
                  key={template.name}
                  onClick={() => applyTemplate(template.views)}
                  className={cn(
                    "p-4 rounded-lg border-2 text-left transition-all hover:shadow-md",
                    JSON.stringify(selectedViews.sort()) === JSON.stringify(template.views.sort())
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex -space-x-1">
                      {template.views.slice(0, 3).map((view) => (
                        <div 
                          key={view} 
                          className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary border-2 border-white"
                        >
                          {view.charAt(0)}
                        </div>
                      ))}
                    </div>
                  </div>
                  <h3 className="font-semibold text-sm">{template.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">{template.description}</p>
                  <div className="flex gap-1 mt-2">
                    {template.views.map(view => (
                      <Badge key={view} variant="secondary" className="text-[10px]">
                        {view}
                      </Badge>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* View Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Available Views</CardTitle>
            <CardDescription>
              Toggle which views customers can customize ({selectedViews.length} selected)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {VIEW_CONFIGS.map((viewConfig) => {
                const isSelected = selectedViews.includes(viewConfig.id);
                return (
                  <div
                    key={viewConfig.id}
                    className={cn(
                      "p-4 rounded-lg border-2 transition-all cursor-pointer",
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-gray-200 bg-gray-50 opacity-60"
                    )}
                    onClick={() => toggleView(viewConfig.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-12 h-12 rounded-lg flex items-center justify-center",
                          isSelected ? "bg-primary text-white" : "bg-gray-200 text-gray-500"
                        )}>
                          {viewConfig.icon}
                        </div>
                        <div>
                          <h3 className="font-semibold">{viewConfig.name}</h3>
                          <p className="text-sm text-gray-500">{viewConfig.description}</p>
                        </div>
                      </div>
                      <Switch 
                        checked={isSelected} 
                        onCheckedChange={() => toggleView(viewConfig.id)}
                      />
                    </div>
                    
                    {isSelected && (
                      <div className="mt-3 flex items-center gap-2 text-sm text-primary">
                        <Check className="w-4 h-4" />
                        <span>Active</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {selectedViews.length === 1 && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                <p className="text-sm text-yellow-800">
                  Only one view is selected. Customers will only be able to customize this single view.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>This is how the product will appear in the customizer</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center justify-center gap-4">
                {selectedViews.map((view, index) => (
                  <React.Fragment key={view}>
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-20 h-20 rounded-full bg-white border-2 border-primary shadow-sm flex items-center justify-center">
                        <span className="text-lg font-bold text-primary">{view.charAt(0)}</span>
                      </div>
                      <span className="text-xs font-medium text-gray-600">{view}</span>
                    </div>
                    {index < selectedViews.length - 1 && (
                      <div className="w-8 h-0.5 bg-gray-300"></div>
                    )}
                  </React.Fragment>
                ))}
              </div>
              <p className="text-center text-sm text-gray-500 mt-4">
                Customers will be able to switch between {selectedViews.length} view{selectedViews.length !== 1 ? 's' : ''}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => router.push(`/admin/products/${productId}/variants`)}>
            Manage Variants
          </Button>
          <Button 
            onClick={saveViews} 
            disabled={saving || !hasChanges}
            className={cn(!hasChanges && "opacity-50")}
          >
            {saving ? 'Saving...' : 'Save Configuration'}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
