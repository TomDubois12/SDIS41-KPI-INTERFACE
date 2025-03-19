import { useTranslation } from "../hooks/useTranslation";

import styles from "../styles/pages/Credits.module.scss"

import Header from "../components/Header";
import Title from "../components/Title";

export default function Credits() {

    const { t } = useTranslation();
    
    return (
        <>
            <Header text={t("Parametre.Credits")} />
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
        </>
    );
}