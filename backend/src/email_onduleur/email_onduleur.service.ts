// src/email_onduleur/email_onduleur.service.ts
import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationService } from '../notifications/notifications.service';
// Importer l'événement générique et le payload
import { ImapEmailPayload, EMAIL_RECEIVED_EVENT } from '../imap-polling/imap-polling.service';

@Injectable()
export class EmailOnduleurService {
    private readonly logger = new Logger(EmailOnduleurService.name);
    private processedOnduleurEmails: any[] = []; // Historique mémoire
    // Réintroduire le Set pour gérer les notifications uniques par session
    private notifiedEmailIds: Set<string> = new Set();
    private readonly MAX_HISTORY_SIZE = 100; // Ajustable
    // Critères de filtrage
    private readonly adresseEmailSources = [
         'nicolas.bellier@sdis41.fr',
         'onduleur.alerte@sdis41.fr',
         'onduleur.administratif@sdis41.fr',
     ];
    private readonly sujetEmailSource = 'UPS event notification';

    constructor(
        @Inject(forwardRef(() => NotificationService))
        private readonly notificationService: NotificationService,
    ) {
         this.logger.log('EmailOnduleurService initialisé, écoute de ' + EMAIL_RECEIVED_EVENT);
    }

    // Écouter l'événement générique
    @OnEvent(EMAIL_RECEIVED_EVENT, { async: true })
    async handleEmailReceived(payload: ImapEmailPayload) {
        const { seqno, parsed, messageId } = payload;
        this.logger.debug(`[Onduleur] Événement ${EMAIL_RECEIVED_EVENT} reçu pour #${seqno} (ID: ${messageId})`);

        // 1. Filtrer : Est-ce un email Onduleur ?
        const senderAddress = parsed.from?.value?.[0]?.address?.toLowerCase();
        const subjectMatch = parsed.subject === this.sujetEmailSource;
        if (!subjectMatch || !senderAddress || !this.adresseEmailSources.includes(senderAddress)) {
            this.logger.debug(`[Onduleur] Email #${seqno} ignoré (critères sujet/expéditeur non remplis).`);
            return; // Ignorer
        }

        this.logger.log(`[Onduleur] Email correspondant trouvé #${seqno}. Traitement...`);

        // 2. Extraire les données spécifiques Onduleur (Corps Complet)
        const content = parsed.text || '';
        const type = content.includes('administratif') ? 'Administratif' : 'Alerte';
        const messageMatch = content.match(/Message\s*:\s*(.+?)\n\n/s);
        const eventMatch = content.match(/Event List\s*:\s*(.+?)\n/s);
        const timestampMatch = content.match(/Timestamp\s*:\s*(.+?)$/m);
        const emailData: any = {
            id: messageId, // Utiliser messageId
            originalSeqno: seqno,
            from: parsed.from?.text,
            subject: parsed.subject,
            date: parsed.date,
            type,
            message: messageMatch?.[1]?.trim() ?? '',
            event: eventMatch?.[1]?.trim() ?? '',
            timestamp: timestampMatch?.[1]?.trim() ?? '',
         };

        // 3. Mettre à jour l'historique en mémoire (TOUJOURS)
        const existingIndex = this.processedOnduleurEmails.findIndex(e => e.id === messageId);
        if (existingIndex > -1) {
            // Remplacer l'entrée existante
            this.processedOnduleurEmails[existingIndex] = emailData;
            this.logger.debug(`[Onduleur] Email ID: ${messageId} mis à jour dans l'historique.`);
        } else {
            // Ajouter au début si nouveau
            this.processedOnduleurEmails.unshift(emailData);
            this.logger.debug(`[Onduleur] Email ID: ${messageId} ajouté à l'historique.`);
            // Limiter la taille
            if (this.processedOnduleurEmails.length > this.MAX_HISTORY_SIZE) {
                 this.processedOnduleurEmails.length = this.MAX_HISTORY_SIZE;
            }
        }
        this.logger.debug(`[Onduleur] Historique mis à jour pour ID: ${messageId}. Taille: ${this.processedOnduleurEmails.length}`);

        // 4. Vérifier si DÉJÀ NOTIFIÉ cette session
        if (!messageId || typeof messageId !== 'string' || messageId.startsWith('seqno-')) {
             this.logger.warn(`[Onduleur] Message-ID invalide pour #${seqno}. Notification ignorée.`);
             return;
        }
        if (this.notifiedEmailIds.has(messageId)) {
             this.logger.log(`[Onduleur] Email ID: ${messageId} déjà notifié cette session. Ignoré pour notif.`);
             return; // Ne pas notifier à nouveau
        }

        // 5. Notifier (car nouveau pour notification CETTE SESSION) et Mémoriser l'ID notifié
        this.notifiedEmailIds.add(messageId); // Marquer comme notifié
        this.logger.log(`[ONDULEUR NOTIFICATION] ID: ${messageId} marqué comme notifié pour cette session. Envoi...`);
        const notificationPayload = JSON.stringify({
            title: `Alerte Onduleur (${type})`,
            body: `Événement: ${emailData.event || 'N/A'}\nMessage: ${emailData.message?.substring(0, 50) || 'N/A'}...`,
            data: { emailType: 'Onduleur', id: messageId }
        });
         try {
             const subscriptions = await this.notificationService.getEmailSubscribers(); // Abonnés EMAIL
             if (subscriptions && subscriptions.length > 0) {
                 this.logger.log(`[Onduleur Notification] Envoi à ${subscriptions.length} abonnés.`);
                 // Envoyer en parallèle
                 Promise.allSettled( subscriptions.map(sub => this.notificationService.sendPushNotification(sub, notificationPayload)) )
                     .then(results => {
                         const fulfilled = results.filter(r => r.status === 'fulfilled' && r.value).length;
                         this.logger.log(`[Onduleur Notification] Envoi terminé pour ID: ${messageId}. Succès: ${fulfilled}/${results.length}`);
                     });
             } else { this.logger.log(`[Onduleur Notification] Aucun abonné trouvé pour les emails.`); }
         } catch (notificationError) { this.logger.error(`[Onduleur Notification] Erreur envoi pour ID: ${messageId}:`, notificationError); }

    } // Fin handleEmailReceived

    // Retourne l'historique mémoire actuel
    getEmails(): any[] {
        // Le tri est implicite par unshift
        return this.processedOnduleurEmails;
    }

} // Fin classe EmailOnduleurService