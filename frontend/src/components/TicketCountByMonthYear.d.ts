/**
 * Définit les propriétés acceptées par le composant TicketCountByMonthYear.
 * @property month Le mois (numérique, 1-12) pour lequel récupérer les statistiques.
 * @property year L'année (numérique) pour laquelle récupérer les statistiques.
 */
interface TicketCountByMonthYearProps {
    month: number;
    year: number;
}
/**
 * Composant React affichant le nombre de tickets créés et résolus
 * pour un mois et une année spécifiques, fournis via les props.
 * Récupère les données depuis l'API et gère les états de chargement et d'erreur.
 *
 * @param props Les propriétés du composant, voir `TicketCountByMonthYearProps`.
 * @returns Le composant JSX affichant les compteurs ou les états alternatifs.
 */
export default function TicketCountByMonthYear({ month, year }: TicketCountByMonthYearProps): import("react/jsx-runtime").JSX.Element;
export {};
