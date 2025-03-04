import { Link } from "react-router-dom";
import { useState } from "react";
import { useTranslation } from "../hooks/useTranslation";

import styles from "../styles/components/Parametre.module.scss";

const Parametres = () => {
  
  const [isOpen, setIsOpen] = useState(false);
  const { t, setLang, lang } = useTranslation();

  return (
    <div className={styles.wrapper}>
        <button className={styles.parametres} onClick={() => setIsOpen(!isOpen)}>
          ☰
        </button>
        {isOpen && (
            <div className={styles.menu}>
                <button onClick={() => setLang(lang === "fr" ? "en" : "fr")}>
                    {t("SwitchLanguage")}
                </button>
                <button>{t("SwitchToDT")}</button>
                <button>{t("Credits")}</button>
                <Link to="/">  
                    <button>{t("BackToHome")}</button>
                </Link>
            </div>
        )}
    </div>
  );
};

export default Parametres;
