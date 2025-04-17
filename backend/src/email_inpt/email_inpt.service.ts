import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as Imap from 'imap';
import { simpleParser } from 'mailparser';

@Injectable()
export class EmailINPTService {
    private imap: Imap;
    private readonly logger = new Logger(EmailINPTService.name);
    private emails: any[] = [];
    private readonly sujetEmailSource = [
        "Operation programmee Tetrapol",
        "Debut d'incident sur le reseau INPT",
        "Fin d'incident sur le reseau INPT "
    ];
    private imapConnected = false;

    constructor() {
        this.initializeImap();
    }

    private initializeImap() {
        this.imap = new Imap({
            user: 'sic@sdis41.fr',
            password: 'puhz tmew shzv ldeo',
            host: 'imap.gmail.com',
            port: 993,
            tls: true,
            tlsOptions: { rejectUnauthorized: false },
        });

        this.imap.setMaxListeners(20);

        this.imap.on('ready', () => {
            this.imapConnected = true;
            this.logger.log('Connexion IMAP établie');
        });

        this.imap.on('error', (err) => {
            this.logger.error('Erreur IMAP:', err);
            this.imapConnected = false;
        });

        this.imap.on('end', () => {
            this.imapConnected = false;
            this.logger.log('Connexion IMAP fermée');
        });
    }

    private connectImap(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.imapConnected) {
                resolve();
                return;
            }

            if (this.imap && (this.imap.state === 'disconnected' || this.imap.state === 'error')) {
                this.logger.log('Réinitialisation de la connexion IMAP');
                this.initializeImap();
            }

            this.imap.once('ready', () => {
                this.imapConnected = true;
                resolve();
            });

            this.imap.once('error', (err) => {
                this.imapConnected = false;
                reject(err);
            });

            try {
                this.imap.connect();
            } catch (error) {
                this.logger.error('Erreur lors de la connexion IMAP:', error);
                reject(error);
            }
        });
    }

    private disconnectImap(): Promise<void> {
        return new Promise((resolve) => {
            if (this.imapConnected && this.imap && this.imap.state !== 'disconnected') {
                try {
                    this.imap.end();
                } catch (error) {
                    this.logger.error('Erreur lors de la déconnexion IMAP:', error);
                }
                this.imapConnected = false;
            }
            resolve();
        });
    }

    private openInbox(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.imap.openBox('INBOX', true, (err, box) => {
                if (err) {
                    reject(err);
                    return;
                }
                this.logger.log('Boîte de réception ouverte');
                resolve();
            });
        });
    }

    private isFetchingEmails = false;
    private lastSuccessfulFetch: Date | null = null;

    @Cron(CronExpression.EVERY_MINUTE)
    async fetchAndProcessEmails() {
        if (this.isFetchingEmails) {
            this.logger.warn('Récupération des emails déjà en cours, ignorée.');
            return;
        }

        this.isFetchingEmails = true;
        this.logger.debug('Début de fetchAndProcessEmails');

        try {
            await this.connectImap();
            await this.openInbox();

            const now = new Date();
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); //30 jours

            // Utiliser un tableau temporaire au lieu de vider emails
            const tempEmails: any[] = []; // Explicitly type tempEmails as any[]
            await this.fetchEmails(thirtyDaysAgo, now, tempEmails);

            // Traiter les incidents de début et de fin
            this.processEmailRelationships(tempEmails);

            // Trier les emails par id décroissant
            tempEmails.sort((a: any, b: any) => b.id - a.id); // Explicitly type a and b as any

            // Mettre à jour emails seulement après avoir tout récupéré et trié
            this.emails = tempEmails;

            this.lastSuccessfulFetch = new Date();
        } catch (error) {
            if (error.code === 'EPIPE') {
                this.logger.error('Erreur de socket : La connexion IMAP a été fermée de manière inattendue.');
                this.imapConnected = false;
                try {
                    this.imap.end();
                } catch (e) { }
                this.initializeImap();
            } else {
                this.logger.error('Erreur lors de la récupération des emails:', error);
            }
        } finally {
            try {
                await this.disconnectImap();
            } catch (error) {
                this.logger.error('Erreur lors de la déconnexion:', error);
            }
            this.isFetchingEmails = false;
            this.logger.debug('Fin de fetchAndProcessEmails');
        }
    }

    private processEmailRelationships(emails: any[]) {
        // Créer un dictionnaire pour accéder rapidement aux emails par numéro d'opération
        const emailsByNumeroOperation = new Map();

        // Premier passage pour identifier les opérations programmées et initialiser leur statut
        emails.forEach(email => {
            if (email.typeEmail === 'operation' && email.numeroOperation) {
                email.status = '❌'; // Statut par défaut
                emailsByNumeroOperation.set(email.numeroOperation, email);
            }
        });

        // Second passage pour mettre à jour les statuts
        emails.forEach(email => {
            if ((email.typeEmail === 'incident_debut' || email.typeEmail === 'incident_fin') && email.numeroOperation) {
                const relatedEmail = emailsByNumeroOperation.get(email.numeroOperation);

                if (relatedEmail) {
                    // Mettre à jour le statut unique
                    if (email.typeEmail === 'incident_fin') {
                        relatedEmail.status = '✅'; // Priorité à la fin d'incident
                    } else if (email.typeEmail === 'incident_debut' && relatedEmail.status === '❌') {
                        relatedEmail.status = '🔃'; // Début d'incident si pas de fin
                    }
                }
            }
        });
    }

    private async fetchEmails(startDate: Date, now: Date, emailsArray: any[]) {
        return new Promise<void>((resolve, reject) => {
            const searchCriteria = [['SINCE', startDate]];
            const fetchOptions = {
                bodies: [''],
                struct: true,
            };

            this.imap.search(searchCriteria, (err, results) => {
                if (err) {
                    this.logger.error('Erreur lors de la recherche des emails:', err);
                    reject(err);
                    return;
                }

                if (!results || results.length === 0) {
                    this.logger.log('Aucun email trouvé dans la plage de dates.');
                    resolve();
                    return;
                }

                const f = this.imap.fetch(results, fetchOptions);

                f.on('message', (msg, seqno) => {
                    msg.on('body', (stream, info) => {
                        simpleParser(stream, (err, parsed) => {
                            if (err) {
                                this.logger.error('Erreur de parsing:', err);
                                return;
                            }

                            // Déterminer le type d'email
                            let typeEmail = "";
                            if (parsed.subject?.includes("Operation programmee Tetrapol")) {
                                typeEmail = 'operation';
                            } else if (parsed.subject?.includes("Debut d\'incident sur le reseau INPT")) {
                                typeEmail = 'incident_debut';
                            } else if (parsed.subject?.includes("Fin d\'incident sur le reseau INPT")) {
                                typeEmail = 'incident_fin';
                            }

                            if (typeEmail) {
                                // Extraction de base
                                const emailData: any = {
                                    id: seqno,
                                    from: parsed.from?.text,
                                    subject: parsed.subject,
                                    date: parsed.date,
                                    text: parsed.text,
                                    typeEmail: typeEmail,
                                    statusDebut: '',
                                    statusFin: ''
                                };

                                // Extraction spécifique selon le type d'email
                                if (typeEmail === 'operation') {
                                    // Pour les opérations programmées
                                    const numeroOperationMatch = parsed.subject.match(/n°\s*(\d+)/);
                                    const nomSiteMatch = parsed.subject.match(/site de\s*([\w\s]+)/);
                                    const dateHeureMatch = parsed.text?.match(/(\d{2}\/\d{2}\/\d{4}\s+de\s+\d{2}:\d{2}\s+à\s+\d{2}:\d{2})/);

                                    emailData.numeroOperation = numeroOperationMatch ? numeroOperationMatch[1] : null;
                                    emailData.nomSite = nomSiteMatch ? nomSiteMatch[1].trim() : null;
                                    emailData.dateHeure = dateHeureMatch ? dateHeureMatch[1] : null;
                                } else if (typeEmail === 'incident_debut') {
                                    // Pour les débuts d'incidents
                                    const numeroOperationMatch = parsed.text?.match(/incident référencé n°\s*(\d+)/);
                                    emailData.numeroOperation = numeroOperationMatch ? numeroOperationMatch[1] : null;

                                    // Extraire la date et l'heure de l'incident
                                    const dateHeureMatch = parsed.text?.match(/survenu le (\d{2}\/\d{2}\/\d{4}) à (\d{2}:\d{2})/);
                                    if (dateHeureMatch) {
                                        emailData.dateHeure = `${dateHeureMatch[1]} à ${dateHeureMatch[2]}`;
                                    }

                                    // Extraire les sites impactés
                                    const sitesMatch = parsed.text?.match(/impacte le ou les relais de ([^\.]+)/);
                                    emailData.nomSite = sitesMatch ? sitesMatch[1].trim() : null;
                                } else if (typeEmail === 'incident_fin') {
                                    // Pour les fins d'incidents
                                    const numeroOperationMatch = parsed.text?.match(/fin de l\'incident n°\s*(\d+)/);
                                    emailData.numeroOperation = numeroOperationMatch ? numeroOperationMatch[1] : null;

                                    // Extraire la date et l'heure de résolution
                                    const dateHeureMatch = parsed.text?.match(/apparu le (\d{2}\/\d{2}\/\d{4}) à (\d{2}:\d{2})/);
                                    if (dateHeureMatch) {
                                        emailData.dateHeure = `${dateHeureMatch[1]} à ${dateHeureMatch[2]}`;
                                    }

                                    // Extraire le site concerné
                                    const siteMatch = parsed.text?.match(/impactant le site ou artère ([^\.]+)/);
                                    emailData.nomSite = siteMatch ? siteMatch[1].trim() : null;
                                }

                                emailsArray.push(emailData);
                                this.logger.log(`Email #${seqno} récupéré: ${parsed.subject} (Type: ${typeEmail})`);
                            }
                        });
                    });
                });

                f.once('error', (err) => {
                    this.logger.error('Erreur lors du fetch:', err);
                    reject(err);
                });

                f.once('end', () => {
                    this.logger.log('Récupération des emails terminée.');
                    resolve();
                });
            });
        });
    }

    getEmails(): any[] {
        return this.emails;
    }

    getLastSuccessfulFetch(): Date | null {
        return this.lastSuccessfulFetch;
    }

    getEmailsByType(type: string): any[] {
        return this.emails.filter(email => email.typeEmail === type);
    }

    isConnected(): boolean {
        return this.imapConnected;
    }
}