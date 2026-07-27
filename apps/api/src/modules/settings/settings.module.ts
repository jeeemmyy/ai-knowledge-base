import { Global, Module } from '@nestjs/common';
import { AppSettingsRepository } from './app-settings.repository';

/** Global so any module can read/write app_settings (e.g. the SendGrid key). */
@Global()
@Module({
  providers: [AppSettingsRepository],
  exports: [AppSettingsRepository],
})
export class SettingsModule {}
