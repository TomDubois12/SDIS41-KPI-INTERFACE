import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

/**
 * Service destiné à contenir la logique métier pour le calcul et la récupération
 * des statistiques de l'application.
 * Interagit probablement avec la base de données via l'instance DataSource injectée.
 */
@Injectable()
export class StatistiquesService {
    /**
     * Injecte l'instance DataSource de TypeORM pour permettre les interactions
     * avec la base de données (ex: requêtes SQL complexes, agrégations).
     * @param dataSource L'instance DataSource fournie par TypeORM.
     */
    constructor(private dataSource: DataSource) {}
}