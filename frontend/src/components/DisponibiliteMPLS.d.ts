/**
 * Définit les propriétés acceptées par le composant DisponibiliteMPLS.
 * @property onAvailabilityData Fonction de rappel appelée lorsque les données de disponibilité sont validées,
 * transmettant la valeur de disponibilité (ex: pourcentage) au composant parent.
 */
interface DisponibiliteMPLSProps {
    onAvailabilityData: (availability: string) => void;
}
/**
 * Composant React permettant à l'utilisateur de téléverser un fichier CSV
 * contenant des données de disponibilité MPLS. Le fichier est envoyé à une API
 * pour validation et traitement. Le composant affiche ensuite la disponibilité calculée
 * (typiquement `upMeanTime`) et offre la possibilité d'afficher les données détaillées
 * retournées par l'API dans un tableau. Utilise `react-dropzone` pour le téléversement.
 * Ce composant est structurellement très similaire à `DisponibiliteESX`.
 *
 * @param props Les propriétés du composant, voir `DisponibiliteMPLSProps`.
 * @returns Le composant JSX gérant l'upload et l'affichage des résultats.
 */
export default function DisponibiliteMPLS({ onAvailabilityData }: DisponibiliteMPLSProps): import("react/jsx-runtime").JSX.Element;
export {};
