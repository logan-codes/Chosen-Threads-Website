"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
  Undo2,
  Redo2,
  ShoppingCart,
  Image as ImageIcon,
  Shirt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

type ProductView = "FRONT" | "BACK" | "RIGHT" | "LEFT";

function CustomizeEditor() {
  const searchParams = useSearchParams();
  const productId = searchParams.get("productId");
  const colorParam = searchParams.get("color");

  const [selectedView, setSelectedView] = React.useState<ProductView>("FRONT");
  const [selectedColor, setSelectedColor] = React.useState(
    colorParam || "white"
  );
  const [selectedNavItem, setSelectedNavItem] = React.useState<string | null>(
    null
  );

  // Update color when URL param changes
  React.useEffect(() => {
    if (colorParam) {
      setSelectedColor(colorParam);
    }
  }, [colorParam]);

  const navItems = [
    { id: "products", label: "Products", icon: Shirt },
    { id: "image", label: "Image", icon: ImageIcon },
    { id: "order", label: "Order", icon: ShoppingCart },
  ];

  const productViews: ProductView[] = ["FRONT", "BACK", "RIGHT", "LEFT"];

  const actionButtons = [
    { id: "undo", label: "Undo", icon: Undo2 },
    { id: "redo", label: "Redo", icon: Redo2 },
    
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f5f3f0]">
      {/* Left Sidebar */}
      <aside className="w-64 bg-[#f5f3f0] border-r border-[#e8e5e0] flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-[#e8e5e0]">
          <Link href="/">
          <Image src="/logo.jpg" alt="Chosen Threads Logo" width={100} height={100} />
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-4 px-2">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = selectedNavItem === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => setSelectedNavItem(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors",
                      isActive
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:bg-white/50"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium">
                        {item.label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="h-20 bg-white border-b border-[#e8e5e0] flex items-center justify-between px-6">
          {/* Action Buttons */}
          <div className="flex items-center gap-6">
            {actionButtons.map((btn) => {
              const Icon = btn.icon;
              return (
                <button
                  key={btn.id}
                  className="flex flex-col items-center gap-1 hover:opacity-70 transition-opacity"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-gray-700" />
                  </div>
                  <span className="text-[10px] font-medium text-gray-600 uppercase tracking-wide">
                    {btn.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Main Buttons */}
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              className="bg-gray-800 text-white hover:bg-gray-700 rounded-lg px-6 py-2 text-sm font-semibold"
            >
              Tutorials
            </Button>
            <Button
              className="bg-orange-500 text-white hover:bg-orange-600 rounded-lg px-6 py-2 text-sm font-semibold"
            >
              Order
            </Button>
          </div>
        </header>

        {/* Central Display Area */}
        <main className="flex-1 flex items-center justify-center bg-[#f5f3f0] p-8 overflow-auto">
          <div className="relative w-full h-full max-w-2xl flex items-center justify-center">
            {/* T-shirt Display */}
            <div className="relative w-full max-w-md flex items-center justify-center">
              {/* T-shirt SVG - More realistic shape */}
              <svg
                viewBox="0 0 300 400"
                className="w-full h-auto max-h-[600px]"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Left Sleeve */}
                <path
                  d="M 20 80 Q 20 60 30 50 Q 40 40 50 50 L 50 180 Q 50 200 40 210 Q 30 220 20 210 Z"
                  fill={selectedColor}
                  stroke="#d1d5db"
                  strokeWidth="1.5"
                />
                {/* Right Sleeve */}
                <path
                  d="M 280 80 Q 280 60 270 50 Q 260 40 250 50 L 250 180 Q 250 200 260 210 Q 270 220 280 210 Z"
                  fill={selectedColor}
                  stroke="#d1d5db"
                  strokeWidth="1.5"
                />
                {/* Main Body */}
                <path
                  d="M 50 50 Q 50 30 80 30 L 220 30 Q 250 30 250 50 L 250 350 Q 250 370 220 370 L 80 370 Q 50 370 50 350 Z"
                  fill={selectedColor}
                  stroke="#d1d5db"
                  strokeWidth="1.5"
                />
                {/* Neck Opening */}
                <path
                  d="M 110 50 Q 150 50 190 50 Q 190 30 150 30 Q 110 30 110 50"
                  fill={selectedColor}
                  stroke="#d1d5db"
                  strokeWidth="1.5"
                />
                {/* Shoulder seams */}
                <line
                  x1="50"
                  y1="50"
                  x2="80"
                  y2="30"
                  stroke="#cbd5e1"
                  strokeWidth="1"
                  opacity="0.5"
                />
                <line
                  x1="250"
                  y1="50"
                  x2="220"
                  y2="30"
                  stroke="#cbd5e1"
                  strokeWidth="1"
                  opacity="0.5"
                />
              </svg>
            </div>
          </div>
        </main>
      </div>

      {/* Right Sidebar */}
      <aside className="w-64 bg-white border-l border-[#e8e5e0] flex flex-col items-center py-6 px-4 align-middle ">
        {/* Product View Thumbnails */}
        <div className="space-y-4 my-auto">
          {productViews.map((view) => {
            const isSelected = selectedView === view;
            return (
              <button
                key={view}
                onClick={() => setSelectedView(view)}
                className={cn(
                  "flex flex-col items-center gap-2 transition-all",
                  isSelected && "scale-105"
                )}
              >
                <div
                  className={cn(
                    "w-20 h-20 rounded-full border-2 overflow-hidden bg-gray-100 flex items-center justify-center",
                    isSelected
                      ? "border-blue-500 shadow-lg"
                      : "border-gray-300"
                  )}
                >
                  {/* TODO-Mini t-shirt preview */}
                  
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-700">
                  {view}
                </span>
              </button>
            );
          })}
        </div>
      </aside>
    </div>
  );
}

export default function CustomizePage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-screen items-center justify-center bg-[#f5f3f0]">
        <div className="text-gray-600">Loading...</div>
      </div>
    }>
      <CustomizeEditor />
    </Suspense>
  );
}

