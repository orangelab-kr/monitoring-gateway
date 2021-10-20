import { Router } from 'express';
import {
  $$$,
  getInternalMonitorsAccessKeysRouter,
  getInternalMonitorsAlarmsRouter,
  getInternalMonitorsMetricsRouter,
  getInternalMonitorsRulesRouter,
  InternalMonitorMiddleware,
  Monitor,
  RESULT,
  Wrapper,
} from '../../..';

export * from './accessKeys';
export * from './alarms';
export * from './metrics';
export * from './rules';

export function getInternalMonitorsRouter(): Router {
  const router = Router();

  router.use(
    '/:monitorId/alarms',
    InternalMonitorMiddleware(),
    getInternalMonitorsAlarmsRouter()
  );

  router.use(
    '/:monitorId/metrics',
    InternalMonitorMiddleware(),
    getInternalMonitorsMetricsRouter()
  );

  router.use(
    '/:monitorId/accessKeys',
    InternalMonitorMiddleware(),
    getInternalMonitorsAccessKeysRouter()
  );

  router.use(
    '/:monitorId/rules',
    InternalMonitorMiddleware(),
    getInternalMonitorsRulesRouter()
  );

  router.get(
    '/',
    Wrapper(async (req) => {
      const { total, monitors } = await Monitor.getMonitors(req.query);
      throw RESULT.SUCCESS({ details: { monitors, total } });
    })
  );

  router.post(
    '/',
    Wrapper(async (req) => {
      const monitor = await $$$(Monitor.createMonitor(req.body));
      throw RESULT.SUCCESS({ details: { monitor } });
    })
  );

  router.get(
    '/:monitorId',
    InternalMonitorMiddleware(),
    Wrapper(async (req) => {
      const { monitor } = req.internal;
      throw RESULT.SUCCESS({ details: { monitor } });
    })
  );

  router.post(
    '/:monitorId',
    InternalMonitorMiddleware(),
    Wrapper(async (req) => {
      const { internal, body } = req;
      const monitor = await $$$(Monitor.modifyMonitor(internal.monitor, body));
      throw RESULT.SUCCESS({ details: { monitor } });
    })
  );

  router.delete(
    '/:monitorId',
    InternalMonitorMiddleware(),
    Wrapper(async (req) => {
      const { monitor } = req.internal;
      await $$$(Monitor.deleteMonitor(monitor));
      throw RESULT.SUCCESS();
    })
  );

  return router;
}
