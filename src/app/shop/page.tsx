"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag,
  Search,
  X,
  Star,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabaseClient";
import { useSearchParams } from "next/navigation";

type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
  customizable: boolean;
  rating: number;
  tag?: string | null;
};

export default function Shop() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("All");
  const [sortBy, setSortBy] = React.useState("featured");
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const searchParams = useSearchParams();

  React.useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("Products")
        .select("id,name,category,price,image,customizable,rating,tag")
        .order("id", { ascending: true });
      if (error) {
        console.error("Supabase products fetch error:", error.message);
        setProducts([]);
      } else {
        setProducts((data as Product[]) || []);
      }

      if (searchParams.get("category")) {
        setSelectedCategory(searchParams.get("category")!);
      }

      setLoading(false);
    };
    loadProducts();
  }, [searchParams]);

  const categories = React.useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => set.add(p.category));
    return ["All", ...Array.from(set)];
  }, [products]);

  const filteredProducts = products
    .filter((product) => {
      const matchesSearch = product.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "All" || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === "price-low") return a.price - b.price;
      if (sortBy === "price-high") return b.price - a.price;
      if (sortBy === "rating") return b.rating - a.rating;
      return 0;
    });

  return (
    <div className="flex flex-col min-h-screen bg-white text-foreground selection:bg-primary selection:text-white">
      {/* Navigation */}
      <Navigation
      
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Shop Header */}
      <section className="py-12 md:py-20 bg-zinc-50 border-b border-zinc-100">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl">
            <Badge className="bg-primary/10 text-primary border-primary/20 rounded-full px-4 py-1 mb-6 text-[9px] uppercase tracking-widest font-bold">
              The Catalog
            </Badge>
            <h1 className="text-4xl md:text-6xl font-serif text-foreground mb-6 leading-tight">
              Elevated Essentials <br />{" "}
              <span className="text-primary italic">Shop All</span>
            </h1>
            <p className="text-zinc-500 max-w-xl font-medium leading-relaxed">
              Explore our full collection of premium basics, lifestyle goods,
              and customizable pieces. Every article is designed with durability
              and personalization in mind.
            </p>
          </div>
        </div>
      </section>

      {/* Toolbar */}
      <section className="sticky top-64px z-40 bg-white border-b border-zinc-100 py-4">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar w-full md:w-auto">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className={`rounded-full px-6 text-[10px] font-bold uppercase tracking-widest transition-all ${
                  selectedCategory === category
                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                    : "text-zinc-400 hover:text-primary hover:bg-primary/5"
                }`}
              >
                {category}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
            <div className="md:hidden flex-1 relative mr-4">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full bg-zinc-50 border-none rounded-full px-4 py-2 text-xs"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full border-zinc-200 text-[10px] font-bold uppercase tracking-widest gap-2"
                >
                  <SlidersHorizontal className="w-3 h-3" />
                  Sort: {sortBy.replace("-", " ")}
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="rounded-xl border-zinc-100 p-2 min-w-160px"
              >
                <DropdownMenuItem
                  onClick={() => setSortBy("featured")}
                  className="text-[10px] font-bold uppercase tracking-widest p-3 rounded-lg cursor-pointer"
                >
                  Featured
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSortBy("price-low")}
                  className="text-[10px] font-bold uppercase tracking-widest p-3 rounded-lg cursor-pointer"
                >
                  Price: Low to High
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSortBy("price-high")}
                  className="text-[10px] font-bold uppercase tracking-widest p-3 rounded-lg cursor-pointer"
                >
                  Price: High to Low
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSortBy("rating")}
                  className="text-[10px] font-bold uppercase tracking-widest p-3 rounded-lg cursor-pointer"
                >
                  Top Rated
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="py-12 bg-white min-h-[600px]">
        <div className="container mx-auto px-6">
          {loading ? (
            <div className="flex items-center justify-center py-24 text-zinc-400">
              Loading products…
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((product) => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="border-none bg-white shadow-sm hover:shadow-2xl transition-all duration-500 rounded-sm group overflow-hidden h-full flex flex-col">
                      <CardContent className="p-0 flex flex-col h-full">
                        <div className="relative aspect-4/5 overflow-hidden bg-zinc-100">
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-700"
                          />
                          {product.tag && (
                            <Badge className="absolute top-4 left-4 bg-primary text-white rounded-full text-[8px] uppercase tracking-widest px-3 py-1 border-none">
                              {product.tag}
                            </Badge>
                          )}
                          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="p-6 flex flex-col flex-1">
                          <div className="flex items-center gap-1 mb-2">
                            <Star className="w-3 h-3 fill-primary text-primary" />
                            <span className="text-[10px] font-bold text-zinc-400">
                              {product.rating}
                            </span>
                          </div>
                          <h4 className="font-bold text-foreground text-lg mb-1 group-hover:text-primary transition-colors">
                            {product.name}
                          </h4>
                          <p className="text-zinc-400 text-[10px] uppercase tracking-widest mb-4 font-bold">
                            {product.category}
                          </p>
                          <div className="mt-auto flex items-center justify-between pt-4">
                            <span className="text-xl font-bold text-foreground tracking-tighter">
                              ₹{product.price}
                            </span>
                            {product.customizable ? (
                              <Link href={`/customize?productId=${product.id}&color=white`}>
                                <Button
                                  size="sm"
                                  className="bg-primary hover:bg-foreground text-white rounded-full px-6 text-[10px] font-bold uppercase tracking-widest"
                                >
                                  Customize
                                </Button>
                              </Link>
                            ) : (
                              <Button
                                size="sm"
                                className="bg-primary hover:bg-foreground text-white rounded-full px-6 text-[10px] font-bold uppercase tracking-widest"
                              >
                                Add to Cart
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mb-6">
                <Search className="w-8 h-8 text-zinc-200" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                No products found
              </h3>
              <p className="text-zinc-400 text-sm max-w-xs">
                We couldn't find any items matching your current filters or
                search query.
              </p>
              <Button
                variant="link"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All");
                }}
                className="text-primary font-bold uppercase tracking-widest text-[10px] mt-4"
              >
                Clear all filters
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <Footer/>
    </div>
  );
}
