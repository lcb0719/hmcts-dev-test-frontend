import axios from 'axios';
import nock from 'nock';

import {
  createTask,
  deleteTask,
  getAllTasks,
  getApiError,
  getTask,
  updateTaskStatus,
} from '../../main/services/taskApi';

const API_URL = 'http://localhost:4000';

describe('taskApi', () => {
  afterEach(() => {
    nock.cleanAll();
  });

  describe('getApiError', () => {
    test('returns API error body from axios response', () => {
      const error = {
        isAxiosError: true,
        response: {
          data: { status: 400, message: 'Validation failed', fieldErrors: { title: 'Required' } },
        },
      };
      jest.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      expect(getApiError(error)).toEqual({
        status: 400,
        message: 'Validation failed',
        fieldErrors: { title: 'Required' },
      });

      jest.restoreAllMocks();
    });

    test('returns connection message for ECONNREFUSED', () => {
      const error = { isAxiosError: true, code: 'ECONNREFUSED' };
      jest.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      expect(getApiError(error).message).toContain('Cannot reach the task service');

      jest.restoreAllMocks();
    });

    test('returns generic message for unknown errors', () => {
      expect(getApiError(new Error('boom')).message).toBe('An unexpected error occurred');
    });
  });

  describe('API client', () => {
    test('getAllTasks returns tasks', async () => {
      nock(API_URL).get('/tasks').reply(200, [{ id: 1, title: 'Task', status: 'PENDING', dueDateTime: '2026-06-01T09:00:00' }]);
      const tasks = await getAllTasks();
      expect(tasks).toHaveLength(1);
    });

    test('getTask returns a task', async () => {
      nock(API_URL)
        .get('/tasks/1')
        .reply(200, { id: 1, title: 'Task', status: 'PENDING', dueDateTime: '2026-06-01T09:00:00' });
      const task = await getTask(1);
      expect(task.id).toBe(1);
    });

    test('createTask posts and returns created task', async () => {
      nock(API_URL)
        .post('/tasks', { title: 'New', status: 'PENDING', dueDateTime: '2026-06-01T09:00:00' })
        .reply(201, { id: 2, title: 'New', status: 'PENDING', dueDateTime: '2026-06-01T09:00:00' });
      const task = await createTask({ title: 'New', status: 'PENDING', dueDateTime: '2026-06-01T09:00:00' });
      expect(task.id).toBe(2);
    });

    test('updateTaskStatus patches status', async () => {
      nock(API_URL)
        .patch('/tasks/1/status', { status: 'COMPLETED' })
        .reply(200, { id: 1, title: 'Task', status: 'COMPLETED', dueDateTime: '2026-06-01T09:00:00' });
      const task = await updateTaskStatus(1, { status: 'COMPLETED' });
      expect(task.status).toBe('COMPLETED');
    });

    test('deleteTask sends delete request', async () => {
      nock(API_URL).delete('/tasks/1').reply(204);
      await expect(deleteTask(1)).resolves.toBeUndefined();
    });
  });
});
