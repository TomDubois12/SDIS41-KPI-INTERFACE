// src/email_inpt/email_inpt.service.ts (COMPLET - SANS AUCUN COMMENTAIRE PLACEHOLDER)
import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationService } from '../notifications/notifications.service';
// Importer le payload et le nom d'événement corrects
import { ImapEmailPayload, EMAIL_RECEIVED_EVENT } from '../imap-polling/imap-polling.service'; // Utilisation de l'événement générique

@Injectable()
export class EmailINPTService {
    private readonly logger = new Logger(EmailINPTService.name);
    private processedInptEmails: any[] = []; // Historique mémoire pour affichage
    // Set pour gérer les notifications uniques par session serveur
    private notifiedEmailIds: Set<string> = new Set();
    private readonly MAX_HISTORY_SIZE = 200; // Taille max historique

    constructor(
        @Inject(forwardRef(() => NotificationService))
        private readonly notificationService: NotificationService,
    ) {
        this.logger.log('EmailINPTService initialisé, écoute de ' + EMAIL_RECEIVED_EVENT);
    }

    // Écouter l'événement générique émis par ImapPollingService
    @OnEvent(EMAIL_RECEIVED_EVENT, { async: true })
    async handleEmailReceived(payload: ImapEmailPayload) {
        const { seqno, parsed, messageId } = payload; // Utiliser messageId du payload
        this.logger.debug(`[INPT] Événement ${EMAIL_RECEIVED_EVENT} reçu pour #${seqno} (ID: ${messageId})`);

        // 1. Filtrer : Est-ce un email INPT ?
        let typeEmail = "";
        if (parsed.subject?.includes("Operation programmee Tetrapol")) typeEmail = 'operation';
        else if (parsed.subject?.includes("Debut d\'incident sur le reseau INPT")) typeEmail = 'incident_debut';
        else if (parsed.subject?.includes("Fin d\'incident sur le reseau INPT")) typeEmail = 'incident_fin';
        else {
            this.logger.debug(`[INPT] Email #${seqno} ignoré (sujet non pertinent).`);
            return; // Ignorer si le sujet ne correspond pas
        }

        this.logger.log(`[INPT] Email correspondant trouvé #${seqno} (Type: ${typeEmail}). Traitement...`);

        // 2. Extraire les données spécifiques INPT (Corps Complet)
        // Utiliser messageId comme identifiant principal si possible
        const currentMessageId = messageId || `seqno-${seqno}`;
        const emailData: any = {
            id: currentMessageId,
            originalSeqno: seqno,
            from: parsed.from?.text,
            subject: parsed.subject,
            date: parsed.date, // Objet Date
            text: parsed.text, // Garder le texte brut
            typeEmail: typeEmail,
            numeroOperation: null, // Initialiser
            nomSite: null,
            dateHeure: null,
            status: null // Initialiser le statut
         };
        try {
             // Logique d'extraction spécifique complète
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


        // 3. Gérer Historique et Statut (Logique complète)
        const existingIndex = this.processedInptEmails.findIndex(e => e.id === currentMessageId);
        let relatedOperationIndex = -1;

        if (typeEmail === 'operation') {
            // Déterminer statut initial en cherchant dans l'historique actuel
            const relatedDebut = this.processedInptEmails.find(e => e.typeEmail === 'incident_debut' && e.numeroOperation && e.numeroOperation === emailData.numeroOperation);
            const relatedFin = this.processedInptEmails.find(e => e.typeEmail === 'incident_fin' && e.numeroOperation && e.numeroOperation === emailData.numeroOperation);
            if (relatedFin) { emailData.status = '✅'; }
            else if (relatedDebut) { emailData.status = '🔃'; }
            else { emailData.status = '❌'; }
            this.logger.debug(`[INPT] Statut calculé pour Opération ${emailData.numeroOperation} (ID: ${currentMessageId}): ${emailData.status}`);
            // Ajouter/Mettre à jour l'opération
            if (existingIndex > -1) { this.processedInptEmails[existingIndex] = emailData; }
            else { this.processedInptEmails.unshift(emailData); }

        } else if (typeEmail === 'incident_debut') {
            // Ajouter/Mettre à jour l'email 'debut'
            if (existingIndex > -1) { this.processedInptEmails[existingIndex] = emailData; }
            else { this.processedInptEmails.unshift(emailData); }
            // Chercher l'opération liée et mettre à jour son statut si '❌'
            relatedOperationIndex = this.processedInptEmails.findIndex(e => e.typeEmail === 'operation' && e.numeroOperation && e.numeroOperation === emailData.numeroOperation);
            if (relatedOperationIndex > -1 && this.processedInptEmails[relatedOperationIndex].status === '❌') {
                this.processedInptEmails[relatedOperationIndex].status = '🔃';
                this.logger.log(`[INPT] Statut opération ${emailData.numeroOperation} MàJ -> '🔃' par début #${seqno}`);
            }

        } else if (typeEmail === 'incident_fin') {
            // Ajouter/Mettre à jour l'email 'fin'
            if (existingIndex > -1) { this.processedInptEmails[existingIndex] = emailData; }
            else { this.processedInptEmails.unshift(emailData); }
            // Chercher l'opération liée et mettre à jour son statut à '✅'
            relatedOperationIndex = this.processedInptEmails.findIndex(e => e.typeEmail === 'operation' && e.numeroOperation && e.numeroOperation === emailData.numeroOperation);
            if (relatedOperationIndex > -1) {
                 this.processedInptEmails[relatedOperationIndex].status = '✅';
                 this.logger.log(`[INPT] Statut opération ${emailData.numeroOperation} MàJ -> '✅' par fin #${seqno}`);
            }
        }
        // Trier et Limiter la taille
        this.processedInptEmails.sort((a, b) => (new Date(b.date).getTime() || 0) - (new Date(a.date).getTime() || 0)); // Trier par date JS
        if (this.processedInptEmails.length > this.MAX_HISTORY_SIZE) {
            this.processedInptEmails.length = this.MAX_HISTORY_SIZE;
        }
        this.logger.debug(`[INPT] Historique traité. Taille: ${this.processedInptEmails.length}`);


        // 4. Vérifier si DÉJÀ NOTIFIÉ cette session
        if (!messageId || typeof messageId !== 'string' || messageId.startsWith('seqno-')) {
             this.logger.warn(`[INPT] Message-ID invalide pour #${seqno}. Notification ignorée.`);
             return; // Ne pas notifier si l'ID n'est pas fiable
        }
        if (this.notifiedEmailIds.has(messageId)) {
             this.logger.log(`[INPT] Email ID: ${messageId} déjà notifié cette session. Ignoré pour notif.`);
             return; // Ne pas notifier à nouveau
        }

        // 5. Notifier (car nouveau pour notification CETTE SESSION) et Mémoriser l'ID notifié
        this.notifiedEmailIds.add(messageId); // Marquer comme notifié MAINTENANT
        this.logger.log(`[INPT NOTIFICATION] ID: ${messageId} marqué comme notifié. Envoi...`);
        // Construction complète du payload
        const notificationPayload = JSON.stringify({
            title: `Alerte Email INPT (${typeEmail})`,
            body: `Sujet: ${emailData.subject?.substring(0, 60) ?? 'N/A'}...\nSite: ${emailData.nomSite ?? 'N/A'}`,
            data: { emailType: 'INPT', id: messageId }
        });
        // Bloc d'envoi complet
         try {
             const subscriptions = await this.notificationService.getEmailSubscribers(); // Abonnés EMAIL
             if (subscriptions && subscriptions.length > 0) {
                 this.logger.log(`[INPT Notification] Envoi à ${subscriptions.length} abonnés.`);
                 // Envoyer à tous en parallèle
                 const results = await Promise.allSettled( subscriptions.map(sub => this.notificationService.sendPushNotification(sub, notificationPayload)) );
                 const fulfilled = results.filter(r => r.status === 'fulfilled' && r.value).length;
                 const rejected = results.length - fulfilled;
                 this.logger.log(`[INPT Notification] Envoi terminé pour ID: ${messageId}. Succès: ${fulfilled}, Échecs: ${rejected}`);
             } else {
                 this.logger.log(`[INPT Notification] Aucun abonné trouvé pour les emails.`);
             }
         } catch (notificationError) {
             this.logger.error(`[INPT Notification] Erreur récupération/lancement envoi pour ID: ${messageId}:`, notificationError);
         }

    } // Fin handleEmailReceived


    // Nouvelle tâche CRON pour mettre à jour les statuts expirés (corps complet)
    @Cron(CronExpression.EVERY_HOUR) // Exécution toutes les heures
    async checkAndUpdateExpiredOperations() {
        this.logger.log('[CRON Status Check INPT] Démarrage de la vérification des opérations terminées...');
        const now = new Date();
        let updatedCount = 0;

        // Itérer sur la liste pour vérifier les dates de fin
        for (const email of this.processedInptEmails) {
            // Cibler opérations non terminées ('❌' ou '🔃')
            if (email.typeEmail === 'operation' && (email.status === '❌' || email.status === '🔃')) {
                if (email.dateHeure && typeof email.dateHeure === 'string') {
                    // Extraire date/heure de FIN
                    const match = email.dateHeure.match(/(\d{2})\/(\d{2})\/(\d{4})\s+de\s+\d{2}:\d{2}\s+à\s+(\d{2}):(\d{2})/);
                    if (match) {
                        const [, day, month, year, endHour, endMinute] = match;
                        try {
                             // Construire objet Date de fin
                             const endDate = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10), parseInt(endHour, 10), parseInt(endMinute, 10));
                             // Vérifier si valide et passée
                             if (!isNaN(endDate.getTime()) && endDate < now) {
                                  this.logger.log(`[CRON Status Check INPT] Opération ${email.numeroOperation} (ID: ${email.id}) terminée (date fin ${endDate.toISOString()} passée). Passage status à '✅'.`);
                                  email.status = '✅'; // Mettre à jour le statut
                                  updatedCount++;
                             }
                        } catch(dateError) {
                             this.logger.error(`[CRON Status Check INPT] Erreur parsing date pour op ${email.numeroOperation} (ID: ${email.id}, dateHeure: ${email.dateHeure})`, dateError);
                        }
                    } else {
                         this.logger.warn(`[CRON Status Check INPT] Format dateHeure non reconnu pour op ${email.numeroOperation} (ID: ${email.id}): ${email.dateHeure}`);
                    }
                } else {
                     this.logger.debug(`[CRON Status Check INPT] Opération ${email.numeroOperation} (ID: ${email.id}) sans dateHeure valide, statut inchangé.`);
                }
            }
        } // Fin boucle for

        if (updatedCount > 0) {
             this.logger.log(`[CRON Status Check INPT] ${updatedCount} opération(s) mise(s) à jour à '✅'.`);
        } else {
             this.logger.log('[CRON Status Check INPT] Aucune opération expirée à mettre à jour.');
        }
    } // Fin checkAndUpdateExpiredOperations


    // Retourne l'historique mémoire actuel (maintenant avec statuts à jour)
    getEmails(): any[] {
        // Le tri est fait après chaque ajout/modification dans handleEmailReceived
        return this.processedInptEmails;
    }

} // Fin classe EmailINPTService