"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiClient } from "../../lib/api";

interface Room {
  id: string;
  roomName: string;
  category: string;
  createdAt: string;
  host: {
    id: string;
    name: string;
    avatar?: string | null;
  };
}

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roomName, setRoomName] = useState("");
  const [category, setCategory] = useState("Coding");
  const [creating, setCreating] = useState(false);

  const fetchRooms = async () => {
    try {
      const res = await apiClient.get<{ rooms: Room[] }>("/rooms");
      setRooms(res.data.rooms);
    } catch (err: any) {
      const message =
        err?.response?.data?.message ??
        "Unable to load rooms. Please log in again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      await apiClient.post("/rooms", { roomName, category });
      setRoomName("");
      setCategory("Coding");
      fetchRooms();
    } catch (err: any) {
      const message =
        err?.response?.data?.message ??
        "Unable to create room. Please try again.";
      setError(message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f5f0e6] px-4 py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase text-zinc-500">
              DeepRoots Focus Rooms
            </p>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Choose your virtual forest
            </h1>
          </div>
          <Link href="/dashboard" className="neo-button bg-[#22c55e] text-black">
            Back to Dashboard
          </Link>
        </header>

        <section className="grid gap-4 md:grid-cols-[1.2fr,1fr]">
          <div className="neo-card bg-[#fefaf2] p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase text-zinc-500">
                Active Rooms
              </p>
              <span className="neo-tag bg-[#bbf7d0] text-xs font-semibold text-black">
                Real-time collaboration
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {loading && (
                <p className="text-xs text-zinc-600">
                  Loading rooms in your forest...
                </p>
              )}
              {error && (
                <p className="rounded-xl border-2 border-red-500 bg-red-100 px-3 py-2 text-xs font-semibold text-red-700">
                  {error}
                </p>
              )}
              {!loading &&
                rooms.map((room) => (
                  <Link
                    key={room.id}
                    href={`/rooms/${room.id}`}
                    className="flex items-center justify-between rounded-2xl border-2 border-black bg-white px-3 py-2 transition-transform hover:-translate-y-0.5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl border-2 border-black bg-[#bbf7d0] text-center text-xl leading-8">
                        {room.host.avatar ?? "🌱"}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{room.roomName}</p>
                        <p className="text-[11px] text-zinc-600">
                          Host: {room.host.name} · {room.category}
                        </p>
                      </div>
                    </div>
                    <span className="neo-tag bg-[#fef9c3] text-[10px]">
                      Join focus
                    </span>
                  </Link>
                ))}
              {!loading && rooms.length === 0 && (
                <p className="text-xs text-zinc-600">
                  No rooms yet. Create the first focus forest for today.
                </p>
              )}
            </div>
          </div>

          <div className="neo-card bg-[#fefaf2] p-4">
            <p className="text-xs font-semibold uppercase text-zinc-500">
              Create a new room
            </p>
            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <label className="text-xs font-semibold uppercase text-zinc-600">
                Room name
                <input
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  required
                  className="mt-1 w-full rounded-xl border-2 border-black bg-white px-3 py-2 text-sm outline-none"
                  placeholder="#deep-work-coding"
                />
              </label>

              <label className="text-xs font-semibold uppercase text-zinc-600">
                Category
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1 w-full rounded-xl border-2 border-black bg-white px-3 py-2 text-sm"
                >
                  <option value="Coding">Coding</option>
                  <option value="Web Development">Web Development</option>
                  <option value="Project Work">Project Work</option>
                  <option value="DSA Practice">DSA Practice</option>
                </select>
              </label>

              <button
                type="submit"
                className="neo-button bg-[#22c55e] text-black"
                disabled={creating}
              >
                {creating ? "Creating..." : "Create Focus Room"}
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}

