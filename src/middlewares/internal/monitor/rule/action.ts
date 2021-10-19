import { Action, RESULT, Wrapper, WrapperCallback } from '../../../..';

export function InternalMonitorRuleActionMiddleware(): WrapperCallback {
  return Wrapper(async (req, res, next) => {
    const {
      internal: { rule },
      params: { actionId },
    } = req;

    if (!rule || !actionId) throw RESULT.CANNOT_FIND_ACTION();
    req.internal.action = await Action.getActionOrThrow(rule, actionId);
    next();
  });
}
