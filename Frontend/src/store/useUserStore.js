import { create } from 'zustand';

export const useUserStore = create((set) => ({
  isLoggedIn: false,
  setIsLoggedIn: (value) => set({ isLoggedIn: value }),

  userInfo: null,
  setUserInfo: (info) => set({ userInfo: info }),
  getUserInfo: () => useUserStore.getState().userInfo,

  userRole: 'guest',
  setUserRole: (role) => set({ userRole: role }),
}));