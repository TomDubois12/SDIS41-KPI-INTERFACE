import { useTranslation } from "../hooks/useTranslation";

import Header from "../components/Header";
import Card from "../components/Card";
import Feu from '../assets/images/Feu.png';

import styles from "../styles/pages/Alertes.module.scss"

export default function Alertes() {

    const { t } = useTranslation();
    
    return (
        <>
            <Header text={t("Titles.Alertes")} />  
            <div className={styles.divCard}>    
                <Card 
                    img={Feu} //changer les images
                    text={t("EmailOnduleur.AlerteTitle")} 
                    buttonText={t("Global.Entrer")}
                    path="/alertes_onduleurs"
                />
                <Card 
                    img={Feu} //changer les images
                    text={t("EmailINPT.AlerteTitle")}
                    buttonText={t("Global.Entrer")}
                    path="/alertes_inpt"
                />
            </div>
        </>
    );
}