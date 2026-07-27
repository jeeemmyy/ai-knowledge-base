import { Global, Module } from '@nestjs/common';
import { EmailService } from './email.service';

/** Global so account + admin flows can send email without re-importing. */
@Global()
@Module({
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
