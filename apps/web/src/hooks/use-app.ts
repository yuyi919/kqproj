"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

export const useApp = () => {
  const router = useRouter();

  const redirectToAccountSettings = useCallback(async () => {
    router.push("/settings");
  }, [router]);

  const redirectToSignIn = useCallback(async () => {
    router.push("/login");
  }, [router]);

  const redirectToSignUp = useCallback(async () => {
    router.push("/register");
  }, [router]);

  return {
    redirectToAccountSettings,
    redirectToSignIn,
    redirectToSignUp,
  };
};
