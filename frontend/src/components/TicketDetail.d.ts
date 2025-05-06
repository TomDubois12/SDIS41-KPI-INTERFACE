import React from 'react';
/**
 * Composant React affichant les détails complets d'un ticket Clarilog spécifique.
 * L'ID du ticket est récupéré depuis le paramètre 'id' de l'URL (`?id=...`).
 * Récupère les informations détaillées via un appel API, formate certains noms,
 * et affiche les données dans une mise en page structurée avec des styles conditionnels.
 * Gère les états de chargement et d'erreur. Le bouton "Retour" a un comportement adaptatif.
 *
 * @returns Le composant JSX affichant les détails du ticket ou un état alternatif.
 */
declare const ClarilogTicketDetail: React.FC;
export default ClarilogTicketDetail;
