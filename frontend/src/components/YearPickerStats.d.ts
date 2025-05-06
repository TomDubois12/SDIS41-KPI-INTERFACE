import React from 'react';
/**
 * Définit les propriétés initiales optionnelles pour le composant sélecteur d'année.
 * @property initialYear? L'année initiale à sélectionner. Défaut: année actuelle.
 */
interface YearPickerProps {
    initialYear?: number;
}
/**
 * Définit l'interface de la "poignée" (handle) exposée par le composant via `ref`.
 * Permet aux composants parents d'appeler des méthodes sur ce composant.
 * @property getTicketData Méthode pour récupérer les données de tickets calculées.
 */
export interface YearPickerStatsHandle {
    getTicketData: () => {
        countTicketCreated: number | null;
        resolutionRate: string | null;
    };
}
/**
 * Composant React (actuellement nommé MonthPickerStats mais fonctionnant comme YearPickerStats)
 * permettant à l'utilisateur de sélectionner une année via un menu déroulant.
 * Récupère les statistiques de tickets (créés, résolus) pour l'année sélectionnée
 * depuis une API, calcule le taux de résolution, et affiche ces informations.
 * Navigue vers une URL `/statistiques_annuelles` lors du changement d'année.
 * Expose une méthode `getTicketData` via `ref` pour que les composants parents
 * puissent récupérer les statistiques calculées. Utilise `forwardRef`.
 *
 * @param props Les propriétés initiales optionnelles, voir `YearPickerProps`.
 * @param ref La ref transférée depuis le composant parent pour l'accès impératif.
 * @returns Le composant JSX avec le sélecteur d'année et les statistiques affichées.
 */
declare const MonthPickerStats: React.ForwardRefExoticComponent<YearPickerProps & React.RefAttributes<YearPickerStatsHandle>>;
export default MonthPickerStats;
