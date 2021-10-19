import { RESULT, Rule, Wrapper, WrapperCallback } from '../../../..';

export * from './action';

export function InternalMonitorRuleMiddleware(): WrapperCallback {
  return Wrapper(async (req, res, next) => {
    const {
      internal: { monitor },
      params: { ruleId },
    } = req;

    if (!monitor || !ruleId) throw RESULT.CANNOT_FIND_RULE();
    req.internal.rule = await Rule.getRuleOrThrow(monitor, ruleId);
    next();
  });
}
