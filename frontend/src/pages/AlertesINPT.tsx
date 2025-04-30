import { useTranslation } from "../hooks/useTranslation";

import Header from "../components/Header";
import EmailIMPT from "../components/EmailINPT";

export default function AlertesOnduleurs() {
    const { t } = useTranslation();
    
    return (
        <>
            <Header text={t("Titles.Alertes")} />
            <EmailIMPT />
        </>
    );
}