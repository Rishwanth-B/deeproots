import { Server, Socket } from "socket.io";
import {
  getRoomById,
  getUserById,
  updateUser,
  addFocusStats,
  getLastFocusDate,
} from "../store";

type AttentionState = "focused" | "moderate" | "distracted";

interface RoomParticipant {
  socketId: string;
  userId: string;
  name: string;
  avatar?: string | null;
  attention: AttentionState;
}

interface RoomTimer {
  startTime: number;
  durationSeconds: number;
  intervalId?: NodeJS.Timeout;
}

interface RoomState {
  roomId: string;
  hostId: string;
  participants: Record<string, RoomParticipant>;
  timer?: RoomTimer;
}

const rooms: Record<string, RoomState> = {};

function broadcastRoomState(io: Server, roomId: string) {
  const room = rooms[roomId];
  if (!room) return;

  io.to(roomId).emit("room_state", {
    roomId,
    hostId: room.hostId,
    participants: Object.values(room.participants),
  });
}

function startTimer(io: Server, roomId: string, durationMinutes: number) {
  const room = rooms[roomId];
  if (!room) return;

  const durationSeconds = durationMinutes * 60;
  const startTime = Date.now();

  const timer: RoomTimer = {
    startTime,
    durationSeconds,
  };

  room.timer = timer;

  const tick = () => {
    const now = Date.now();
    const elapsedSeconds = Math.floor((now - startTime) / 1000);
    const remaining = Math.max(timer.durationSeconds - elapsedSeconds, 0);

    io.to(roomId).emit("timer_tick", {
      roomId,
      remainingSeconds: remaining,
      durationSeconds: timer.durationSeconds,
    });

    if (remaining <= 0 && timer.intervalId) {
      clearInterval(timer.intervalId);
    }
  };

  tick();
  timer.intervalId = setInterval(tick, 1000);
}

function toYYYYMMDD(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function registerFocusNamespace(io: Server) {
  const nsp = io.of("/focus");

  nsp.on("connection", (socket: Socket) => {
    socket.on(
      "join_room",
      ({
        roomId,
        userId,
        name,
        avatar,
      }: {
        roomId: string;
        userId: string;
        name: string;
        avatar?: string;
        isHost?: boolean;
      }) => {
        if (!roomId || !userId) return;

        const roomRecord = getRoomById(roomId);
        if (!roomRecord) {
          socket.emit("error_message", { message: "Room not found" });
          return;
        }

        if (!rooms[roomId]) {
          rooms[roomId] = {
            roomId,
            hostId: roomRecord.hostId,
            participants: {},
          };
        }

        socket.join(roomId);

        rooms[roomId].participants[userId] = {
          socketId: socket.id,
          userId,
          name,
          avatar,
          attention: "focused",
        };

        broadcastRoomState(nsp, roomId);
      },
    );

    socket.on(
      "leave_room",
      ({ roomId, userId }: { roomId: string; userId: string }) => {
        if (!roomId || !userId) return;
        socket.leave(roomId);
        const room = rooms[roomId];
        if (!room) return;
        delete room.participants[userId];
        broadcastRoomState(nsp, roomId);
      },
    );

    socket.on(
      "attention_update",
      ({
        roomId,
        userId,
        attention,
      }: {
        roomId: string;
        userId: string;
        attention: AttentionState;
      }) => {
        const room = rooms[roomId];
        if (!room) return;
        const participant = room.participants[userId];
        if (!participant) return;
        participant.attention = attention;

        nsp.to(roomId).emit("attention_state", {
          userId,
          attention,
        });
      },
    );

    socket.on(
      "timer_start",
      ({
        roomId,
        hostId,
        durationMinutes,
      }: {
        roomId: string;
        hostId: string;
        durationMinutes: number;
      }) => {
        const room = rooms[roomId];
        if (!room) return;
        if (room.hostId !== hostId) {
          socket.emit("error_message", {
            message: "Only the host can start the timer",
          });
          return;
        }

        if (room.timer?.intervalId) {
          clearInterval(room.timer.intervalId);
        }

        room.timer = {
          startTime: Date.now(),
          durationSeconds: durationMinutes * 60,
        };

        startTimer(nsp, roomId, durationMinutes);

        nsp.to(roomId).emit("timer_started", {
          roomId,
          durationMinutes,
        });
      },
    );

    socket.on(
      "timer_stop",
      ({ roomId, hostId }: { roomId: string; hostId: string }) => {
        const room = rooms[roomId];
        if (!room || !room.timer) return;
        if (room.hostId !== hostId) {
          socket.emit("error_message", {
            message: "Only the host can stop the timer",
          });
          return;
        }

        if (room.timer.intervalId) {
          clearInterval(room.timer.intervalId);
        }

        const now = new Date();
        const elapsedSeconds = Math.floor(
          (Date.now() - room.timer.startTime) / 1000,
        );
        const durationMinutes = Math.round(elapsedSeconds / 60);
        const focusHours = durationMinutes / 60;
        const pointsEarned = Math.round(focusHours * 5);

        const participants = Object.values(room.participants);

        for (const participant of participants) {
          const user = getUserById(participant.userId);
          if (!user) continue;

          const lastDate = getLastFocusDate(participant.userId);
          const today = toYYYYMMDD(now);
          let newStreak = 1;
          if (lastDate) {
            const lastDay = toYYYYMMDD(lastDate);
            if (lastDay === today) {
              newStreak = user.currentStreak;
            } else {
              const lastMs = new Date(lastDay).getTime();
              const todayMs = new Date(today).getTime();
              const diffDays = (todayMs - lastMs) / (1000 * 60 * 60 * 24);
              if (diffDays === 1) {
                newStreak = user.currentStreak + 1;
              }
            }
          }

          addFocusStats({
            userId: participant.userId,
            focusHours,
            pointsEarned,
            sessionDate: now,
          });

          const newPoints = user.points + pointsEarned;
          const newSaplings = Math.floor(newPoints / 100);

          updateUser(participant.userId, {
            totalFocusHours: user.totalFocusHours + focusHours,
            points: newPoints,
            saplingsPlanted: Math.max(user.saplingsPlanted, newSaplings),
            currentStreak: newStreak,
            lastFocusDate: today,
          });
        }

        nsp.to(roomId).emit("session_completed", {
          roomId,
          durationMinutes,
        });

        room.timer = undefined;
      },
    );

    socket.on("disconnect", () => {
      Object.values(rooms).forEach((room) => {
        const participantEntry = Object.entries(room.participants).find(
          ([, p]) => p.socketId === socket.id,
        );
        if (participantEntry) {
          const [userId] = participantEntry;
          delete room.participants[userId];
          broadcastRoomState(nsp, room.roomId);
        }
      });
    });
  });
}
