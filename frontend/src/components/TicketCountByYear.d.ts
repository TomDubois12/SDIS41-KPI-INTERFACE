/**
 * Définit les propriétés acceptées par le composant TicketCountByYear.
 * @property year L'année (numérique) pour laquelle récupérer les statistiques.
 */
interface TicketCountByYearProps {
    year: number;
}
/**
 * Composant React affichant le nombre de tickets créés et résolus
 * pour une année spécifiques, fournie via les props.
 * Récupère les données depuis l'API et gère les états de chargement et d'erreur.
 *
 * @param props Les propriétés du composant, voir `TicketCountByYearProps`.
 * @returns Le composant JSX affichant les compteurs ou les états alternatifs.
 */
export default function TicketCountByYear({ year }: TicketCountByYearProps): import("react/jsx-runtime").JSX.Element;
export {};
