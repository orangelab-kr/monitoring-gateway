import { AlarmModel, MonitorModel, Prisma, RuleModel } from '@prisma/client';
import { Joi, prisma } from '..';

export class Alarm {
  public static async createAlarm(
    rule: RuleModel
  ): Promise<() => Prisma.Prisma__AlarmModelClient<AlarmModel>> {
    const { ruleId, monitorId } = rule;
    return () => prisma.alarmModel.create({ data: { ruleId, monitorId } });
  }

  public static async getAlarms(
    monitor: MonitorModel,
    props: {
      take?: number;
      skip?: number;
      ruleId?: string;
      orderByField?: 'ruleName' | 'createdAt' | 'updatedAt';
      orderBySort?: 'asc' | 'desc';
      search?: string;
    }
  ): Promise<{ total: number; alarms: AlarmModel[] }> {
    const { monitorId } = monitor;
    const where: Prisma.AlarmModelWhereInput = { monitorId };
    const { take, skip, ruleId, orderByField, orderBySort, search } =
      await Joi.object({
        take: Joi.number().default(10).optional(),
        skip: Joi.number().default(0).optional(),
        ruleId: Joi.string().uuid().optional(),
        orderByField: Joi.string()
          .valid('ruleName', 'createdAt', 'updatedAt')
          .default('createdAt')
          .optional(),
        orderBySort: Joi.string()
          .valid('asc', 'desc')
          .default('desc')
          .optional(),
        search: Joi.string().allow(null).allow('').optional(),
      }).validateAsync(props);
    if (search) where.ruleId = { contains: ruleId };
    if (ruleId) where.ruleId = ruleId;
    const orderBy = { [orderByField]: orderBySort };
    const [total, alarms] = await prisma.$transaction([
      prisma.alarmModel.count({ where }),
      prisma.alarmModel.findMany({ where, take, skip, orderBy }),
    ]);

    return { total, alarms };
  }

  public static async getLatestAlarmFromRule(
    monitor: MonitorModel,
    rule: RuleModel
  ): Promise<AlarmModel | null> {
    const { ruleId } = rule;
    const { alarms } = await Alarm.getAlarms(monitor, {
      ruleId,
      take: 1,
      orderByField: 'createdAt',
      orderBySort: 'desc',
    });

    if (alarms.length <= 0) return null;
    return alarms[0];
  }
}
