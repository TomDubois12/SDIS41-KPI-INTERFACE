import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

/**
 * Data Transfer Object (DTO) utilisé pour valider les données lors de la mise à jour
 * des préférences de notification pour un abonnement push spécifique,
 * identifié par son endpoint.
 */
export class UpdatePreferencesDto {
    /**
     * L'URL unique (endpoint) de l'abonnement push dont les préférences doivent être mises à jour.
     * Doit être une chaîne de caractères non vide.
     */
    @IsString()
    @IsNotEmpty()
    endpoint: string;

    /**
     * Préférence de l'utilisateur pour recevoir des notifications concernant les tickets.
     * Si fourni, doit être un booléen. Optionnel.
     */
    @IsBoolean()
    @IsOptional()
    notifyOnTicket?: boolean;

    /**
     * Préférence de l'utilisateur pour recevoir des notifications concernant les emails.
     * Si fourni, doit être un booléen. Optionnel.
     */
    @IsBoolean()
    @IsOptional()
    notifyOnEmail?: boolean;
}