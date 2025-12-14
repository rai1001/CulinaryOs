import type { StateCreator } from 'zustand';
import type { Menu } from '../../types';
import type { AppState } from '../types';

export interface MenuSlice {
    menus: Menu[];
    setMenus: (menus: Menu[]) => void;
    addMenu: (menu: Menu) => void;
    updateMenu: (menu: Menu) => void;
    deleteMenu: (id: string) => void;
}

export const createMenuSlice: StateCreator<
    AppState,
    [],
    [],
    MenuSlice
> = (set) => ({
    menus: [],

    setMenus: (menus) => set({ menus }),

    addMenu: (menu) => set((state) => ({
        menus: [...state.menus, menu]
    })),

    updateMenu: (updatedMenu) => set((state) => ({
        menus: state.menus.map(m => m.id === updatedMenu.id ? updatedMenu : m)
    })),

    deleteMenu: (id) => set((state) => ({
        menus: state.menus.filter(m => m.id !== id)
    })),
});
