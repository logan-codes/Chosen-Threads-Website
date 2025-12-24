"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Search, X, Star, SlidersHorizontal, ArrowLeft, ChevronDown } from "lucide-react";
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

const allProducts = [
  {
    id: 1,
    name: "Essential Heavyweight Tee",
    category: "Apparel",
    price: 65,
    image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=800",
    customizable: true,
    rating: 4.9,
    tag: "Best Seller",
  },
  {
    id: 2,
    name: "Premium Oversized Hoodie",
    category: "Apparel",
    price: 145,
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=800",
    customizable: true,
    rating: 5.0,
    tag: "New Drop",
  },
  {
    id: 3,
    name: "Custom Tapered Denim",
    category: "Apparel",
    price: 180,
    image: "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=800",
    customizable: true,
    rating: 4.8,
  },
  {
    id: 4,
    name: "Insulated Aurum Cup",
    category: "Lifestyle",
    price: 45,
    image: "https://images.unsplash.com/photo-1517256011271-bc50875c7423?auto=format&fit=crop&q=80&w=800",
    customizable: true,
    rating: 4.7,
  },
  {
    id: 5,
    name: "Graphic Capsule Tee",
    category: "Apparel",
    price: 75,
    image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=800",
    customizable: false,
    rating: 4.9,
  },
  {
    id: 6,
    name: "Minimalist Windbreaker",
    category: "Apparel",
    price: 210,
    image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&q=80&w=800",
    customizable: true,
    rating: 5.0,
  },
  {
    id: 7,
    name: "Aurum Signature Cap",
    category: "Accessories",
    price: 55,
    image: "https://images.unsplash.com/photo-1588850567045-1612b8042a25?auto=format&fit=crop&q=80&w=800",
    customizable: true,
    rating: 4.6,
  },
  {
    id: 8,
    name: "Luxury Fleece Joggers",
    category: "Apparel",
    price: 120,
    image: "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?auto=format&fit=crop&q=80&w=800",
    customizable: true,
    rating: 4.9,
  },
  {
    id: 9,
    name: "Aurum Ceramic Mug",
    category: "Lifestyle",
    price: 35,
    image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&q=80&w=800",
    customizable: true,
    rating: 4.8,
  },
  {
    id: 10,
    name: "Technical Canvas Tote",
    category: "Accessories",
    price: 85,
    image: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=800",
    customizable: true,
    rating: 4.7,
  }
];

const categories = ["All", "Apparel", "Lifestyle", "Accessories"];

export default function Shop() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("All");
  const [sortBy, setSortBy] = React.useState("featured");

  const filteredProducts = allProducts.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    if (sortBy === "price-low") return a.price - b.price;
    if (sortBy === "price-high") return b.price - a.price;
    if (sortBy === "rating") return b.rating - a.rating;
    return 0;
  });

  return (
    <div className="flex flex-col min-h-screen bg-white text-foreground selection:bg-primary selection:text-white">
      {/* Navigation */}
      <nav className="sticky top-0 w-full z-50 bg-white/90 backdrop-blur-xl border-b border-zinc-100">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/">
              <Button variant="ghost" size="sm" className="hover:bg-primary/10 gap-2">
                <ArrowLeft className="w-4 h-4 text-primary" />
                <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">Back</span>
              </Button>
            </Link>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg italic">A</span>
              </div>
              <h1 className="text-2xl font-bold tracking-[0.2em] text-foreground">AURUM</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..." 
                className="w-64 bg-zinc-50 border-none rounded-full px-6 py-2 text-xs focus-visible:ring-1 focus-visible:ring-primary/30"
              />
              <Search className="absolute right-4 top-2.5 w-4 h-4 text-zinc-300" />
            </div>
            <div className="relative">
              <Button variant="ghost" size="icon" className="hover:bg-primary/10">
                <ShoppingBag className="w-5 h-5" />
              </Button>
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white text-[8px] flex items-center justify-center rounded-full font-bold">2</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Shop Header */}
      <section className="py-12 md:py-20 bg-zinc-50 border-b border-zinc-100">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl">
            <Badge className="bg-primary/10 text-primary border-primary/20 rounded-full px-4 py-1 mb-6 text-[9px] uppercase tracking-widest font-bold">The Catalog</Badge>
            <h1 className="text-4xl md:text-6xl font-serif text-foreground mb-6 leading-tight">Elevated Essentials <br /> <span className="text-primary italic">Shop All</span></h1>
            <p className="text-zinc-500 max-w-xl font-medium leading-relaxed">
              Explore our full collection of premium basics, lifestyle goods, and customizable pieces. Every article is designed with durability and personalization in mind.
            </p>
          </div>
        </div>
      </section>

      {/* Toolbar */}
      <section className="sticky top-[73px] z-40 bg-white border-b border-zinc-100 py-4">
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
                <Button variant="outline" size="sm" className="rounded-full border-zinc-200 text-[10px] font-bold uppercase tracking-widest gap-2">
                  <SlidersHorizontal className="w-3 h-3" />
                  Sort: {sortBy.replace("-", " ")}
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl border-zinc-100 p-2 min-w-[160px]">
                <DropdownMenuItem onClick={() => setSortBy("featured")} className="text-[10px] font-bold uppercase tracking-widest p-3 rounded-lg cursor-pointer">Featured</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("price-low")} className="text-[10px] font-bold uppercase tracking-widest p-3 rounded-lg cursor-pointer">Price: Low to High</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("price-high")} className="text-[10px] font-bold uppercase tracking-widest p-3 rounded-lg cursor-pointer">Price: High to Low</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("rating")} className="text-[10px] font-bold uppercase tracking-widest p-3 rounded-lg cursor-pointer">Top Rated</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="py-12 bg-white min-h-[600px]">
        <div className="container mx-auto px-6">
          {filteredProducts.length > 0 ? (
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
                        <div className="relative aspect-[4/5] overflow-hidden bg-zinc-100">
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
                            <span className="text-[10px] font-bold text-zinc-400">{product.rating}</span>
                          </div>
                          <h4 className="font-bold text-foreground text-lg mb-1 group-hover:text-primary transition-colors">{product.name}</h4>
                          <p className="text-zinc-400 text-[10px] uppercase tracking-widest mb-4 font-bold">{product.category}</p>
                          <div className="mt-auto flex items-center justify-between pt-4">
                            <span className="text-xl font-bold text-foreground tracking-tighter">${product.price}</span>
                            <Button size="sm" className="bg-primary hover:bg-foreground text-white rounded-full px-6 text-[10px] font-bold uppercase tracking-widest">
                              {product.customizable ? "Customize" : "Add to Cart"}
                            </Button>
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
              <h3 className="text-xl font-bold text-foreground mb-2">No products found</h3>
              <p className="text-zinc-400 text-sm max-w-xs">We couldn't find any items matching your current filters or search query.</p>
              <Button 
                variant="link" 
                onClick={() => {setSearchQuery(""); setSelectedCategory("All");}}
                className="text-primary font-bold uppercase tracking-widest text-[10px] mt-4"
              >
                Clear all filters
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-50 pt-24 pb-12 border-t border-zinc-200">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-white font-bold italic">A</span>
                </div>
                <h1 className="text-xl font-bold tracking-[0.2em]">AURUM</h1>
              </div>
              <p className="text-zinc-500 text-sm leading-relaxed">
                Redefining the standard for daily essentials through quality and personalization.
              </p>
            </div>
            <div>
              <h5 className="font-bold uppercase tracking-widest text-[11px] mb-8">Shop</h5>
              <ul className="space-y-4 text-zinc-400 text-sm font-medium">
                {categories.map(i => <li key={i} className="hover:text-primary cursor-pointer">{i}</li>)}
              </ul>
            </div>
            <div>
              <h5 className="font-bold uppercase tracking-widest text-[11px] mb-8">Support</h5>
              <ul className="space-y-4 text-zinc-400 text-sm font-medium">
                {["Shipping", "Returns", "Size Guide", "Custom Orders"].map(i => <li key={i} className="hover:text-primary cursor-pointer">{i}</li>)}
              </ul>
            </div>
            <div>
              <h5 className="font-bold uppercase tracking-widest text-[11px] mb-8">Join the Lab</h5>
              <p className="text-zinc-400 text-sm mb-6">Get early access to custom drops.</p>
              <Input placeholder="EMAIL" className="bg-transparent border-b border-zinc-300 rounded-none px-0 text-[10px] focus-visible:ring-0" />
            </div>
          </div>
          <div className="pt-12 border-t border-zinc-200 flex justify-between items-center">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">© 2024 AURUM CUSTOMS.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
