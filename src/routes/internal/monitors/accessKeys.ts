import { Router } from 'express';
import {
  $$$,
  AccessKey,
  InternalMonitorAccessKeyMiddleware,
  RESULT,
  Wrapper,
} from '../../..';

export function getInternalMonitorsAccessKeysRouter(): Router {
  const router = Router();

  router.get(
    '/',
    Wrapper(async (req) => {
      const { total, accessKeys } = await AccessKey.getAccessKeys(
        req.internal.monitor,
        req.query
      );

      throw RESULT.SUCCESS({ details: { accessKeys, total } });
    })
  );

  router.post(
    '/',
    Wrapper(async (req) => {
      const accessKey = await AccessKey.createAccessKey(
        req.internal.monitor,
        req.body
      );

      throw RESULT.SUCCESS({ details: { accessKey } });
    })
  );

  router.get(
    '/:accessKeyId',
    InternalMonitorAccessKeyMiddleware(),
    Wrapper(async (req) => {
      const { accessKey } = req.internal;
      throw RESULT.SUCCESS({ details: { accessKey } });
    })
  );

  router.post(
    '/:accessKeyId',
    InternalMonitorAccessKeyMiddleware(),
    Wrapper(async (req) => {
      const { internal, body } = req;
      const accessKey = await $$$(
        AccessKey.modifyAccessKey(internal.accessKey, body)
      );

      throw RESULT.SUCCESS({ details: { accessKey } });
    })
  );

  router.delete(
    '/:accessKeyId',
    InternalMonitorAccessKeyMiddleware(),
    Wrapper(async (req) => {
      const { accessKey } = req.internal;
      await $$$(AccessKey.deleteAccessKey(accessKey));
      throw RESULT.SUCCESS();
    })
  );

  return router;
}
