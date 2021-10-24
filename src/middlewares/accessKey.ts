import { AccessKey, RESULT, Wrapper, WrapperCallback } from '..';

export function AccessKeyMiddleware(): WrapperCallback {
  return Wrapper(async (req, res, next) => {
    const {
      query: { token },
      headers: { authorization },
    } = req;

    const accessKeyId = authorization ? authorization.substr(7) : token;
    if (typeof accessKeyId !== 'string') {
      throw RESULT.INVALID_CLIENT_ACCESS_KEY();
    }

    if (!req.loggined) req.loggined = <any>{};
    req.loggined.accessKey = await AccessKey.getAccessKeyOrThrow(accessKeyId);
    next();
  });
}
