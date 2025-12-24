"use client";

import * as React from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ChevronDown, Menu, ShoppingBag, Search, X, Instagram, Facebook, Twitter, Crown, Sparkles, MoveRight } from "lucide-react";
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
    name: "Royal Navy Wool Suit",
    category: "The Sovereign Collection",
    price: "$3,200",
    image: "https://images.unsplash.com/photo-1593032465175-481ac7f401a0?auto=format&fit=crop&q=80&w=800",
    customizable: true,
  },
  {
    id: 2,
    name: "Imperial Velvet Blazer",
    category: "Evening Gala",
    price: "$1,950",
    image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=800",
    customizable: true,
  },
  {
    id: 3,
    name: "Gilded Silk Waistcoat",
    category: "Formal Accents",
    price: "$850",
    image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&q=80&w=800",
    customizable: true,
  },
  {
    id: 4,
    name: "Heirloom Cashmere Scarf",
    category: "Accessories",
    price: "$550",
    image: "https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?auto=format&fit=crop&q=80&w=800",
    customizable: false,
  },
];

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0.3]);
  const heroScale = useTransform(scrollY, [0, 500], [1, 1.1]);

  return (
    <div className="flex flex-col min-h-screen bg-white text-primary selection:bg-secondary selection:text-primary">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 transition-all duration-500 bg-white/80 backdrop-blur-md border-b border-secondary/20">
        <div className="container mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Button variant="ghost" size="icon" className="hover:bg-secondary/20" onClick={() => setIsMenuOpen(true)}>
              <Menu className="w-6 h-6" />
            </Button>
            <div className="hidden lg:flex items-center gap-6 text-[10px] uppercase tracking-[0.3em] font-medium text-primary/60">
              <a href="#" className="hover:text-primary transition-colors">Men</a>
              <a href="#" className="hover:text-primary transition-colors">Women</a>
              <a href="#" className="hover:text-primary transition-colors">Bespoke</a>
            </div>
          </div>
          
          <div className="flex flex-col items-center">
            <h1 className="text-2xl font-serif tracking-[0.3em] font-bold text-primary">ATELIER</h1>
            <span className="text-[8px] uppercase tracking-[0.5em] text-secondary-foreground font-bold -mt-1">Modern Royalty</span>
          </div>
          
          <div className="flex items-center gap-2 md:gap-6">
            <Button variant="ghost" size="icon" className="hover:bg-secondary/20 hidden sm:flex">
              <Search className="w-5 h-5" />
            </Button>
            <div className="relative">
              <Button variant="ghost" size="icon" className="hover:bg-secondary/20">
                <ShoppingBag className="w-5 h-5" />
              </Button>
              <span className="absolute top-1 right-1 w-2 h-2 bg-secondary rounded-full border border-white" />
            </div>
          </div>
        </div>
      </nav>

      {/* Menu Overlay */}
      {isMenuOpen && (
        <motion.div 
          initial={{ x: "-100%" }}
          animate={{ x: 0 }}
          exit={{ x: "-100%" }}
          className="fixed inset-0 z-[60] bg-primary text-white flex flex-col p-8 md:p-16"
        >
          <div className="flex justify-between items-center mb-16 md:mb-32">
            <h1 className="text-2xl font-serif tracking-[0.3em]">ATELIER</h1>
            <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(false)} className="text-white hover:bg-white/10">
              <X className="w-8 h-8" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
            <div className="flex flex-col gap-6 text-4xl md:text-7xl font-serif italic">
              {["Collections", "Bespoke", "The Archive", "Journal", "Heritage"].map((item, i) => (
                <motion.a
                  key={item}
                  href="#"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="hover:text-secondary transition-all flex items-center gap-4 group"
                >
                  <span className="text-sm font-sans not-italic text-white/30 tracking-widest uppercase">0{i+1}</span>
                  {item}
                  <MoveRight className="w-12 h-12 opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.a>
              ))}
            </div>
            <div className="hidden md:block space-y-8">
              <div className="aspect-video relative overflow-hidden">
                <Image src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=800" fill alt="Menu Visual" className="object-cover opacity-50" />
              </div>
              <p className="text-white/40 max-w-sm text-sm leading-relaxed tracking-wide">
                Experience the next generation of tailoring. We combine ancestral techniques with modern silhouettes to create garments for the contemporary monarch.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Hero Section */}
      <section className="relative h-[90vh] mt-20 flex items-center justify-center overflow-hidden bg-primary">
        <motion.div style={{ opacity: heroOpacity, scale: heroScale }} className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?auto=format&fit=crop&q=80&w=2000"
            alt="Royal Tailoring"
            fill
            className="object-cover opacity-70"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/50 via-transparent to-primary/80" />
        </motion.div>
        
        <div className="relative z-10 text-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          >
            <div className="flex justify-center mb-6">
              <Crown className="w-8 h-8 text-secondary" />
            </div>
            <span className="text-secondary uppercase tracking-[0.6em] text-[10px] font-bold mb-6 block">The Sovereign Standard</span>
            <h2 className="text-5xl md:text-8xl text-white font-serif font-bold mb-10 max-w-5xl leading-[1] italic tracking-tight">
              A Modern Take <br /> on Royal Elegance
            </h2>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button size="lg" className="bg-secondary text-primary hover:bg-white hover:scale-105 transition-all px-12 py-8 text-sm font-bold uppercase tracking-widest rounded-none">
                Explore The Throne
              </Button>
              <Button size="lg" variant="ghost" className="text-white hover:text-secondary group flex items-center gap-4 py-8 text-sm uppercase tracking-[0.3em]">
                Book Consultation <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Modern Royal Feature */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="container mx-auto px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 space-y-8">
            <h3 className="text-4xl md:text-5xl font-serif text-primary leading-tight italic">
              "Power is felt, <br /> Excellence is worn."
            </h3>
            <p className="text-primary/60 leading-relaxed max-w-md font-medium tracking-wide">
              Atelier bridges the gap between traditional royal protocols and modern architectural design. Every stitch is a statement of intent, every fabric a legacy reborn.
            </p>
            <div className="flex items-center gap-4 text-secondary-foreground font-bold text-xs uppercase tracking-widest">
              <Sparkles className="w-4 h-4" />
              <span>Certified Heirloom Quality</span>
            </div>
          </div>
          <div className="lg:col-span-7 grid grid-cols-2 gap-4">
            <div className="aspect-[4/5] relative overflow-hidden translate-y-8">
              <Image src="https://images.unsplash.com/photo-1594932224444-66037ec56ec2?auto=format&fit=crop&q=80&w=800" alt="Detail 1" fill className="object-cover hover:scale-105 transition-transform duration-700" />
            </div>
            <div className="aspect-[4/5] relative overflow-hidden">
              <Image src="https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?auto=format&fit=crop&q=80&w=800" alt="Detail 2" fill className="object-cover hover:scale-105 transition-transform duration-700" />
            </div>
          </div>
        </div>
      </section>

      {/* Inventory Grid */}
      <section className="py-32 bg-primary text-white">
        <div className="container mx-auto px-8">
          <div className="flex flex-col md:flex-row justify-between items-baseline mb-20 gap-8">
            <div>
              <span className="text-secondary uppercase tracking-[0.4em] text-[10px] font-bold mb-4 block">Seasonal Inventory</span>
              <h2 className="text-4xl md:text-6xl font-serif italic">The Sovereign Collection</h2>
            </div>
            <Button variant="outline" className="border-white/20 hover:border-secondary text-white hover:bg-secondary/10 rounded-none px-10 py-6 uppercase tracking-widest text-[10px]">
              View All Pieces
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((product) => (
              <motion.div
                key={product.id}
                whileHover={{ y: -10 }}
                className="group relative"
              >
                <div className="relative aspect-[3/4] mb-6 overflow-hidden bg-white/5 border border-white/10 p-2">
                  <div className="relative w-full h-full overflow-hidden">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-1000 grayscale group-hover:grayscale-0"
                    />
                  </div>
                  {product.customizable && (
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-secondary text-primary border-none rounded-none text-[8px] uppercase tracking-widest py-1 px-3">
                        Bespoke Available
                      </Badge>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button className="bg-white text-primary rounded-none px-8 font-bold text-[10px] uppercase tracking-tighter">View Details</Button>
                  </div>
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-white/40 text-[9px] uppercase tracking-[0.2em] mb-2 block">{product.category}</span>
                    <h4 className="text-lg font-serif italic group-hover:text-secondary transition-colors">{product.name}</h4>
                  </div>
                  <span className="text-secondary font-medium tracking-tight">{product.price}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Modern Tailoring Process */}
      <section className="py-32 bg-secondary/5 border-y border-secondary/20">
        <div className="container mx-auto px-8">
          <div className="max-w-4xl mx-auto text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-serif text-primary italic mb-6 leading-tight">Architectural Tailoring</h2>
            <p className="text-primary/50 text-lg leading-relaxed font-medium">We treat tailoring as architecture for the body. A symphony of structure, silhouette, and soul.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            {[
              { icon: <Sparkles className="w-6 h-6" />, title: "Digital Sculpting", desc: "Our 3D fitting tech meets master tailoring for impossible precision." },
              { icon: <Crown className="w-6 h-6" />, title: "Noble Fabrics", desc: "Exotic silks and high-performance wools sourced from ethical mills." },
              { icon: <MoveRight className="w-6 h-6" />, title: "The Hand-Finish", desc: "Final stitches are made by hand, ensuring your garment has a soul." }
            ].map((feature, i) => (
              <div key={i} className="flex flex-col items-center text-center space-y-6 group">
                <div className="p-6 rounded-full bg-white shadow-xl shadow-secondary/10 group-hover:scale-110 transition-transform text-secondary-foreground">
                  {feature.icon}
                </div>
                <h4 className="text-xl font-serif italic text-primary">{feature.title}</h4>
                <p className="text-sm text-primary/60 leading-relaxed font-medium">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-48 bg-primary relative overflow-hidden">
        <Image src="https://images.unsplash.com/photo-1550991152-713702a200f5?auto=format&fit=crop&q=80&w=2000" fill alt="CTA" className="object-cover opacity-10" />
        <div className="relative container mx-auto px-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
          >
            <h2 className="text-5xl md:text-9xl font-serif text-white mb-12 italic leading-none">Rule Your <br /> Wardrobe.</h2>
            <Button className="bg-secondary text-primary hover:bg-white px-20 py-10 text-lg font-bold uppercase tracking-[0.4em] rounded-none">
              Apply for Bespoke
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white pt-32 pb-12 border-t border-secondary/20">
        <div className="container mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-16 mb-32">
            <div className="lg:col-span-2 space-y-8">
              <div>
                <h1 className="text-3xl font-serif tracking-[0.3em] font-bold text-primary">ATELIER</h1>
                <span className="text-[10px] uppercase tracking-[0.5em] text-secondary-foreground font-bold">Modern Royalty</span>
              </div>
              <p className="text-primary/40 leading-relaxed max-w-sm font-medium">
                Pioneering modern elegance through architectural tailoring and ethical luxury. For those who command their destiny.
              </p>
              <div className="flex gap-6">
                <Instagram className="w-5 h-5 text-primary/40 hover:text-secondary cursor-pointer transition-colors" />
                <Facebook className="w-5 h-5 text-primary/40 hover:text-secondary cursor-pointer transition-colors" />
                <Twitter className="w-5 h-5 text-primary/40 hover:text-secondary cursor-pointer transition-colors" />
              </div>
            </div>
            <div>
              <h5 className="font-serif italic text-lg mb-8 text-primary">The Studio</h5>
              <ul className="space-y-4 text-primary/40 text-sm font-medium tracking-wide">
                {["Collections", "Bespoke Lab", "Sizing Guide", "The Process", "Studio Map"].map((item) => (
                  <li key={item} className="hover:text-secondary cursor-pointer transition-colors">{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h5 className="font-serif italic text-lg mb-8 text-primary">Concierge</h5>
              <ul className="space-y-4 text-primary/40 text-sm font-medium tracking-wide">
                {["Shipping", "Returns", "Care Guide", "Gift Royal", "Contact"].map((item) => (
                  <li key={item} className="hover:text-secondary cursor-pointer transition-colors">{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h5 className="font-serif italic text-lg mb-8 text-primary">The Inner Circle</h5>
              <p className="text-primary/40 text-sm mb-8 leading-relaxed font-medium">Join the elite for private collection access.</p>
              <div className="flex items-center border-b border-primary/10 pb-2">
                <input 
                  type="email" 
                  placeholder="Email" 
                  className="bg-transparent text-sm w-full focus:outline-none placeholder:text-primary/20 uppercase tracking-widest font-bold"
                />
                <Button variant="ghost" className="p-0 hover:bg-transparent hover:text-secondary">
                  <MoveRight className="w-6 h-6" />
                </Button>
              </div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center pt-12 border-t border-primary/5 gap-8">
            <p className="text-primary/20 text-[10px] uppercase font-bold tracking-widest">© 2024 Atelier Custom. Crafted for Kings.</p>
            <div className="flex gap-12 text-primary/20 text-[10px] uppercase font-bold tracking-widest">
              <span className="hover:text-primary cursor-pointer transition-colors">Privacy</span>
              <span className="hover:text-primary cursor-pointer transition-colors">Terms</span>
              <span className="hover:text-primary cursor-pointer transition-colors">Cookies</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
