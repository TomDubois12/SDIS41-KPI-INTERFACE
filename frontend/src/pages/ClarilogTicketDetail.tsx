import { useTranslation } from "../hooks/useTranslation";

import styles from '../styles/pages/ClarilogTicketDetail.module.scss';

import Header from "../components/Header";
import TicketDetail from "../components/TicketDetail";

export default function ClarilogTicketDetail() {

    const { t } = useTranslation();
    
    return (
        <>
            <Header 
                text={t("Titles.PerfClarilog")} 
            />
            <TicketDetail />
        </>
    );
}