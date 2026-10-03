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
}

export function useTeacherAuth() {
  const [teacher, setTeacher] = useState<TeacherUser | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setTeacher(getStoredTeacher());
    setIsLoaded(true);
  }, []);

  const login = (user: TeacherUser) => {
    setTeacher(user);
    setStoredTeacher(user);
  };

  const logout = () => {
    setTeacher(null);
    setStoredTeacher(null);
  };

  return { teacher, isLoaded, login, logout };
}
