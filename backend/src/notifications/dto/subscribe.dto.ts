import { IsNotEmpty, IsObject, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { SubscribeKeysDto } from './subscribe-keys.dto';

/**
 * Data Transfer Object (DTO) représentant un objet d'abonnement Web Push complet.
 * Utilisé pour valider les données d'un nouvel abonnement push reçu du client.
 * Inclut le point de terminaison (endpoint) et les clés cryptographiques.
 */
export class SubscribeDto {
    /**
     * L'URL unique fournie par le service push pour envoyer des notifications
     * à cet abonnement spécifique.
     * Doit être une chaîne de caractères non vide.
     */
    @IsString()
    @IsNotEmpty()
    endpoint: string;

    /**
     * L'objet contenant les clés cryptographiques nécessaires pour chiffrer
     * les notifications push (p256dh et auth).
     * Doit être un objet non vide, et ses propriétés sont validées
     * en utilisant les règles définies dans `SubscribeKeysDto`.
     */
    @IsObject()
    @IsNotEmpty()
    @ValidateNested() // Indique qu'il faut valider l'objet imbriqué
    @Type(() => SubscribeKeysDto) // Nécessaire pour class-transformer et la validation imbriquée
    keys: SubscribeKeysDto;
}