// src/imap-polling/imap-polling.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // Importer ConfigModule si on utilise ConfigService
import { ImapPollingService } from './imap-polling.service';
// Pas besoin d'importer EventEmitterModule ici, fait dans AppModule

@Module({
  imports: [
      ConfigModule, // Importer pour que ConfigService soit injectable dans ImapPollingService (même si pas utilisé pour les credentials pour l'instant)
    ],
  providers: [ImapPollingService],
  exports: [], // Pas besoin d'exporter le service pour l'instant
})
export class ImapPollingModule {}