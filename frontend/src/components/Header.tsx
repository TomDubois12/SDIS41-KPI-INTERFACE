import { Link } from "react-router-dom";

import Title from "./Title";
import Parametres from "./Parametres";

import styles from '../styles/components/Header.module.scss';
import logoSDIS from '../assets/images/LogoSDIS.png';

interface HeaderProps {
    text: string;
}

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
