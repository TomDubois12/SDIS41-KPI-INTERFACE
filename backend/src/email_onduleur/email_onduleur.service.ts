import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as Imap from 'imap';
import { simpleParser } from 'mailparser';

@Injectable()
export class EmailOnduleurService {
    private imap: Imap;
    private readonly logger = new Logger(EmailOnduleurService.name);
    private emails: any[] = [];
    private readonly adresseEmailSources = [
        'nicolas.bellier@sdis41.fr',
        'onduleur.alerte@sdis41.fr',
        'onduleur.administratif@sdis41.fr',
    ];
    private readonly sujetEmailSource = 'UPS event notification';
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
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

            // Utiliser un tableau temporaire au lieu de vider emails
            const tempEmails = [];
            await this.fetchEmails(thirtyDaysAgo, now, tempEmails);
            
            // Mettre à jour emails seulement après avoir tout récupéré
            this.emails = tempEmails;

            this.lastSuccessfulFetch = new Date();
        } catch (error) {
            if (error.code === 'EPIPE') {
                this.logger.error('Erreur de socket : La connexion IMAP a été fermée de manière inattendue.');
                this.imapConnected = false;
                try {
                    this.imap.end();
                } catch (e) {}
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

                            if (
                                parsed.subject === this.sujetEmailSource &&
                                parsed.from &&
                                parsed.from.value &&
                                parsed.from.value.length > 0 &&
                                this.adresseEmailSources.includes(parsed.from.value[0].address)
                            ) {
                                const content = parsed.text;
                                const type = content.includes('administratif') ? 'Administratif' : 'Alerte';
                                const messageMatch = content.match(/Message\s*:\s*(.+?)\n\n/s);
                                const eventMatch = content.match(/Event List\s*:\s*(.+?)\n/s);
                                const timestampMatch = content.match(/Timestamp\s*:\s*(.+?)$/m);

                                // Utiliser emailsArray au lieu de this.emails
                                emailsArray.push({
                                    id: seqno,
                                    from: parsed.from?.text,
                                    subject: parsed.subject,
                                    date: parsed.date,
                                    type,
                                    message: messageMatch?.[1]?.trim() ?? '',
                                    event: eventMatch?.[1]?.trim() ?? '',
                                    timestamp: timestampMatch?.[1]?.trim() ?? '',
                                });
                                this.logger.log(`Email #${seqno} récupéré: ${parsed.subject}`);
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

    getEmailById(id: number): any {
        return this.emails.find(email => email.id === id);
    }

    getLastSuccessfulFetch(): Date | null {
        return this.lastSuccessfulFetch;
    }
}