/**
 * In-memory store — no database or external connection required.
 * Data resets when the server restarts.
 */

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  avatar?: string | null;
  themeColor?: string | null;
  preferredCategory?: string | null;
  totalFocusHours: number;
  points: number;
  saplingsPlanted: number;
  currentStreak: number;
  lastFocusDate?: string | null; // YYYY-MM-DD for streak
}

export interface Room {
  id: string;
  roomName: string;
  category: string;
  hostId: string;
  createdAt: Date;
}

export interface FocusStatsEntry {
  userId: string;
  focusHours: number;
  pointsEarned: number;
  sessionDate: Date;
}

const users = new Map<string, User>();
const rooms = new Map<string, Room>();
const focusStats: FocusStatsEntry[] = [];

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

// --- Users ---
export function getUserById(id: string): User | undefined {
  return users.get(id);
}

export function getUserByEmail(email: string): User | undefined {
  return Array.from(users.values()).find((u) => u.email === email);
}

export function createUser(data: Omit<User, "id" | "totalFocusHours" | "points" | "saplingsPlanted" | "currentStreak">): User {
  const user: User = {
    id: generateId(),
    ...data,
    totalFocusHours: 0,
    points: 0,
    saplingsPlanted: 0,
    currentStreak: 0,
  };
  users.set(user.id, user);
  return user;
}

export function updateUser(id: string, updates: Partial<Pick<User, "totalFocusHours" | "points" | "saplingsPlanted" | "currentStreak" | "lastFocusDate">>): User | undefined {
  const user = users.get(id);
  if (!user) return undefined;
  Object.assign(user, updates);
  return user;
}

// --- Rooms ---
export function getRoomById(id: string): Room | undefined {
  return rooms.get(id);
}

export function createRoom(data: Omit<Room, "id" | "createdAt">): Room {
  const room: Room = {
    id: generateId(),
    ...data,
    createdAt: new Date(),
  };
  rooms.set(room.id, room);
  return room;
}

export function getAllRooms(): Room[] {
  return Array.from(rooms.values()).sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );
}

// --- Focus stats (for streak and history) ---
export function addFocusStats(entry: FocusStatsEntry): void {
  focusStats.push(entry);
}

export function getLastFocusDate(userId: string): Date | undefined {
  const userStats = focusStats
    .filter((s) => s.userId === userId)
    .sort((a, b) => b.sessionDate.getTime() - a.sessionDate.getTime());
  return userStats[0]?.sessionDate;
}

// --- Community / leaderboard ---
export function getTotalCommunitySaplings(): number {
  return Array.from(users.values()).reduce((sum, u) => sum + u.saplingsPlanted, 0);
}

export function getLeaderboard(limit: number): Array<Pick<User, "id" | "name" | "avatar" | "points" | "saplingsPlanted" | "totalFocusHours">> {
  return Array.from(users.values())
    .sort((a, b) => {
      if (b.saplingsPlanted !== a.saplingsPlanted) return b.saplingsPlanted - a.saplingsPlanted;
      return b.points - a.points;
    })
    .slice(0, limit)
    .map((u) => ({
      id: u.id,
      name: u.name,
      avatar: u.avatar,
      points: u.points,
      saplingsPlanted: u.saplingsPlanted,
      totalFocusHours: u.totalFocusHours,
    }));
}
