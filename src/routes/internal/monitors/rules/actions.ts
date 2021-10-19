import { Router } from 'express';
import {
  $$$,
  Action,
  InternalMonitorRuleActionMiddleware,
  RESULT,
  Wrapper,
} from '../../../..';

export function getInternalMonitorsRulesActionsRouter(): Router {
  const router = Router();

  router.get(
    '/',
    Wrapper(async (req) => {
      const { rule } = req.internal;
      const { total, actions } = await Action.getActions(rule, req.query);
      throw RESULT.SUCCESS({ details: { actions, total } });
    })
  );

  router.post(
    '/',
    Wrapper(async (req) => {
      const { rule } = req.internal;
      const action = await $$$(Action.createAction(rule, req.body));
      throw RESULT.SUCCESS({ details: { action } });
    })
  );

  router.get(
    '/:actionId',
    InternalMonitorRuleActionMiddleware(),
    Wrapper(async (req) => {
      const { action } = req.internal;
      throw RESULT.SUCCESS({ details: { action } });
    })
  );

  router.post(
    '/:actionId',
    InternalMonitorRuleActionMiddleware(),
    Wrapper(async (req) => {
      const { internal, body } = req;
      const action = await $$$(Action.modifyAction(internal.action, body));
      throw RESULT.SUCCESS({ details: { action } });
    })
  );

  router.delete(
    '/:actionId',
    InternalMonitorRuleActionMiddleware(),
    Wrapper(async (req) => {
      const { action } = req.internal;
      await $$$(Action.deleteAction(action));
      throw RESULT.SUCCESS();
    })
  );

  return router;
}
