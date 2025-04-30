import { IsString, IsNotEmpty, IsUrl } from 'class-validator';

export class UnsubscribeDto {
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