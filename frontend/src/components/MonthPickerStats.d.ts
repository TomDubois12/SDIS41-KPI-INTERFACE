import React from 'react';
/**
 * Définit les propriétés initiales optionnelles pour le composant MonthPickerStats.
 * @property initialMonth? Le mois initial à sélectionner (1-12). Défaut: mois actuel.
 * @property initialYear? L'année initiale à sélectionner. Défaut: année actuelle.
 */
interface MonthPickerProps {
    initialMonth?: number;
    initialYear?: number;
}
/**
 * Définit l'interface de la "poignée" (handle) exposée par le composant via `ref`.
 * Permet aux composants parents d'appeler des méthodes sur ce composant.
 * @property getTicketData Méthode pour récupérer les données de tickets calculées par ce composant.
 */
export interface MonthPickerStatsHandle {
    getTicketData: () => {
        countTicketCreated: number | null;
        resolutionRate: string | null;
    };
}
/**
 * Composant React permettant à l'utilisateur de sélectionner un mois et une année.
 * Récupère les statistiques de tickets (créés, résolus) pour la période sélectionnée
 * depuis une API, calcule le taux de résolution, et affiche ces informations.
 * Navigue vers une URL `/statistiques_mensuelles` lors du changement de mois ou d'année.
 * Expose une méthode `getTicketData` via `ref` pour que les composants parents
 * puissent récupérer les statistiques calculées. Utilise `forwardRef`.
 *
 * @param props Les propriétés initiales optionnelles, voir `MonthPickerProps`.
 * @param ref La ref transférée depuis le composant parent pour l'accès impératif.
 * @returns Le composant JSX avec les sélecteurs de mois/année et les statistiques affichées.
 */
declare const MonthPickerStats: React.ForwardRefExoticComponent<MonthPickerProps & React.RefAttributes<MonthPickerStatsHandle>>;
export default MonthPickerStats;
