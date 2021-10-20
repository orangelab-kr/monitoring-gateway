import { Alarm, RESULT, Wrapper, WrapperCallback } from '../..';

export function MonitorAlarmMiddleware(): WrapperCallback {
  return Wrapper(async (req, res, next) => {
    const {
      loggined: { monitor },
      params: { alarmId },
    } = req;

    if (!monitor || !alarmId) throw RESULT.CANNOT_FIND_ALARM();
    req.loggined.alarm = await Alarm.getAlarmOrThrow(monitor, alarmId);
    next();
  });
}
