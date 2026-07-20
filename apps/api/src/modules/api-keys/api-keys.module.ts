import { Global, Module } from '@nestjs/common';
import { ApiKeysController } from './api-keys.controller';
import { ApiKeysService } from './api-keys.service';
import { ApiKeysRepository } from './api-keys.repository';
import { AuthModule } from '../auth/auth.module';

/**
 * Global so SupabaseAuthGuard (provided by AuthModule and used across feature
 * modules) can resolve ApiKeysService without every module importing this one.
 */
@Global()
@Module({
  imports: [AuthModule],
  controllers: [ApiKeysController],
  providers: [ApiKeysService, ApiKeysRepository],
  exports: [ApiKeysService],
})
export class ApiKeysModule {}
