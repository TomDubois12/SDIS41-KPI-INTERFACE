/**
 * Composant React représentant la page d'affichage des performances et statistiques
 * Clarilog pour une année spécifique.
 * Récupère l'année à afficher depuis les paramètres de l'URL (`?year=Y`).
 * Orchestre l'affichage de plusieurs sous-composants :
 * - `Header` : L'en-tête de la page.
 * - `YearPicker` : Permet de changer l'année affichée (et met à jour l'URL).
 * - `TicketCountByYear` : Affiche les compteurs de tickets créés/résolus pour l'année.
 * - `BarChart` : Graphique en barres des tickets par opérateur pour l'année.
 * - `PieChart` : Graphique en secteurs des tickets par type pour l'année.
 * Fournit un bouton pour revenir à la vue mensuelle courante.
 *
 * @returns Le composant JSX de la page des statistiques annuelles Clarilog.
 */
declare const ClarilogAnnuel: React.FC;
export default ClarilogAnnuel;
