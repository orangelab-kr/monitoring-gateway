import { Monitor, RESULT, Wrapper, WrapperCallback } from '../../..';

export * from './alarm';
export * from './metrics';
export * from './rule';

export function InternalMonitorMiddleware(): WrapperCallback {
  return Wrapper(async (req, res, next) => {
    const { monitorId } = req.params;
    if (!monitorId) throw RESULT.CANNOT_FIND_MONITOR();
    req.internal.monitor = await Monitor.getMonitorOrThrow(monitorId);
    next();
  });
}
