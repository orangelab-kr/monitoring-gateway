import { Alarm, RESULT, Wrapper, WrapperCallback } from '../../..';

export function InternalMonitorAlarmMiddleware(): WrapperCallback {
  return Wrapper(async (req, res, next) => {
    const {
      internal: { monitor },
      params: { alarmId },
    } = req;

    if (!monitor || !alarmId) throw RESULT.CANNOT_FIND_ALARM();
    req.internal.alarm = await Alarm.getAlarmOrThrow(monitor, alarmId);
    next();
  });
}
