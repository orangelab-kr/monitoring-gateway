import { IncomingWebhook, IncomingWebhookSendArguments } from '@slack/webhook';
import { Liquid } from 'liquidjs';
import { ActionExecuteInput, ActionInterface } from '.';
import { Joi } from '../..';

export interface SlackActionPayload {
  url: string;
  args: string | IncomingWebhookSendArguments;
}

export class SlackAction implements ActionInterface {
  private liquid = new Liquid();

  constructor(private payload: SlackActionPayload) {}

  public async validatePayload(): Promise<void> {
    await Joi.object({
      url: Joi.string().required(),
      args: Joi.any().required(),
    }).validateAsync(this.payload);
  }

  public async executeAction(props: ActionExecuteInput): Promise<void> {
    const { url, args } = await this.getRenderedPayload(props);
    await new IncomingWebhook(url).send(args);
  }

  private async getRenderedPayload(scope: any): Promise<SlackActionPayload> {
    const rawPayload = JSON.stringify(this.payload);
    const renderedPayload = await this.liquid.parseAndRender(rawPayload, scope);
    return <SlackActionPayload>JSON.parse(renderedPayload);
  }
}