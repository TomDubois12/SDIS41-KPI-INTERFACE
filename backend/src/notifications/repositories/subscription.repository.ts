import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

import { Subscription } from '../entities/subscription.entity';

interface SubscriptionPreferences {
    notifyOnTicket?: boolean;
    notifyOnEmail?: boolean;
}

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

    async findTicketSubscribers(): Promise<Subscription[]> {
        return this.repository.find({ where: { notifyOnTicket: true } });
    }

    async findEmailSubscribers(): Promise<Subscription[]> {
        return this.repository.find({ where: { notifyOnEmail: true } });
    }

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
        return this.repository.save(subscription);
    }

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
            await this.repository.save(subscription);
        }
        return true;
    }

    public async save(subscription: Subscription): Promise<Subscription> {
        return this.repository.save(subscription);
    }

    async delete(id: number): Promise<void> {
        await this.repository.delete(id);
    }

    async deleteByEndpoint(endpoint: string): Promise<boolean> {
        const result = await this.repository.delete({ endpoint });
        return result.affected !== undefined && result.affected !== null && result.affected > 0;
    }
}