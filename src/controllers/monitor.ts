import { AccessKeyModel, MonitorModel, Prisma } from '@prisma/client';
import { $$$, Joi, prisma, RESULT } from '..';

export class Monitor {
  public static async createMonitor(props: {
    monitorId: string;
    monitorName: string;
    description?: string;
    ttl?: number;
  }): Promise<() => Prisma.Prisma__MonitorModelClient<MonitorModel>> {
    const { monitorId, monitorName, description, ttl } = await Joi.object({
      monitorId: Joi.string().alphanum().min(2).max(32).required(),
      monitorName: Joi.string().min(2).max(32).required(),
      description: Joi.string().min(2).max(64).optional(),
      ttl: Joi.number().allow(null).optional(),
    }).validateAsync(props);
    const monitor = await $$$(Monitor.getMonitor(monitorId));
    if (monitor) throw RESULT.ALREADY_EXISTS_MONITOR_NAME();
    return () =>
      prisma.monitorModel.create({
        data: { monitorId, monitorName, description, ttl },
      });
  }

  public static async modifyMonitor(
    monitor: MonitorModel,
    props: {
      monitorId: string;
      monitorName: string;
      description?: string;
      ttl?: number;
    }
  ): Promise<() => Prisma.Prisma__MonitorModelClient<MonitorModel>> {
    const { monitorId, monitorName, description, ttl } = await Joi.object({
      monitorId: Joi.string().alphanum().min(2).max(32).optional(),
      monitorName: Joi.string().min(2).max(32).optional(),
      description: Joi.string().allow('').allow(null).optional(),
      ttl: Joi.number().allow(null).optional(),
    }).validateAsync(props);
    if (monitorId !== monitor.monitorId) {
      const monitor = await $$$(Monitor.getMonitor(monitorId));
      if (monitor) throw RESULT.ALREADY_EXISTS_MONITOR_NAME();
    }

    return () =>
      prisma.monitorModel.update({
        where: { monitorId: monitor.monitorId },
        data: { monitorId, monitorName, description, ttl },
      });
  }

  public static async getMonitors(
    props: {
      take?: number;
      skip?: number;
      orderByField?: 'monitorId' | 'monitorName' | 'createdAt' | 'updatedAt';
      orderBySort?: 'asc' | 'desc';
      search?: string;
    },
    accessKey?: AccessKeyModel
  ): Promise<{ total: number; monitors: MonitorModel[] }> {
    const where: Prisma.MonitorModelWhereInput = {};
    const { take, skip, orderByField, orderBySort, search } = await Joi.object({
      take: Joi.number().default(10).optional(),
      skip: Joi.number().default(0).optional(),
      orderByField: Joi.string()
        .valid('monitorId', 'monitorName', 'createdAt', 'updatedAt')
        .default('createdAt')
        .optional(),
      orderBySort: Joi.string().valid('asc', 'desc').default('desc').optional(),
      search: Joi.string().allow(null).allow('').optional(),
    }).validateAsync(props);
    if (search) {
      where.OR = [
        { monitorId: { contains: search } },
        { monitorName: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (accessKey) {
      const { accessKeyId } = accessKey;
      where.accessKeys = { some: { accessKeyId } };
    }

    const orderBy = { [orderByField]: orderBySort };
    const [total, monitors] = await prisma.$transaction([
      prisma.monitorModel.count({ where }),
      prisma.monitorModel.findMany({ where, take, skip, orderBy }),
    ]);

    return { total, monitors };
  }

  public static async getMonitor(
    monitorId: string,
    accessKeyId?: string
  ): Promise<() => Prisma.Prisma__MonitorModelClient<MonitorModel | null>> {
    const some = { accessKeyId };
    return () =>
      prisma.monitorModel.findFirst({
        where: {
          monitorId,
          accessKeys: { some },
        },
      });
  }

  public static async getMonitorOrThrow(
    monitorId: string,
    accessKeyId?: string
  ): Promise<MonitorModel> {
    const monitor = await $$$(Monitor.getMonitor(monitorId));
    if (!monitor) throw RESULT.CANNOT_FIND_MONITOR();
    return monitor;
  }

  public static async deleteMonitor(
    monitor: MonitorModel
  ): Promise<() => Prisma.Prisma__MonitorModelClient<MonitorModel>> {
    const { monitorId } = monitor;
    return () => prisma.monitorModel.delete({ where: { monitorId } });
  }
}
