import axios, { Method } from 'axios';
import { Liquid } from 'liquidjs';
import { ActionExecuteInput, ActionInterface, Joi } from '../..';

export interface WebhookActionPayload {
  method: Method;
  url: string;
  data: any;
}

export class WebhookAction implements ActionInterface {
  private liquid = new Liquid();

  constructor(private payload: string) {}

  public async executeAction(props: ActionExecuteInput): Promise<void> {
    const payload = await this.getRenderedPayload(props);
    const { url, method, data } = await Joi.object({
      method: Joi.string().required(),
      url: Joi.string().required(),
      data: Joi.any().required(),
    }).validateAsync(payload);
    await axios({ url, method, data });
  }

  private async getRenderedPayload(scope: any): Promise<WebhookActionPayload> {
    const { payload } = this;
    const renderedPayload = await this.liquid.parseAndRender(payload, scope);
    return <WebhookActionPayload>JSON.parse(renderedPayload);
  }
}
