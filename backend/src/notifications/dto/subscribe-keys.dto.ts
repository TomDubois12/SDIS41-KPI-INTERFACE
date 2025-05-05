import { IsString, IsNotEmpty } from 'class-validator';

/**
 * Data Transfer Object (DTO) représentant les clés cryptographiques
 * d'un abonnement Web Push (`PushSubscriptionKeys`).
 * Utilisé pour valider les données des clés lors de l'enregistrement d'un abonnement.
 */
export class SubscribeKeysDto {
    /**
     * La clé publique P-256 ECDH de l'abonnement push, encodée en base64url.
     * Doit être une chaîne de caractères non vide.
     */
    @IsString()
    @IsNotEmpty()
    p256dh: string;

    /**
     * Le secret d'authentification de l'abonnement push, encodé en base64url.
     * Doit être une chaîne de caractères non vide.
     */
    @IsString()
    @IsNotEmpty()
    auth: string;
}