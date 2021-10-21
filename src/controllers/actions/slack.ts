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

  public async executeAction(props: ActionExecuteInput): Promise<void> {
    const payload = await this.getRenderedPayload(props);
    const { url, args } = await Joi.object({
      url: Joi.string().required(),
      args: Joi.any().required(),
    }).validateAsync(payload);

    await new IncomingWebhook(url).send(args);
  }

  private async getRenderedPayload(scope: any): Promise<SlackActionPayload> {
    const rawPayload = JSON.stringify(this.payload);
    const renderedPayload = await this.liquid.parseAndRender(rawPayload, scope);
    return <SlackActionPayload>JSON.parse(JSON.parse(renderedPayload));
  }
}
