import { notFound } from "next/navigation";
import { ProductDetails } from "@/components/products/ProductDetails";
import { ReviewSection } from "@/components/products/ReviewSection";
import { supabase } from "@/lib/supabaseClient";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

type Product = {
  id: number;
  name: string;
  category: string;
  image: string;
  customizable: boolean;
};

type ProductVariant = {
  id: number;
  product_id: number;
  color: string;
  image_url: string | null;
};

type Review = {
  id: number;
  product_id: number;
  user_id: string;
  rating: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
};

interface ProductPageProps {
  params: { productId: string };
}

async function getProduct(productId: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from("Products")
    .select("*")
    .eq("id", Number(productId))
    .single();

  if (error || !data) {
    return null;
  }

  return data as Product;
}

async function getProductVariants(productId: string): Promise<ProductVariant[]> {
  const { data, error } = await supabase
    .from("ProductVariants")
    .select("*")
    .eq("product_id", Number(productId));

  if (error || !data) {
    return [];
  }

  return data as ProductVariant[];
}

async function getReviews(productId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from("Reviews")
    .select("*")
    .eq("product_id", Number(productId))
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data as Review[];
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { productId } = await params;
  const product = await getProduct(productId);
  if (!product) {
    notFound();
  }

  const variants = await getProductVariants(productId);
  const reviews = await getReviews(productId);

  return (
    <div className="flex flex-col min-h-screen bg-white text-foreground selection:bg-primary selection:text-white">
      {/* Navigation */}
      <Navigation />

      {/* Breadcrumb */}
      <section className="py-4 bg-zinc-50 border-b border-zinc-100">
        <div className="container mx-auto px-6">
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <a href="/shop" className="hover:text-primary transition-colors">
              Shop
            </a>
            <span>/</span>
            <span className="text-foreground font-medium">{product.name}</span>
          </div>
        </div>
      </section>

      {/* Product Content */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1  gap-12 mb-16">
            <ProductDetails product={product} variants={variants} />
          </div>
          
          {/* Reviews Section */}
          <div className="border-t border-zinc-100 pt-12">
            <ReviewSection reviews={reviews} productId={params.productId} />
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
