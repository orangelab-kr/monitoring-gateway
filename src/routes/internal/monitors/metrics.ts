import { Router } from 'express';
import {
  $$$,
  InternalMonitorMetricsMiddleware,
  Metrics,
  RESULT,
  Wrapper,
} from '../../..';

export function getInternalMonitorsMetricsRouter(): Router {
  const router = Router();

  router.get(
    '/',
    Wrapper(async (req) => {
      const { total, metrics } = await Metrics.getManyMetrics(
        req.internal.monitor,
        req.query
      );

      throw RESULT.SUCCESS({ details: { metrics, total } });
    })
  );

  router.post(
    '/',
    Wrapper(async (req) => {
      const metrics = await Metrics.createMetricsWithMonitoring(
        req.internal.monitor,
        req.body
      );

      throw RESULT.SUCCESS({ details: { metrics } });
    })
  );

  router.get(
    '/:metricsId',
    InternalMonitorMetricsMiddleware(),
    Wrapper(async (req) => {
      const { metrics } = req.internal;
      throw RESULT.SUCCESS({ details: { metrics } });
    })
  );

  router.post(
    '/:metricsId',
    InternalMonitorMetricsMiddleware(),
    Wrapper(async (req) => {
      const { internal, body } = req;
      const metrics = await $$$(Metrics.modifyMetrics(internal.metrics, body));
      throw RESULT.SUCCESS({ details: { metrics } });
    })
  );

  router.delete(
    '/:metricsId',
    InternalMonitorMetricsMiddleware(),
    Wrapper(async (req) => {
      const { metrics } = req.internal;
      await $$$(Metrics.deleteMetrics(metrics));
      throw RESULT.SUCCESS();
    })
  );

  return router;
}
