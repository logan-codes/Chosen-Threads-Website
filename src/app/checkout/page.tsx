"use client";

import React, { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  
  const [loading, setLoading] = React.useState(true);
  const [email, setEmail] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [orderCompleted, setOrderCompleted] = React.useState(false);

  const [formData, setFormData] = React.useState({
    fullName: "",
    phone: "",
    notes: "",
  });

  React.useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (!session) {
        // If not logged in, redirect to login then back to checkout
        const redirectPath = orderId ? `/checkout?orderId=${orderId}` : '/checkout';
        router.replace(`/login?redirect=${encodeURIComponent(redirectPath)}`);
      } else {
        setEmail(session.user.email ?? null);
      }
      setLoading(false);
    };
    checkSession();
  }, [router, orderId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('Order')
        .update({
          status: 'pending_contact',
          contact_info: formData
        })
        .eq('id', orderId);

      if (error) throw error;

      setOrderCompleted(true);
      toast.success("Order placed successfully!");
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast.error("Failed to submit order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="container mx-auto px-6 py-12">Loading...</div>
      </div>
    );
  }

  if (orderCompleted) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="container mx-auto px-6 py-12 max-w-2xl text-center">
          <div className="mb-6 flex justify-center">
            <div className="h-16 w-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-4 text-zinc-900">Order Received!</h1>
          <p className="text-zinc-600 mb-8">
            Thank you for your order. We have received your design and contact details.
            Our team will review your request and contact you shortly at <strong>{formData.phone}</strong> or <strong>{email}</strong> to finalize the payment and details.
          </p>
          <Button onClick={() => router.push("/shop")} className="bg-black text-white hover:bg-zinc-800">Continue Shopping</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <section className="container mx-auto px-6 py-12 max-w-2xl">
        <h1 className="text-3xl font-bold mb-2">Checkout</h1>
        <p className="mb-8 text-sm text-zinc-500">Signed in as {email}</p>
        
        <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-8 space-y-6 shadow-sm">
          {orderId ? (
            <>
              <div>
                <h2 className="font-bold text-xl mb-2">Complete Your Order</h2>
                <p className="text-sm text-zinc-600">
                  Please provide your contact details so we can reach out to you for payment and final confirmation.
                </p>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="font-medium">Full Name</Label>
                  <Input 
                    id="fullName" 
                    required 
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    placeholder="John Doe"
                    className="bg-white"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone" className="font-medium">Phone Number</Label>
                  <Input 
                    id="phone" 
                    required 
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="+1 (555) 000-0000"
                    className="bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes" className="font-medium">Additional Notes (Optional)</Label>
                  <Textarea 
                    id="notes" 
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Any specific instructions..."
                    className="bg-white"
                  />
                </div>

                <div className="pt-4">
                  <Button type="submit" className="w-full h-12 text-base bg-black text-white hover:bg-zinc-800" disabled={submitting}>
                    {submitting ? "Submitting Order..." : "Submit Order Request"}
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="text-center py-8">
               <h2 className="font-semibold mb-2">Your cart is currently empty</h2>
               <p className="text-sm text-zinc-600 mb-6">Start customizing a product to place an order.</p>
               <Button onClick={() => router.push("/shop")} variant="outline">Browse Shop</Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}