import { Router } from 'express';
import {
  clusterInfo,
  getInternalRouter,
  InternalMiddleware,
  RESULT,
  Wrapper,
} from '..';

export * from './internal';

export function getRouter(): Router {
  const router = Router();

  router.use('/internal', InternalMiddleware(), getInternalRouter());

  router.get(
    '/',
    Wrapper(async () => {
      throw RESULT.SUCCESS({ details: clusterInfo });
    })
  );

  return router;
}
