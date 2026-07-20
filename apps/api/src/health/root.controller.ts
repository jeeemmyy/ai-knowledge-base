import { Controller, Get } from '@nestjs/common';

/** Friendly landing response so GET / doesn't read as a broken deployment. */
@Controller()
export class RootController {
  @Get()
  root() {
    return {
      service: 'docbrain-api',
      status: 'ok',
      health: '/health',
      docs: 'https://github.com/jeeemmyy/ai-knowledge-base/blob/main/docs/api-guide.md',
    };
  }
}
