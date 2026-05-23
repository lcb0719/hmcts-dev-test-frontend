import { app } from '../../main/app';

import { expect } from 'chai';
import nock from 'nock';
import request from 'supertest';

const API_URL = 'http://localhost:4000';

const sampleTask = {
  id: 1,
  title: 'Review application',
  description: 'Check documents',
  status: 'PENDING',
  dueDateTime: '2026-06-01T09:00:00',
};

function connectionRefusedError(): Error {
  const error = new Error('connect ECONNREFUSED');
  (error as NodeJS.ErrnoException).code = 'ECONNREFUSED';
  return error;
}

describe('Tasks routes', () => {
  afterEach(() => {
    nock.cleanAll();
  });

  describe('GET /tasks', () => {
    test('should render task list', async () => {
      nock(API_URL).get('/tasks').reply(200, [sampleTask]);

      await request(app)
        .get('/tasks')
        .expect(res => {
          expect(res.status).to.equal(200);
          expect(res.text).to.include('Review application');
          expect(res.text).to.include('Pending');
        });
    });

    test('should show deleted banner when query param is set', async () => {
      nock(API_URL).get('/tasks').reply(200, []);

      await request(app)
        .get('/tasks?deleted=true')
        .expect(res => {
          expect(res.status).to.equal(200);
          expect(res.text).to.include('Task deleted');
        });
    });

    test('should show error when backend is unavailable', async () => {
      nock(API_URL).get('/tasks').replyWithError(connectionRefusedError());

      await request(app)
        .get('/tasks')
        .expect(res => {
          expect(res.status).to.equal(200);
          expect(res.text).to.include('Cannot reach the task service');
        });
    });

    test('should paginate task list', async () => {
      const tasks = Array.from({ length: 15 }, (_, i) => ({
        id: i + 1,
        title: `Task ${i + 1}`,
        status: 'PENDING',
        dueDateTime: '2026-06-01T09:00:00',
      }));

      nock(API_URL).get('/tasks').reply(200, tasks);

      await request(app)
        .get('/tasks?page=2')
        .expect(res => {
          expect(res.status).to.equal(200);
          expect(res.text).to.include('>Task 11</a>');
          expect(res.text).to.include('Showing 11 to 15 of 15 tasks');
          expect(res.text).to.include('govuk-pagination');
        });
    });
  });

  describe('GET /tasks/new', () => {
    test('should render create form', async () => {
      await request(app)
        .get('/tasks/new')
        .expect(res => {
          expect(res.status).to.equal(200);
          expect(res.text).to.include('Create a task');
        });
    });
  });

  describe('POST /tasks', () => {
    test('should create a task and redirect', async () => {
      nock(API_URL)
        .post('/tasks', {
          title: 'New task',
          status: 'PENDING',
          dueDateTime: '2026-06-01T09:00:00',
        })
        .reply(201, {
          id: 2,
          title: 'New task',
          status: 'PENDING',
          dueDateTime: '2026-06-01T09:00:00',
        });

      await request(app)
        .post('/tasks')
        .type('form')
        .send({
          title: 'New task',
          status: 'PENDING',
          dueDateTime: '2026-06-01T09:00',
        })
        .expect(res => {
          expect(res.status).to.equal(302);
          expect(res.headers.location).to.equal('/tasks/2?created=true');
        });
    });

    test('should create a task with description', async () => {
      nock(API_URL)
        .post('/tasks', {
          title: 'New task',
          description: 'Details',
          status: 'PENDING',
          dueDateTime: '2026-06-01T09:00:00',
        })
        .reply(201, {
          id: 3,
          title: 'New task',
          description: 'Details',
          status: 'PENDING',
          dueDateTime: '2026-06-01T09:00:00',
        });

      await request(app)
        .post('/tasks')
        .type('form')
        .send({
          title: 'New task',
          description: 'Details',
          status: 'PENDING',
          dueDateTime: '2026-06-01T09:00',
        })
        .expect(302);
    });

    test('should reject missing title', async () => {
      await request(app)
        .post('/tasks')
        .type('form')
        .send({ status: 'PENDING', dueDateTime: '2026-06-01T09:00' })
        .expect(res => {
          expect(res.status).to.equal(200);
          expect(res.text).to.include('Title is required');
        });
    });

    test('should reject invalid status', async () => {
      await request(app)
        .post('/tasks')
        .type('form')
        .send({ title: 'Task', status: 'INVALID', dueDateTime: '2026-06-01T09:00' })
        .expect(res => {
          expect(res.status).to.equal(200);
          expect(res.text).to.include('Status is required');
        });
    });

    test('should reject missing due date', async () => {
      await request(app)
        .post('/tasks')
        .type('form')
        .send({ title: 'Task', status: 'PENDING' })
        .expect(res => {
          expect(res.status).to.equal(200);
          expect(res.text).to.include('Due date and time is required');
        });
    });

    test('should show API validation errors', async () => {
      nock(API_URL).post('/tasks').reply(400, {
        status: 400,
        message: 'Validation failed',
        fieldErrors: { title: 'Title is required' },
      });

      await request(app)
        .post('/tasks')
        .type('form')
        .send({ title: 'Task', status: 'PENDING', dueDateTime: '2026-06-01T09:00' })
        .expect(res => {
          expect(res.status).to.equal(200);
          expect(res.text).to.include('Validation failed');
        });
    });
  });

  describe('GET /tasks/:id', () => {
    test('should render task details', async () => {
      nock(API_URL)
        .get('/tasks/1')
        .reply(200, { ...sampleTask, status: 'IN_PROGRESS' });

      await request(app)
        .get('/tasks/1?created=true&updated=true')
        .expect(res => {
          expect(res.status).to.equal(200);
          expect(res.text).to.include('Review application');
          expect(res.text).to.include('In progress');
          expect(res.text).to.include('Task created');
          expect(res.text).to.include('Task status updated');
        });
    });

    test('should return 400 for invalid id', async () => {
      await request(app)
        .get('/tasks/abc')
        .expect(res => {
          expect(res.status).to.equal(400);
          expect(res.text).to.include('Invalid task ID');
        });
    });

    test('should return 404 when task not found', async () => {
      nock(API_URL).get('/tasks/99').reply(404, { status: 404, message: 'Task not found' });

      await request(app)
        .get('/tasks/99')
        .expect(res => {
          expect(res.status).to.equal(404);
          expect(res.text).to.include('Task not found');
        });
    });

    test('should return error for other API failures', async () => {
      nock(API_URL).get('/tasks/1').reply(500, { status: 500, message: 'Server error' });

      await request(app)
        .get('/tasks/1')
        .expect(res => {
          expect(res.status).to.equal(500);
          expect(res.text).to.include('Server error');
        });
    });
  });

  describe('GET /tasks/:id/edit-status', () => {
    test('should render edit status form', async () => {
      nock(API_URL).get('/tasks/1').reply(200, sampleTask);

      await request(app)
        .get('/tasks/1/edit-status')
        .expect(res => {
          expect(res.status).to.equal(200);
          expect(res.text).to.include('Update status');
        });
    });

    test('should return 400 for invalid id', async () => {
      await request(app).get('/tasks/0/edit-status').expect(400);
    });

    test('should return 404 when task not found', async () => {
      nock(API_URL).get('/tasks/99').reply(404, { status: 404, message: 'Task not found' });

      await request(app).get('/tasks/99/edit-status').expect(404);
    });

    test('should return error for other API failures', async () => {
      nock(API_URL).get('/tasks/1').reply(503, { status: 503, message: 'Unavailable' });

      await request(app)
        .get('/tasks/1/edit-status')
        .expect(res => {
          expect(res.status).to.equal(503);
          expect(res.text).to.include('Unavailable');
        });
    });
  });

  describe('POST /tasks/:id/edit-status', () => {
    test('should update status and redirect', async () => {
      nock(API_URL).patch('/tasks/1/status', { status: 'COMPLETED' }).reply(200, {
        ...sampleTask,
        status: 'COMPLETED',
      });

      await request(app)
        .post('/tasks/1/edit-status')
        .type('form')
        .send({ status: 'COMPLETED' })
        .expect(res => {
          expect(res.status).to.equal(302);
          expect(res.headers.location).to.equal('/tasks/1?updated=true');
        });
    });

    test('should reject invalid status', async () => {
      nock(API_URL).get('/tasks/1').reply(200, sampleTask);

      await request(app)
        .post('/tasks/1/edit-status')
        .type('form')
        .send({ status: 'INVALID' })
        .expect(res => {
          expect(res.status).to.equal(200);
          expect(res.text).to.include('Status is required');
        });
    });

    test('should return 404 when task missing for invalid status', async () => {
      nock(API_URL).get('/tasks/99').reply(404, { status: 404, message: 'Task not found' });

      await request(app)
        .post('/tasks/99/edit-status')
        .type('form')
        .send({ status: 'INVALID' })
        .expect(404);
    });

    test('should return 404 when update target is missing', async () => {
      nock(API_URL).patch('/tasks/99/status').reply(404, { status: 404, message: 'Task not found' });

      await request(app)
        .post('/tasks/99/edit-status')
        .type('form')
        .send({ status: 'COMPLETED' })
        .expect(404);
    });

    test('should show API error when update fails', async () => {
      nock(API_URL).patch('/tasks/1/status').reply(400, {
        status: 400,
        message: 'Validation failed',
        fieldErrors: { status: 'Invalid status' },
      });
      nock(API_URL).get('/tasks/1').reply(200, sampleTask);

      await request(app)
        .post('/tasks/1/edit-status')
        .type('form')
        .send({ status: 'COMPLETED' })
        .expect(res => {
          expect(res.status).to.equal(200);
          expect(res.text).to.include('Validation failed');
        });
    });

    test('should throw when update fails and task cannot be reloaded', async () => {
      nock(API_URL).patch('/tasks/1/status').reply(500, { status: 500, message: 'Server error' });
      nock(API_URL).get('/tasks/1').reply(404, { status: 404, message: 'Task not found' });

      await request(app)
        .post('/tasks/1/edit-status')
        .type('form')
        .send({ status: 'COMPLETED' })
        .expect(res => {
          expect(res.status).to.equal(500);
          expect(res.text).to.include('Server error');
        });
    });

    test('should return 400 for invalid id', async () => {
      await request(app).post('/tasks/abc/edit-status').type('form').send({ status: 'COMPLETED' }).expect(400);
    });
  });

  describe('POST /tasks/:id/delete', () => {
    test('should delete a task and redirect', async () => {
      nock(API_URL).delete('/tasks/1').reply(204);

      await request(app)
        .post('/tasks/1/delete')
        .expect(res => {
          expect(res.status).to.equal(302);
          expect(res.headers.location).to.equal('/tasks?deleted=true');
        });
    });

    test('should preserve page on redirect after delete', async () => {
      nock(API_URL).delete('/tasks/1').reply(204);

      await request(app)
        .post('/tasks/1/delete')
        .type('form')
        .send({ page: '2' })
        .expect(res => {
          expect(res.status).to.equal(302);
          expect(res.headers.location).to.equal('/tasks?deleted=true&page=2');
        });
    });

    test('should return 404 when task not found', async () => {
      nock(API_URL).delete('/tasks/99').reply(404, { status: 404, message: 'Task not found' });

      await request(app).post('/tasks/99/delete').expect(404);
    });

    test('should return error for other API failures', async () => {
      nock(API_URL).delete('/tasks/1').reply(500, { status: 500, message: 'Delete failed' });

      await request(app)
        .post('/tasks/1/delete')
        .expect(res => {
          expect(res.status).to.equal(500);
          expect(res.text).to.include('Delete failed');
        });
    });

    test('should return 400 for invalid id', async () => {
      await request(app).post('/tasks/abc/delete').expect(400);
    });
  });
});
