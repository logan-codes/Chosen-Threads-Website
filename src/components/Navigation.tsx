"use client";

import React from "react";
import Link from "next/link";
import { Menu, Search, ShoppingBag, ArrowLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";

type Props = {
  showBack?: boolean;
  backHref?: string;
  searchQuery?: string;
  setSearchQuery?: (v: string) => void;
};

export default function Navigation({
  showBack,
  backHref = "/",
  searchQuery,
  setSearchQuery,
}: Props) {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <>
      {/* NAVBAR */}
      <nav className="fixed top-0 z-50 w-full bg-white/90 backdrop-blur-xl border-b border-zinc-100 h-16">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          {/* LEFT */}
          <div className="flex items-center gap-4">
            {showBack ? (
              <Link href={backHref}>
                <Button className="group" variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5 text-primary group-hover:text-white" />
                </Button>
              </Link>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="group hover:bg-primary"
                onClick={() => setIsMenuOpen(true)}
              >
                <Menu className="w-6 h-6 text-primary group-hover:text-white transition-all" />
              </Button>
            )}
          </div>

          {/* LOGO */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
            <Image
              src="/logo.jpg"
              alt="Chosen Threads Logo"
              width={64}
              height={64}
            />
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-3">
            {setSearchQuery ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMenuOpen(true)}
              >
                <Search className="w-5 h-5" />
              </Button>
            ) : (
              <Button variant="ghost" size="icon">
                <Search className="w-5 h-5" />
              </Button>
            )}

            <Button variant="ghost" size="icon" className="relative">
              <ShoppingBag className="w-5 h-5" />
              {/* <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white text-[8px] rounded-full flex items-center justify-center">
                2
              </span> */}
            </Button>
          </div>
        </div>
      </nav>

      {/* DRAWER (ALL VIEWPORTS) */}
      <div
        className={`fixed inset-0 z-50 transition ${
          isMenuOpen ? "visible" : "invisible"
        }`}
      >
        {/* BACKDROP */}
        <div
          onClick={() => setIsMenuOpen(false)}
          className={`absolute inset-0 bg-black/40 transition-opacity ${
            isMenuOpen ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* DRAWER */}
        <div
          className={`absolute left-0 top-0 h-full w-80 bg-white p-6 transform transition-transform ${
            isMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between mb-8">
            <span className="font-bold tracking-widest">MENU</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(false)}
            >
              <X />
            </Button>
          </div>

          {/* SEARCH */}
          {setSearchQuery && (
            <div className="mb-6">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
              />
            </div>
          )}

          {/* NAV LINKS */}
          <nav className="flex flex-col gap-5 text-sm font-semibold uppercase tracking-widest text-zinc-600">
            <Link href="/shop" onClick={() => setIsMenuOpen(false)}>
              Shop
            </Link>
            <Link href="/customize" onClick={() => setIsMenuOpen(false)}>
              Customize
            </Link>
          </nav>
        </div>
      </div>

      {/* SPACER */}
      <div className="h-[72px]" />
    </>
  );
}
