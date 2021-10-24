import { AccessKeyModel, Prisma } from '@prisma/client';
import { $$$, Joi, prisma, RESULT } from '..';

export class AccessKey {
  public static defaultInclude: Prisma.AccessKeyModelInclude = {
    monitors: true,
  };

  public static async createAccessKey(props: {
    accessKeyName: string;
    description?: string;
    monitorIds?: string[];
  }): Promise<() => Prisma.Prisma__AccessKeyModelClient<AccessKeyModel>> {
    const { accessKeyName, description, monitorIds } = await Joi.object({
      accessKeyName: Joi.string().min(2).max(32).required(),
      description: Joi.string().allow('').allow(null).optional(),
      monitorIds: Joi.array().items(Joi.string().uuid()).default([]).optional(),
    }).validateAsync(props);
    const connect = monitorIds.map((monitorId: string) => ({ monitorId }));

    return () =>
      prisma.accessKeyModel.create({
        data: { accessKeyName, description, monitors: { connect } },
        include: AccessKey.defaultInclude,
      });
  }

  public static async modifyAccessKey(
    accessKey: AccessKeyModel,
    props: {
      accessKeyName?: string;
      description?: string;
      monitorIds?: string[];
    }
  ): Promise<() => Prisma.Prisma__AccessKeyModelClient<AccessKeyModel>> {
    const { accessKeyId } = accessKey;
    const { accessKeyName, description, monitorIds } = await Joi.object({
      accessKeyName: Joi.string().min(2).max(32).optional(),
      description: Joi.string().allow('').allow(null).optional(),
      monitorIds: Joi.array().items(Joi.string().uuid()).optional(),
    }).validateAsync(props);
    const set = monitorIds.map((monitorId: string) => ({ monitorId }));

    return () =>
      prisma.accessKeyModel.update({
        where: { accessKeyId },
        data: { accessKeyName, description, monitors: { set } },
        include: AccessKey.defaultInclude,
      });
  }

  public static async getAccessKeys(props: {
    take?: number;
    skip?: number;
    orderByField?: 'accessKeyId' | 'name' | 'createdAt' | 'updatedAt';
    orderBySort?: 'asc' | 'desc';
    monitorId?: string;
    search?: string;
  }): Promise<{ total: number; accessKeys: AccessKeyModel[] }> {
    const where: Prisma.AccessKeyModelWhereInput = {};
    const { take, skip, orderByField, orderBySort, monitorId, search } =
      await Joi.object({
        take: Joi.number().default(10).optional(),
        skip: Joi.number().default(0).optional(),
        ruleId: Joi.string().uuid().optional(),
        metricsKey: Joi.string().optional(),
        orderByField: Joi.string()
          .valid('accessKeyId', 'name', 'createdAt', 'updatedAt')
          .default('createdAt')
          .optional(),
        orderBySort: Joi.string()
          .valid('asc', 'desc')
          .default('desc')
          .optional(),
        monitorId: Joi.string().uuid().optional(),
        search: Joi.string().allow(null).allow('').optional(),
      }).validateAsync(props);
    if (search) {
      where.OR = [
        { accessKeyId: { contains: search } },
        { accessKeyName: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (monitorId) where.monitors = { some: { monitorId } };
    const orderBy = { [orderByField]: orderBySort };
    const include = AccessKey.defaultInclude;
    const [total, accessKeys] = await prisma.$transaction([
      prisma.accessKeyModel.count({ where }),
      prisma.accessKeyModel.findMany({ where, take, skip, orderBy, include }),
    ]);

    return { total, accessKeys };
  }

  public static async getAccessKey(
    accessKeyId: string
  ): Promise<() => Prisma.Prisma__AccessKeyModelClient<AccessKeyModel | null>> {
    return () =>
      prisma.accessKeyModel.findFirst({
        where: { accessKeyId },
        include: AccessKey.defaultInclude,
      });
  }

  public static async getAccessKeyOrThrow(
    accessKeyId: string
  ): Promise<AccessKeyModel> {
    const accessKey = await $$$(AccessKey.getAccessKey(accessKeyId));
    if (!accessKey) throw RESULT.CANNOT_FIND_MONITOR();
    return accessKey;
  }

  public static async deleteAccessKey(
    accessKey: AccessKeyModel
  ): Promise<() => Prisma.Prisma__AccessKeyModelClient<AccessKeyModel>> {
    const { accessKeyId } = accessKey;
    return () =>
      prisma.accessKeyModel.delete({
        where: { accessKeyId },
        include: AccessKey.defaultInclude,
      });
  }
}
