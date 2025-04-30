import { useTranslation } from "../hooks/useTranslation";

import Header from "../components/Header";
import Card from "../components/Card";

import styles from '../styles/pages/Hub.module.scss';
import Extincteur from '../assets/images/Extincteur.png';
import Dring from '../assets/images/Dring.png';
import Feu from '../assets/images/Feu.png';

export default function Hub() {

    const { t } = useTranslation();
    const today = new Date();
    const month = (today.getMonth() + 1).toString();
    const year = today.getFullYear().toString();

    return (
        <div>
            <Header text={t("Titles.KPI")} />
            <div className={styles.divCard}>
                <Card 
                    img={Extincteur}
                    text={t("Titles.PerfClarilog")}
                    buttonText={t("Global.Entrer")}
                    path={`/clarilog_mensuel?month=${month}&year=${year}`}
                />
                <Card 
                    img={Dring}
                    text={t("Titles.StatsRapport")}
                    buttonText={t("Global.Entrer")}
                    path={`/statistiques_mensuelles?month=${month}&year=${year}`}
                />
                <Card 
                    img={Feu}
                    text={t("Titles.Alertes")}
                    buttonText={t("Global.Entrer")}
                    path="/alertes"
                />
            </div>
        </div>
    );
}
