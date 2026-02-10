"use client";

import React from "react";
import { useRouter, useParams } from "next/navigation";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, Save, Loader2 } from "lucide-react";
import Link from "next/link";

type ProductView = "FRONT" | "BACK" | "RIGHT" | "LEFT";
const VIEWS: ProductView[] = ["FRONT", "BACK", "RIGHT", "LEFT"];

type ProductVariant = {
  id?: number;
  view: ProductView;
  color: string;
  image_url: string;
};

type DesignArea = {
  view: ProductView;
  x: number;
  y: number;
  width: number;
  height: number;
};

export default function ProductEditorPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id === "new" ? null : Number(params.id);

  const [loading, setLoading] = React.useState(false);
  const [initialLoading, setInitialLoading] = React.useState(!!id);
  
  // Product State
  const [name, setName] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [price, setPrice] = React.useState("");
  const [image, setImage] = React.useState("");
  const [customizable, setCustomizable] = React.useState(false);
  const [rating, setRating] = React.useState("5");
  const [tag, setTag] = React.useState("");

  // Variants State
  const [variants, setVariants] = React.useState<ProductVariant[]>([]);

  // Design Areas State
  const [designAreas, setDesignAreas] = React.useState<Record<string, DesignArea>>({});

  React.useEffect(() => {
    if (id) {
      loadProductData(id);
    }
  }, [id]);

  const loadProductData = async (productId: number) => {
    setInitialLoading(true);
    try {
      // Load Product
      const { data: product, error: productError } = await supabase
        .from("Products")
        .select("*")
        .eq("id", productId)
        .single();
      
      if (productError) throw productError;

      setName(product.name);
      setCategory(product.category);
      setPrice(product.price.toString());
      setImage(product.image);
      setCustomizable(product.customizable);
      setRating(product.rating.toString());
      setTag(product.tag || "");

      if (product.customizable) {
        // Load Variants
        const { data: variantsData, error: variantsError } = await supabase
          .from("ProductVariants")
          .select("*")
          .eq("product_id", productId);
        
        if (variantsError) throw variantsError;
        setVariants(variantsData || []);

        // Load Design Areas
        const { data: areasData, error: areasError } = await supabase
          .from("DesignAreas")
          .select("*")
          .eq("product_id", productId);
        
        if (areasError) throw areasError;
        
        const areasMap: Record<string, DesignArea> = {};
        areasData?.forEach((area: any) => {
          areasMap[area.view] = {
            view: area.view,
            x: area.x,
            y: area.y,
            width: area.width,
            height: area.height,
          };
        });
        setDesignAreas(areasMap);
      }

    } catch (error: any) {
      console.error("Error loading product:", error);
      toast.error("Failed to load product details");
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name || !category || !price) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const productData = {
        name,
        category,
        price: Number(price),
        image,
        customizable,
        rating: Number(rating),
        tag: tag || null,
      };

      let productId = id;

      if (id) {
        // Update
        const { error } = await supabase
          .from("Products")
          .update(productData)
          .eq("id", id);
        if (error) throw error;
      } else {
        // Insert
        const { data, error } = await supabase
          .from("Products")
          .insert(productData)
          .select()
          .single();
        if (error) throw error;
        productId = data.id;
      }

      if (customizable && productId) {
        // Handle Variants: Delete all and re-insert for simplicity
        // In a real app, you'd want to diff updates to preserve IDs if referenced elsewhere
        await supabase.from("ProductVariants").delete().eq("product_id", productId);
        
        if (variants.length > 0) {
          const variantsToInsert = variants.map(v => ({
            product_id: productId,
            view: v.view,
            color: v.color,
            image_url: v.image_url
          }));
          const { error: vError } = await supabase.from("ProductVariants").insert(variantsToInsert);
          if (vError) throw vError;
        }

        // Handle Design Areas
        await supabase.from("DesignAreas").delete().eq("product_id", productId);
        
        const areasToInsert = Object.values(designAreas).map(area => ({
          product_id: productId,
          view: area.view,
          x: area.x,
          y: area.y,
          width: area.width,
          height: area.height
        }));
        
        if (areasToInsert.length > 0) {
          const { error: aError } = await supabase.from("DesignAreas").insert(areasToInsert);
          if (aError) throw aError;
        }
      }

      toast.success("Product saved successfully");
      router.push("/admin/products");

    } catch (error: any) {
      console.error("Error saving product:", error);
      toast.error("Failed to save product: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const addVariant = () => {
    setVariants([...variants, { view: "FRONT", color: "White", image_url: "" }]);
  };

  const removeVariant = (index: number) => {
    const newVariants = [...variants];
    newVariants.splice(index, 1);
    setVariants(newVariants);
  };

  const updateVariant = (index: number, field: keyof ProductVariant, value: string) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setVariants(newVariants);
  };

  const updateDesignArea = (view: ProductView, field: keyof DesignArea, value: number) => {
    setDesignAreas(prev => ({
      ...prev,
      [view]: {
        ...prev[view],
        view, // Ensure view is set
        [field]: value
      }
    }));
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50/50 pb-20">
      <Navigation />
      <div className="container mx-auto px-6 py-12">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin/products">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">
            {id ? "Edit Product" : "New Product"}
          </h1>
          <div className="ml-auto">
            <Button onClick={handleSave} disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Save className="w-4 h-4 mr-2" />
              Save Product
            </Button>
          </div>
        </div>

        <Tabs defaultValue="details" className="space-y-6">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="variants" disabled={!customizable}>Variants</TabsTrigger>
            <TabsTrigger value="design-areas" disabled={!customizable}>Design Areas</TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle>Product Details</CardTitle>
                <CardDescription>Basic information about the product.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Product Name</Label>
                    <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Classic T-Shirt" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Input id="category" value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. Apparel" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price</Label>
                    <Input id="price" type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rating">Rating</Label>
                    <Input id="rating" type="number" step="0.1" max="5" value={rating} onChange={e => setRating(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image">Main Image URL</Label>
                  <Input id="image" value={image} onChange={e => setImage(e.target.value)} placeholder="https://..." />
                  {image && (
                    <div className="mt-2 w-32 h-32 relative rounded-md overflow-hidden border">
                      <img src={image} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tag">Tag (Optional)</Label>
                  <Input id="tag" value={tag} onChange={e => setTag(e.target.value)} placeholder="e.g. Bestseller" />
                </div>

                <div className="flex items-center space-x-2 pt-4">
                  <Checkbox 
                    id="customizable" 
                    checked={customizable} 
                    onCheckedChange={(checked) => setCustomizable(checked as boolean)} 
                  />
                  <Label htmlFor="customizable">This product is customizable</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="variants">
            <Card>
              <CardHeader>
                <CardTitle>Product Variants</CardTitle>
                <CardDescription>Define the available views and colors for customization.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {variants.map((variant, index) => (
                    <div key={index} className="grid grid-cols-12 gap-4 items-end border p-4 rounded-lg">
                      <div className="col-span-2 space-y-2">
                        <Label>View</Label>
                        <Select value={variant.view} onValueChange={(val) => updateVariant(index, "view", val)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {VIEWS.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-3 space-y-2">
                        <Label>Color</Label>
                        <Input value={variant.color} onChange={e => updateVariant(index, "color", e.target.value)} placeholder="e.g. White" />
                      </div>
                      <div className="col-span-6 space-y-2">
                        <Label>Image URL (Base for this view/color)</Label>
                        <Input value={variant.image_url} onChange={e => updateVariant(index, "image_url", e.target.value)} placeholder="https://..." />
                      </div>
                      <div className="col-span-1">
                        <Button variant="ghost" size="icon" onClick={() => removeVariant(index)} className="text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <Button onClick={addVariant} variant="outline" className="w-full border-dashed">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Variant
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="design-areas">
            <Card>
              <CardHeader>
                <CardTitle>Design Areas</CardTitle>
                <CardDescription>Define the printable area for each view (values 0-1 relative to image size).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {VIEWS.map(view => {
                    const area = designAreas[view] || { view, x: 0, y: 0, width: 0, height: 0 };
                    return (
                      <div key={view} className="border p-4 rounded-lg space-y-4">
                        <h3 className="font-semibold">{view} View</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>X Position</Label>
                            <Input 
                              type="number" step="0.01" min="0" max="1"
                              value={area.x} 
                              onChange={e => updateDesignArea(view, "x", parseFloat(e.target.value))} 
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Y Position</Label>
                            <Input 
                              type="number" step="0.01" min="0" max="1"
                              value={area.y} 
                              onChange={e => updateDesignArea(view, "y", parseFloat(e.target.value))} 
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Width</Label>
                            <Input 
                              type="number" step="0.01" min="0" max="1"
                              value={area.width} 
                              onChange={e => updateDesignArea(view, "width", parseFloat(e.target.value))} 
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Height</Label>
                            <Input 
                              type="number" step="0.01" min="0" max="1"
                              value={area.height} 
                              onChange={e => updateDesignArea(view, "height", parseFloat(e.target.value))} 
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
