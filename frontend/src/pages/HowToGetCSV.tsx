import { useTranslation } from "../hooks/useTranslation";

import Header from "../components/Header";
import Button from "../components/Button";

import styles from "../styles/pages/HowToGetCSV.module.scss"
import DispoGroupHote from '../assets/images/DispoGroupHote.png';
import GroupHote from '../assets/images/GroupHote.png';
import PlageDate from '../assets/images/PlageDate.png';

export default function HowToGetCSV() {
    const { t } = useTranslation();

    function goBack() {
        window.history.back();
    }

    return (
        <div className={styles.container}>
            <Header text={t("Titles.StatsRapport")} />
            <h2>{t("Rapport.HowToGetCSV")}</h2>
            <p>{t("Rapport.Etape1")} :</p>
            <img src={DispoGroupHote} alt="Logo SDIS" className={styles.DispoGroupHote} />
            <p>{t("Rapport.Etape2")} :</p>
            <img src={GroupHote} alt="Logo SDIS" className={styles.GroupHote} />
            <p>{t("Rapport.Etape3")} :</p>
            <img src={PlageDate} alt="Logo SDIS" className={styles.PlageDate} />
            <p>{t("Rapport.Etape4")}</p>
            <Button
                backgroundColor={"#2B3244"}
                text={t("Rapport.GoBack")}
                textColor={"white"}
                onClick={goBack}
            />
        </div>
    );
}