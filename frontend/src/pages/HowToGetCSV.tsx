import { useTranslation } from "../hooks/useTranslation";

import Header from "../components/Header";
import Button from "../components/Button";

import styles from "../styles/pages/HowToGetCSV.module.scss";
import DispoGroupHote from '../assets/images/DispoGroupHote.png';
import GroupHote from '../assets/images/GroupHote.png';
import PlageDate from '../assets/images/PlageDate.png';

/**
 * Composant React affichant une page d'aide statique expliquant,
 * à l'aide de textes et d'images, les étapes nécessaires pour exporter
 * le fichier CSV requis (probablement depuis Centreon/Nagios)
 * pour les calculs de disponibilité réseau/système utilisés dans d'autres parties de l'application.
 *
 * @returns Le composant JSX de la page d'aide.
 */
export default function HowToGetCSV() {
    const { t } = useTranslation();

    /**
     * Fonction simple pour naviguer vers la page précédente dans l'historique du navigateur.
     */
    function goBack() {
        window.history.back();
    }

    return (
        <div className={styles.container}>
            <Header text={t("Titles.StatsRapport")} />
            <h2>{t("Rapport.HowToGetCSV")}</h2>
            <p>{t("Rapport.Etape1")} :</p>
            <img src={DispoGroupHote} alt="Étape 1: Disponibilité Groupe Hôte" className={styles.DispoGroupHote} />
            <p>{t("Rapport.Etape2")} :</p>
            <img src={GroupHote} alt="Étape 2: Sélection Groupe Hôte" className={styles.GroupHote} />
            <p>{t("Rapport.Etape3")} :</p>
            <img src={PlageDate} alt="Étape 3: Sélection Plage Date" className={styles.PlageDate} />
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