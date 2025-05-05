import { IsString, IsNotEmpty, IsUrl } from 'class-validator';

/**
 * Data Transfer Object (DTO) utilisé pour valider les données nécessaires
 * au désabonnement d'une notification push.
 * Le désabonnement est identifié par l'URL unique (endpoint) de l'abonnement.
 */
export class UnsubscribeDto {
    /**
     * L'URL unique (endpoint) de l'abonnement push qui doit être supprimé.
     * Doit être une chaîne de caractères non vide et une URL valide (http ou https).
     */
    @IsNotEmpty({ message: "L'endpoint ne peut pas être vide." })
    @IsString()
    @IsUrl(
        {
            require_protocol: true,
            protocols: ['https', 'http']
        },
        {
            message: "L'endpoint doit être une URL valide."
        }
    )
    endpoint: string;
}