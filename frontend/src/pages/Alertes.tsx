import { useTranslation } from "../hooks/useTranslation";

import Header from "../components/Header";
import Card from "../components/Card";

import styles from "../styles/pages/Alertes.module.scss"
import Pompier1 from '../assets/images/Pompier1.png';
import Pompier2 from '../assets/images/Pompier2.png';

export default function Alertes() {
    const { t } = useTranslation();
    
    return (
        <>
            <Header text={t("Titles.Alertes")} />  
            <div className={styles.divCard}>    
                <Card 
                    img={Pompier1}
                    text={t("EmailOnduleur.AlerteTitle")} 
                    buttonText={t("Global.Entrer")}
                    path="/alertes_onduleurs"
                />
                <Card 
                    img={Pompier2}
                    text={t("EmailINPT.AlerteTitle")}
                    buttonText={t("Global.Entrer")}
                    path="/alertes_inpt"
                />
            </div>
        </>
    );
}