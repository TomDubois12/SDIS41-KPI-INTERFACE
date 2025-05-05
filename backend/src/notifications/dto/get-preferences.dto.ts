import { IsString, IsNotEmpty, IsUrl } from 'class-validator';

/**
 * Data Transfer Object (DTO) utilisé pour valider les données nécessaires
 * à la récupération des préférences utilisateur associées à un endpoint spécifique.
 */
export class GetPreferencesDto {
    /**
     * L'URL du point de terminaison (endpoint) pour lequel les préférences sont demandées.
     * Doit être une chaîne de caractères non vide et une URL valide (http ou https).
     */
    @IsNotEmpty({ message: 'Le paramètre endpoint ne peut pas être vide.' })
    @IsString({ message: 'Le paramètre endpoint doit être une chaîne de caractères.' })
    @IsUrl({ require_protocol: true, protocols: ['https', 'http'] }, { message: 'Le paramètre endpoint doit être une URL valide (http ou https).' })
    endpoint: string;
}