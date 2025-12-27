"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";

export default function CheckoutPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [email, setEmail] = React.useState<string | null>(null);

  React.useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (!session) {
        router.replace("/login?redirect=/checkout");
      } else {
        setEmail(session.user.email ?? null);
      }
      setLoading(false);
    };
    checkSession();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="container mx-auto px-6 py-12">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <section className="container mx-auto px-6 py-12 max-w-2xl">
        <h1 className="text-2xl font-bold mb-4">Checkout</h1>
        <p className="mb-6 text-sm text-zinc-600">Signed in as {email}</p>
        <div className="border rounded-lg p-6 space-y-4">
          <h2 className="font-semibold">Order Summary</h2>
          <p className="text-sm text-zinc-600">Your cart is currently empty.</p>
          <div className="flex gap-3">
            <Button onClick={() => router.push("/shop")} variant="outline">Continue Shopping</Button>
            <Button disabled>Place Order</Button>
          </div>
        </div>
      </section>
    </div>
  );
}