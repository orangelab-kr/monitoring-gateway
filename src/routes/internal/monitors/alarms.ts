import { Router } from 'express';
import {
  Alarm,
  InternalMonitorAlarmMiddleware,
  RESULT,
  Wrapper,
} from '../../..';

export function getInternalMonitorsAlarmsRouter(): Router {
  const router = Router();

  router.get(
    '/',
    Wrapper(async (req) => {
      const { monitor } = req.internal;
      const { total, alarms } = await Alarm.getAlarms(monitor, req.query);
      throw RESULT.SUCCESS({ details: { alarms, total } });
    })
  );

  router.get(
    '/:alarmId',
    InternalMonitorAlarmMiddleware(),
    Wrapper(async (req) => {
      const { alarm } = req.internal;
      throw RESULT.SUCCESS({ details: { alarm } });
    })
  );

  return router;
}
