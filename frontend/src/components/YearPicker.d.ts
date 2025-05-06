import React from 'react';
/**
 * Définit les propriétés acceptées par le composant YearPicker.
 * @property initialYear? L'année initiale à sélectionner dans le dropdown. Défaut: année actuelle.
 */
interface YearPickerProps {
    initialYear?: number;
}
/**
 * Composant React affichant un menu déroulant (`<select>`) permettant à l'utilisateur
 * de choisir une année parmi une plage prédéfinie (les 15 dernières années).
 * Lors de la sélection d'une année, le composant navigue vers la page
 * des statistiques annuelles correspondante (`/clarilog_annuel`).
 *
 * @param props Les propriétés du composant, voir `YearPickerProps`.
 * @returns Le composant JSX affichant le sélecteur d'année.
 */
declare const YearPicker: React.FC<YearPickerProps>;
export default YearPicker;
