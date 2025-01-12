import cors from 'cors';
import express from 'express';
import i18n from 'i18n';
import {
  getRouter,
  logger,
  LoggerMiddleware,
  prisma,
  registerSentry,
  RESULT,
  Wrapper,
} from '.';

export * from './controllers';
export * from './middlewares';
export * from './routes';
export * from './tools';

async function main() {
  logger.info('System / 시스템을 활성화하고 있습니다.');
  const app = express();
  registerSentry(app);

  if (process.env.NODE_ENV === 'dev') {
    const { PrismaStudioMiddleware } = await import('express-prisma-studio');
    app.use('/prisma', PrismaStudioMiddleware(prisma));
  }

  app.use(cors());
  app.use(i18n.init);
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(LoggerMiddleware());
  app.use('/v1/monitoring', getRouter());
  app.all(
    '*',
    Wrapper(async () => {
      throw RESULT.INVALID_API();
    })
  );

  app.listen(process.env.WEB_PORT, () => {
    logger.info('System / 시스템이 준비되었습니다.');
  });
}

main();
