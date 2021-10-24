import { Router } from 'express';
import {
  AccessKeyMiddleware,
  clusterInfo,
  getInternalRouter,
  getMonitorsRouter,
  InternalMiddleware,
  RESULT,
  Wrapper,
} from '..';

export * from './internal';
export * from './monitors';

export function getRouter(): Router {
  const router = Router();

  router.use('/internal', InternalMiddleware(), getInternalRouter());
  router.use('/monitors', AccessKeyMiddleware(), getMonitorsRouter());

  router.get(
    '/',
    Wrapper(async () => {
      throw RESULT.SUCCESS({ details: clusterInfo });
    })
  );

  return router;
}
