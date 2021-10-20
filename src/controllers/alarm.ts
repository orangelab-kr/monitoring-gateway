import {
  AlarmModel,
  MetricsModel,
  MonitorModel,
  Prisma,
  RuleModel,
} from '@prisma/client';
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

    await Action.executeActions({ alarm, rule, metrics });
    return alarm;
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
      orderByField,
      orderBySort,
      search,
    } = await Joi.object({
      take: Joi.number().default(10).optional(),
      skip: Joi.number().default(0).optional(),
      ruleId: Joi.string().uuid().optional(),
      metricsKey: Joi.string().optional(),
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
}
