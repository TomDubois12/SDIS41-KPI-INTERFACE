import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ImapPollingService } from './imap-polling.service';

/**
 * Module NestJS encapsulant la logique de récupération (polling) des emails via IMAP.
 * Ce module importe `ConfigModule` pour accéder à la configuration (ex: identifiants IMAP)
 * et fournit le service principal `ImapPollingService`.
 * Note : Ce module n'exporte aucun de ses fournisseurs par défaut.
 */
@Module({
    imports: [
        ConfigModule,
    ],
    providers: [ImapPollingService],
    exports: [],
})
export class ImapPollingModule {}