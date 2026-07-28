import { Global, Module } from '@nestjs/common';
import { LimitsService } from './limits.service';

/** Global so Documents, Chat, and Account can enforce/read per-user limits. */
@Global()
@Module({
  providers: [LimitsService],
  exports: [LimitsService],
})
export class LimitsModule {}
