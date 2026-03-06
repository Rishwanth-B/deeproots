"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import io, { Socket } from "socket.io-client";
import * as faceapi from "face-api.js";
import { apiClient } from "../../../lib/api";

type AttentionState = "focused" | "moderate" | "distracted";

interface Participant {
  userId: string;
  name: string;
  avatar?: string | null;
  attention: AttentionState;
}

interface RoomResponse {
  room: {
    id: string;
    roomName: string;
    category: string;
    hostId: string;
    host: {
      id: string;
      name: string;
      avatar?: string | null;
    };
  };
}

export default function FocusRoomPage() {
  const params = useParams<{ roomId: string }>();
  const router = useRouter();
  const roomId = params.roomId;

  const [room, setRoom] = useState<RoomResponse["room"] | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [isHost, setIsHost] = useState(false);
  const [attention, setAttention] = useState<AttentionState>("distracted");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const modelsLoadedRef = useRef(false);

  const userIdRef = useRef<string | null>(null);
  const userNameRef = useRef<string>("You");
  const userAvatarRef = useRef<string>("🌱");

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const res = await apiClient.get<RoomResponse>(`/rooms/${roomId}`);
        setRoom(res.data.room);

        const me = await apiClient.get<{ user: any }>("/auth/me");
        const meUser = me.data.user;
        userIdRef.current = meUser.id;
        userNameRef.current = meUser.name;
        userAvatarRef.current = meUser.avatar ?? "🌱";
        setIsHost(meUser.id === res.data.room.hostId);
      } catch (err) {
        setStatusMessage("Unable to load room. Please go back and try again.");
      }
    };

    fetchRoom();
  }, [roomId]);

  useEffect(() => {
    const setupSocket = () => {
      const url =
        process.env.NEXT_PUBLIC_SOCKET_URL ||
        "http://localhost:4000/focus";
      const socketInstance = io(url, {
        transports: ["websocket"],
      });
      socketRef.current = socketInstance;

      socketInstance.on("connect", () => {
        if (!userIdRef.current) return;
        socketInstance.emit("join_room", {
          roomId,
          userId: userIdRef.current,
          name: userNameRef.current,
          avatar: userAvatarRef.current,
          isHost,
        });
      });

      socketInstance.on(
        "room_state",
        (payload: { participants: Participant[] }) => {
          setParticipants(payload.participants);
        },
      );

      socketInstance.on(
        "timer_tick",
        (payload: { remainingSeconds: number; durationSeconds: number }) => {
          setRemainingSeconds(payload.remainingSeconds);
          setDurationMinutes(Math.round(payload.durationSeconds / 60));
        },
      );

      socketInstance.on(
        "attention_state",
        (payload: { userId: string; attention: AttentionState }) => {
          setParticipants((prev) =>
            prev.map((p) =>
              p.userId === payload.userId
                ? { ...p, attention: payload.attention }
                : p,
            ),
          );
        },
      );

      socketInstance.on(
        "session_completed",
        (payload: { durationMinutes: number }) => {
          setStatusMessage(
            `Session completed! Logged ${payload.durationMinutes} minutes of deep work.`,
          );
        },
      );

      socketInstance.on(
        "error_message",
        (payload: { message: string }) => {
          setStatusMessage(payload.message);
        },
      );

      return () => {
        socketInstance.disconnect();
      };
    };

    if (room) {
      return setupSocket();
    }
  }, [room, roomId, isHost]);

  useEffect(() => {
    const setupWebcamAndFaceApi = async () => {
      try {
        if (!videoRef.current) return;

        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        videoRef.current.srcObject = stream;

        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
          faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
        ]);
        modelsLoadedRef.current = true;

        const analyze = async () => {
          if (!videoRef.current || !modelsLoadedRef.current) return;
          const video = videoRef.current;
          const options = new faceapi.TinyFaceDetectorOptions();

          const detection = await faceapi
            .detectSingleFace(video, options)
            .withFaceLandmarks();

          let newAttention: AttentionState = "distracted";

          if (detection && detection.detection) {
            const box = detection.detection.box;
            const centerX = box.x + box.width / 2;
            const videoCenterX = video.videoWidth / 2;
            const offset = Math.abs(centerX - videoCenterX);

            if (offset < video.videoWidth * 0.15) {
              newAttention = "focused";
            } else if (offset < video.videoWidth * 0.3) {
              newAttention = "moderate";
            } else {
              newAttention = "distracted";
            }
          } else {
            newAttention = "distracted";
          }

          setAttention((prev) => {
            if (prev !== newAttention) {
              const userId = userIdRef.current;
              if (socketRef.current && userId) {
                socketRef.current.emit("attention_update", {
                  roomId,
                  userId,
                  attention: newAttention,
                });
              }
            }
            return newAttention;
          });

          requestAnimationFrame(analyze);
        };

        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          analyze();
        };
      } catch (err) {
        console.error("Webcam/face-api error", err);
        setStatusMessage(
          "Unable to access webcam or load attention models. Focus indicators may be limited.",
        );
      }
    };

    setupWebcamAndFaceApi();
  }, [roomId]);

  const handleStartTimer = () => {
    if (!socketRef.current || !room || !userIdRef.current) return;
    socketRef.current.emit("timer_start", {
      roomId: room.id,
      hostId: userIdRef.current,
      durationMinutes,
    });
  };

  const handleStopTimer = () => {
    if (!socketRef.current || !room || !userIdRef.current) return;
    socketRef.current.emit("timer_stop", {
      roomId: room.id,
      hostId: userIdRef.current,
    });
  };

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
      2,
      "0",
    )}`;
  };

  const myParticipant = participants.find(
    (p) => p.userId === userIdRef.current,
  );
  const myAttention = myParticipant?.attention ?? attention;

  return (
    <main className="min-h-screen bg-[#f5f0e6] px-4 py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase text-zinc-500">
              Focus Room
            </p>
            <h1 className="text-2xl font-extrabold tracking-tight">
              {room?.roomName ?? "Loading room..."}
            </h1>
            {room && (
              <p className="text-xs text-zinc-600">
                Category: {room.category} · Host: {room.host.name}
              </p>
            )}
          </div>
          <button
            onClick={() => router.push("/rooms")}
            className="neo-button bg-[#22c55e] text-black"
          >
            Leave room
          </button>
        </header>

        {statusMessage && (
          <p className="rounded-xl border-2 border-black bg-[#fef9c3] px-3 py-2 text-xs font-semibold text-zinc-800">
            {statusMessage}
          </p>
        )}

        <section className="grid gap-4 md:grid-cols-[1.2fr,1fr]">
          <div className="neo-card bg-[#fefaf2] p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase text-zinc-500">
                  Pomodoro Timer
                </p>
                <p className="text-sm text-zinc-700">
                  Synchronized across all participants.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={durationMinutes}
                  onChange={(e) =>
                    setDurationMinutes(parseInt(e.target.value, 10))
                  }
                  className="rounded-xl border-2 border-black bg-white px-2 py-1 text-xs"
                  disabled={!isHost}
                >
                  <option value={25}>25 min</option>
                  <option value={45}>45 min</option>
                  <option value={60}>60 min</option>
                </select>
                {isHost && (
                  <>
                    <button
                      onClick={handleStartTimer}
                      className="neo-button bg-[#22c55e] text-black text-xs"
                    >
                      Start
                    </button>
                    <button
                      onClick={handleStopTimer}
                      className="neo-button bg-[#ef4444] text-black text-xs"
                    >
                      Stop
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-col items-center justify-center gap-4">
              <div className="flex h-40 w-40 items-center justify-center rounded-full border-4 border-black bg-[#fefaf2] shadow-[0_0_0_8px_rgba(0,0,0,1)]">
                <span className="text-4xl font-extrabold text-[#14532d]">
                  {formatTime(remainingSeconds || durationMinutes * 60)}
                </span>
              </div>
              <p className="text-xs text-zinc-600">
                When the timer ends, your deep work is converted into DeepRoots
                points and saplings.
              </p>
            </div>
          </div>

          <div className="neo-card bg-[#fefaf2] p-4">
            <p className="text-xs font-semibold uppercase text-zinc-500">
              Your Focus Feed
            </p>
            <div className="mt-3 rounded-2xl border-2 border-black bg-black">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="h-40 w-full rounded-2xl object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
            </div>
            <p className="mt-2 text-xs text-zinc-600">
              Webcam stays local to your browser. Only your anonymized attention
              state (focused / moderate / distracted) is shared with the room.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <span
                className={`h-3 w-3 rounded-full ${
                  myAttention === "focused"
                    ? "bg-emerald-400"
                    : myAttention === "moderate"
                      ? "bg-yellow-300"
                      : "bg-red-500"
                }`}
              />
              <p className="text-xs font-semibold text-zinc-700">
                {myAttention === "focused"
                  ? "You are focused on the screen."
                  : myAttention === "moderate"
                    ? "Partial attention — keep eyes near the code."
                    : "Looks like you’re away. Come back to grow your saplings."}
              </p>
            </div>
          </div>
        </section>

        <section className="neo-card bg-[#fefaf2] p-4">
          <p className="text-xs font-semibold uppercase text-zinc-500">
            Room Participants
          </p>
          <div className="mt-3 grid gap-3 md:grid-cols-4">
            {participants.map((p) => (
              <div
                key={p.userId}
                className="flex flex-col items-center rounded-2xl border-2 border-black bg-white p-3"
              >
                <div className="mb-2 h-10 w-10 rounded-xl border-2 border-black bg-[#bbf7d0] text-center text-2xl leading-9">
                  {p.avatar ?? "🌱"}
                </div>
                <p className="text-xs font-semibold">{p.name}</p>
                <span
                  className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    p.attention === "focused"
                      ? "bg-emerald-400 text-black"
                      : p.attention === "moderate"
                        ? "bg-yellow-300 text-black"
                        : "bg-red-500 text-white"
                  }`}
                >
                  {p.attention === "focused"
                    ? "Focused"
                    : p.attention === "moderate"
                      ? "Looking away"
                      : "Distracted"}
                </span>
              </div>
            ))}
            {participants.length === 0 && (
              <p className="text-xs text-zinc-600">
                Waiting for others to join this focus forest.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

