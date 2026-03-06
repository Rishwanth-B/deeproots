"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient, setAuthToken } from "../../../lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post("/auth/login", form);
      const { token } = response.data;
      setAuthToken(token);
      router.push("/dashboard");
    } catch (err: any) {
      const message =
        err?.response?.data?.message ?? "Unable to log in. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f0e6] px-4 py-10">
      <div className="neo-card max-w-md flex-1 bg-[#fefaf2] p-8">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase text-zinc-500">
            Welcome back to
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight">
            DeepRoots Focus Rooms
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="text-xs font-semibold uppercase text-zinc-600">
            Email
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              className="mt-1 w-full rounded-xl border-2 border-black bg-white px-3 py-2 text-sm outline-none"
            />
          </label>

          <label className="text-xs font-semibold uppercase text-zinc-600">
            Password
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              className="mt-1 w-full rounded-xl border-2 border-black bg-white px-3 py-2 text-sm outline-none"
            />
          </label>

          {error && (
            <p className="rounded-xl border-2 border-red-500 bg-red-100 px-3 py-2 text-xs font-semibold text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="neo-button bg-[#22c55e] text-black"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Log in & join forest"}
          </button>
        </form>

        <p className="mt-4 text-xs text-zinc-600">
          New to DeepRoots?{" "}
          <Link href="/auth/signup" className="font-semibold underline">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}

