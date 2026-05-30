import { Controller, Get } from '@nestjs/common';
import { SupabaseService } from '../common/supabase/supabase.service';

@Controller('health')
export class HealthController {
  constructor(private readonly supabase: SupabaseService) {}

  @Get()
  async check() {
    let db = 'ok';
    try {
      // Cheap round-trip to confirm the DB/PostgREST is reachable.
      const { error } = await this.supabase.admin.from('documents').select('id').limit(1);
      if (error) db = `error: ${error.message}`;
    } catch (err) {
      db = `error: ${(err as Error).message}`;
    }
    return {
      status: db === 'ok' ? 'ok' : 'degraded',
      service: 'ai-knowledge-base-api',
      db,
      timestamp: new Date().toISOString(),
    };
  }
}
