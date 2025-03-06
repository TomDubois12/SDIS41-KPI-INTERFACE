import { Link } from "react-router-dom";
import { useTranslation } from "../hooks/useTranslation";

import Header from "../components/Header";

export default function Statistiques() {

    const { t } = useTranslation();
    
    return (
        <>
            <Header text={t("Titles.StatsRapport")} />

        </>
    );
}