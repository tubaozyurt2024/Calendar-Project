import { createAction } from 'redux-actions';

import types from './types';

export const fetchSchedule = createAction(types.FETCH_SCHEDULE);
export const fetchScheduleSuccess = createAction(types.FETCH_SCHEDULE_SUCCESS);
export const fetchScheduleFailed = createAction(types.FETCH_SCHEDULE_FAILED);

// Assignment güncelleme için action'lar
export const updateAssignment = createAction(types.UPDATE_ASSIGNMENT);
export const updateAssignmentSuccess = createAction(types.UPDATE_ASSIGNMENT_SUCCESS);
export const updateAssignmentFailed = createAction(types.UPDATE_ASSIGNMENT_FAILED);
