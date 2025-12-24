"use client";

import * as React from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ChevronDown, Menu, ShoppingBag, Search, X, Instagram, Facebook, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

const products = [
  {
    id: 1,
    name: "The Midnight Tuxedo",
    category: "Formal Wear",
    price: "$2,400",
    image: "https://images.unsplash.com/photo-1594932224828-b4b057bfe4f1?auto=format&fit=crop&q=80&w=800",
    customizable: true,
  },
  {
    id: 2,
    name: "Cashmere Overcoat",
    category: "Outerwear",
    price: "$1,850",
    image: "https://images.unsplash.com/photo-1539533377285-b921100db62d?auto=format&fit=crop&q=80&w=800",
    customizable: true,
  },
  {
    id: 3,
    name: "Ivory Silk Blouse",
    category: "Essential",
    price: "$650",
    image: "https://images.unsplash.com/photo-1551163943-3f6a855d1153?auto=format&fit=crop&q=80&w=800",
    customizable: true,
  },
  {
    id: 4,
    name: "Wool Flannel Trousers",
    category: "Separates",
    price: "$450",
    image: "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&q=80&w=800",
    customizable: true,
  },
];

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 200], [1, 0]);
  const scale = useTransform(scrollY, [0, 200], [1, 0.95]);

  return (
    <div className="flex flex-col min-h-screen selection:bg-black selection:text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 mix-blend-difference">
        <div className="container mx-auto px-6 py-6 flex items-center justify-between text-white">
          <Button variant="ghost" size="icon" className="hover:bg-white/10" onClick={() => setIsMenuOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>
          
          <h1 className="text-2xl font-serif tracking-[0.2em] font-light">ATELIER</h1>
          
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="hover:bg-white/10 hidden sm:flex">
              <Search className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="hover:bg-white/10">
              <ShoppingBag className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Fullscreen Menu Overlay */}
      {isMenuOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[60] bg-white text-black flex flex-col p-12"
        >
          <div className="flex justify-between items-center mb-24">
            <h1 className="text-2xl font-serif tracking-[0.2em]">ATELIER</h1>
            <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(false)}>
              <X className="w-6 h-6" />
            </Button>
          </div>
          <div className="flex flex-col gap-8 text-6xl font-serif">
            {["Collections", "Bespoke", "Journal", "Heritage", "Contact"].map((item) => (
              <motion.a
                key={item}
                href="#"
                whileHover={{ x: 20 }}
                className="hover:text-zinc-500 transition-colors"
              >
                {item}
              </motion.a>
            ))}
          </div>
        </motion.div>
      )}

      {/* Hero Section */}
      <section className="relative h-screen overflow-hidden bg-zinc-900">
        <motion.div 
          style={{ opacity, scale }}
          className="absolute inset-0"
        >
          <Image
            src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&q=80&w=2000"
            alt="Atelier Hero"
            fill
            className="object-cover opacity-60"
            priority
          />
        </motion.div>
        
        <div className="relative h-full flex flex-col items-center justify-center text-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 1 }}
          >
            <span className="text-white/70 uppercase tracking-[0.4em] text-sm mb-6 block">The Art of Precision</span>
            <h2 className="text-6xl md:text-8xl text-white font-serif font-light mb-8 max-w-4xl leading-[1.1]">
              Custom Tailoring <br /> Refined for You
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-black hover:bg-zinc-200 px-12 py-8 text-lg rounded-none">
                Explore Collection
              </Button>
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10 px-12 py-8 text-lg rounded-none">
                Begin Customization
              </Button>
            </div>
          </motion.div>
          
          <motion.div 
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute bottom-12 text-white/50"
          >
            <ChevronDown className="w-6 h-6" />
          </motion.div>
        </div>
      </section>

      {/* Statement Section */}
      <section className="py-32 bg-white flex justify-center px-6">
        <div className="max-w-3xl text-center">
          <h3 className="text-3xl md:text-4xl font-serif text-zinc-900 leading-relaxed mb-8">
            "Clothing is not just about what you wear, it's about the narrative you project. We believe in garments that are as unique as the individuals who wear them."
          </h3>
          <div className="w-24 h-px bg-zinc-300 mx-auto" />
        </div>
      </section>

      {/* Bespoke Process */}
      <section className="py-24 bg-zinc-50">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <div className="relative aspect-[3/4] overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&q=80&w=800"
                alt="Tailoring Process"
                fill
                className="object-cover grayscale hover:grayscale-0 transition-all duration-1000"
              />
            </div>
            <div className="flex flex-col gap-12">
              <span className="text-zinc-400 uppercase tracking-widest text-sm">The Studio Experience</span>
              <h2 className="text-5xl font-serif leading-tight">Mastering the <br /> Bespoke Silhouette</h2>
              <div className="space-y-8">
                {[
                  { title: "Personal Consultation", desc: "Discover fabrics, fits, and finishes tailored to your lifestyle." },
                  { title: "Precision Fitting", desc: "Master tailors ensure every seam aligns with perfection." },
                  { title: "Handcrafted Details", desc: "Monograms, hand-stitched lapels, and custom linings." }
                ].map((step, i) => (
                  <div key={i} className="flex gap-6 group">
                    <span className="text-zinc-300 text-3xl font-serif">0{i + 1}</span>
                    <div>
                      <h4 className="text-xl font-serif mb-2 group-hover:text-zinc-500 transition-colors">{step.title}</h4>
                      <p className="text-zinc-500 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="link" className="text-black p-0 w-fit group">
                Learn more about our heritage <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Product Grid */}
      <section className="py-32">
        <div className="container mx-auto px-6">
          <div className="flex flex-col sm:flex-row justify-between items-end mb-16 gap-6">
            <div>
              <span className="text-zinc-400 uppercase tracking-widest text-sm mb-4 block">Current Inventory</span>
              <h2 className="text-4xl font-serif">Signature Pieces</h2>
            </div>
            <div className="flex gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="rounded-none px-6">Filter</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="rounded-none">
                  <DropdownMenuItem>All Items</DropdownMenuItem>
                  <DropdownMenuItem>Formal Wear</DropdownMenuItem>
                  <DropdownMenuItem>Outerwear</DropdownMenuItem>
                  <DropdownMenuItem>Accessories</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
            {products.map((product) => (
              <motion.div
                key={product.id}
                whileHover={{ y: -10 }}
                className="group cursor-pointer"
              >
                <div className="relative mb-6 overflow-hidden bg-zinc-100">
                  <AspectRatio ratio={3/4}>
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-1000"
                    />
                  </AspectRatio>
                  {product.customizable && (
                    <Badge className="absolute top-4 right-4 bg-white/90 text-black hover:bg-white/90 rounded-none font-sans font-light tracking-wide py-1 px-3">
                      Customizable
                    </Badge>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-zinc-400 text-xs uppercase tracking-widest mb-1 block">{product.category}</span>
                    <h4 className="text-lg font-serif">{product.name}</h4>
                  </div>
                  <span className="text-zinc-900 font-light">{product.price}</span>
                </div>
              </motion.div>
            ))}
          </div>
          
          <div className="mt-24 text-center">
            <Button variant="outline" className="px-12 py-8 text-lg rounded-none border-zinc-200 hover:bg-zinc-50">
              View Entire Collection
            </Button>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="relative py-48 bg-zinc-900 overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&q=80&w=2000"
          alt="CTA Background"
          fill
          className="object-cover opacity-20"
        />
        <div className="relative container mx-auto px-6 text-center">
          <h2 className="text-5xl md:text-7xl font-serif text-white mb-12 max-w-4xl mx-auto leading-tight">
            Your Narrative, <br /> Tailored to Perfection.
          </h2>
          <Button size="lg" className="bg-white text-black hover:bg-zinc-200 px-16 py-8 text-xl rounded-none">
            Schedule a Fitting
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white pt-24 pb-12 border-t border-zinc-100">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-24">
            <div className="col-span-1 lg:col-span-1">
              <h1 className="text-2xl font-serif tracking-[0.2em] mb-8">ATELIER</h1>
              <p className="text-zinc-500 leading-relaxed mb-8">
                Crafting bespoke excellence since 1984. Every garment tells a story of heritage and personal expression.
              </p>
              <div className="flex gap-4">
                <Instagram className="w-5 h-5 text-zinc-400 hover:text-black cursor-pointer transition-colors" />
                <Facebook className="w-5 h-5 text-zinc-400 hover:text-black cursor-pointer transition-colors" />
                <Twitter className="w-5 h-5 text-zinc-400 hover:text-black cursor-pointer transition-colors" />
              </div>
            </div>
            <div>
              <h5 className="font-serif text-lg mb-8">Navigation</h5>
              <ul className="space-y-4 text-zinc-500">
                {["Collections", "Bespoke", "Journal", "Heritage", "Studio Locations"].map((item) => (
                  <li key={item} className="hover:text-black cursor-pointer transition-colors">{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h5 className="font-serif text-lg mb-8">Concierge</h5>
              <ul className="space-y-4 text-zinc-500">
                {["Shipping & Returns", "Size Guide", "Care Instructions", "Gift Cards", "Contact Support"].map((item) => (
                  <li key={item} className="hover:text-black cursor-pointer transition-colors">{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h5 className="font-serif text-lg mb-8">Newsletter</h5>
              <p className="text-zinc-500 mb-6">Join the Atelier circle for exclusive access to new drops.</p>
              <div className="flex">
                <input 
                  type="email" 
                  placeholder="Email Address" 
                  className="bg-zinc-50 border-zinc-200 border px-4 py-3 w-full focus:outline-none focus:border-black transition-colors"
                />
                <Button className="bg-black text-white rounded-none py-3 h-auto">Join</Button>
              </div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center pt-12 border-t border-zinc-100 gap-6">
            <p className="text-zinc-400 text-sm">© 2024 Atelier Custom. All rights reserved.</p>
            <div className="flex gap-8 text-zinc-400 text-sm">
              <span className="hover:text-black cursor-pointer transition-colors">Privacy Policy</span>
              <span className="hover:text-black cursor-pointer transition-colors">Terms of Service</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
