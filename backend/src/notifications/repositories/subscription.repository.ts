// src/notifications/repositories/subscription.repository.ts

import { Injectable } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { Subscription } from '../entities/subscription.entity';
import { InjectDataSource } from '@nestjs/typeorm';

// Interface optionnelle pour les préférences
interface SubscriptionPreferences {
    notifyOnTicket?: boolean;
    notifyOnEmail?: boolean;
}


@Injectable()
export class SubscriptionRepository {
    // Garder l'accès au repository TypeORM sous-jacent
    private repository: Repository<Subscription>;

    constructor(
        @InjectDataSource('push_notifications_connection')
        private dataSource: DataSource,
    ) {
        this.repository = this.dataSource.getRepository(Subscription);
    }

    /** Récupère TOUS les abonnements. */
    async find(): Promise<Subscription[]> {
        return this.repository.find();
    }

    /** Récupère un abonnement par son endpoint unique. */
    async findOneByEndpoint(endpoint: string): Promise<Subscription | null> {
        return this.repository.findOne({ where: { endpoint } });
    }

    /** Récupère les abonnés aux notifications TICKET */
    async findTicketSubscribers(): Promise<Subscription[]> {
        return this.repository.find({ where: { notifyOnTicket: true } });
    }

    /** Récupère les abonnés aux notifications EMAIL */
    async findEmailSubscribers(): Promise<Subscription[]> {
        return this.repository.find({ where: { notifyOnEmail: true } });
    }

    /**
     * Crée et enregistre un NOUVEL abonnement.
     * Utilise les préférences par défaut de l'entité si non spécifiées.
     */
    async saveSubscription(
        endpoint: string,
        p256dh: string,
        auth: string,
        userId: number | null,
        initialPreferences?: SubscriptionPreferences
    ): Promise<Subscription> {
        const subscription = new Subscription();
        subscription.endpoint = endpoint;
        subscription.p256dh = p256dh;
        subscription.auth = auth;
        subscription.userId = userId;
        if (initialPreferences?.notifyOnTicket !== undefined) {
            subscription.notifyOnTicket = initialPreferences.notifyOnTicket;
        }
        if (initialPreferences?.notifyOnEmail !== undefined) {
            subscription.notifyOnEmail = initialPreferences.notifyOnEmail;
        }
        // save de TypeORM gère l'insertion ici car l'entité est nouvelle
        return this.repository.save(subscription);
    }

    /**
     * Met à jour les préférences pour un abonnement identifié par son endpoint.
     */
    async updatePreferencesByEndpoint(endpoint: string, preferences: SubscriptionPreferences): Promise<boolean> {
        const subscription = await this.findOneByEndpoint(endpoint);
        if (!subscription) return false;

        let needsUpdate = false;
        if (preferences.notifyOnTicket !== undefined && subscription.notifyOnTicket !== preferences.notifyOnTicket) {
            subscription.notifyOnTicket = preferences.notifyOnTicket;
            needsUpdate = true;
        }
        if (preferences.notifyOnEmail !== undefined && subscription.notifyOnEmail !== preferences.notifyOnEmail) {
            subscription.notifyOnEmail = preferences.notifyOnEmail;
            needsUpdate = true;
        }

        if (needsUpdate) {
            // save de TypeORM gère l'update car l'entité vient de la BDD (a un ID)
            await this.repository.save(subscription);
        }
        return true;
    }

    // --- NOUVELLE MÉTHODE SAVE PUBLIQUE ---
    /**
     * Sauvegarde une entité Subscription (création ou mise à jour).
     * Utile pour le service lorsqu'il modifie une entité existante.
     */
    public async save(subscription: Subscription): Promise<Subscription> {
        return this.repository.save(subscription);
    }
    // --- FIN NOUVELLE MÉTHODE SAVE ---


    /** Supprime un abonnement par son ID primaire. */
    async delete(id: number): Promise<void> {
        await this.repository.delete(id);
    }

     /** Supprime un abonnement par son endpoint. */
     async deleteByEndpoint(endpoint: string): Promise<boolean> {
         const result = await this.repository.delete({ endpoint });
         return result.affected !== undefined && result.affected !== null && result.affected > 0;
     }

} // Fin classe SubscriptionRepository