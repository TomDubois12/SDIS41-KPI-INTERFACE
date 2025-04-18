import { IsNotEmpty, IsObject, IsString } from 'class-validator';
import { SubscribeKeysDto } from './subscribe-keys.dto';

export class SubscribeDto {
    @IsString()
    @IsNotEmpty()
    endpoint: string;

    @IsObject()
    @IsNotEmpty()
    keys: SubscribeKeysDto;
}