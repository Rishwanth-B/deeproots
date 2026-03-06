import "dotenv/config";
import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import authRoutes from "./routes/auth";
import roomsRoutes from "./routes/rooms";
import userRoutes from "./routes/user";
import { registerFocusNamespace } from "./sockets/focus";

const app = express();

const CLIENT_ORIGIN =
  process.env.CLIENT_ORIGIN || "http://localhost:3000";

app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: true,
  }),
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomsRoutes);
app.use("/api/user", userRoutes);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: CLIENT_ORIGIN,
  },
});

registerFocusNamespace(io);

const PORT = Number(process.env.PORT) || 4000;

server.listen(PORT, () => {
  console.log(`DeepRoots API server listening on port ${PORT}`);
});

