import { Module } from '@nestjs/common';

import { FileUploadCleanupService } from './FileUploadCleanupService';

@Module({
    providers: [FileUploadCleanupService],
    exports: [FileUploadCleanupService],
})
export class UtilsModule { }