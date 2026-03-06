"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiClient } from "../../lib/api";

interface StatsResponse {
  stats: {
    totalFocusHours: number;
    points: number;
    saplingsPlanted: number;
    currentStreak: number;
  };
  community: {
    totalSaplings: number;
  };
}

interface LeaderboardEntry {
  id: string;
  name: string;
  avatar?: string | null;
  points: number;
  saplingsPlanted: number;
  totalFocusHours: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, leaderboardRes] = await Promise.all([
          apiClient.get<StatsResponse>("/user/stats"),
          apiClient.get<{ leaderboard: LeaderboardEntry[] }>(
            "/user/leaderboard",
          ),
        ]);
        setStats(statsRes.data);
        setLeaderboard(leaderboardRes.data.leaderboard);
      } catch (err: any) {
        const message =
          err?.response?.data?.message ??
          "Unable to load dashboard. Please log in again.";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const points = stats?.stats.points ?? 0;
  const currentMilestone = points % 100;

  return (
    <main className="min-h-screen bg-[#f5f0e6] px-4 py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase text-zinc-500">
              DeepRoots Dashboard
            </p>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Your Focus Garden
            </h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/rooms" className="neo-button bg-[#22c55e] text-black">
              Enter Focus Rooms
            </Link>
            <Link
              href="/rooms"
              className="neo-button bg-[#f97316] text-black"
            >
              Create Focus Room
            </Link>
          </div>
        </header>

        {loading && (
          <p className="text-sm text-zinc-600">Loading your forest...</p>
        )}
        {error && (
          <p className="rounded-xl border-2 border-red-500 bg-red-100 px-3 py-2 text-xs font-semibold text-red-700">
            {error}
          </p>
        )}

        {stats && (
          <>
            <section className="grid gap-4 md:grid-cols-4">
              <div className="neo-card bg-[#fefaf2] p-4">
                <p className="text-xs font-semibold uppercase text-zinc-500">
                  Deep Work Hours
                </p>
                <p className="mt-2 text-3xl font-extrabold text-[#14532d]">
                  {stats.stats.totalFocusHours.toFixed(1)}
                </p>
              </div>

              <div className="neo-card bg-[#fefaf2] p-4">
                <p className="text-xs font-semibold uppercase text-zinc-500">
                  DeepRoots Points
                </p>
                <p className="mt-2 text-3xl font-extrabold text-[#0f766e]">
                  {stats.stats.points}
                </p>
                <p className="mt-1 text-[11px] text-zinc-600">
                  1 hour = 5 points
                </p>
              </div>

              <div className="neo-card bg-[#fefaf2] p-4">
                <p className="text-xs font-semibold uppercase text-zinc-500">
                  Saplings Planted
                </p>
                <p className="mt-2 text-3xl font-extrabold text-[#65a30d]">
                  {stats.stats.saplingsPlanted}
                </p>
                <p className="mt-1 text-[11px] text-zinc-600">
                  Community forest: {stats.community.totalSaplings} total
                </p>
              </div>

              <div className="neo-card bg-[#fefaf2] p-4">
                <p className="text-xs font-semibold uppercase text-zinc-500">
                  Focus Streak
                </p>
                <p className="mt-2 text-3xl font-extrabold text-[#7c3aed]">
                  {stats.stats.currentStreak} days
                </p>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              <div className="neo-card bg-[#fefaf2] p-4">
                <p className="text-xs font-semibold uppercase text-zinc-500">
                  Points to next sapling
                </p>
                <div className="mt-3">
                  <div className="mb-1 flex items-center justify-between text-xs font-semibold text-zinc-600">
                    <span>Progress</span>
                    <span>
                      {currentMilestone} / 100 pts to next sapling
                    </span>
                  </div>
                  <div className="h-3 w-full rounded-full border-2 border-black bg-[#fefaf2]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#22c55e] via-[#a3e635] to-[#facc15]"
                      style={{
                        width: `${Math.min(
                          100,
                          (currentMilestone / 100) * 100,
                        )}%`,
                      }}
                    />
                  </div>
                  {currentMilestone === 0 && points > 0 && (
                    <p className="mt-2 text-xs font-semibold text-[#14532d]">
                      You have planted a real sapling through your focus. Your
                      deep work helped grow the planet.
                    </p>
                  )}
                </div>
              </div>

              <div className="neo-card bg-[#fefaf2] p-4">
                <p className="text-xs font-semibold uppercase text-zinc-500">
                  Community Forest
                </p>
                <p className="mt-2 text-lg font-extrabold">
                  Community Forest: {stats.community.totalSaplings} Saplings
                </p>
                <p className="mt-1 text-xs text-zinc-600">
                  Every focus room session nudges this number upward. Invite
                  your friends and teammates to grow the forest together.
                </p>
              </div>
            </section>
          </>
        )}

        <section className="neo-card bg-[#fefaf2] p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase text-zinc-500">
              Leaderboard
            </p>
            <span className="neo-tag bg-[#bbf7d0] text-xs font-semibold text-black">
              Top focus growers
            </span>
          </div>
          <div className="mt-4 space-y-2">
            {leaderboard.map((entry, index) => (
              <div
                key={entry.id}
                className="flex items-center justify-between rounded-2xl border-2 border-black bg-white px-3 py-2"
              >
                <div className="flex items-center gap-3">
                  <span className="h-7 w-7 rounded-full border-2 border-black bg-[#fefaf2] text-center text-xs font-bold leading-6">
                    #{index + 1}
                  </span>
                  <span className="text-sm font-semibold">
                    {entry.avatar ?? "🌱"} {entry.name}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs font-semibold">
                  <span>{entry.points} pts</span>
                  <span>{entry.saplingsPlanted} trees</span>
                </div>
              </div>
            ))}
            {leaderboard.length === 0 && !loading && (
              <p className="text-xs text-zinc-600">
                Start your first focus session to appear on the leaderboard.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

