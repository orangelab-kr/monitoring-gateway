import { Router } from 'express';
import { getInternalMonitorsRouter } from '..';

export * from './monitors';

export function getInternalRouter(): Router {
  const router = Router();

  router.use('/monitors', getInternalMonitorsRouter());

  return router;
}
