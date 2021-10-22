import {
  ActionModel,
  ActionProvider,
  AlarmModel,
  MetricsModel,
  Prisma,
  RuleModel,
} from '@prisma/client';
import * as Sentry from '@sentry/node';
import {
  $$$,
  clusterInfo,
  Joi,
  logger,
  prisma,
  RESULT,
  SlackAction,
} from '../..';

export * from './slack';

export interface ActionConstructor {
  new (payload: any): ActionInterface;
}

export type ActionExecuteInput = {
  metricsKey: string;
  metrics: MetricsModel[];
  alarm: AlarmModel;
  alarmCount: number;
  rule: RuleModel;
  clusterInfo: {
    name?: string;
    description?: string;
    version?: string;
    mode?: string;
    author?: string;
    cluster?: string;
  };
};

export interface ActionInterface {
  executeAction(props: ActionExecuteInput): Promise<void>;
}

export class Action {
  public static getActionInterface(
    provider: ActionProvider,
    payload: any
  ): ActionInterface {
    return new SlackAction(payload);
  }

  public static async executeActions(props: {
    metricsKey: string;
    metrics: MetricsModel[];
    alarm: AlarmModel;
    rule: RuleModel;
  }): Promise<void> {
    const { alarm, rule, metrics, metricsKey } = props;
    const { ruleId } = rule;
    const [actions, alarmCount] = await prisma.$transaction([
      prisma.actionModel.findMany({ where: { ruleId } }),
      prisma.alarmModel.count({ where: { ruleId, metricsKey } }),
    ]);

    const input: ActionExecuteInput = {
      metricsKey,
      metrics,
      alarm,
      alarmCount,
      rule,
      clusterInfo,
    };

    await Promise.all([
      actions
        .map((a) => Action.getActionInterface(a.provider, a.payload))
        .map((action) => Action.actionHandler(action, input)()),
    ]);
  }

  public static actionHandler(
    action: ActionInterface,
    props: ActionExecuteInput
  ): () => Promise<void> {
    return async () => {
      try {
        await action.executeAction(props);
      } catch (err: any) {
        Sentry.captureException(err);
        if (process.env.NODE_ENV !== 'prod') {
          logger.error(`Action / 액션을 실행할 수 없습니다. ${err.message}`);
          logger.error(err.stack);
        }
      }
    };
  }

  public static async createAction(
    rule: RuleModel,
    props: {
      actionName: string;
      description: string;
      provider: ActionProvider;
      payload: any;
    }
  ): Promise<() => Prisma.Prisma__ActionModelClient<ActionModel>> {
    const { ruleId } = rule;
    const { actionName, description, provider, payload } = await Joi.object({
      actionName: Joi.string().min(2).max(32).required(),
      description: Joi.string().allow('').allow(null).optional(),
      provider: Joi.string()
        .valid(...Object.keys(ActionProvider))
        .required(),
      payload: [
        Joi.string().required(),
        Joi.object()
          .custom(<any>JSON.stringify)
          .required(),
      ],
    }).validateAsync(props);
    return () =>
      prisma.actionModel.create({
        data: { actionName, description, provider, payload, ruleId },
      });
  }

  public static async modifyAction(
    action: ActionModel,
    props: {
      actionName?: string;
      description?: string;
      provider?: ActionProvider;
      payload?: any;
    }
  ): Promise<() => Prisma.Prisma__ActionModelClient<ActionModel>> {
    const { actionId } = action;
    const { actionName, description, provider, payload } = await Joi.object({
      actionName: Joi.string().min(2).max(32).optional(),
      description: Joi.string().allow('').allow(null).optional(),
      provider: Joi.string()
        .valid(...Object.keys(ActionProvider))
        .optional(),
      payload: Joi.any().optional(),
    }).validateAsync(props);
    return () =>
      prisma.actionModel.update({
        where: { actionId },
        data: { actionName, description, provider, payload },
      });
  }

  public static async getAction(
    rule: RuleModel,
    actionId: string
  ): Promise<() => Prisma.Prisma__ActionModelClient<ActionModel | null>> {
    const { ruleId } = rule;
    return () => prisma.actionModel.findFirst({ where: { ruleId, actionId } });
  }

  public static async getActionOrThrow(
    rule: RuleModel,
    actionId: string
  ): Promise<ActionModel> {
    const action = await $$$(Action.getAction(rule, actionId));
    if (!action) throw RESULT.CANNOT_FIND_ACTION();
    return action;
  }

  public static async getActions(
    rule: RuleModel,
    props: {
      take?: number;
      skip?: number;
      orderByField?: 'actionId' | 'monitorName' | 'createdAt' | 'updatedAt';
      orderBySort?: 'asc' | 'desc';
      search?: string;
    }
  ): Promise<{ total: number; actions: ActionModel[] }> {
    const { ruleId } = rule;
    const where: Prisma.ActionModelWhereInput = { ruleId };
    const { take, skip, orderByField, orderBySort, search } = await Joi.object({
      take: Joi.number().default(10).optional(),
      skip: Joi.number().default(0).optional(),
      orderByField: Joi.string()
        .valid('actionId', 'actionName', 'createdAt', 'updatedAt')
        .default('createdAt')
        .optional(),
      orderBySort: Joi.string().valid('asc', 'desc').default('desc').optional(),
      search: Joi.string().allow(null).allow('').optional(),
    }).validateAsync(props);
    if (search) {
      where.OR = [
        { actionId: { contains: search } },
        { actionName: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const orderBy = { [orderByField]: orderBySort };
    const [total, actions] = await prisma.$transaction([
      prisma.actionModel.count({ where }),
      prisma.actionModel.findMany({ where, take, skip, orderBy }),
    ]);

    return { total, actions };
  }

  public static async deleteAction(
    action: ActionModel
  ): Promise<() => Prisma.Prisma__ActionModelClient<ActionModel>> {
    const { actionId } = action;
    return () => prisma.actionModel.delete({ where: { actionId } });
  }
}
