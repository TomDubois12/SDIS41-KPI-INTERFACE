import { IsString, IsNotEmpty, IsUrl } from 'class-validator';

export class GetPreferencesDto {
    @IsNotEmpty({ message: 'Le paramètre endpoint ne peut pas être vide.' })
    @IsString({ message: 'Le paramètre endpoint doit être une chaîne de caractères.' })
    @IsUrl({ require_protocol: true, protocols: ['https', 'http'] }, { message: 'Le paramètre endpoint doit être une URL valide (http ou https).' })
    endpoint: string;
}