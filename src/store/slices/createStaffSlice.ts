import type { StateCreator } from 'zustand';

import type { AppState, StaffSlice } from '../types';

export const createStaffSlice: StateCreator<
    AppState,
    [],
    [],
    StaffSlice
> = (set) => ({
    staff: [],
    schedule: {},
    setStaff: (staff) => set({ staff }),
    addEmployee: (employee) => set((state) => ({ staff: [...state.staff, employee] })),
    updateEmployee: (employee) => set((state) => ({
        staff: state.staff.map(e => e.id === employee.id ? employee : e)
    })),
    deleteEmployee: (id) => set((state) => ({ staff: state.staff.filter(e => e.id !== id) })),
    updateSchedule: (month, data) => set((state) => ({
        schedule: {
            ...state.schedule,
            [month]: data
        }
    })),
    updateShift: (dateStr, employeeId, type) => set((state) => {
        const date = new Date(dateStr);
        const monthKey = date.toISOString().slice(0, 7);
        const currentMonthSchedule = state.schedule[monthKey];

        if (!currentMonthSchedule) return state;

        const newShifts = currentMonthSchedule.shifts.filter(s => !(s.date === dateStr && s.employeeId === employeeId));
        newShifts.push({
            date: dateStr,
            employeeId,
            type
        });

        return {
            schedule: {
                ...state.schedule,
                [monthKey]: {
                    ...currentMonthSchedule,
                    shifts: newShifts
                }
            }
        };
    }),
    removeShift: (dateStr, employeeId) => set((state) => {
        const date = new Date(dateStr);
        const monthKey = date.toISOString().slice(0, 7);
        const currentMonthSchedule = state.schedule[monthKey];

        if (!currentMonthSchedule) return state;

        return {
            schedule: {
                ...state.schedule,
                [monthKey]: {
                    ...currentMonthSchedule,
                    shifts: currentMonthSchedule.shifts.filter(s => !(s.date === dateStr && s.employeeId === employeeId))
                }
            }
        };
    }),
});
