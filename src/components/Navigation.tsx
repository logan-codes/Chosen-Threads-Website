"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, Search, ShoppingBag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/lib/supabaseClient";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";

type Props = {
  searchQuery?: string;
  setSearchQuery?: (v: string) => void;
};

const categories = [
  { id: 1, name: "Apparel" },
  { id: 2, name: "Lifestyle" },
  { id: 3, name: "Accessories" },
  { id: 4, name: "Hoodies" },
  ]
export default function Navigation({ searchQuery, setSearchQuery }: Props) {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const isMobile = useIsMobile();

  const router = useRouter();
  const [user, setUser] = React.useState<any>(null);

  React.useEffect(() => {
    let mounted = true;

    (async () => {
      const { data } = await supabase.auth.getUser();
      if (mounted) setUser(data.user);
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe?.();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push("/");
  };

  React.useEffect(() => {
    // Close mobile-only UI when switching to desktop view
    if (!isMobile) {
      setIsMenuOpen(false);
      setIsSearchOpen(false);
    }
  }, [isMobile]);

  return (
    <>
      {/* NAVBAR */}
      <nav className="fixed top-0 z-50 w-full bg-white/90 backdrop-blur-xl border-b border-zinc-100">
        <div className="h-16 container mx-auto px-4 flex items-center justify-between md:justify-end">
          {/* LEFT — MENU */}
          {isMobile && (
            <div className="justify-start">
              <Button
                variant="ghost"
                size="icon"
                className="group hover:bg-primary"
                onClick={() => setIsMenuOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="w-6 h-6 text-primary group-hover:text-white transition-all" />
              </Button>
            </div>
          )}

          {/* CENTER — LOGO */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <Link href="/">
              <Image
                src="/logo.jpg"
                alt="Chosen Threads Logo"
                width={64}
                height={64}
                priority
              />
            </Link>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-3 ">
            {setSearchQuery &&
              (isMobile ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSearchOpen((p) => !p)}
                  aria-label="Toggle search"
                >
                  <Search className="w-5 h-5 justify-end" />
                </Button>
              ) : (
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="w-48 md:w-64"
                />
              ))}

            {user ? (
              <>
                <Button variant="ghost" onClick={handleSignOut}>
                  Logout
                </Button>
                <Link href="/checkout">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Go to checkout"
                  >
                    <ShoppingBag className="w-5 h-5 justify-end" />
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost">Login</Button>
                </Link>
                <Link href="/signup">
                  <Button>Sign Up</Button>
                </Link>
                <Link href="/checkout">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Go to checkout"
                  >
                    <ShoppingBag className="w-5 h-5 justify-end" />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* SEARCH BAR DROPDOWN */}
        {setSearchQuery && isMobile && (
          <div
            className={`overflow-hidden transition-all duration-300 border-t border-zinc-100 ${
              isSearchOpen ? "max-h-24 opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <div className="container mx-auto px-4 py-3">
              <Input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
              />
            </div>
          </div>
        )}
      </nav>

      {/* DESKTOP SUB-NAV BELOW NAVBAR */}
      {!isMobile && (
        <div className="fixed top-16 z-40 w-full bg-white/90 backdrop-blur-xl border-b border-zinc-100">
          <div className="container mx-auto px-4 py-2 flex items-center justify-center relative">
            <NavigationMenu viewport={false} className="justify-end">
              <NavigationMenuList className="gap-6">
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent uppercase tracking-widest ">
                    Shop
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="">
                    <div className="w-[520px] p-6 grid grid-cols-2 md:grid-cols-3 gap-4">
                      {categories.map((category)=> (
                        <Link
                          key={category.id} 
                          href={`/shop?category=${category.name}`}
                          className="text-sm font-semibold text-zinc-700 hover:text-primary"
                        >{category.name}</Link>
                        ))}
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuLink
                    href="/customize"
                    className="uppercase tracking-widest"
                  >
                    Customize
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>
        </div>
      )}

      {/* DRAWER */}
      {isMobile && (
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

          {/* DRAWER PANEL */}
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
                aria-label="Close menu"
              >
                <X />
              </Button>
            </div>

            {/* NAV LINKS */}
            <nav className="flex flex-col gap-5 text-sm font-semibold uppercase tracking-widest text-zinc-600">
              <Link href="/" onClick={() => setIsMenuOpen(false)}>
                Home
              </Link>
              <Link href="/shop" onClick={() => setIsMenuOpen(false)}>
                Shop
              </Link>
              <Link href="/customize" onClick={() => setIsMenuOpen(false)}>
                Customize
              </Link>
              {user ? (
                <button
                  onClick={async () => {
                    await supabase.auth.signOut();
                    setIsMenuOpen(false);
                  }}
                  className="text-left"
                >
                  Logout
                </button>
              ) : (
                <>
                  <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                    Login
                  </Link>
                  <Link href="/signup" onClick={() => setIsMenuOpen(false)}>
                    Sign Up
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      )}

      {/* SPACER: account for fixed navbar (64px) + subnav (~40px) */}
      <div className="h-[120px]" />
    </>
  );
}
