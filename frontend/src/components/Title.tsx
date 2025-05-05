import styles from '../styles/components/Title.module.scss'; // Assurez-vous que le chemin est correct

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
const Title = ({ text }: TitleProps) => {
    return (
        <div className={styles.title}>
            <h1>{text}</h1>
        </div>
    );
};
export default Title;