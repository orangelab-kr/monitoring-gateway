import { Router } from 'express';
import {
  $$$,
  getMonitorsAlarmsRouter,
  getMonitorsMetricsRouter,
  MonitorMiddleware,
  Monitor,
  RESULT,
  Wrapper,
} from '../..';

export * from './alarms';
export * from './metrics';

export function getMonitorsRouter(): Router {
  const router = Router();

  router.use(
    '/:monitorId/alarms',
    MonitorMiddleware(),
    getMonitorsAlarmsRouter()
  );

  router.use(
    '/:monitorId/metrics',
    MonitorMiddleware(),
    getMonitorsMetricsRouter()
  );

  router.get(
    '/:monitorId',
    MonitorMiddleware(),
    Wrapper(async (req) => {
      const { monitor } = req.loggined;
      throw RESULT.SUCCESS({ details: { monitor } });
    })
  );

  return router;
}
