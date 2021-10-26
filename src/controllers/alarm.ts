import {
  AlarmModel,
  MetricsModel,
  MonitorModel,
  Prisma,
  PrismaPromise,
  RuleModel,
} from '@prisma/client';
import dayjs from 'dayjs';
import { $$$, Action, Joi, prisma, RESULT } from '..';

export class Alarm {
  public static async createAlarm(
    rule: RuleModel,
    metricsKey: string,
    metrics: MetricsModel[]
  ): Promise<AlarmModel> {
    const { ruleId, monitorId } = rule;
    const alarm = await prisma.alarmModel.create({
      data: { ruleId, monitorId, metricsKey },
    });

    await Alarm.resolveAlarmByAutoResolve(rule);
    await Action.executeActions({ alarm, rule, metrics, metricsKey });
    return alarm;
  }

  public static async getUnresolvedAlarmCount(
    rule: RuleModel,
    metricsKey: string
  ): Promise<() => PrismaPromise<number>> {
    const { ruleId } = rule;
    return () =>
      prisma.alarmModel.count({
        where: { ruleId, metricsKey, resolvedAt: null },
      });
  }

  public static async resolveAlarmByAutoResolve(
    rule: RuleModel
  ): Promise<void> {
    const { ruleId, autoResolve } = rule;
    if (autoResolve === null) return;
    const createdAt = dayjs().subtract(autoResolve, 's').toDate();
    await prisma.alarmModel.updateMany({
      data: { resolvedAt: new Date() },
      where: {
        ruleId,
        resolvedAt: null,
        createdAt: { lte: createdAt },
      },
    });
  }

  public static async modifyAlarm(
    alarm: AlarmModel,
    props: { resolvedAt?: Date }
  ): Promise<() => Prisma.Prisma__AlarmModelClient<AlarmModel>> {
    const { alarmId } = alarm;
    const { resolvedAt } = await Joi.object({
      resolvedAt: Joi.date().allow(null).optional(),
    }).validateAsync(props);

    return () =>
      prisma.alarmModel.update({
        where: { alarmId },
        data: { resolvedAt },
      });
  }

  public static async getAlarm(
    monitor: MonitorModel,
    alarmId: string
  ): Promise<() => Prisma.Prisma__AlarmModelClient<AlarmModel | null>> {
    const { monitorId } = monitor;
    return () => prisma.alarmModel.findFirst({ where: { monitorId, alarmId } });
  }

  public static async getAlarmOrThrow(
    monitor: MonitorModel,
    alarmId: string
  ): Promise<AlarmModel> {
    const alarm = await $$$(Alarm.getAlarm(monitor, alarmId));
    if (!alarm) throw RESULT.CANNOT_FIND_ALARM();
    return alarm;
  }

  public static async getAlarms(
    monitor: MonitorModel,
    props: {
      take?: number;
      skip?: number;
      ruleId?: string;
      metricsKey?: string;
      showResolved?: boolean;
      orderByField?: 'ruleName' | 'createdAt' | 'updatedAt';
      orderBySort?: 'asc' | 'desc';
      search?: string;
    }
  ): Promise<{ total: number; alarms: AlarmModel[] }> {
    const { monitorId } = monitor;
    const where: Prisma.AlarmModelWhereInput = { monitorId };
    const {
      take,
      skip,
      ruleId,
      metricsKey,
      showResolved,
      orderByField,
      orderBySort,
      search,
    } = await Joi.object({
      take: Joi.number().default(10).optional(),
      skip: Joi.number().default(0).optional(),
      ruleId: Joi.string().uuid().optional(),
      metricsKey: Joi.string().optional(),
      showResolved: Joi.boolean().default(false).optional(),
      orderByField: Joi.string()
        .valid('ruleName', 'createdAt', 'updatedAt')
        .default('createdAt')
        .optional(),
      orderBySort: Joi.string().valid('asc', 'desc').default('desc').optional(),
      search: Joi.string().allow(null).allow('').optional(),
    }).validateAsync(props);
    if (search) where.ruleId = { contains: search };
    if (ruleId) where.ruleId = ruleId;
    if (metricsKey) where.metricsKey = metricsKey;
    if (!showResolved) where.resolvedAt = null;
    const orderBy = { [orderByField]: orderBySort };
    const [total, alarms] = await prisma.$transaction([
      prisma.alarmModel.count({ where }),
      prisma.alarmModel.findMany({ where, take, skip, orderBy }),
    ]);

    return { total, alarms };
  }

  public static async getLatestAlarmFromRule(props: {
    monitor: MonitorModel;
    rule: RuleModel;
    metricsKey?: string;
  }): Promise<AlarmModel | null> {
    const { monitor, rule, metricsKey } = props;
    const { ruleId } = rule;
    const { alarms } = await Alarm.getAlarms(monitor, {
      ruleId,
      metricsKey,
      take: 1,
      orderByField: 'createdAt',
      orderBySort: 'desc',
    });

    if (alarms.length <= 0) return null;
    return alarms[0];
  }

  public static async deleteAlarm(
    alarm: AlarmModel
  ): Promise<() => Prisma.Prisma__AlarmModelClient<AlarmModel>> {
    const { alarmId } = alarm;
    return () => prisma.alarmModel.delete({ where: { alarmId } });
  }
}
