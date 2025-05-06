/**
 * Définit les propriétés acceptées par le composant Header.
 * @property text Le texte à afficher comme titre principal dans l'en-tête.
 */
interface HeaderProps {
    text: string;
}
/**
 * Composant React représentant l'en-tête (header) de l'application.
 * Affiche un logo cliquable redirigeant vers le hub, le titre de la page actuelle
 * (via le composant `Title`), et un composant pour les paramètres (`Parametres`).
 * Inclut également une structure alternative (potentiellement masquée par CSS ou pour
 * d'autres états) contenant un bouton de retour en plus des autres éléments.
 *
 * @param props Les propriétés du composant, voir `HeaderProps`.
 * @returns Le composant JSX représentant l'en-tête.
 */
declare const Header: ({ text }: HeaderProps) => import("react/jsx-runtime").JSX.Element;
export default Header;
