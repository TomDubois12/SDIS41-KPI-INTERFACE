/**
 * Définit la structure d'un objet email INPT après traitement et extraction des données pertinentes.
 * Utilisé pour typer les données affichées dans le tableau.
 * @property id Identifiant unique de l'email (messageId ou seqno).
 * @property from? L'expéditeur de l'email.
 * @property subject? Le sujet de l'email.
 * @property date? La date de réception de l'email.
 * @property numeroOperation? Le numéro d'opération extrait du sujet ou du corps.
 * @property nomSite? Le nom du site extrait du sujet ou du corps.
 * @property dateHeure? La date/heure de l'événement extrait du sujet ou du corps.
 * @property text? Le corps texte de l'email.
 * @property typeEmail? Le type d'email déterminé ('operation', 'incident_debut', 'incident_fin').
 * @property status? Le statut calculé de l'opération ('✅', '🔃', '❌').
 */
interface EmailINPT {
    id: number | string;
    from?: string;
    subject?: string;
    date?: string | Date;
    numeroOperation?: string | null;
    nomSite?: string | null;
    dateHeure?: string | null;
    text?: string;
    typeEmail?: 'operation' | 'incident_debut' | 'incident_fin';
    status?: string;
}
/**
 * Composant React affichant une liste des emails INPT de type 'operation' dans un tableau.
 * Récupère les données depuis l'API `/emails_impt`, filtre les emails pour ne garder que
 * les opérations, et rafraîchit la liste périodiquement.
 * Gère les états de chargement et d'erreur.
 *
 * @returns Le composant JSX affichant le titre, le tableau des emails ou les états alternatifs.
 */
declare function EmailINPT(): import("react/jsx-runtime").JSX.Element;
export default EmailINPT;
