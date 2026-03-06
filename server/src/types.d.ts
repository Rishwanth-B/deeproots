import type { User } from "./store";

declare module "express-serve-static-core" {
  interface Request {
    user?: User;
    userId?: string;
  }
}
