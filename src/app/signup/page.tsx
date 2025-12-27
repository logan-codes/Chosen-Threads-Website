"use client";

import React, { Suspense } from "react";
import AuthForm from "@/components/AuthForm";
import Navigation from "@/components/Navigation";

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <section className="container mx-auto px-6 py-12 max-w-md">
        <h1 className="text-2xl font-bold mb-6">Sign Up</h1>
        <Suspense fallback={<div />}>
          <AuthForm mode="signup" />
        </Suspense>
        <p className="mt-4 text-sm">
          Already have an account?{" "}
          <a className="text-primary" href="/login">
            Log in
          </a>
        </p>
      </section>
    </div>
  );
}
