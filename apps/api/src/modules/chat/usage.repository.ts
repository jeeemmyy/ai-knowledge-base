import { Injectable, Logger } from '@nestjs/common';
import type { TokenUsage } from '@repo/shared';
import { SupabaseService } from '../../common/supabase/supabase.service';

@Injectable()
export class UsageRepository {
  private readonly logger = new Logger(UsageRepository.name);
  constructor(private readonly supabase: SupabaseService) {}

  /** Best-effort usage logging — never block or fail the chat on a log error. */
  async log(params: {
    userId: string;
    conversationId: string | null;
    operation: 'chat' | 'embedding';
    model: string;
    usage?: TokenUsage;
  }): Promise<void> {
    try {
      await this.supabase.admin.from('usage_logs').insert({
        user_id: params.userId,
        conversation_id: params.conversationId,
        operation: params.operation,
        model: params.model,
        prompt_tokens: params.usage?.promptTokens ?? 0,
        completion_tokens: params.usage?.completionTokens ?? 0,
        total_tokens: params.usage?.totalTokens ?? 0,
      });
    } catch (err) {
      this.logger.warn(`usage log failed (non-fatal): ${(err as Error).message}`);
    }
  }
}
