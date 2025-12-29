/**
 * User Store
 * Stores current user info globally.
 */

import { create } from "zustand";

export const useUserStore = create((set) => ({
  user: null,
  token: null,
  setUser: (user, token = null) => set({ user, token }),
  setToken: (token) => set({ token }),
  clearUser: () => set({ user: null, token: null })
}));
