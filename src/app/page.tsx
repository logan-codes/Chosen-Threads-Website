"use client";

import * as React from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import {
  Sparkles,
  Star,
  Settings,
  ShieldCheck,
  Palette,
  Laptop,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";

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

export default function Home() {
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0.5]);
  const heroScale = useTransform(scrollY, [0, 500], [1, 1.05]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [products, setProducts] = React.useState<Product[]>([]);
    const [loading, setLoading] = React.useState(true);
React.useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("Products")
        .select("id,name,category,price,image,customizable,rating,tag")
        .order("id", { ascending: true })
        .limit(8);
      if (error) {
        console.error("Supabase products fetch error:", error.message);
        setProducts([]);
      } else {
        setProducts((data as Product[]) || []);
      }
      setLoading(false);
    };
    loadProducts();
  }, []);
  return (
    <div className="flex flex-col min-h-screen bg-white text-foreground selection:bg-primary selection:text-white">
      {/* Navigation */}
      <Navigation searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      {/* Hero Section */}
      <section className="relative h-[85vh] flex items-center justify-center overflow-hidden bg-zinc-50 pt-20">
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="absolute inset-0"
        >
          <Image
            src="https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=2000"
            alt="Aurum Premium Essentials"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-white/40" />
        </motion.div>
        <div className="relative z-10 text-center px-6 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Badge className="bg-primary/10 text-primary border-primary/20 rounded-full px-6 py-2 mb-8 text-[10px] uppercase tracking-widest font-bold backdrop-blur-md">
              The 2026 Personalization Drop
            </Badge>
            <h2 className="text-5xl md:text-8xl font-serif text-foreground mb-10 leading-[0.9] tracking-tight">
              Premium Build. <br />{" "}
              <span className="text-primary italic">Personalized</span> By You.
            </h2>
            <p className="text-zinc-600 mb-12 text-lg max-w-2xl mx-auto font-medium leading-relaxed">
              We redefine everyday essentials with obsession over fabric quality
              and the power of individual customization.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/customize?productId=1&color=white">
                <Button
                  size="lg"
                  className="bg-primary text-white hover:bg-foreground transition-all px-12 py-8 text-xs font-bold uppercase tracking-widest rounded-sm shadow-xl shadow-primary/20"
                >
                  Start Customizing
                </Button>
              </Link>
              <Link href="/shop">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-primary/20 text-primary hover:bg-primary hover:text-white px-12 py-8 text-xs font-bold uppercase tracking-widest rounded-sm"
                >
                  View Collection
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Brand Values */}
      <section className="py-20 bg-white border-y border-zinc-100">
        <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12">
          {[
            {
              icon: <ShieldCheck className="w-6 h-6" />,
              title: "Grade-A Quality",
              desc: "Every garment is stress-tested and crafted from ethically sourced, premium fibers.",
            },
            {
              icon: <Palette className="w-6 h-6" />,
              title: "infinite Customization",
              desc: "From thread color to custom embroidery, make every piece truly yours.",
            },
            {
              icon: <Laptop className="w-6 h-6" />,
              title: "Direct to You",
              desc: "Premium goods without the luxury markup. Straight from our lab to your door.",
            },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.6,
                ease: "easeOut",
                delay: i * 0.2,
              }}
              className="flex flex-col items-center text-center space-y-4"
            >
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-primary border border-primary/10">
                {item.icon}
              </div>
              <h4 className="text-xl font-bold text-foreground uppercase tracking-tight">
                {item.title}
              </h4>
              <p className="text-zinc-500 text-sm leading-relaxed max-w-xs">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Shop Marketplace */}
      <section className="py-24 bg-zinc-50">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div>
              <h2 className="text-3xl md:text-5xl font-serif text-foreground mb-4">
                Daily Essentials
              </h2>
              <p className="text-zinc-400 font-medium uppercase tracking-widest text-[10px]">
                Quality focused. Customer centric.
              </p>
            </div>
            <div className="flex gap-4">
              <Link href="/shop">
                <Button
                  variant="ghost"
                  className="text-primary font-bold uppercase tracking-widest text-[10px]"
                >
                  View All
                </Button>
              </Link>
            </div>
          </div>

        <div className="container mx-auto px-6">
          {loading ? (
            <div className="flex items-center justify-center py-24 text-zinc-400">
              Loading products…
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              <AnimatePresence mode="popLayout">
                {products.map((product) => (
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
                          <h4 className="font-bold text-foreground text-lg mb-1 group-hover:text-primary transition-colors cursor-pointer" onClick={() => window.location.href = `/shop/${product.id}`}>
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
         )}
        </div>
      
        </div>
      </section>

      {/* Customization Promo */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative aspect-square rounded-sm overflow-hidden shadow-2xl">
              <Image
                src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&q=80&w=1000"
                fill
                alt="Customization Lab"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-primary/20 backdrop-blur-[2px]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-white/90 backdrop-blur flex items-center justify-center animate-pulse">
                  <Settings className="w-10 h-10 text-primary" />
                </div>
              </div>
            </div>
            <div className="space-y-8">
              <Badge
                variant="outline"
                className="border-primary text-primary px-4 py-1 rounded-full uppercase text-[10px] font-bold tracking-widest"
              >
                Chosen Threads Lab
              </Badge>
              <h3 className="text-4xl md:text-6xl font-serif leading-tight">
                Your Canvas, <br /> Our Craft.
              </h3>
              <p className="text-zinc-600 text-lg leading-relaxed">
                We believe the best clothes are the ones you help design. Use
                our real-time customizer to adjust fits, select exclusive
                fabrics, and add personal insignias.
              </p>
              <ul className="space-y-4">
                {[
                  "100+ Premium Colorways",
                  "Bespoke Print Options",
                  "Recycled Sustainable Fabrics",
                ].map((perk, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 text-sm font-bold text-foreground uppercase tracking-wide"
                  >
                    <Sparkles className="w-4 h-4 text-primary" />
                    {perk}
                  </li>
                ))}
              </ul>
              <Link href="/customize?productId=1&color=white">
                <Button
                  size="lg"
                  className="bg-primary text-white px-12 py-8 rounded-sm text-xs font-bold uppercase tracking-widest hover:scale-105 transition-transform"
                >
                  Open Customizer
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
