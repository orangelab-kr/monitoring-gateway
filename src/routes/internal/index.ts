import { Router } from 'express';
import { getInternalAccessKeysRouter, getInternalMonitorsRouter } from '..';

export * from './accessKeys';
export * from './monitors';

export function getInternalRouter(): Router {
  const router = Router();

  router.use('/monitors', getInternalMonitorsRouter());
  router.use('/accessKeys', getInternalAccessKeysRouter());

  return router;
}
