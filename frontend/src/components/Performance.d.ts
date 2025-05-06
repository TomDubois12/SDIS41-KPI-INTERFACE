/**
 * Définit les propriétés acceptées par le composant Performance.
 * @property date La date (format YYYY-MM-DD) pour laquelle calculer la performance.
 */
interface PerformanceProps {
    date: string;
}
/**
 * Composant React affichant un indicateur de performance simple (✅ ou ❌).
 * La performance est déterminée en comparant le nombre de tickets résolus pour une date donnée
 * (récupéré via API) à un objectif fixe (moyenne).
 * Affiche une infobulle explicative au survol de l'indicateur.
 *
 * @param props Les propriétés du composant, voir `PerformanceProps`.
 * @returns Le composant JSX affichant l'indicateur de performance et son infobulle.
 */
declare const Performance: React.FC<PerformanceProps>;
export default Performance;
