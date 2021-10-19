import {
  ActionModel,
  ActionProvider,
  AlarmModel,
  MetricsModel,
  Prisma,
  RuleModel,
} from '@prisma/client';
import { Joi, prisma, SlackAction } from '../..';

export * from './slack';

export interface ActionConstructor {
  new (payload: any): ActionInterface;
}

export type ActionExecuteInput = {
  alarm: AlarmModel;
  rule: RuleModel;
  metrics: MetricsModel[];
};

export interface ActionInterface {
  validatePayload(): Promise<void>;
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
    alarm: AlarmModel;
    rule: RuleModel;
    metrics: MetricsModel[];
  }): Promise<void> {
    const { alarm, rule, metrics } = props;
    const { ruleId } = rule;
    const actions = await prisma.actionModel.findMany({ where: { ruleId } });
    const input: ActionExecuteInput = { alarm, rule, metrics };
    await Promise.all([
      actions
        .map((a) => Action.getActionInterface(a.provider, a.payload))
        .map((a) => Action.actionHandler(a.executeAction, input))
        .map((action) => action()),
    ]);
  }

  public static actionHandler(
    executeAction: (props: ActionExecuteInput) => Promise<void>,
    props: ActionExecuteInput
  ): () => Promise<void> {
    return async () => {
      try {
        await executeAction(props);
      } catch (err) {}
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
      payload: Joi.any().required(),
    }).validateAsync(props);
    await Action.getActionInterface(provider, payload).validatePayload();
    return () =>
      prisma.actionModel.create({
        data: { actionName, description, provider, payload, ruleId },
      });
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
}
