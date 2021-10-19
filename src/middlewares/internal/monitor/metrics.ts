import { Metrics, Monitor, RESULT, Wrapper, WrapperCallback } from '../../..';

export function InternalMonitorMetricsMiddleware(): WrapperCallback {
  return Wrapper(async (req, res, next) => {
    const {
      internal: { monitor },
      params: { metricsId },
    } = req;

    if (!monitor || !metricsId) throw RESULT.CANNOT_FIND_METRICS();
    req.internal.metrics = await Metrics.getMetricsOrThrow(monitor, metricsId);
    next();
  });
}
