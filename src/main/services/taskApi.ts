import axios, { AxiosError } from 'axios';
import config from 'config';

import { ApiError, CreateTaskRequest, Task, UpdateTaskStatusRequest } from '../types/task';

const apiUrl: string = process.env.API_URL || config.get<string>('apiUrl');

const client = axios.create({
  baseURL: apiUrl,
  headers: { Accept: 'application/json' },
});

export function getApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiError>;
    if (axiosError.response?.data?.message) {
      return axiosError.response.data;
    }
    if (axiosError.code === 'ECONNREFUSED') {
      return {
        status: 503,
        message: `Cannot reach the task service at ${apiUrl}. Start the backend and try again.`,
      };
    }
  }
  return { status: 500, message: 'An unexpected error occurred' };
}

export async function getAllTasks(): Promise<Task[]> {
  const { data } = await client.get<Task[]>('/tasks');
  return data;
}

export async function getTask(id: number): Promise<Task> {
  const { data } = await client.get<Task>(`/tasks/${id}`);
  return data;
}

export async function createTask(request: CreateTaskRequest): Promise<Task> {
  const { data } = await client.post<Task>('/tasks', request, {
    headers: { 'Content-Type': 'application/json' },
  });
  return data;
}

export async function updateTaskStatus(id: number, request: UpdateTaskStatusRequest): Promise<Task> {
  const { data } = await client.patch<Task>(`/tasks/${id}/status`, request, {
    headers: { 'Content-Type': 'application/json' },
  });
  return data;
}

export async function deleteTask(id: number): Promise<void> {
  await client.delete(`/tasks/${id}`);
}
