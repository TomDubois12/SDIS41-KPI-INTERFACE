import styles from '../styles/components/Button.module.scss'; // Assurez-vous que le chemin est correct

/**
 * Définit les propriétés acceptées par le composant Button.
 * @property onClick? La fonction à exécuter lors du clic sur le bouton. Optionnel.
 * @property backgroundColor La couleur de fond du bouton (CSS).
 * @property text Le texte à afficher à l'intérieur du bouton.
 * @property textColor La couleur du texte du bouton (CSS).
 * @property className? Classes CSS additionnelles à appliquer au bouton. Optionnel.
 * @property disabled? Si vrai, désactive le bouton. Optionnel (défaut: false).
 */
interface ButtonProps {
    onClick?: () => void;
    backgroundColor: string;
    text: string;
    textColor: string;
    className?: string;
    disabled?: boolean;
}

/**
 * Composant React simple pour afficher un bouton HTML standard.
 * Permet la personnalisation de l'action au clic, des couleurs de fond et de texte,
 * du contenu textuel, des classes CSS additionnelles, et de l'état activé/désactivé.
 *
 * @param props Les propriétés du composant, voir `ButtonProps`.
 * @returns Le composant JSX représentant le bouton.
 */
const Button = ({ onClick, backgroundColor, text, textColor, className, disabled }: ButtonProps) => {

    const combinedClassName = [
        styles.button,
        className
    ].filter(Boolean).join(' ');

    return (
        <button
            onClick={onClick}
            className={combinedClassName}
            style={{
                backgroundColor: backgroundColor,
                color: textColor,
            }}
            disabled={disabled}
        >
            {text}
        </button>
    );
};
export default Button;