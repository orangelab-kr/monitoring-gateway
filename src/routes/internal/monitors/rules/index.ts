import { Router } from 'express';
import {
  $$$,
  getInternalMonitorsRulesActionsRouter,
  InternalMonitorRuleMiddleware,
  RESULT,
  Rule,
  Wrapper,
} from '../../../..';

export * from './actions';

export function getInternalMonitorsRulesRouter(): Router {
  const router = Router();

  router.use(
    '/:ruleId/actions',
    InternalMonitorRuleMiddleware(),
    getInternalMonitorsRulesActionsRouter()
  );

  router.get(
    '/',
    Wrapper(async (req) => {
      const { monitor } = req.internal;
      const { total, rules } = await Rule.getRules(monitor, req.query);
      throw RESULT.SUCCESS({ details: { rules, total } });
    })
  );

  router.post(
    '/',
    Wrapper(async (req) => {
      const { monitor } = req.internal;
      const rule = await $$$(Rule.createRule(monitor, req.body));
      throw RESULT.SUCCESS({ details: { rule } });
    })
  );

  router.get(
    '/:ruleId',
    InternalMonitorRuleMiddleware(),
    Wrapper(async (req) => {
      const { rule } = req.internal;
      throw RESULT.SUCCESS({ details: { rule } });
    })
  );

  router.post(
    '/:ruleId',
    InternalMonitorRuleMiddleware(),
    Wrapper(async (req) => {
      const { internal, body } = req;
      const rule = await $$$(Rule.modifyRule(internal.rule, body));
      throw RESULT.SUCCESS({ details: { rule } });
    })
  );

  router.delete(
    '/:ruleId',
    InternalMonitorRuleMiddleware(),
    Wrapper(async (req) => {
      const { rule } = req.internal;
      await $$$(Rule.deleteRule(rule));
      throw RESULT.SUCCESS();
    })
  );

  return router;
}
