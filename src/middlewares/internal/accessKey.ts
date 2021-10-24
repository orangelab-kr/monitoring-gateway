import { AccessKey, RESULT, Wrapper, WrapperCallback } from '../..';

export function InternalAccessKeyMiddleware(): WrapperCallback {
  return Wrapper(async (req, res, next) => {
    const { accessKeyId } = req.params;
    if (!accessKeyId) throw RESULT.CANNOT_FIND_ACCESS_KEY();
    req.internal.accessKey = await AccessKey.getAccessKeyOrThrow(accessKeyId);
    next();
  });
}
