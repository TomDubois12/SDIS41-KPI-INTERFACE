import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as Imap from 'imap';
import { simpleParser, ParsedMail } from 'mailparser';
import { Stream } from 'stream';

export interface ImapEmailPayload {
    seqno: number;
    parsed: ParsedMail;
    messageId: string | null;
}

export const EMAIL_RECEIVED_EVENT = 'imap.email.received';

@Injectable()
export class ImapPollingService implements OnModuleInit, OnModuleDestroy {
    private imap: Imap.ImapConnection;
    private readonly logger = new Logger(ImapPollingService.name);
    private imapConnected = false;
    private isProcessing = false;
    private lastSuccessfulFetchTime: Date | null = null;

    constructor(
        private readonly configService: ConfigService,
        private readonly eventEmitter: EventEmitter2,
    ) { }

    async onModuleInit() {
        this.logger.log('ImapPollingService initialisé. Configuration IMAP...');
        this.initializeImap();
        this.logger.log('Lancement du premier fetch des emails récents...');
        setTimeout(() => this.fetchAndEmitAllEmailsInWindow().catch(err => this.logger.error("Erreur lors du fetch initial différé", err)), 5000);
    }

    async onModuleDestroy() {
        this.logger.log('Arrêt de ImapPollingService. Déconnexion IMAP...');
        await this.disconnectImap();
    }

    private initializeImap() {
        this.logger.log('Création/Réinitialisation instance Imap...');
        if (this.imap) {
            this.logger.warn('initializeImap: Instance IMAP existante détectée. Tentative de fermeture...');
            try {
                if (this.imap.state !== 'disconnected') {
                    this.logger.log(`Destruction de l'ancienne instance IMAP (état: ${this.imap.state})`);
                    this.imap.destroy();
                }
            } catch (e) {
                this.logger.error('Erreur lors de la destruction de l\'ancienne instance IMAP', e);
            }
            this.imap = null;
            this.imapConnected = false;
        }
        this.imap = new Imap({
            user: this.configService.get<string>('SIC_MAILBOX_USERNAME') as string,
            password: this.configService.get<string>('SIC_MAILBOX_PASSWORD') as string,
            host: this.configService.get<string>('SIC_MAILBOX_HOST') as string,
            port: this.configService.get<string>('SIC_MAILBOX_PORT') as string,
            tls: true,
            tlsOptions: { rejectUnauthorized: false },
            connTimeout: 15000, authTimeout: 10000,
        }) as Imap.ImapConnection;
        this.imap.setMaxListeners(20);
        this.imap.removeAllListeners();
        this.imap.on('ready', () => { this.imapConnected = true; this.logger.log('Événement IMAP: Ready'); });
        this.imap.on('error', (err) => { this.logger.error('Événement IMAP: Error', err); this.imapConnected = false; });
        this.imap.on('end', () => { this.imapConnected = false; this.logger.log('Événement IMAP: End'); });
        this.imap.on('close', (hadError) => { this.imapConnected = false; this.logger.log(`Événement IMAP: Close (Error: ${hadError})`); });
    }

    private connectImap(): Promise<void> {
        return new Promise((resolve, reject) => {
            const operationTimeout = 20000; let timer: NodeJS.Timeout | null = null;
            if (!this.imap) { this.logger.error('connectImap: Instance IMAP non initialisée!'); return reject(new Error('IMAP instance not initialized')); }
            if (this.imapConnected && this.imap.state === 'authenticated') { this.logger.debug('connectImap: Déjà connecté.'); return resolve(); }

            const cleanupListeners = () => { if (timer) clearTimeout(timer); this.imap?.removeListener('ready', readyListener); this.imap?.removeListener('error', errorListener); };
            const readyListener = () => { this.logger.debug("connectImap: Listener 'ready' exécuté."); cleanupListeners(); resolve(); };
            const errorListener = (err: Error) => { this.logger.error("connectImap: Listener 'error' exécuté.", err); cleanupListeners(); reject(err); };

            timer = setTimeout(() => {
                this.logger.error(`connectImap: Timeout (${operationTimeout}ms)`);
                cleanupListeners();
                try { if (this.imap && this.imap.state !== 'disconnected') this.imap.destroy(); } catch (e) { }
                reject(new Error('connectImap: Timeout'));
            }, operationTimeout);

            this.imap.once('ready', readyListener);
            this.imap.once('error', errorListener);

            if (['connecting', 'connected', 'authenticated'].includes(this.imap.state)) {
                this.logger.warn(`connectImap: État actuel ${this.imap.state}. Attente 'ready'.`);
            } else if (this.imap.state === 'disconnected') {
                try {
                    this.logger.log(`connectImap: Tentative connexion (état: ${this.imap.state})`);
                    this.imap.connect();
                } catch (error) {
                    this.logger.error('connectImap: Erreur synchrone .connect()', error);
                    cleanupListeners();
                    reject(error);
                }
            } else {
                this.logger.error(`connectImap: État inattendu ${this.imap.state}.`);
                cleanupListeners();
                reject(new Error(`Cannot connect in state ${this.imap.state}`));
            }
        });
    }

    private disconnectImap(): Promise<void> {
        return new Promise((resolve) => {
            if (this.imap && this.imap.state !== 'disconnected') {
                this.logger.log(`disconnectImap: Demande (état: ${this.imap.state})`);
                let timer: NodeJS.Timeout | null = null;
                const closeListener = () => { if (timer) clearTimeout(timer); this.logger.log('disconnectImap: Event \'close\' reçu.'); resolve(); };
                this.imap.once('close', closeListener);
                timer = setTimeout(() => {
                    this.logger.warn('disconnectImap: Timeout attente \'close\'. Résolution forcée.');
                    this.imap?.removeListener('close', closeListener);
                    this.imapConnected = false;
                    resolve();
                }, 5000);

                try {
                    if (['connected', 'authenticated'].includes(this.imap.state)) {
                        this.logger.log('disconnectImap: Appel de imap.end()');
                        this.imap.end();
                    } else {
                        this.logger.warn(`disconnectImap: État = ${this.imap.state}, appel de imap.destroy().`);
                        this.imap.destroy();
                    }
                } catch (error) {
                    this.logger.error('disconnectImap: Erreur .end/.destroy:', error);
                    if (timer) clearTimeout(timer);
                    this.imap?.removeListener('close', closeListener);
                    this.imapConnected = false;
                    resolve();
                }
            } else {
                this.logger.debug('disconnectImap: Déjà déconnecté ou instance non définie.');
                this.imapConnected = false;
                resolve();
            }
        });
    }

    private openInbox(): Promise<Imap.Box | null> {
        return new Promise((resolve) => {
            if (!this.imap || this.imap.state !== 'authenticated') { this.logger.error('openInbox: IMAP non authentifié.'); return resolve(null); }
            this.imap.openBox('INBOX', false, (err, box) => {
                if (err) { this.logger.error('openInbox: Erreur ouverture INBOX:', err); return resolve(null); }
                this.logger.log(`openInbox: INBOX ouverte. Total: ${box.messages.total}, Nouveau: ${box.messages.new}`);
                resolve(box);
            });
        });
    }

    private searchImap(criteria: any[]): Promise<number[] | null> {
        return new Promise((resolve, reject) => {
            if (!this.imap || this.imap.state !== 'authenticated') { this.logger.error('searchImap: IMAP non authentifié.'); return reject(new Error('IMAP not authenticated')); }
            this.imap.search(criteria, (err, results) => {
                if (err) { this.logger.error('Erreur pendant imap.search:', err); return reject(err); }
                resolve(results ?? null);
            });
        });
    }

    @Cron(CronExpression.EVERY_MINUTE)
    async handleCron() {
        this.logger.log(`CRON JOB Email: Déclenchement ${new Date().toISOString()}`);
        if (this.isProcessing) { this.logger.warn('CRON JOB Email: Traitement précédent en cours, saut.'); return; }
        try {
            await this.fetchAndEmitAllEmailsInWindow();
        } catch (error) {
            this.logger.error("Erreur non interceptée dans fetchAndEmitAllEmailsInWindow (Cron)", error);
        } finally {
            this.isProcessing = false;
            this.logger.log(`CRON JOB Email: Fin cycle ${new Date().toISOString()}`);
        }
    }

    async fetchAndEmitAllEmailsInWindow() {
        if (this.isProcessing) return;
        this.isProcessing = true;
        this.logger.debug('Début fetchAndEmitAllEmailsInWindow');
        try {
            await this.connectImap();
            const box = await this.openInbox();
            if (!box) throw new Error("Impossible d'ouvrir INBOX.");

            const historyDays = 30;
            const now = new Date();
            const sinceDate = new Date(now.getTime() - historyDays * 24 * 60 * 60 * 1000);
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const formattedSinceDate = `${sinceDate.getDate()}-${months[sinceDate.getMonth()]}-${sinceDate.getFullYear()}`;
            const searchCriteria = [['SINCE', formattedSinceDate]];

            this.logger.log(`WorkspaceAndEmitAllEmailsInWindow: Recherche emails: ${JSON.stringify(searchCriteria)}`);
            const results = await this.searchImap(searchCriteria);

            if (results && results.length > 0) {
                this.logger.log(`WorkspaceAndEmitAllEmailsInWindow: ${results.length} email(s) trouvé(s). Récupération, parsing et émission...`);
                await this.fetchAndParseAndEmit(results);
                this.logger.log(`WorkspaceAndEmitAllEmailsInWindow: Émission des événements terminée (si applicable).`);
            } else {
                this.logger.log(`WorkspaceAndEmitAllEmailsInWindow: Aucun email trouvé depuis ${formattedSinceDate}.`);
            }
            this.lastSuccessfulFetchTime = new Date();

        } catch (error: any) {
            this.logger.error('Erreur dans fetchAndEmitAllEmailsInWindow:', error.message || error);
            if (error.message?.includes('ECONNRESET') || error.code === 'EPIPE' || error.message?.includes('Timeout')) {
                this.imapConnected = false;
            }
        } finally {
            if (this.imap && this.imap.state !== 'disconnected') {
                await this.disconnectImap();
            }
            this.logger.debug('Fin fetchAndEmitAllEmailsInWindow');
        }
    }

    private async fetchAndParseAndEmit(uidsOrSeqnos: number[]): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (!uidsOrSeqnos || uidsOrSeqnos.length === 0) return resolve();
            if (!this.imap || this.imap.state !== 'authenticated') return reject(new Error('IMAP non authentifié pour fetch'));

            const fetchOptions = { bodies: [''], struct: true, markSeen: false };

            this.logger.log(`Début fetchAndParseAndEmit pour ${uidsOrSeqnos.length} email(s)`);
            const f = this.imap.fetch(uidsOrSeqnos, fetchOptions);
            let completedCount = 0; let hasRejected = false;

            const checkCompletion = () => {
                if (!hasRejected && completedCount === uidsOrSeqnos.length) {
                    this.logger.log(`WorkspaceAndParseAndEmit: Terminé après ${completedCount} messages.`);
                    clearTimeout(fetchTimeout);
                    resolve();
                }
            };
            const fetchTimeout = setTimeout(() => {
                if (!hasRejected && completedCount < uidsOrSeqnos.length) {
                    this.logger.error(`Timeout dans fetchAndParseAndEmit: ${completedCount}/${uidsOrSeqnos.length} traités. Forçage fin.`);
                    hasRejected = true;
                    reject(new Error(`Timeout processing emails, only ${completedCount}/${uidsOrSeqnos.length} finished.`));
                }
            }, 60000 * 5);

            f.on('message', (msg, seqno) => {
                this.logger.debug(`Réception message #${seqno}`);
                const currentSeqno = seqno;
                msg.on('body', (stream: Stream, info) => {
                    simpleParser(stream, (err, parsed) => {
                        if (err) {
                            this.logger.error(`Erreur parsing email #${currentSeqno}:`, err);
                        } else {
                            this.logger.debug(`Email #${currentSeqno} parsé. Sujet: ${parsed.subject}`);
                            const messageId = parsed.messageId || `seqno-${currentSeqno}`;
                            const payload: ImapEmailPayload = { seqno: currentSeqno, parsed, messageId };

                            this.eventEmitter.emitAsync(EMAIL_RECEIVED_EVENT, payload)
                                .then(() => this.logger.debug(`Événement ${EMAIL_RECEIVED_EVENT} émis (async) pour email #${currentSeqno}`))
                                .catch(emitError => this.logger.error(`Erreur émission ${EMAIL_RECEIVED_EVENT} pour #${currentSeqno}:`, emitError));
                        }
                        completedCount++;
                        checkCompletion();
                    });
                });
            });

            f.once('error', (err) => {
                this.logger.error('Erreur PENDANT le stream fetch IMAP:', err);
                clearTimeout(fetchTimeout);
                hasRejected = true;
                reject(err);
            });

            f.once('end', () => {
                this.logger.log(`Stream fetch IMAP terminé. Attente fin parsing ${uidsOrSeqnos.length}...`);
            });
        });
    }
}