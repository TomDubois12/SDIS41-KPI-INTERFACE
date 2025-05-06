import React from "react";
/**
 * Définit les propriétés acceptées par le composant BarChart.
 * @property date? Date spécifique pour filtrer les données (format YYYY-MM-DD).
 * @property month? Mois spécifique pour filtrer les données (1-12). Nécessite `year`.
 * @property year? Année spécifique pour filtrer les données. Requis si `month` est fourni.
 * @property colors? Couleurs personnalisées pour le graphique (chaîne ou tableau de chaînes).
 * @property title Titre à afficher au-dessus du graphique.
 */
interface BarChartProps {
    date?: string;
    month?: number;
    year?: number;
    colors?: string | string[];
    title: string;
}
/**
 * Composant React affichant un graphique en barres (Bar Chart) représentant
 * le nombre de tickets par opérateur pour une période donnée (jour, mois, année).
 * Récupère les données depuis une API, les rafraîchit périodiquement,
 * gère les états de chargement et d'erreur, et formate les noms d'opérateurs.
 * Utilise la librairie ReactApexCharts pour le rendu du graphique.
 *
 * @param props Les propriétés du composant, voir `BarChartProps`.
 * @returns Le composant JSX affichant le graphique ou un état (chargement, erreur, pas de données).
 */
declare const BarChart: React.FC<BarChartProps>;
export default BarChart;
