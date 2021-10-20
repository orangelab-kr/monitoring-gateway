import { AccessKey, RESULT, Wrapper, WrapperCallback } from '../../..';

export function InternalMonitorAccessKeyMiddleware(): WrapperCallback {
  return Wrapper(async (req, res, next) => {
    const {
      internal: { monitor },
      params: { accessKeyId },
    } = req;

    if (!monitor || !accessKeyId) throw RESULT.CANNOT_FIND_ACCESS_KEY();
    req.internal.accessKey = await AccessKey.getAccessKeyOrThrow(
      monitor,
      accessKeyId
    );

    next();
  });
}
