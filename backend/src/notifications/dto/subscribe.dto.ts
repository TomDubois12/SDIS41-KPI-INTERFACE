import { IsNotEmpty, IsObject, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { SubscribeKeysDto } from './subscribe-keys.dto';

export class SubscribeDto {
    @IsString()
    @IsNotEmpty()
    endpoint: string;

    @IsObject()
    @IsNotEmpty()
    @ValidateNested()
    @Type(() => SubscribeKeysDto)
    keys: SubscribeKeysDto;
}
