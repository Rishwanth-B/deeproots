\"use client\";

import Link from "next/link";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f5f0e6] px-4 py-10 text-zinc-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 lg:flex-row">
        <section className="flex-1 space-y-6">
          <span className="neo-tag bg-[#22c55e] text-black">
            Deep work for developers, builders, and learners
          </span>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            DeepRoots — Grow Your Focus,
            <span className="block text-[#14532d]">Grow the Planet</span>
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-zinc-700">
            DeepRoots is a collaborative deep work platform crafted for coding,
            research, and serious project work. Stay accountable in virtual focus
            rooms, track your attention with webcam detection, and turn your deep
            work hours into real trees planted on Earth.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <Link href="/rooms" className="neo-button bg-[#22c55e]">
              Create Focus Room
            </Link>
            <Link
              href="/auth/signup"
              className="neo-button bg-[#f97316] text-black"
            >
              Join Focus Forest
            </Link>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-600">
              Pomodoro · Real-time rooms · Sapling rewards
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="neo-card p-4">
              <p className="text-xs font-semibold uppercase text-zinc-500">
                Deep Work Hours
              </p>
              <p className="mt-2 text-3xl font-extrabold text-[#14532d]">
                1h = 5 pts
              </p>
              <p className="mt-1 text-xs text-zinc-600">
                Every focused hour earns DeepRoots points toward planting real
                saplings.
              </p>
            </div>
            <div className="neo-card p-4">
              <p className="text-xs font-semibold uppercase text-zinc-500">
                Sapling Milestone
              </p>
              <p className="mt-2 text-3xl font-extrabold text-[#0f766e]">
                100 pts → 1 tree
              </p>
              <p className="mt-1 text-xs text-zinc-600">
                Hit 100 points and we commit to planting one real sapling.
              </p>
            </div>
            <div className="neo-card p-4">
              <p className="text-xs font-semibold uppercase text-zinc-500">
                Community Forest
              </p>
              <p className="mt-2 text-3xl font-extrabold text-[#65a30d]">
                Live leaderboard
              </p>
              <p className="mt-1 text-xs text-zinc-600">
                See how your focus contributes to the global DeepRoots forest.
              </p>
            </div>
          </div>
        </section>

        <section className="flex-1">
          <motion.div
            className="neo-card relative h-full min-h-[320px] overflow-hidden bg-gradient-to-b from-[#bbf7d0] via-[#fef9c3] to-[#f5f0e6] p-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase text-zinc-700">
                  Live Focus Room
                </p>
                <p className="mt-1 text-lg font-bold">#Forest-Coders</p>
              </div>
              <div className="neo-tag bg-black text-[#fefaf2]">
                <span className="mr-1 h-2 w-2 rounded-full bg-[#22c55e]" />{" "}
                Focus ON
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((id) => (
                <motion.div
                  key={id}
                  className="neo-card flex flex-col items-center justify-between bg-[#fefaf2] p-3"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * id }}
                >
                  <div className="mb-2 h-10 w-10 rounded-xl bg-gradient-to-br from-[#22c55e] to-[#14532d]" />
                  <p className="text-xs font-semibold">Dev {id}</p>
                  <span
                    className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      id === 4
                        ? "bg-red-500 text-white"
                        : id === 3
                          ? "bg-yellow-400 text-black"
                          : "bg-emerald-400 text-black"
                    }`}
                  >
                    {id === 4
                      ? "Distracted"
                      : id === 3
                        ? "Looking away"
                        : "Locked in"}
                  </span>
                </motion.div>
              ))}
            </div>

            <motion.div
              className="mt-6 rounded-2xl border-2 border-dashed border-black bg-[#fefaf2]/80 p-4"
              initial={{ scaleX: 0.9 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-xs font-semibold uppercase text-zinc-600">
                Community Forest
              </p>
              <div className="mt-2 flex items-end justify-between">
                <div>
                  <p className="text-3xl font-extrabold text-[#14532d]">
                    256 Saplings
                  </p>
                  <p className="text-xs text-zinc-600">
                    Planted through DeepRoots focus rooms.
                  </p>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((idx) => (
                    <motion.div
                      key={idx}
                      className="flex h-20 w-8 flex-col justify-end rounded-full border-2 border-black bg-[#fefaf2] p-1"
                      animate={{
                        scaleY: [0.6, 1, 0.9],
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 2.2,
                        delay: idx * 0.15,
                      }}
                    >
                      <div className="h-2 w-full rounded-full bg-[#166534]" />
                      <div className="mt-1 h-full rounded-full bg-gradient-to-t from-[#22c55e] via-[#86efac] to-[#bbf7d0]" />
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </section>
      </div>
    </main>
  );
}

