import { Module } from '@nestjs/common';
import { StatistiquesService } from './statistiques.service';
import { StatistiquesController } from './statistiques.controller';

/**
 * Module NestJS encapsulant les fonctionnalités relatives aux statistiques.
 * Ce module déclare le contrôleur (`StatistiquesController`) et le service (`StatistiquesService`) associés.
 */
@Module({
    providers: [StatistiquesService],
    controllers: [StatistiquesController],
})
export class StatistiquesModule {}