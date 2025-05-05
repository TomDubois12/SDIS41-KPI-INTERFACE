import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

/**
 * Entité TypeORM représentant un enregistrement d'abonnement Web Push
 * dans la table 'subscriptions'. Stocke les informations nécessaires
 * pour envoyer des notifications push à un utilisateur/appareil spécifique.
 */
@Entity('subscriptions')
export class Subscription {
    /**
     * Identifiant unique auto-incrémenté de l'enregistrement d'abonnement (clé primaire).
     */
    @PrimaryGeneratedColumn()
    id: number;

    /**
     * L'URL unique (endpoint) fournie par le service push (navigateur/OS)
     * pour cet abonnement spécifique. Utilisée comme identifiant unique métier.
     */
    @Column({ length: 768, unique: true })
    endpoint: string;

    /**
     * La clé publique P-256 ECDH de l'abonnement, encodée en base64url,
     * utilisée pour le chiffrement des notifications.
     */
    @Column()
    p256dh: string;

    /**
     * Le secret d'authentification de l'abonnement, encodé en base64url,
     * utilisé pour sécuriser l'envoi des notifications.
     */
    @Column()
    auth: string;

    /**
     * Identifiant de l'utilisateur associé à cet abonnement (optionnel).
     * Permet de lier un abonnement à un compte utilisateur spécifique.
     * Correspond à la colonne 'user_id' dans la base de données.
     */
    @Column({
        type: 'int',
        nullable: true,
        name: 'user_id'
    })
    userId: number | null;

    /**
     * Date et heure de création de l'enregistrement d'abonnement.
     * Gérée automatiquement par TypeORM.
     */
    @CreateDateColumn()
    createdAt: Date;

    /**
     * Préférence de l'utilisateur pour recevoir des notifications concernant les tickets.
     * Vrai par défaut. Correspond à la colonne 'notify_on_ticket'.
     */
    @Column({
        type: 'boolean',
        default: true,
        name: 'notify_on_ticket'
    })
    notifyOnTicket: boolean;

    /**
     * Préférence de l'utilisateur pour recevoir des notifications concernant les emails.
     * Vrai par défaut. Correspond à la colonne 'notify_on_email'.
     */
    @Column({
        type: 'boolean',
        default: true,
        name: 'notify_on_email'
    })
    notifyOnEmail: boolean;
}