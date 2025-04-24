// src/notifications/dto/unsubscribe.dto.ts
import { IsString, IsNotEmpty, IsUrl } from 'class-validator';

export class UnsubscribeDto {
    @IsNotEmpty({ message: "L'endpoint ne peut pas être vide." })
    @IsString()
    // Garder une validation basique pour l'URL de l'endpoint
    @IsUrl({ require_protocol: true, protocols: ['https', 'http'] }, { message: "L'endpoint doit être une URL valide." })
    endpoint: string;
}