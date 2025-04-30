import { useTranslation } from "../hooks/useTranslation";

import Header from "../components/Header";
import Title from "../components/Title";
import Button from "../components/Button";

import styles from "../styles/pages/Credits.module.scss";

/**
 * Composant React représentant la page "Crédits" de l'application.
 * Affiche des informations statiques telles que les auteurs, les objectifs du projet,
 * les technologies utilisées et les informations de contact, en utilisant des clés
 * de traduction pour le contenu textuel.
 *
 * @returns Le composant JSX de la page Crédits.
 */
export default function Credits() {
    const { t } = useTranslation();

    /**
     * Fonction simple pour naviguer vers la page précédente dans l'historique du navigateur.
     */
    function goBack() {
        window.history.back();
    }

    return (
        <>
            <Header text={t("Parametre.Credits")} />
            <div className={styles.containerCredit}>
                <div className={styles.title}>
                    <Title text={t("Credits.Title.Credit")} />
                </div>
                <div className={styles.txt}>
                    <p>{t("Credits.CreditTxt")}</p>
                </div>
                <div className={styles.title}>
                    <Title text={t("Credits.Title.Objectif")} />
                </div>
                <div className={styles.txt}>
                    <p>{t("Credits.ObjectifTxt")}</p>
                </div>
                <div className={styles.title}>
                    <Title text={t("Credits.Title.TechUse")} />
                </div>
                <div className={styles.txt}>
                    <li>{t("Credits.TechUse1")}</li>
                    <li>{t("Credits.TechUse2")}</li>
                </div>
                <div className={styles.title}>
                    <Title text={t("Credits.Title.Contact")} />
                </div>
                <div className={styles.txt}>
                    <p>{t("Credits.ContactTxt")}</p>
                    <li>{t("Credits.Contact1")}</li>
                </div>
                <div className={styles.thx}>
                    <p>{t("Credits.FinalTxt")}</p>
                </div>
                <Button
                    className={styles.buttonCredit}
                    backgroundColor={"#2B3244"}
                    text={t("Rapport.GoBack")}
                    textColor={"white"}
                    onClick={goBack}
                />
            </div>
        </>
    );
}