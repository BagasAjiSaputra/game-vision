"use client";

import { useState, useEffect } from "react";
import { TeacherUser } from "@/app/actions";

const STORAGE_KEY = "game_motion_teacher_user";

export function getStoredTeacher(): TeacherUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error("Failed to parse stored teacher", e);
    return null;
  }
}

export function setStoredTeacher(user: TeacherUser | null): void {
  if (typeof window === "undefined") return;
  if (user) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
  // Dispatch event so other components immediately react
  window.dispatchEvent(new Event("teacher-auth-changed"));
}

export function useTeacherAuth() {
  const [teacher, setTeacher] = useState<TeacherUser | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const syncTeacher = () => {
      setTeacher(getStoredTeacher());
    };
    syncTeacher();
    setIsLoaded(true);

    window.addEventListener("storage", syncTeacher);
    window.addEventListener("teacher-auth-changed", syncTeacher);
    return () => {
      window.removeEventListener("storage", syncTeacher);
      window.removeEventListener("teacher-auth-changed", syncTeacher);
    };
  }, []);

  const login = (user: TeacherUser) => {
    setStoredTeacher(user);
    setTeacher(user);
  };

  const logout = () => {
    setStoredTeacher(null);
    setTeacher(null);
  };

  return { teacher, isLoaded, login, logout };
}
