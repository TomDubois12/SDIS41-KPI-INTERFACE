/**
 * Définit les propriétés acceptées par le composant Title.
 * @property text Le texte à afficher comme titre principal.
 */
interface TitleProps {
    text: string;
}
/**
 * Composant React simple affichant un titre principal (balise `<h1>`)
 * à l'intérieur d'un conteneur `div` stylisé.
 *
 * @param props Les propriétés du composant, voir `TitleProps`.
 * @returns Le composant JSX affichant le titre.
 */
declare const Title: ({ text }: TitleProps) => import("react/jsx-runtime").JSX.Element;
export default Title;
