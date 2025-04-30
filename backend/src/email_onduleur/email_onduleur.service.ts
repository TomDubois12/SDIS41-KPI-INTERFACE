import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { NotificationService } from '../notifications/notifications.service';
import { ImapEmailPayload, EMAIL_RECEIVED_EVENT } from '../imap-polling/imap-polling.service';

/**
 * Service chargé du traitement spécifique des emails provenant des onduleurs.
 * Écoute les événements de réception d'email, filtre les emails pertinents
 * selon l'expéditeur et le sujet, extrait les détails de l'événement,
 * maintient un historique et envoie des notifications push pour les nouveaux événements.
 */
@Injectable()
export class EmailOnduleurService {
    private readonly logger = new Logger(EmailOnduleurService.name);
    private processedOnduleurEmails: any[] = [];
    private notifiedEmailIds: Set<string> = new Set();
    private readonly MAX_HISTORY_SIZE = 100;
    private readonly adresseEmailSources = [
        'nicolas.bellier@sdis41.fr', // a retirer plus tard
        'onduleur.alerte@sdis41.fr',
        'onduleur.administratif@sdis41.fr',
    ];
    private readonly sujetEmailSource = 'UPS event notification';

    /**
     * Injecte les dépendances nécessaires.
     * Gère une dépendance circulaire avec NotificationService via forwardRef.
     * @param notificationService Service utilisé pour envoyer les notifications push.
     */
    constructor(
        @Inject(forwardRef(() => NotificationService))
        private readonly notificationService: NotificationService,
    ) {
        this.logger.log('EmailOnduleurService initialisé, écoute de ' + EMAIL_RECEIVED_EVENT);
    }

    /**
     * Gère l'événement de réception d'un nouvel email (`EMAIL_RECEIVED_EVENT`).
     * Filtre les emails pour ne traiter que ceux provenant des adresses et avec le sujet configurés pour les onduleurs.
     * Extrait les informations clés (type, message, événement, timestamp) du corps de l'email.
     * Ajoute ou met à jour l'email dans l'historique interne (`processedOnduleurEmails`).
     * Limite la taille de l'historique.
     * Envoie une notification push via NotificationService si l'email est nouveau pour la session actuelle.
     * @param payload Données de l'email reçu, incluant l'objet parsé et l'ID du message.
     */
    @OnEvent(EMAIL_RECEIVED_EVENT, { async: true })
    async handleEmailReceived(payload: ImapEmailPayload) {
        const { seqno, parsed, messageId } = payload;
        this.logger.debug(`[Onduleur] Événement ${EMAIL_RECEIVED_EVENT} reçu pour #${seqno} (ID: ${messageId})`);

        const senderAddress = parsed.from?.value?.[0]?.address?.toLowerCase();
        const subjectMatch = parsed.subject === this.sujetEmailSource;
        if (!subjectMatch || !senderAddress || !this.adresseEmailSources.includes(senderAddress)) {
            this.logger.debug(`[Onduleur] Email #${seqno} ignoré (critères sujet/expéditeur non remplis).`);
            return;
        }

        this.logger.log(`[Onduleur] Email correspondant trouvé #${seqno}. Traitement...`);

        const content = parsed.text || '';
        const type = content.includes('administratif') ? 'Administratif' : 'Alerte';
        const messageMatch = content.match(/Message\s*:\s*(.+?)\n\n/s);
        const eventMatch = content.match(/Event List\s*:\s*(.+?)\n/s);
        const timestampMatch = content.match(/Timestamp\s*:\s*(.+?)$/m);
        const emailData: any = {
            id: messageId,
            originalSeqno: seqno,
            from: parsed.from?.text,
            subject: parsed.subject,
            date: parsed.date,
            type,
            message: messageMatch?.[1]?.trim() ?? '',
            event: eventMatch?.[1]?.trim() ?? '',
            timestamp: timestampMatch?.[1]?.trim() ?? '',
        };

        const existingIndex = this.processedOnduleurEmails.findIndex(e => e.id === messageId);
        if (existingIndex > -1) {
            this.processedOnduleurEmails[existingIndex] = emailData;
            this.logger.debug(`[Onduleur] Email ID: ${messageId} mis à jour dans l'historique.`);
        } else {
            this.processedOnduleurEmails.unshift(emailData);
            this.logger.debug(`[Onduleur] Email ID: ${messageId} ajouté à l'historique.`);
            if (this.processedOnduleurEmails.length > this.MAX_HISTORY_SIZE) {
                this.processedOnduleurEmails.length = this.MAX_HISTORY_SIZE;
            }
        }
        this.logger.debug(`[Onduleur] Historique mis à jour pour ID: ${messageId}. Taille: ${this.processedOnduleurEmails.length}`);

        if (!messageId || typeof messageId !== 'string' || messageId.startsWith('seqno-')) {
            this.logger.warn(`[Onduleur] Message-ID invalide pour #${seqno}. Notification ignorée.`);
            return;
        }
        if (this.notifiedEmailIds.has(messageId)) {
            this.logger.log(`[Onduleur] Email ID: ${messageId} déjà notifié cette session. Ignoré pour notif.`);
            return;
        }

        this.notifiedEmailIds.add(messageId);
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
                Promise.allSettled(subscriptions.map(sub => this.notificationService.sendPushNotification(sub, notificationPayload)))
                    .then(results => {
                        const fulfilled = results.filter(r => r.status === 'fulfilled' && r.value).length;
                        this.logger.log(`[Onduleur Notification] Envoi terminé pour ID: ${messageId}. Succès: ${fulfilled}/${results.length}`);
                    });
            } else { this.logger.log(`[Onduleur Notification] Aucun abonné trouvé pour les emails.`); }
        } catch (notificationError) { this.logger.error(`[Onduleur Notification] Erreur envoi pour ID: ${messageId}:`, notificationError); }

    }

    /**
     * Retourne l'historique actuel des emails d'onduleur traités et stockés par le service.
     * @returns Un tableau contenant les objets emails traités.
     */
    getEmails(): any[] {
        return this.processedOnduleurEmails;
    }
}