import { Controller } from '@nestjs/common';
import { StatistiquesService } from './statistiques.service';

/**
 * Contrôleur destiné à gérer les requêtes HTTP relatives aux statistiques.
 * Les points d'accès (endpoints) spécifiques (Get, Post, etc.) sont définis
 * dans les méthodes de cette classe.
 * Route de base : /statistiques
 */
@Controller('statistiques')
export class StatistiquesController {
    /**
     * Injecte le service StatistiquesService pour accéder à la logique métier.
     * @param statistiquesService Le service utilisé pour calculer ou récupérer les statistiques.
     */
    constructor(private readonly statistiquesService: StatistiquesService) {}
}