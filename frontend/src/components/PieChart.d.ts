import React from "react";
/**
 * Définit les propriétés acceptées par le composant PieChart.
 * @property date? Date spécifique pour filtrer les données (format YYYY-MM-DD).
 * @property month? Mois spécifique pour filtrer les données (1-12). Nécessite `year`.
 * @property year? Année spécifique pour filtrer les données. Requis si `month` est fourni ou seul.
 * @property colors? Chaîne de couleurs personnalisées séparées par des virgules.
 * @property title Titre à afficher au-dessus du graphique.
 */
interface PieChartProps {
    date?: string;
    month?: number;
    year?: number;
    colors?: string;
    title: string;
}
/**
 * Composant React affichant un graphique en secteurs (Pie Chart) représentant
 * la distribution des tickets par type/catégorie pour une période donnée (jour, mois, année).
 * Récupère les données depuis l'API, calcule les pourcentages, trie les données,
 * rafraîchit périodiquement, et gère les états de chargement/erreur.
 * Utilise ReactApexCharts pour le rendu.
 *
 * @param props Les propriétés du composant, voir `PieChartProps`.
 * @returns Le composant JSX affichant le graphique ou un état alternatif.
 */
declare const PieChart: React.FC<PieChartProps>;
export default PieChart;
