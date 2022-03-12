import { IncomingWebhook, IncomingWebhookSendArguments } from '@slack/webhook';
import { Liquid } from 'liquidjs';
import { ActionExecuteInput, ActionInterface } from '.';
import { Joi } from '../../tools';

export interface SlackWithTemplateActionPayload {
  url: string;
  message: string; // Short message
  header?: string; // Header message (default: message)
  description?: string; // Description
  fields: { label: string; contents: string }[]; // Fields
  image?: string;
}

export class SlackWithTemplateAction implements ActionInterface {
  private liquid = new Liquid();

  constructor(private payload: string) {}

  public async executeAction(props: ActionExecuteInput): Promise<void> {
    const payload = await this.getRenderedPayload(props);
    const template = await Joi.object({
      url: Joi.string().required(),
      message: Joi.string().required(),
      header: Joi.string().default(Joi.ref('message')).optional(),
      description: Joi.string().optional(),
      image: Joi.string().uri().optional(),
      fields: Joi.array()
        .default([])
        .optional()
        .items(
          Joi.object({
            label: Joi.string().required(),
            contents: Joi.string().required(),
          })
        ),
    }).validateAsync(payload);
    const args = this.generateMessage(template);
    await new IncomingWebhook(template.url).send(args);
  }

  private generateMessage(
    props: SlackWithTemplateActionPayload
  ): IncomingWebhookSendArguments {
    const args: IncomingWebhookSendArguments = {
      text: props.message,
      blocks: [],
    };

    // Header
    args.blocks!.push({
      type: 'header',
      text: {
        type: 'plain_text',
        text: props.header || props.message,
        emoji: true,
      },
    });

    // Description
    if (props.description) {
      args.blocks!.push({
        type: 'section',
        text: { type: 'mrkdwn', text: props.description },
      });
    }

    // Divider
    args.blocks!.push({ type: 'divider' });

    // Fields
    if (props.fields) {
      args.blocks!.push({
        type: 'section',
        fields: props.fields.map(({ label, contents }) => ({
          type: 'mrkdwn',
          text: `*${label}*\n${contents}`,
        })),
      });

      // Divider
      args.blocks!.push({ type: 'divider' });
    }

    // Image
    if (props.image) {
      args.blocks!.push({
        type: 'image',
        image_url: props.image,
        alt_text: 'image',
      });
    }

    // Monitoring Gateway
    args.blocks!.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: 'HIKICK Coreservice Monitoring Gateway',
        },
      ],
    });

    console.log(args);
    return args;
  }

  private async getRenderedPayload(
    scope: any
  ): Promise<SlackWithTemplateActionPayload> {
    const { payload } = this;
    const renderedPayload = await this.liquid.parseAndRender(payload, scope);
    return <SlackWithTemplateActionPayload>JSON.parse(renderedPayload);
  }
}
