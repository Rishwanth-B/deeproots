"use client";

import { ReactNode, useEffect } from "react";
import { loadInitialAuthToken } from "../lib/api";

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    loadInitialAuthToken();
  }, []);

  return <>{children}</>;
}

