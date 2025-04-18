import { Repository } from 'typeorm';
import { Subscription } from '../entities/subscription.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class SubscriptionRepository extends Repository<Subscription> {
    constructor(
        @InjectRepository(Subscription)
        repository: Repository<Subscription>,
    ) {
        super(repository.target, repository.manager, repository.queryRunner);
    }

    async saveSubscription(endpoint: string, p256dh: string, auth: string, userId: number | null): Promise<Subscription> {
        const subscription = new Subscription();
        subscription.endpoint = endpoint;
        subscription.p256dh = p256dh;
        subscription.auth = auth;
        subscription.userId = userId; // Laissez ceci tel quel, car l'entité est corrigée

        return await this.save(subscription);
    }

    async findOneByEndpoint(endpoint: string): Promise<Subscription | undefined> {
        const subscription = await this.findOne({ where: { endpoint } });
        if (!subscription) {
            return undefined;
        }
        return subscription as Subscription; // Type assertion ici
    }

    // Vous pouvez ajouter d'autres méthodes pour récupérer, supprimer des abonnements, etc.
}