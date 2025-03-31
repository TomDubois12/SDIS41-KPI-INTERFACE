import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { FileUploadCleanupService } from './FileUploadCleanupService';

@Module({
    imports: [ScheduleModule.forRoot()], // Important: Import and register ScheduleModule
    providers: [FileUploadCleanupService],
    exports: [FileUploadCleanupService], // If you need to use this service elsewhere
})
export class UtilsModule {}