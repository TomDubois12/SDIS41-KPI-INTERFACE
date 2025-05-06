/**
 * Définit les propriétés acceptées par le composant DisponibiliteESX.
 * @property onAvailabilityData Fonction de rappel appelée lorsque les données de disponibilité sont validées,
 * transmettant la valeur de disponibilité (ex: pourcentage) au composant parent.
 */
interface DisponibiliteESXProps {
    onAvailabilityData: (availability: string) => void;
}
/**
 * Composant React permettant à l'utilisateur de téléverser un fichier CSV
 * contenant des données de disponibilité ESX. Le fichier est envoyé à une API
 * pour validation et traitement. Le composant affiche ensuite la disponibilité calculée
 * (typiquement `upMeanTime`) et offre la possibilité d'afficher les données détaillées
 * retournées par l'API dans un tableau. Utilise `react-dropzone` pour le téléversement.
 *
 * @param props Les propriétés du composant, voir `DisponibiliteESXProps`.
 * @returns Le composant JSX gérant l'upload et l'affichage des résultats.
 */
export default function DisponibiliteESX({ onAvailabilityData }: DisponibiliteESXProps): import("react/jsx-runtime").JSX.Element;
export {};
