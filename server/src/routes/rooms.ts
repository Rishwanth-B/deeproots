import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { createRoom, getRoomById, getAllRooms, getUserById } from "../store";

const router = Router();

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { roomName, category } = req.body as {
      roomName: string;
      category: string;
    };

    if (!roomName || !category) {
      return res.status(400).json({ message: "Missing roomName or category" });
    }

    const hostId = req.userId!;

    const room = createRoom({
      roomName,
      category,
      hostId,
    });

    return res.status(201).json({ room });
  } catch (err) {
    console.error("Create room error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/", authMiddleware, async (req, res) => {
  try {
    const allRooms = getAllRooms();
    const rooms = allRooms.map((room) => {
      const host = getUserById(room.hostId);
      return {
        ...room,
        host: host
          ? { id: host.id, name: host.name, avatar: host.avatar }
          : { id: room.hostId, name: "Unknown", avatar: null },
      };
    });

    return res.json({ rooms });
  } catch (err) {
    console.error("List rooms error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/:roomId", authMiddleware, async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = getRoomById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    const host = getUserById(room.hostId);

    return res.json({
      room: {
        ...room,
        host: host
          ? { id: host.id, name: host.name, avatar: host.avatar }
          : { id: room.hostId, name: "Unknown", avatar: null },
      },
    });
  } catch (err) {
    console.error("Get room error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
