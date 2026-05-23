import { Application } from 'express';

export default function (app: Application): void {
  app.get('/', (_req, res) => {
    res.redirect('/tasks');
  });
}
