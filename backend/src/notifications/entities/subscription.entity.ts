// src/notifications/entities/subscription.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('subscriptions') // Le nom de la table dans la base de données MySQL
export class Subscription {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 768, unique: true })
    endpoint: string;

    @Column()
    p256dh: string;

    @Column()
    auth: string;

    @Column({ type: 'int', nullable: true, name: 'user_id' }) // Colonne user_id, peut être null
    userId: number | null;

    @CreateDateColumn()
    createdAt: Date;

    // --- NOUVELLES COLONNES POUR LES PRÉFÉRENCES ---

    /**
     * Indique si l'utilisateur souhaite recevoir des notifications pour les nouveaux tickets.
     * Par défaut à true lors de la création de l'abonnement.
     */
    @Column({ type: 'boolean', default: true, name: 'notify_on_ticket' })
    notifyOnTicket: boolean;

    /**
     * Indique si l'utilisateur souhaite recevoir des notifications pour les nouveaux emails
     * (peut être affiné plus tard si nécessaire pour INPT vs Onduleur).
     * Par défaut à true lors de la création de l'abonnement.
     */
    @Column({ type: 'boolean', default: true, name: 'notify_on_email' })
    notifyOnEmail: boolean;

    // --- FIN DES NOUVELLES COLONNES ---
}