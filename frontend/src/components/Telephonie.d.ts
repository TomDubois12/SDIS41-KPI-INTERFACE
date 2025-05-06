/**
 * Définit les propriétés acceptées par le composant Telephonie.
 * @property onMaintenanceDataChange Fonction de rappel appelée lorsque l'état de maintenance
 * ou le nombre de minutes change. Reçoit le nouvel état de maintenance (booléen)
 * et les minutes (chaîne) en arguments.
 */
interface TelephonieProps {
    onMaintenanceDataChange: (maintenance: boolean, minutes: string) => void;
}
/**
 * Composant React permettant à l'utilisateur d'indiquer si une maintenance
 * a eu lieu sur la téléphonie et, le cas échéant, d'en saisir la durée en minutes.
 * Affiche un taux de disponibilité simplifié (100% ou 99.9%) basé sur l'état de maintenance.
 * Informe le composant parent des changements via la fonction de rappel `onMaintenanceDataChange`.
 *
 * @param props Les propriétés du composant, voir `TelephonieProps`.
 * @returns Le composant JSX avec la case à cocher et le champ de saisie conditionnel.
 */
export default function Telephonie({ onMaintenanceDataChange }: TelephonieProps): import("react/jsx-runtime").JSX.Element;
export {};
