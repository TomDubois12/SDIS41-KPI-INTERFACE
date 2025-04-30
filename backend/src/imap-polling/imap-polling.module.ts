import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ImapPollingService } from './imap-polling.service';

@Module({
  imports: [
    ConfigModule,
  ],
  providers: [ImapPollingService],
  exports: [],
})
export class ImapPollingModule { }