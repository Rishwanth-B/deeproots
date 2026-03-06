"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient, setAuthToken } from "../../../lib/api";

const AVATARS = ["🌱", "🌿", "🌲", "🌳", "🌵", "🌸"];
const THEME_COLORS = ["#14532d", "#0f766e", "#5f3b1a", "#7e22ce", "#ea580c"];

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    avatar: AVATARS[0],
    themeColor: THEME_COLORS[0],
    preferredCategory: "Coding",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post("/auth/signup", {
        name: form.name,
        email: form.email,
        password: form.password,
        avatar: form.avatar,
        themeColor: form.themeColor,
        preferredCategory: form.preferredCategory,
      });

      const { token } = response.data;
      setAuthToken(token);
      router.push("/dashboard");
    } catch (err: any) {
      const message =
        err?.response?.data?.message ?? "Unable to sign up. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f0e6] px-4 py-10">
      <div className="neo-card max-w-xl flex-1 bg-[#fefaf2] p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-zinc-500">
              Welcome to
            </p>
            <h1 className="text-2xl font-extrabold tracking-tight">
              DeepRoots Focus Forest
            </h1>
          </div>
          <span className="neo-tag bg-[#22c55e] text-xs font-semibold uppercase text-black">
            New here
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-xs font-semibold uppercase text-zinc-600">
              Name
              <input
                className="mt-1 w-full rounded-xl border-2 border-black bg-white px-3 py-2 text-sm outline-none"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </label>

            <label className="text-xs font-semibold uppercase text-zinc-600">
              Email
              <input
                type="email"
                className="mt-1 w-full rounded-xl border-2 border-black bg-white px-3 py-2 text-sm outline-none"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </label>
          </div>

          <label className="text-xs font-semibold uppercase text-zinc-600">
            Password
            <input
              type="password"
              className="mt-1 w-full rounded-xl border-2 border-black bg-white px-3 py-2 text-sm outline-none"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              minLength={6}
            />
          </label>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase text-zinc-600">
                Avatar
              </p>
              <div className="mt-1 flex flex-wrap gap-2">
                {AVATARS.map((av) => (
                  <button
                    type="button"
                    key={av}
                    onClick={() => setForm((prev) => ({ ...prev, avatar: av }))}
                    className={`flex h-10 w-10 items-center justify-center rounded-xl border-2 border-black text-xl ${
                      form.avatar === av ? "bg-[#22c55e]" : "bg-white"
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>

            <label className="text-xs font-semibold uppercase text-zinc-600">
              Theme color
              <div className="mt-1 flex flex-wrap gap-2">
                {THEME_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({ ...prev, themeColor: color }))
                    }
                    style={{ backgroundColor: color }}
                    className={`h-8 w-8 rounded-full border-2 border-black ${
                      form.themeColor === color ? "ring-2 ring-black" : ""
                    }`}
                  />
                ))}
              </div>
            </label>

            <label className="text-xs font-semibold uppercase text-zinc-600">
              Focus Category
              <select
                name="preferredCategory"
                value={form.preferredCategory}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border-2 border-black bg-white px-3 py-2 text-sm"
              >
                <option value="Coding">Coding</option>
                <option value="Web Development">Web Development</option>
                <option value="Project Work">Project Work</option>
                <option value="DSA Practice">DSA Practice</option>
              </select>
            </label>
          </div>

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
            {loading ? "Creating account..." : "Sign up & start focusing"}
          </button>
        </form>

        <p className="mt-4 text-xs text-zinc-600">
          Already have an account?{" "}
          <Link href="/auth/login" className="font-semibold underline">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}

