import { AccessKey, Monitor, RESULT, Wrapper, WrapperCallback } from '../..';

export * from './alarm';

export function MonitorMiddleware(): WrapperCallback {
  return Wrapper(async (req, res, next) => {
    const {
      query: { token },
      headers: { authorization },
      params: { monitorId },
    } = req;

    if (!monitorId) throw RESULT.CANNOT_FIND_MONITOR();
    const monitor = await Monitor.getMonitorOrThrow(monitorId);
    const accessKeyId = authorization ? authorization.substr(7) : token;
    if (typeof accessKeyId !== 'string') throw RESULT.CANNOT_FIND_MONITOR();
    const accessKey = await AccessKey.getAccessKeyOrThrow(monitor, accessKeyId);
    req.loggined = <any>{ monitor, accessKey };
    next();
  });
}
