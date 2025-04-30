import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class UpdatePreferencesDto {
    @IsString()
    @IsNotEmpty()
    endpoint: string;

    @IsBoolean()
    @IsOptional()
    notifyOnTicket?: boolean;

    @IsBoolean()
    @IsOptional()
    notifyOnEmail?: boolean;
}