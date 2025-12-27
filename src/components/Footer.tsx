"use client";

import React from "react";
import Link from "next/link";
import { Instagram, Facebook, Twitter, MoveRight } from "lucide-react";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-zinc-50 pt-24 pb-12 border-t border-zinc-200">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Image
                src="/logo.jpg"
                alt="Chosen Threads Logo"
                width={64}
                height={64}
              />
            </div>
            <p className="text-zinc-500 text-sm leading-relaxed">
              Redefining the standard for daily essentials through quality and
              personalization.
            </p>
            <div className="flex gap-6">
              <Link
                href="https://www.instagram.com/_chosen.threads_/?igsh=eWZuNjQ5d3FyZDIz#"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Instagram className="w-5 h-5 text-zinc-400 hover:text-primary cursor-pointer" />
              </Link>
              <Facebook className="w-5 h-5 text-zinc-400 hover:text-primary cursor-pointer" />
              <Twitter className="w-5 h-5 text-zinc-400 hover:text-primary cursor-pointer" />
            </div>
          </div>
          <div>
            <h5 className="font-bold uppercase tracking-widest text-[11px] mb-8">
              Products
            </h5>
            <ul className="space-y-4 text-zinc-400 text-sm font-medium">
              {[
                "T-Shirts",
                "Hoodies",
                "Jeans",
                "Accessories",
                "Home & Lifestyle",
              ].map((i) => (
                <li key={i} className="hover:text-primary cursor-pointer">
                  {i}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h5 className="font-bold uppercase tracking-widest text-[11px] mb-8">
              Company
            </h5>
            <ul className="space-y-4 text-zinc-400 text-sm font-medium">
              {[
                "Our Story",
                "Quality Lab",
                "Sustainability",
                "Careers",
                "Contact",
              ].map((i) => (
                <li key={i} className="hover:text-primary cursor-pointer">
                  {i}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h5 className="font-bold uppercase tracking-widest text-[11px] mb-8">
              Newsletter
            </h5>
            <p className="text-zinc-400 text-sm mb-6">
              Get early access to new drops and custom perks.
            </p>
            <div className="flex border-b border-zinc-300 pb-2">
              <input
                type="email"
                placeholder="EMAIL ADDRESS"
                className="bg-transparent w-full text-[10px] font-bold outline-none placeholder:text-zinc-300"
              />
              <MoveRight className="w-5 h-5 text-zinc-400" />
            </div>
          </div>
        </div>
        <div className="pt-12 border-t border-zinc-200 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
            © 2024 CHOSEN THREADS. ALL RIGHTS RESERVED.
          </p>
          <div className="flex gap-8 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
            <span className="hover:text-primary cursor-pointer">Privacy</span>
            <span className="hover:text-primary cursor-pointer">Terms</span>
            <span className="hover:text-primary cursor-pointer">Shipping</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
