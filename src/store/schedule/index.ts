/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Action } from 'redux-actions';

import { handleActions } from 'redux-actions';

import types from './types';

import type { ErrorBE } from '../../utils/types';
import type { ScheduleInstance } from '../../models/schedule';

export interface ScheduleState {
  errors: ErrorBE;
  loading: boolean;
  schedule: ScheduleInstance;
}

const initialState: ScheduleState = {
  loading: false,
  errors: {},
  schedule: {} as ScheduleInstance,
};

const scheduleReducer: any = {
  [types.FETCH_SCHEDULE_SUCCESS]: (
    state: ScheduleState,
    { payload }: Action<typeof state.schedule>
  ): ScheduleState => ({
    ...state,
    loading: false,
    errors: {},
    schedule: payload,
  }),

  [types.FETCH_SCHEDULE_FAILED]: (
    state: ScheduleState,
    { payload }: Action<typeof state.errors>
  ): ScheduleState => ({
    ...state,
    loading: false,
    errors: payload,
  }),

  [types.UPDATE_ASSIGNMENT_SUCCESS]: (
    state: ScheduleState,
    { payload }: Action<{ assignmentId: string; newShiftStart: string; newShiftEnd: string }>
  ): ScheduleState => {
    if (!payload) return state;

    const { assignmentId, newShiftStart, newShiftEnd } = payload;
    
    // Schedule içindeki assignments array'ini güncelle
    const updatedAssignments = state.schedule.assignments?.map((assignment) => {
      if (assignment.id === assignmentId) {
        return {
          ...assignment,
          shiftStart: newShiftStart,
          shiftEnd: newShiftEnd,
          isUpdated: true, // Güncellenmiş olarak işaretle
        };
      }
      return assignment;
    });

    return {
      ...state,
      schedule: {
        ...state.schedule,
        assignments: updatedAssignments || state.schedule.assignments,
      },
    };
  },

  [types.UPDATE_ASSIGNMENT_FAILED]: (
    state: ScheduleState,
    { payload }: Action<typeof state.errors>
  ): ScheduleState => ({
    ...state,
    loading: false,
    errors: payload,
  }),
};

export default handleActions(scheduleReducer, initialState) as any;
