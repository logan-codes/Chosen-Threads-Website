"use client";

import React, { Suspense } from "react";
import AuthForm from "@/components/AuthForm";
import Navigation from "@/components/Navigation";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <section className="container mx-auto px-6 py-12 max-w-md">
        <h1 className="text-2xl font-bold mb-6">Log In</h1>
        <Suspense fallback={<div />}>
          <AuthForm mode="login" />
        </Suspense>
        <p className="mt-4 text-sm">
          Don’t have an account?{" "}
          <a className="text-primary" href="/signup">
            Sign up
          </a>
        </p>
      </section>
    </div>
  );
}
