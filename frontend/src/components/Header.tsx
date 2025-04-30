import { Link } from "react-router-dom";

import Title from "./Title";
import Parametres from "./Parametres";

import styles from '../styles/components/Header.module.scss';
import logoSDIS from '../assets/images/LogoSDIS.png';

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
const Header = ({ text }: HeaderProps) => {

    return (
        <>
            <div className={styles.hiddenDiv}>
                <div className={styles.hiddenDivLogoParam}>
                    <div className={styles.fleche}>
                        <button className={styles.fleche} onClick={() => {
                            if (document.referrer) {
                                window.history.back();
                            } else {
                                window.location.href = '/hub';
                            }
                        }}>
                            ⇦
                        </button>
                    </div>
                    <Link to="/hub">
                        <img src={logoSDIS} alt="Logo SDIS" className={styles.logoSDIS} />
                    </Link>
                    <div className={styles.Parametres}>
                        <Parametres />
                    </div>
                </div>
                <div className={styles.hiddenDivTitle}>
                    <Title
                        text={text}
                    />
                </div>
            </div>
            <div className={styles.header}>
                <Link to="/hub">
                    <img src={logoSDIS} alt="Logo SDIS" className={styles.logoSDIS} />
                </Link>
                <div className={styles.Title}>
                    <Title
                        text={text}
                    />
                </div>
                <div className={styles.Parametres}>
                    <Parametres />
                </div>
            </div>
        </>
    );
};
export default Header;