import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';

import { NotificationService } from '../notifications/notifications.service';
import { ImapEmailPayload, EMAIL_RECEIVED_EVENT } from '../imap-polling/imap-polling.service';

/**
 * Service chargé du traitement spécifique des emails INPT.
 * Écoute les événements de réception d'email, filtre les emails pertinents (opérations, incidents),
 * extrait les informations clés, maintient un historique avec statut corrélé,
 * envoie des notifications push pour les nouveaux emails pertinents,
 * et met à jour périodiquement le statut des opérations terminées.
 */
@Injectable()
export class EmailINPTService {
    private readonly logger = new Logger(EmailINPTService.name);
    private processedInptEmails: any[] = [];
    private notifiedEmailIds: Set<string> = new Set();
    private readonly MAX_HISTORY_SIZE = 200;

    /**
     * Injecte les dépendances nécessaires.
     * Gère une dépendance circulaire avec NotificationService via forwardRef.
     * @param notificationService Service utilisé pour envoyer les notifications push.
     */
    constructor(
        @Inject(forwardRef(() => NotificationService))
        private readonly notificationService: NotificationService,
    ) {
        this.logger.log('EmailINPTService initialisé, écoute de ' + EMAIL_RECEIVED_EVENT);
    }

    /**
     * Gère l'événement de réception d'un nouvel email (`EMAIL_RECEIVED_EVENT`).
     * Filtre les emails INPT par sujet (opération, début/fin incident).
     * Extrait les données pertinentes (numéro d'opération, site, date/heure) via regex.
     * Met à jour l'historique interne (`processedInptEmails`), calcule et met à jour
     * le statut des opérations en fonction des emails d'incident liés.
     * Trie l'historique et limite sa taille.
     * Envoie une notification push via NotificationService si l'email est nouveau et pertinent.
     * @param payload Données de l'email reçu, incluant l'objet parsé et l'ID du message.
     */
    @OnEvent(EMAIL_RECEIVED_EVENT, { async: true })
    async handleEmailReceived(payload: ImapEmailPayload) {
        const { seqno, parsed, messageId } = payload;
        this.logger.debug(`[INPT] Événement ${EMAIL_RECEIVED_EVENT} reçu pour #${seqno} (ID: ${messageId})`);

        let typeEmail = "";
        if (parsed.subject?.includes("Operation programmee Tetrapol")) typeEmail = 'operation';
        else if (parsed.subject?.includes("Debut d\'incident sur le reseau INPT")) typeEmail = 'incident_debut';
        else if (parsed.subject?.includes("Fin d\'incident sur le reseau INPT")) typeEmail = 'incident_fin';
        else {
            this.logger.debug(`[INPT] Email #${seqno} ignoré (sujet non pertinent).`);
            return;
        }
        this.logger.log(`[INPT] Email correspondant trouvé #${seqno} (Type: ${typeEmail}). Traitement...`);

        const currentMessageId = messageId || `seqno-${seqno}`;
        const emailData: any = {
            id: currentMessageId,
            originalSeqno: seqno,
            from: parsed.from?.text,
            subject: parsed.subject,
            date: parsed.date,
            text: parsed.text,
            typeEmail: typeEmail,
            numeroOperation: null,
            nomSite: null,
            dateHeure: null,
            status: null
        };
        try {
            if (typeEmail === 'operation') {
                const numeroOperationMatch = parsed.subject?.match(/n°\s*(\d+)/);
                const nomSiteMatch = parsed.subject?.match(/site de\s*([\w\sÀ-ÿ-]+)/);
                const dateHeureMatch = parsed.text?.match(/(\d{2}\/\d{2}\/\d{4}\s+de\s+\d{2}:\d{2}\s+à\s+\d{2}:\d{2})/);
                emailData.numeroOperation = numeroOperationMatch ? numeroOperationMatch[1] : null;
                emailData.nomSite = nomSiteMatch ? nomSiteMatch[1].trim() : null;
                emailData.dateHeure = dateHeureMatch ? dateHeureMatch[1] : null;
            } else if (typeEmail === 'incident_debut') {
                const numeroOperationMatch = parsed.text?.match(/incident référencé n°\s*(\d+)/);
                emailData.numeroOperation = numeroOperationMatch ? numeroOperationMatch[1] : null;
                const dateHeureMatch = parsed.text?.match(/survenu le (\d{2}\/\d{2}\/\d{4}) à (\d{2}:\d{2})/);
                if (dateHeureMatch) emailData.dateHeure = `${dateHeureMatch[1]} à ${dateHeureMatch[2]}`;
                const sitesMatch = parsed.text?.match(/impacte le ou les relais de ([^\.]+)/);
                emailData.nomSite = sitesMatch ? sitesMatch[1].trim() : null;
            } else if (typeEmail === 'incident_fin') {
                const numeroOperationMatch = parsed.text?.match(/fin de l\'incident n°\s*(\d+)/);
                emailData.numeroOperation = numeroOperationMatch ? numeroOperationMatch[1] : null;
                const dateHeureMatch = parsed.text?.match(/apparu le (\d{2}\/\d{2}\/\d{4}) à (\d{2}:\d{2})/);
                if (dateHeureMatch) emailData.dateHeure = `${dateHeureMatch[1]} à ${dateHeureMatch[2]}`;
                const siteMatch = parsed.text?.match(/impactant le site ou artère ([^\.]+)/);
                emailData.nomSite = siteMatch ? siteMatch[1].trim() : null;
            }
            this.logger.debug(`[INPT] Données extraites pour #${seqno}: Op#${emailData.numeroOperation}, Site:${emailData.nomSite}`);
        } catch (extractError) { this.logger.error(`[INPT] Erreur extraction #${seqno}:`, extractError); }


        const existingIndex = this.processedInptEmails.findIndex(e => e.id === currentMessageId);
        let relatedOperationIndex = -1;

        if (typeEmail === 'operation') {
            const relatedDebut = this.processedInptEmails.find(e => e.typeEmail === 'incident_debut' && e.numeroOperation && e.numeroOperation === emailData.numeroOperation);
            const relatedFin = this.processedInptEmails.find(e => e.typeEmail === 'incident_fin' && e.numeroOperation && e.numeroOperation === emailData.numeroOperation);
            if (relatedFin) { emailData.status = '✅'; }
            else if (relatedDebut) { emailData.status = '🔃'; }
            else { emailData.status = '❌'; }
            this.logger.debug(`[INPT] Statut calculé pour Opération ${emailData.numeroOperation} (ID: ${currentMessageId}): ${emailData.status}`);
            if (existingIndex > -1) { this.processedInptEmails[existingIndex] = emailData; }
            else { this.processedInptEmails.unshift(emailData); }

        } else if (typeEmail === 'incident_debut') {
            if (existingIndex > -1) { this.processedInptEmails[existingIndex] = emailData; }
            else { this.processedInptEmails.unshift(emailData); }
            relatedOperationIndex = this.processedInptEmails.findIndex(e => e.typeEmail === 'operation' && e.numeroOperation && e.numeroOperation === emailData.numeroOperation);
            if (relatedOperationIndex > -1 && this.processedInptEmails[relatedOperationIndex].status === '❌') {
                this.processedInptEmails[relatedOperationIndex].status = '🔃';
                this.logger.log(`[INPT] Statut opération ${emailData.numeroOperation} MàJ -> '🔃' par début #${seqno}`);
            }

        } else if (typeEmail === 'incident_fin') {
            if (existingIndex > -1) { this.processedInptEmails[existingIndex] = emailData; }
            else { this.processedInptEmails.unshift(emailData); }
            relatedOperationIndex = this.processedInptEmails.findIndex(e => e.typeEmail === 'operation' && e.numeroOperation && e.numeroOperation === emailData.numeroOperation);
            if (relatedOperationIndex > -1) {
                this.processedInptEmails[relatedOperationIndex].status = '✅';
                this.logger.log(`[INPT] Statut opération ${emailData.numeroOperation} MàJ -> '✅' par fin #${seqno}`);
            }
        }
        this.processedInptEmails.sort((a, b) => (new Date(b.date).getTime() || 0) - (new Date(a.date).getTime() || 0)); // Trier par date JS
        if (this.processedInptEmails.length > this.MAX_HISTORY_SIZE) {
            this.processedInptEmails.length = this.MAX_HISTORY_SIZE;
        }
        this.logger.debug(`[INPT] Historique traité. Taille: ${this.processedInptEmails.length}`);

        if (!messageId || typeof messageId !== 'string' || messageId.startsWith('seqno-')) {
            this.logger.warn(`[INPT] Message-ID invalide pour #${seqno}. Notification ignorée.`);
            return;
        }
        if (this.notifiedEmailIds.has(messageId)) {
            this.logger.log(`[INPT] Email ID: ${messageId} déjà notifié cette session. Ignoré pour notif.`);
            return;
        }

        this.notifiedEmailIds.add(messageId);
        this.logger.log(`[INPT NOTIFICATION] ID: ${messageId} marqué comme notifié. Envoi...`);
        const notificationPayload = JSON.stringify({
            title: `Alerte Email INPT (${typeEmail})`,
            body: `Sujet: ${emailData.subject?.substring(0, 120) ?? 'N/A'}...`,
            data: { emailType: 'INPT', id: messageId }
        });
        try {
            const subscriptions = await this.notificationService.getEmailSubscribers();
            if (subscriptions && subscriptions.length > 0) {
                this.logger.log(`[INPT Notification] Envoi à ${subscriptions.length} abonnés.`);
                const results = await Promise.allSettled(subscriptions.map(sub => this.notificationService.sendPushNotification(sub, notificationPayload)));
                const fulfilled = results.filter(r => r.status === 'fulfilled' && r.value).length;
                const rejected = results.length - fulfilled;
                this.logger.log(`[INPT Notification] Envoi terminé pour ID: ${messageId}. Succès: ${fulfilled}, Échecs: ${rejected}`);
            } else {
                this.logger.log(`[INPT Notification] Aucun abonné trouvé pour les emails.`);
            }
        } catch (notificationError) {
            this.logger.error(`[INPT Notification] Erreur récupération/lancement envoi pour ID: ${messageId}:`, notificationError);
        }
    }

    /**
     * Tâche planifiée (Cron Job) exécutée toutes les heures.
     * Parcourt l'historique des emails d'opération traités.
     * Vérifie si la date/heure de fin d'une opération (extraite de l'email) est dépassée.
     * Si une opération est terminée et son statut n'est pas déjà '✅', met à jour son statut à '✅'.
     */
    @Cron(CronExpression.EVERY_HOUR)
    async checkAndUpdateExpiredOperations() {
        this.logger.log('[CRON Status Check INPT] Démarrage de la vérification des opérations terminées...');
        const now = new Date();
        let updatedCount = 0;

        for (const email of this.processedInptEmails) {
            if (email.typeEmail === 'operation' && (email.status === '❌' || email.status === '🔃')) {
                if (email.dateHeure && typeof email.dateHeure === 'string') {
                    const match = email.dateHeure.match(/(\d{2})\/(\d{2})\/(\d{4})\s+de\s+\d{2}:\d{2}\s+à\s+(\d{2}):(\d{2})/);
                    if (match) {
                        const [, day, month, year, endHour, endMinute] = match;
                        try {
                            const endDate = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10), parseInt(endHour, 10), parseInt(endMinute, 10));
                            if (!isNaN(endDate.getTime()) && endDate < now) {
                                this.logger.log(`[CRON Status Check INPT] Opération ${email.numeroOperation} (ID: ${email.id}) terminée (date fin ${endDate.toISOString()} passée). Passage status à '✅'.`);
                                email.status = '✅';
                                updatedCount++;
                            }
                        } catch (dateError) {
                            this.logger.error(`[CRON Status Check INPT] Erreur parsing date pour op ${email.numeroOperation} (ID: ${email.id}, dateHeure: ${email.dateHeure})`, dateError);
                        }
                    } else {
                        this.logger.warn(`[CRON Status Check INPT] Format dateHeure non reconnu pour op ${email.numeroOperation} (ID: ${email.id}): ${email.dateHeure}`);
                    }
                } else {
                    this.logger.debug(`[CRON Status Check INPT] Opération ${email.numeroOperation} (ID: ${email.id}) sans dateHeure valide, statut inchangé.`);
                }
            }
        }

        if (updatedCount > 0) {
            this.logger.log(`[CRON Status Check INPT] ${updatedCount} opération(s) mise(s) à jour à '✅'.`);
        } else {
            this.logger.log('[CRON Status Check INPT] Aucune opération expirée à mettre à jour.');
        }
    }

    /**
     * Retourne l'historique actuel des emails INPT traités et stockés par le service.
     * @returns Un tableau contenant les objets emails traités.
     */
    getEmails(): any[] {
        return this.processedInptEmails;
    }
}