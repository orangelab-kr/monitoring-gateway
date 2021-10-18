import { MonitorModel, Prisma, RuleModel } from '@prisma/client';
import dayjs from 'dayjs';
import { $$$, Alarm, Joi, prisma } from '..';

export class Rule {
  public static async createRule(
    monitor: MonitorModel,
    props: {
      ruleName: string;
      unitTime: number;
      gracePeriod: number;
      count: number;
    }
  ): Promise<() => Prisma.Prisma__RuleModelClient<RuleModel>> {
    const { monitorId } = monitor;
    const { ruleName, unitTime, gracePeriod, count } = await Joi.object({
      ruleName: Joi.string().min(2).max(16).required(),
      unitTime: Joi.number().required(),
      gracePeriod: Joi.number().required(),
      count: Joi.number().required(),
    }).validateAsync(props);

    return () =>
      prisma.ruleModel.create({
        data: {
          monitorId,
          ruleName,
          unitTime,
          gracePeriod,
          count,
        },
      });
  }

  public static async modifyRule(
    rule: RuleModel,
    props: {
      ruleName?: string;
      unitTime?: number;
      gracePeriod?: number;
      count?: number;
    }
  ): Promise<() => Prisma.Prisma__RuleModelClient<RuleModel>> {
    const { ruleId } = rule;
    const { ruleName, unitTime, gracePeriod, count } = await Joi.object({
      ruleName: Joi.string().min(2).max(16).optional(),
      unitTime: Joi.number().optional(),
      gracePeriod: Joi.number().optional(),
      count: Joi.number().optional(),
    }).validateAsync(props);

    return () =>
      prisma.ruleModel.update({
        where: { ruleId },
        data: {
          ruleName,
          unitTime,
          gracePeriod,
          count,
        },
      });
  }

  public static async getRules(
    monitor: MonitorModel,
    props: {
      take?: number;
      skip?: number;
      orderByField?: 'ruleName' | 'createdAt' | 'updatedAt';
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

  public static async executeRules(monitor: MonitorModel): Promise<void> {
    const { monitorId } = monitor;
    const rules = await prisma.ruleModel.findMany({ where: { monitorId } });
    if (rules.length <= 0) return;

    const maxTime = rules.sort((a, b) => b.unitTime - a.unitTime)[0].unitTime;
    const maxCreatedAt = dayjs().subtract(maxTime, 'ms').toDate();
    const rawMetrics = await prisma.metricsModel.findMany({
      orderBy: { createdAt: 'desc' },
      where: { createdAt: { gte: maxCreatedAt } },
      select: { metricsId: true, createdAt: true },
    });

    for (const rule of rules) {
      const inGracePeriod = await Rule.isInGracePeriod(monitor, rule);
      if (inGracePeriod) continue;

      const createdAt = dayjs().subtract(rule.unitTime, 'ms').toDate();
      const metrics = rawMetrics.filter(
        (m) => createdAt.getTime() < m.createdAt.getTime()
      );

      if (metrics.length < rule.count) continue;
      await $$$(Alarm.createAlarm(rule));
    }
  }

  private static async isInGracePeriod(
    monitor: MonitorModel,
    rule: RuleModel
  ): Promise<boolean> {
    const alarm = await Alarm.getLatestAlarmFromRule(monitor, rule);
    if (!alarm) return false;

    const createdAt = dayjs(alarm.createdAt);
    const afterPeriod = dayjs().subtract(rule.gracePeriod, 'ms');
    return createdAt.isAfter(afterPeriod);
  }

  public static async deleteRule(
    rule: RuleModel
  ): Promise<() => Prisma.Prisma__RuleModelClient<RuleModel>> {
    const { ruleId } = rule;
    return () => prisma.ruleModel.delete({ where: { ruleId } });
  }
}
