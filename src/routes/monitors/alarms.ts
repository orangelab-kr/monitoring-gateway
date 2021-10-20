import { Router } from 'express';
import { Alarm, MonitorAlarmMiddleware, RESULT, Wrapper } from '../..';

export function getMonitorsAlarmsRouter(): Router {
  const router = Router();

  router.get(
    '/',
    Wrapper(async (req) => {
      const { monitor } = req.loggined;
      const { total, alarms } = await Alarm.getAlarms(monitor, req.query);
      throw RESULT.SUCCESS({ details: { alarms, total } });
    })
  );

  router.get(
    '/:alarmId',
    MonitorAlarmMiddleware(),
    Wrapper(async (req) => {
      const { alarm } = req.loggined;
      throw RESULT.SUCCESS({ details: { alarm } });
    })
  );

  return router;
}
