import { useTranslation } from "../hooks/useTranslation";

import Header from "../components/Header";
import EmailOnduleur from "../components/EmailOnduleur";

export default function AlertesOnduleurs() {

    const { t } = useTranslation();
    
    return (
        <>
            <Header text={t("Titles.Alertes")} />
            <EmailOnduleur />
        </>
    );
}