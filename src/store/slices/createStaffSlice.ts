import type { StateCreator } from 'zustand';

import type { AppState, StaffSlice } from '../types';

export const createStaffSlice: StateCreator<
    AppState,
    [],
    [],
    StaffSlice
> = (set) => ({
    staff: [
        { id: '1', name: 'Israel', role: 'HEAD_CHEF', consecutiveWorkDays: 0, daysOffInLast28Days: 0, vacationDaysTotal: 30, vacationDates: [] },
        { id: '2', name: 'Ramón', role: 'COOK_MORNING', consecutiveWorkDays: 0, daysOffInLast28Days: 0, vacationDaysTotal: 30, vacationDates: [] },
        { id: '3', name: 'Cristina', role: 'COOK_ROTATING', consecutiveWorkDays: 0, daysOffInLast28Days: 0, vacationDaysTotal: 30, vacationDates: [] },
        { id: '4', name: 'Yago', role: 'COOK_ROTATING', consecutiveWorkDays: 0, daysOffInLast28Days: 0, vacationDaysTotal: 30, vacationDates: [] },
        { id: '5', name: 'Iván', role: 'COOK_ROTATING', consecutiveWorkDays: 0, daysOffInLast28Days: 0, vacationDaysTotal: 30, vacationDates: [] },
    ],
    schedule: {},
    setStaff: (staff) => set({ staff }),
    updateEmployee: (employee) => set((state) => ({
        staff: state.staff.map(e => e.id === employee.id ? employee : e)
    })),
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
