import { useTranslation } from "../hooks/useTranslation";

import Header from "../components/Header";
import Card from "../components/Card";

import styles from '../styles/pages/Hub.module.scss';
import Extincteur from '../assets/images/Extincteur.png';
import Dring from '../assets/images/Dring.png';
import Feu from '../assets/images/Feu.png';

/**
 * Composant React représentant la page principale servant de hub de navigation.
 * Affiche un en-tête et une série de cartes (`Card`) cliquables qui permettent
 * d'accéder aux différentes sections fonctionnelles majeures de l'application :
 * Performance Clarilog, Statistiques & Rapports, et Alertes.
 * Les liens vers les sections mensuelles sont générés pour le mois et l'année courants.
 *
 * @returns Le composant JSX de la page Hub.
 */
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