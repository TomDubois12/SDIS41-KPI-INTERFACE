import { Link } from "react-router-dom";
import { useTranslation } from "../hooks/useTranslation";

import Header from "../components/Header";
import TicketDetail from "../components/TicketDetail";

export default function ClarilogTicketDetail() {

    const { t } = useTranslation();
    
    return (
        <>
            <Header text={t("Titles.PerfClarilog")} />
            <TicketDetail />
        </>
    );
}