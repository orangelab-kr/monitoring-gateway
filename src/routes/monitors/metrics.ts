import { Router } from 'express';
import { Metrics, RESULT, Wrapper } from '../..';

export function getMonitorsMetricsRouter(): Router {
  const router = Router();

  router.post(
    '/',
    Wrapper(async (req) => {
      const metrics = await Metrics.createMetricsWithMonitoring(
        req.loggined.monitor,
        req.body
      );

      throw RESULT.SUCCESS({ details: { metrics } });
    })
  );

  return router;
}
