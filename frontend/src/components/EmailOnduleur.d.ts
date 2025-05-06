/**
 * Définit la structure d'un objet email Onduleur après traitement et extraction des données pertinentes.
 * @property id Identifiant unique de l'email (probablement messageId).
 * @property type Type d'email déterminé (ex: 'Administratif', 'Alerte').
 * @property message Le message principal extrait de l'email.
 * @property event L'événement spécifique rapporté par l'onduleur.
 * @property timestamp L'horodatage de l'événement fourni dans l'email.
 */
interface EmailOnduleur {
    id: number | string;
    type: string;
    message: string;
    event: string;
    timestamp: string;
}
/**
 * Composant React affichant une liste des emails provenant des onduleurs dans un tableau.
 * Récupère les données depuis l'API `/emails_onduleurs` et rafraîchit la liste périodiquement.
 * Gère les états de chargement et d'erreur. Applique un style différent aux lignes
 * du tableau selon le type d'email ('Administratif' ou 'Alerte').
 *
 * @returns Le composant JSX affichant le titre, le tableau des emails ou les états alternatifs.
 */
declare function EmailOnduleur(): import("react/jsx-runtime").JSX.Element;
export default EmailOnduleur;
