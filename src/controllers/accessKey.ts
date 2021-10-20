import { AccessKeyModel, MonitorModel, Prisma } from '@prisma/client';
import { $$$, Joi, prisma, RESULT } from '..';

export class AccessKey {
  public static async createAccessKey(
    monitor: MonitorModel,
    props: { accessKeyName: string; description?: string }
  ): Promise<() => Prisma.Prisma__AccessKeyModelClient<AccessKeyModel>> {
    const { monitorId } = monitor;
    const { accessKeyName, description } = await Joi.object({
      accessKeyName: Joi.string().min(2).max(32).required(),
      description: Joi.string().allow('').allow(null).optional(),
    }).validateAsync(props);

    return () =>
      prisma.accessKeyModel.create({
        data: { accessKeyName, description, monitorId },
      });
  }

  public static async modifyAccessKey(
    accessKey: AccessKeyModel,
    props: { accessKeyName?: string; description?: string }
  ): Promise<() => Prisma.Prisma__AccessKeyModelClient<AccessKeyModel>> {
    const { accessKeyId } = accessKey;
    const { accessKeyName, description } = await Joi.object({
      accessKeyName: Joi.string().min(2).max(32).optional(),
      description: Joi.string().allow('').allow(null).optional(),
    }).validateAsync(props);

    return () =>
      prisma.accessKeyModel.update({
        where: { accessKeyId },
        data: { accessKeyName, description },
      });
  }

  public static async getAccessKeys(
    monitor: MonitorModel,
    props: {
      take?: number;
      skip?: number;
      orderByField?: 'accessKeyId' | 'name' | 'createdAt' | 'updatedAt';
      orderBySort?: 'asc' | 'desc';
      search?: string;
    }
  ): Promise<{ total: number; accessKeys: AccessKeyModel[] }> {
    const { monitorId } = monitor;
    const where: Prisma.AccessKeyModelWhereInput = { monitorId };
    const { take, skip, orderByField, orderBySort, search } = await Joi.object({
      take: Joi.number().default(10).optional(),
      skip: Joi.number().default(0).optional(),
      ruleId: Joi.string().uuid().optional(),
      metricsKey: Joi.string().optional(),
      orderByField: Joi.string()
        .valid('accessKeyId', 'name', 'createdAt', 'updatedAt')
        .default('createdAt')
        .optional(),
      orderBySort: Joi.string().valid('asc', 'desc').default('desc').optional(),
      search: Joi.string().allow(null).allow('').optional(),
    }).validateAsync(props);
    if (search) {
      where.OR = [
        { accessKeyId: { contains: search } },
        { accessKeyName: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const orderBy = { [orderByField]: orderBySort };
    const [total, accessKeys] = await prisma.$transaction([
      prisma.accessKeyModel.count({ where }),
      prisma.accessKeyModel.findMany({ where, take, skip, orderBy }),
    ]);

    return { total, accessKeys };
  }

  public static async getAccessKey(
    monitor: MonitorModel,
    accessKeyId: string
  ): Promise<() => Prisma.Prisma__AccessKeyModelClient<AccessKeyModel | null>> {
    const { monitorId } = monitor;
    return () =>
      prisma.accessKeyModel.findFirst({ where: { monitorId, accessKeyId } });
  }

  public static async getAccessKeyOrThrow(
    monitor: MonitorModel,
    accessKeyId: string
  ): Promise<AccessKeyModel> {
    const accessKey = await $$$(AccessKey.getAccessKey(monitor, accessKeyId));
    if (!accessKey) throw RESULT.CANNOT_FIND_MONITOR();
    return accessKey;
  }

  public static async deleteAccessKey(
    accessKey: AccessKeyModel
  ): Promise<() => Prisma.Prisma__AccessKeyModelClient<AccessKeyModel>> {
    const { accessKeyId } = accessKey;
    return () => prisma.accessKeyModel.delete({ where: { accessKeyId } });
  }
}
