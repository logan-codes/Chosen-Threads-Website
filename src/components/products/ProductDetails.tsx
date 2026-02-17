"use client";

import { useState } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface ProductVariant {
  id: number;
  product_id: number;
  color: string;
  image_url: string | null;
}

interface ProductDetailsProps {
  product: {
    id: number;
    name: string;
    category: string;
    image: string;
    customizable: boolean;
    price: number;
  };
  variants: ProductVariant[];
}

export function ProductDetails({ product, variants }: ProductDetailsProps) {
  const router = useRouter();
  const [selectedColor, setSelectedColor] = useState<string>(
    variants.length > 0 ? variants[0].color : "white"
  );
  const [isProcessing, setIsProcessing] = useState(false);

  const colors = [...new Set(variants.map((v) => v.color))];
  const currentVariant = variants.find((v) => v.color === selectedColor);

  const handleBuyNow = async () => {
    setIsProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Please log in to place an order.");
        router.push(`/login?redirect=/shop/${product.id}`);
        return;
      }

      const { data: orderData, error: orderError } = await supabase
        .from('Order')
        .insert({
          user_id: session.user.id,
          product_id: product.id,
          status: 'pending_confirmation',
          total_price: product.price,
          selected_color: selectedColor
        })
        .select()
        .single();

      if (orderError) {
        throw new Error(`Order creation failed: ${orderError.message}`);
      }

      // const { data: orderItemData, error: orderItemError } = await supabase
      //   .from('OrderItems')
      //   .insert({
      //     order_id: orderData.id,
      //     product_id: product.id,
      //     quantity: 1,
      //     unit_price: product.price,
      //     customization: null,
      //     design_file_url: null,
      //     selected_color: selectedColor
      //   })
      //   .select()
      //   .single();

      // if (orderItemError) {
      //   throw new Error(`Order item creation failed: ${orderItemError.message}`);
      // }

      toast.success("Order created successfully!");
      router.push(`/checkout?orderId=${orderData.id}`);
    } catch (error) {
      console.error("Buy now error:", error);
      toast.error("Failed to create order. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Product Name and Category */}
      <div>
        <Badge className="bg-primary/10 text-primary border-primary/20 rounded-full px-4 py-1 mb-4 text-[10px] uppercase tracking-widest font-bold">
          {product.category}
        </Badge>
        <h1 className="text-3xl md:text-4xl font-serif text-foreground leading-tight">
          {product.name}
        </h1>
      </div>

      {/* Product Image and Color Selection */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Product Image */}
        <div className="relative aspect-square overflow-hidden rounded-lg bg-zinc-50 shadow-lg flex items-center justify-center p-8">
          <div className="relative w-3/4 h-3/4">
            <Image
              src={currentVariant?.image_url || product.image}
              alt={`${product.name} in ${selectedColor}`}
              fill
              className="object-contain hover:scale-105 transition-transform duration-700"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-50/20 to-transparent pointer-events-none" />
        </div>

        {/* Color Selection */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-4">Select Color</h2>
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

          
      {/* Product Features */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
          <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
          <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
          <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
          <Star className="w-5 h-5 text-yellow-300" />
          <span className="ml-2 text-sm text-zinc-600 font-medium">4.5 out of 5</span>
        </div>
        
      {/* Description */}
      <div className="prose prose-sm text-zinc-600 leading-relaxed">
        <p>
          Experience the perfect blend of comfort and style with our premium {product.name.toLowerCase()}. 
          Crafted from high-quality materials with attention to every detail, this piece offers 
          exceptional durability and a timeless design that complements any wardrobe.
        </p>
        <p className="mt-3">
          {product.customizable 
            ? "Make it uniquely yours with our customization options, from color choices to personalized details."
            : "A versatile essential that maintains its quality and appearance through regular wear and care."
          }
        </p>
      </div>
      </div>

          {product.customizable ? (
            <Badge className="bg-green-100 text-green-800 border-green-200 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
              Customizable
            </Badge>
          ) : (
            <Badge className="bg-zinc-100 text-zinc-800 border-zinc-200 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
              Standard
            </Badge>
          )}
        </div>
      </div>
      {/* Action Button */}
      <div className="pt-4">
        {product.customizable ? (
          <button
            onClick={() => window.location.href = `/customize?productId=${product.id}&color=${selectedColor}`}
            className="w-full bg-primary text-white hover:bg-foreground transition-all px-8 py-4 text-sm font-bold uppercase tracking-widest rounded-lg shadow-lg hover:shadow-xl hover:scale-105"
          >
            Start Customizing
          </button>
        ) : (
          <button
            onClick={handleBuyNow}
            disabled={isProcessing}
            className="w-full bg-primary text-white hover:bg-foreground transition-all px-8 py-4 text-sm font-bold uppercase tracking-widest rounded-lg shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? "Processing..." : "Buy Now"}
          </button>
        )}
      </div>
        <div className="flex items-center gap-3">
        </div>


    </div>
  );
}
