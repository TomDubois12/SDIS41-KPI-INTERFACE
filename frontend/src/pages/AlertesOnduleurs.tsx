import { Link } from "react-router-dom";
import { useTranslation } from "../hooks/useTranslation";

import Header from "../components/Header";
import Email from "../components/Email";

export default function AlertesOnduleurs() {

    const { t } = useTranslation();
    
    return (
        <>
            <Header text={t("Titles.Alertes")} />
            <Email />
        </>
    );
}