import { Router } from "express";
import bcrypt from "bcryptjs";
import { createUser, getUserByEmail } from "../store";
import { signToken, authMiddleware } from "../middleware/auth";

const router = Router();

function toSafeUser(user: { id: string; name: string; email: string; avatar?: string | null; themeColor?: string | null; preferredCategory?: string | null; totalFocusHours: number; points: number; saplingsPlanted: number; currentStreak: number }) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    themeColor: user.themeColor,
    preferredCategory: user.preferredCategory,
    totalFocusHours: user.totalFocusHours,
    points: user.points,
    saplingsPlanted: user.saplingsPlanted,
    currentStreak: user.currentStreak,
  };
}

router.post("/signup", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      avatar,
      themeColor,
      preferredCategory,
    } = req.body as {
      name: string;
      email: string;
      password: string;
      avatar?: string;
      themeColor?: string;
      preferredCategory?: string;
    };

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const existing = getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = createUser({
      name,
      email,
      passwordHash,
      avatar,
      themeColor,
      preferredCategory,
    });

    const token = signToken(user.id);

    return res.status(201).json({
      token,
      user: toSafeUser(user),
    });
  } catch (err) {
    console.error("Signup error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body as {
      email: string;
      password: string;
    };

    if (!email || !password) {
      return res.status(400).json({ message: "Missing email or password" });
    }

    const user = getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = signToken(user.id);

    return res.json({
      token,
      user: toSafeUser(user),
    });
  } catch (err) {
    console.error("Login error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  return res.json({
    user: toSafeUser(req.user),
  });
});

export default router;
