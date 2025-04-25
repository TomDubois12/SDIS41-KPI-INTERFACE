import { IsString, IsNotEmpty } from 'class-validator';

export class SubscribeKeysDto {
    @IsString()
    @IsNotEmpty()
    p256dh: string;

    @IsString()
    @IsNotEmpty()
    auth: string;
}