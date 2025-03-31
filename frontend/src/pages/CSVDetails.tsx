import { Link } from "react-router-dom";

import { useTranslation } from "../hooks/useTranslation";

import Header from "../components/Header";

export default function CSVDetails() {

    const { t } = useTranslation();
    
    return (
        <>
            <Header text={t("Titles.StatsRapport")} />
            <p>CSVDetails</p>
        </>
    );
}