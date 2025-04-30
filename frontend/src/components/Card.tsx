import { Link } from "react-router-dom";

import Button from './Button'; // Assurez-vous que le chemin est correct

import styles from '../styles/components/Card.module.scss'; // Assurez-vous que le chemin est correct

/**
 * Définit les propriétés acceptées par le composant Card.
 * @property img Le chemin (URL ou import) vers l'image à afficher dans la carte.
 * @property text Le texte principal (titre) de la carte. Utilisé aussi comme texte alternatif pour l'image.
 * @property buttonText Le texte à afficher sur le bouton de la carte.
 * @property path Le chemin de destination vers lequel le bouton doit naviguer (utilisé avec react-router Link).
 */
interface CardProps {
    img: string;
    text: string;
    buttonText: string;
    path: string;
}

/**
 * Composant React représentant une carte (card) visuelle simple.
 * Affiche une image, un titre et un bouton qui sert de lien de navigation
 * vers un chemin spécifié via react-router. Utilise le composant Button personnalisé.
 *
 * @param props Les propriétés du composant, voir `CardProps`.
 * @returns Le composant JSX représentant la carte.
 */
const Card = ({ img, text, buttonText, path }: CardProps) => {
    return (
        <div className={styles.card}>
            <div className={styles.imageContainer}>
                <img src={img} alt={text} className={styles.img} />
            </div>
            <div className={styles.titleContainer}>
                <h1>{text}</h1>
            </div>
            <div className={styles.buttonContainer}>
                <Link to={path}>
                    <Button
                        backgroundColor={'#2B3244'}
                        text={buttonText}
                        textColor={'white'}
                    />
                </Link>
            </div>
        </div>
    );
};
export default Card;