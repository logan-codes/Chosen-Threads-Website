"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, LayoutDashboard, Settings } from "lucide-react";
import Navigation from "@/components/Navigation";

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-zinc-50/50">
      <Navigation />
      <div className="container mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
          <LayoutDashboard className="w-8 h-8" />
          Admin Dashboard
        </h1>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Link href="/admin/products">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Products
                </CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Manage Products</div>
                <p className="text-xs text-muted-foreground">
                  Add, edit, or remove products and their variants.
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Add more admin sections here later if needed */}
        </div>
      </div>
    </div>
  );
}
