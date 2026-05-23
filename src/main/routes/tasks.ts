import { Application, NextFunction, Request, Response } from 'express';
import config from 'config';

import { createTask, deleteTask, getAllTasks, getApiError, getTask, updateTaskStatus } from '../services/taskApi';
import { CreateTaskRequest, TASK_STATUSES, TaskStatus } from '../types/task';
import { formatDueDateTime, formatStatus, statusTagClass, toApiDateTime } from '../utils/taskFormat';
import { paginateItems, parsePageParam } from '../utils/pagination';
import { HTTPError } from '../HttpError';

const tasksPageSize: number = config.get<number>('tasksPageSize');

function parseId(param: string): number | null {
  const id = Number(param);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function isTaskStatus(value: string): value is TaskStatus {
  return TASK_STATUSES.includes(value as TaskStatus);
}

function enrichTask(task: { status: TaskStatus; dueDateTime: string }) {
  return {
    ...task,
    statusLabel: formatStatus(task.status),
    statusTagClass: statusTagClass(task.status),
    dueDateFormatted: formatDueDateTime(task.dueDateTime),
  };
}

export default function (app: Application): void {
  app.get('/tasks', async (req: Request, res: Response) => {
    const deleted = req.query.deleted === 'true';
    const page = parsePageParam(req.query.page);
    const listQuery: Record<string, string> = deleted ? { deleted: 'true' } : {};

    try {
      const allTasks = (await getAllTasks()).map(enrichTask);
      const paginated = paginateItems(allTasks, page, tasksPageSize, '/tasks', listQuery);

      res.render('tasks/index', {
        tasks: paginated.items,
        deleted,
        pagination: paginated.pagination,
        page: paginated.page,
        totalItems: paginated.totalItems,
        totalPages: paginated.totalPages,
        from: paginated.from,
        to: paginated.to,
      });
    } catch (error) {
      const apiError = getApiError(error);
      res.render('tasks/index', {
        tasks: [],
        error: apiError.message,
        deleted,
        pagination: null,
        page: 1,
        totalItems: 0,
        totalPages: 1,
        from: 0,
        to: 0,
      });
    }
  });

  app.get('/tasks/new', (_req: Request, res: Response) => {
    res.render('tasks/new', {
      statuses: TASK_STATUSES.map(status => ({ value: status, text: formatStatus(status) })),
      form: { status: 'PENDING' },
    });
  });

  app.post('/tasks', async (req: Request, res: Response) => {
    const { title, description, status, dueDateTime } = req.body;
    const form = { title, description, status, dueDateTime };

    if (!title?.trim()) {
      res.render('tasks/new', {
        statuses: TASK_STATUSES.map(s => ({ value: s, text: formatStatus(s) })),
        form,
        fieldErrors: { title: 'Title is required' },
      });
      return;
    }

    if (!isTaskStatus(status)) {
      res.render('tasks/new', {
        statuses: TASK_STATUSES.map(s => ({ value: s, text: formatStatus(s) })),
        form,
        fieldErrors: { status: 'Status is required' },
      });
      return;
    }

    if (!dueDateTime) {
      res.render('tasks/new', {
        statuses: TASK_STATUSES.map(s => ({ value: s, text: formatStatus(s) })),
        form,
        fieldErrors: { dueDateTime: 'Due date and time is required' },
      });
      return;
    }

    const payload: CreateTaskRequest = {
      title: title.trim(),
      description: description?.trim() || undefined,
      status,
      dueDateTime: toApiDateTime(dueDateTime),
    };

    try {
      const task = await createTask(payload);
      res.redirect(`/tasks/${task.id}?created=true`);
    } catch (error) {
      const apiError = getApiError(error);
      res.render('tasks/new', {
        statuses: TASK_STATUSES.map(s => ({ value: s, text: formatStatus(s) })),
        form,
        error: apiError.message,
        fieldErrors: apiError.fieldErrors,
      });
    }
  });

  app.get('/tasks/:id', async (req: Request, res: Response, next: NextFunction) => {
    const id = parseId(req.params.id);
    if (!id) {
      return next(new HTTPError('Invalid task ID', 400));
    }

    try {
      const task = enrichTask(await getTask(id));
      res.render('tasks/show', {
        task,
        created: req.query.created === 'true',
        updated: req.query.updated === 'true',
      });
    } catch (error) {
      const apiError = getApiError(error);
      if (apiError.status === 404) {
        return next(new HTTPError('Task not found', 404));
      }
      return next(new HTTPError(apiError.message, apiError.status));
    }
  });

  app.get('/tasks/:id/edit-status', async (req: Request, res: Response, next: NextFunction) => {
    const id = parseId(req.params.id);
    if (!id) {
      return next(new HTTPError('Invalid task ID', 400));
    }

    try {
      const task = enrichTask(await getTask(id));
      res.render('tasks/edit-status', {
        task,
        statuses: TASK_STATUSES.map(s => ({ value: s, text: formatStatus(s) })),
      });
    } catch (error) {
      const apiError = getApiError(error);
      if (apiError.status === 404) {
        return next(new HTTPError('Task not found', 404));
      }
      return next(new HTTPError(apiError.message, apiError.status));
    }
  });

  app.post('/tasks/:id/edit-status', async (req: Request, res: Response, next: NextFunction) => {
    const id = parseId(req.params.id);
    if (!id) {
      return next(new HTTPError('Invalid task ID', 400));
    }

    const { status } = req.body;

    if (!isTaskStatus(status)) {
      try {
        const task = enrichTask(await getTask(id));
        res.render('tasks/edit-status', {
          task,
          statuses: TASK_STATUSES.map(s => ({ value: s, text: formatStatus(s) })),
          fieldErrors: { status: 'Status is required' },
        });
      } catch {
        return next(new HTTPError('Task not found', 404));
      }
      return;
    }

    try {
      await updateTaskStatus(id, { status });
      res.redirect(`/tasks/${id}?updated=true`);
    } catch (error) {
      const apiError = getApiError(error);
      if (apiError.status === 404) {
        return next(new HTTPError('Task not found', 404));
      }
      try {
        const task = enrichTask(await getTask(id));
        res.render('tasks/edit-status', {
          task,
          statuses: TASK_STATUSES.map(s => ({ value: s, text: formatStatus(s) })),
          error: apiError.message,
          fieldErrors: apiError.fieldErrors,
        });
      } catch {
        return next(new HTTPError(apiError.message, apiError.status));
      }
    }
  });

  app.post('/tasks/:id/delete', async (req: Request, res: Response, next: NextFunction) => {
    const id = parseId(req.params.id);
    if (!id) {
      return next(new HTTPError('Invalid task ID', 400));
    }

    try {
      await deleteTask(id);
      const returnPage = parsePageParam(req.body.page);
      const redirectUrl =
        returnPage > 1 ? `/tasks?deleted=true&page=${returnPage}` : '/tasks?deleted=true';
      res.redirect(redirectUrl);
    } catch (error) {
      const apiError = getApiError(error);
      if (apiError.status === 404) {
        return next(new HTTPError('Task not found', 404));
      }
      return next(new HTTPError(apiError.message, apiError.status));
    }
  });
}
