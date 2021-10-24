import { AccessKey, Monitor, RESULT, Wrapper, WrapperCallback } from '../..';

export * from './alarm';

export function MonitorMiddleware(): WrapperCallback {
  return Wrapper(async (req, res, next) => {
    const {
      loggined: { accessKey },
      params: { monitorId },
    } = req;

    if (!accessKey || typeof monitorId !== 'string') {
      throw RESULT.CANNOT_FIND_MONITOR();
    }

    const { accessKeyId } = accessKey;
    if (!req.loggined) req.loggined = <any>{};
    req.loggined.monitor = await Monitor.getMonitorOrThrow(
      monitorId,
      accessKeyId
    );

    next();
  });
}
