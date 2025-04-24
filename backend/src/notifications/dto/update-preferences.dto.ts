// src/notifications/dto/update-preferences.dto.ts (Nouveau fichier)
import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class UpdatePreferencesDto {
    @IsString()
    @IsNotEmpty()
    endpoint: string; // Endpoint unique pour identifier l'abonnement

    @IsBoolean()
    @IsOptional() // Permet de ne mettre à jour qu'une préférence si souhaité
    notifyOnTicket?: boolean;

    @IsBoolean()
    @IsOptional()
    notifyOnEmail?: boolean;
}