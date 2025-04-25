// src/notifications/dto/get-preferences.dto.ts (Nouveau fichier)
import { IsString, IsNotEmpty, IsUrl } from 'class-validator';

/**
 * DTO pour valider le paramètre 'endpoint' de la requête GET /preferences
 */
export class GetPreferencesDto {
    @IsNotEmpty({ message: 'Le paramètre endpoint ne peut pas être vide.' })
    @IsString({ message: 'Le paramètre endpoint doit être une chaîne de caractères.' })
    // Ajoute une validation basique pour s'assurer que c'est une URL https ou http
    // Attention: ceci n'est pas exhaustif pour tous les types d'endpoints push possibles
    @IsUrl({ require_protocol: true, protocols: ['https', 'http'] }, { message: 'Le paramètre endpoint doit être une URL valide (http ou https).' })
    endpoint: string;
}