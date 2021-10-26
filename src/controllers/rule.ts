import { MetricsModel, MonitorModel, Prisma, RuleModel } from '@prisma/client';
import dayjs from 'dayjs';
import _ from 'lodash';
import { $$$, Alarm, Joi, prisma, RESULT } from '..';

export class Rule {
  public static async createRule(
    monitor: MonitorModel,
    props: {
      ruleName: string;
      baseKey: string;
      unitTime: number;
      gracePeriod: number;
      count: number;
      autoResolve?: number;
    }
  ): Promise<() => Prisma.Prisma__RuleModelClient<RuleModel>> {
    const { monitorId } = monitor;
    const { ruleName, baseKey, unitTime, gracePeriod, count, autoResolve } =
      await Joi.object({
        ruleName: Joi.string().min(2).max(32).required(),
        baseKey: Joi.string().required(),
        unitTime: Joi.number().required(),
        gracePeriod: Joi.number().required(),
        count: Joi.number().required(),
        autoResolve: Joi.number().allow(null).optional(),
      }).validateAsync(props);

    return () =>
      prisma.ruleModel.create({
        data: {
          monitorId,
          baseKey,
          ruleName,
          unitTime,
          gracePeriod,
          count,
          autoResolve,
        },
      });
  }

  public static async getRule(
    monitor: MonitorModel,
    ruleId: string
  ): Promise<() => Prisma.Prisma__RuleModelClient<RuleModel | null>> {
    const { monitorId } = monitor;
    return () => prisma.ruleModel.findFirst({ where: { monitorId, ruleId } });
  }

  public static async getRuleOrThrow(
    monitor: MonitorModel,
    ruleId: string
  ): Promise<RuleModel> {
    const rule = await $$$(Rule.getRule(monitor, ruleId));
    if (!rule) throw RESULT.CANNOT_FIND_RULE();
    return rule;
  }

  public static async modifyRule(
    rule: RuleModel,
    props: {
      ruleName?: string;
      baseKey?: string;
      unitTime?: number;
      gracePeriod?: number;
      count?: number;
      autoResolve?: number;
    }
  ): Promise<() => Prisma.Prisma__RuleModelClient<RuleModel>> {
    const { ruleId } = rule;
    const { ruleName, baseKey, unitTime, gracePeriod, count, autoResolve } =
      await Joi.object({
        ruleName: Joi.string().min(2).max(32).optional(),
        baseKey: Joi.string().optional(),
        unitTime: Joi.number().optional(),
        gracePeriod: Joi.number().optional(),
        count: Joi.number().optional(),
        autoResolve: Joi.number().allow(null).optional(),
      }).validateAsync(props);

    return () =>
      prisma.ruleModel.update({
        where: { ruleId },
        data: {
          ruleName,
          baseKey,
          unitTime,
          gracePeriod,
          count,
          autoResolve,
        },
      });
  }

  public static async getRules(
    monitor: MonitorModel,
    props: {
      take?: number;
      skip?: number;
      orderByField?: 'ruleName' | 'baseKey' | 'createdAt' | 'updatedAt';
      orderBySort?: 'asc' | 'desc';
      search?: string;
    }
  ): Promise<{ total: number; rules: RuleModel[] }> {
    const { monitorId } = monitor;
    const where: Prisma.RuleModelWhereInput = { monitorId };
    const { take, skip, orderByField, orderBySort } = await Joi.object({
      take: Joi.number().default(10).optional(),
      skip: Joi.number().default(0).optional(),
      orderByField: Joi.string()
        .valid('ruleName', 'createdAt', 'updatedAt')
        .default('createdAt')
        .optional(),
      orderBySort: Joi.string().valid('asc', 'desc').default('desc').optional(),
      search: Joi.string().allow(null).allow('').optional(),
    }).validateAsync(props);
    const orderBy = { [orderByField]: orderBySort };
    const [total, rules] = await prisma.$transaction([
      prisma.ruleModel.count({ where }),
      prisma.ruleModel.findMany({ where, take, skip, orderBy }),
    ]);

    return { total, rules };
  }

  public static async executeRules(
    monitor: MonitorModel,
    metrics: MetricsModel
  ): Promise<void> {
    const { monitorId } = monitor;
    const rules = await prisma.ruleModel.findMany({ where: { monitorId } });
    if (rules.length <= 0) return;

    const maxTime = rules.sort((a, b) => b.unitTime - a.unitTime)[0].unitTime;
    const maxCreatedAt = dayjs().subtract(maxTime, 's').toDate();
    const rawMetrics = await prisma.metricsModel.findMany({
      orderBy: { createdAt: 'desc' },
      where: { createdAt: { gte: maxCreatedAt } },
    });

    for (const rule of rules) {
      const { baseKey } = rule;
      const metricsKey = _.get(metrics.metricsData, baseKey);
      const inGracePeriod = await Rule.isInGracePeriod({
        monitor,
        rule,
        metricsKey,
      });

      if (inGracePeriod) continue;
      const createdAt = dayjs().subtract(rule.unitTime, 's').toDate();
      const filiteredMetrics = rawMetrics
        .filter((m) => _.get(m.metricsData, baseKey) === metricsKey)
        .filter((m) => createdAt.getTime() < m.createdAt.getTime());

      if (filiteredMetrics.length < rule.count) continue;
      await Alarm.createAlarm(rule, metricsKey, filiteredMetrics);
    }
  }

  private static async isInGracePeriod(props: {
    monitor: MonitorModel;
    rule: RuleModel;
    metricsKey: string;
  }): Promise<boolean> {
    const { rule } = props;
    const alarm = await Alarm.getLatestAlarmFromRule(props);
    if (!alarm) return false;

    const createdAt = dayjs(alarm.createdAt);
    const afterPeriod = dayjs().subtract(rule.gracePeriod, 's');
    return createdAt.isAfter(afterPeriod);
  }

  public static async deleteRule(
    rule: RuleModel
  ): Promise<() => Prisma.Prisma__RuleModelClient<RuleModel>> {
    const { ruleId } = rule;
    return () => prisma.ruleModel.delete({ where: { ruleId } });
  }
}
