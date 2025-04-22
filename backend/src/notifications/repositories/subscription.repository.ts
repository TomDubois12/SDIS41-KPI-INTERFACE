// Dans src/notifications/repositories/subscription.repository.ts

import { Injectable } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { Subscription } from '../entities/subscription.entity';
import { InjectDataSource } from '@nestjs/typeorm';

@Injectable()
export class SubscriptionRepository {
    private repository: Repository<Subscription>;

    constructor(
        @InjectDataSource('push_notifications_connection')
        private dataSource: DataSource,
    ) {
        this.repository = this.dataSource.getRepository(Subscription);
    }

    async find(): Promise<Subscription[]> {
        return this.repository.find();
    }

    async findOneByEndpoint(endpoint: string): Promise<Subscription | null> {
        return this.repository.findOne({ where: { endpoint } });
    }

    async saveSubscription(endpoint: string, p256dh: string, auth: string, userId: number | null): Promise<Subscription> {
        const subscription = new Subscription();
        subscription.endpoint = endpoint;
        subscription.p256dh = p256dh;
        subscription.auth = auth;
        subscription.userId = userId;
        return this.repository.save(subscription);
    }

    // Ajoutez cette méthode pour supprimer un abonnement
    async delete(id: number): Promise<void> {
        await this.repository.delete(id);
    }
}