import {
  MetricsModel,
  MonitorModel,
  Prisma,
  PrismaPromise,
} from '@prisma/client';
import dayjs from 'dayjs';
import { $$$, Joi, prisma, RESULT, Rule } from '..';

export class Metrics {
  public static async deleteMetricsOverTTL(
    monitor: MonitorModel
  ): Promise<() => PrismaPromise<Prisma.BatchPayload>> {
    let createdAt: Prisma.DateTimeFilter | Date = new Date();
    const { monitorId, ttl } = monitor;
    if (ttl !== null) createdAt = { lte: dayjs().subtract(ttl, 's').toDate() };
    return () =>
      prisma.metricsModel.deleteMany({ where: { monitorId, createdAt } });
  }

  public static async createMetricsWithMonitoring(
    monitor: MonitorModel,
    metricsData?: any
  ): Promise<MetricsModel> {
    const [metrics] = await $$$([
      Metrics.createMetrics(monitor, metricsData),
      Metrics.deleteMetricsOverTTL(monitor),
    ]);

    await Rule.executeRules(monitor, metrics);
    return metrics;
  }

  private static async createMetrics(
    monitor: MonitorModel,
    metricsData?: any
  ): Promise<() => Prisma.Prisma__MetricsModelClient<MetricsModel>> {
    const { monitorId } = monitor;
    return () =>
      prisma.metricsModel.create({ data: { monitorId, metricsData } });
  }

  public static async modifyMetrics(
    metrics: MetricsModel,
    metricsData?: any
  ): Promise<() => Prisma.Prisma__MetricsModelClient<MetricsModel>> {
    const { metricsId } = metrics;
    return () =>
      prisma.metricsModel.update({
        where: { metricsId },
        data: { metricsData },
      });
  }

  public static async getManyMetrics(
    monitor: MonitorModel,
    props: {
      take?: number;
      skip?: number;
      orderByField?: 'metricsId' | 'createdAt' | 'updatedAt';
      orderBySort?: 'asc' | 'desc';
      search?: string;
    }
  ): Promise<{ total: number; metrics: MetricsModel[] }> {
    const { monitorId } = monitor;
    const where: Prisma.MetricsModelWhereInput = { monitorId };
    const { take, skip, orderByField, orderBySort } = await Joi.object({
      take: Joi.number().default(10).optional(),
      skip: Joi.number().default(0).optional(),
      orderByField: Joi.string()
        .valid('metricsId', 'createdAt', 'updatedAt')
        .default('createdAt')
        .optional(),
      orderBySort: Joi.string().valid('asc', 'desc').default('desc').optional(),
      search: Joi.string().allow(null).allow('').optional(),
    }).validateAsync(props);
    const orderBy = { [orderByField]: orderBySort };
    const [total, metrics] = await prisma.$transaction([
      prisma.metricsModel.count({ where }),
      prisma.metricsModel.findMany({ where, take, skip, orderBy }),
    ]);

    return { total, metrics };
  }

  public static async getMetrics(
    monitor: MonitorModel,
    metricsId: string
  ): Promise<() => Prisma.Prisma__MetricsModelClient<MetricsModel | null>> {
    const { monitorId } = monitor;
    return () =>
      prisma.metricsModel.findFirst({ where: { metricsId, monitorId } });
  }

  public static async getMetricsOrThrow(
    monitor: MonitorModel,
    metricsId: string
  ): Promise<MetricsModel> {
    const metrics = await $$$(Metrics.getMetrics(monitor, metricsId));
    if (!metrics) throw RESULT.CANNOT_FIND_METRICS();
    return metrics;
  }

  public static async deleteMetrics(
    metrics: MetricsModel
  ): Promise<() => Prisma.Prisma__MetricsModelClient<MetricsModel>> {
    const { metricsId } = metrics;
    return () => prisma.metricsModel.delete({ where: { metricsId } });
  }
}
