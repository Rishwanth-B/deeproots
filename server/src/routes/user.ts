import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { getUserById, getTotalCommunitySaplings, getLeaderboard } from "../store";

const router = Router();

router.get("/stats", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId!;

    const user = getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const totalCommunitySaplings = getTotalCommunitySaplings();

    return res.json({
      stats: {
        totalFocusHours: user.totalFocusHours,
        points: user.points,
        saplingsPlanted: user.saplingsPlanted,
        currentStreak: user.currentStreak,
      },
      community: {
        totalSaplings: totalCommunitySaplings,
      },
    });
  } catch (err) {
    console.error("User stats error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/leaderboard", authMiddleware, async (_req, res) => {
  try {
    const leaderboard = getLeaderboard(20);
    return res.json({ leaderboard });
  } catch (err) {
    console.error("Leaderboard error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
