import {
  ActionModel,
  AlarmModel,
  MetricsModel,
  MonitorModel,
  RuleModel,
} from '@prisma/client';
import 'express';

declare global {
  namespace Express {
    interface Request {
      internal: {
        sub: string;
        iss: string;
        aud: string;
        prs: boolean[];
        iat: Date;
        exp: Date;
        monitor: MonitorModel;
        alarm: AlarmModel;
        metrics: MetricsModel;
        rule: RuleModel;
        action: ActionModel;
      };
    }
  }
}
