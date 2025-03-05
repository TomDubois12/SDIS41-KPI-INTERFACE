import { Link } from "react-router-dom";
import { useTranslation } from "../hooks/useTranslation";

import styles from '../styles/pages/Home.module.scss';
import logoSDIS from '../assets/images/LogoSDIS.png';
import ImagesPompiers from '../assets/images/ImagesPompiers.png'
import Title from "../components/Title";
import Button from "../components/Button"
import Parametres from "../components/Parametres";


export default function Home() {

    const { t } = useTranslation();

    return (
        <div className={styles.divGlobal}>
            <div className={styles.divImg}>
                <img src={logoSDIS} alt="Logo SDIS" className={styles.logoSDIS}/>
                <img src={ImagesPompiers} alt="Logo SDIS" className={styles.ImagesPompiers}/>
            </div>
            <div className={styles.divTitleButton}>
                <div className={styles.Parametres}>
                    <div className={styles.hiddenLogo}>
                        <img src={logoSDIS} alt="Logo SDIS" className={styles.logoSDIS}/>
                    </div>
                    <Parametres />
                </div>
                <div className={styles.Title}>
                    <Title 
                        text={t("Titles.KPI")}
                    />
                </div>
                <div className={styles.Button}>
                    <Link to="/hub">
                        <Button 
                            backgroundColor={"#C54844"} 
                            text={t("Global.Entrer")} 
                            textColor={"#2B3244"} 
                        />
                    </Link>
                </div>
            </div>
        </div>
    );
}
