import { Router } from 'express';
import {
  $$$,
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

  router.post(
    '/:alarmId',
    InternalMonitorAlarmMiddleware(),
    Wrapper(async (req) => {
      const alarm = await $$$(Alarm.modifyAlarm(req.internal.alarm, req.body));
      throw RESULT.SUCCESS({ details: { alarm } });
    })
  );

  router.delete(
    '/:alarmId',
    InternalMonitorAlarmMiddleware(),
    Wrapper(async (req) => {
      const { alarm } = req.internal;
      await $$$(Alarm.deleteAlarm(alarm));
      throw RESULT.SUCCESS();
    })
  );

  return router;
}
