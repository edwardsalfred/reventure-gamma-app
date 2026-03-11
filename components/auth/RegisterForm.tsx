"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ErrorMessage } from "@/components/ui/ErrorMessage";

export function RegisterForm() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed. Please try again.");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  }

  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Account Created!</h3>
        <p className="text-sm text-gray-600">
          Your account is pending approval. An administrator will review your request
          and notify you when your account is activated.
        </p>
        <Link href="/" className="inline-block text-brand-600 hover:underline text-sm font-medium">
          Back to Sign In
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <ErrorMessage message={error} />
      <Input
        label="Username"
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Choose a username"
        autoComplete="username"
        required
      />
      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        autoComplete="email"
        required
      />
      <Input
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="At least 8 characters"
        autoComplete="new-password"
        required
      />
      <Input
        label="Confirm Password"
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="Re-enter your password"
        autoComplete="new-password"
        required
      />
      <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
        Request Access
      </Button>
      <p className="text-center text-sm text-gray-600">
        Already have an account?{" "}
        <Link href="/" className="text-brand-600 hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </form>
  );
}
