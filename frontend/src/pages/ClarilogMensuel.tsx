// TODO : PAGE "CalendrierPage"import { Link } from "react-router-dom";
import { useTranslation } from "../hooks/useTranslation";

import Header from "../components/Header";
import CalendarComponent from "../components/Calendar"

export default function ClarilogMensuel() {

    const { t } = useTranslation();
    
    return (
        <>
            <Header text={t("Titles.PerfClarilog")} />
            <CalendarComponent /> 
        </>
    );
}