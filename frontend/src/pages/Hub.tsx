import { Link } from "react-router-dom";
import { useTranslation } from "../hooks/useTranslation";

import styles from '../styles/pages/Hub.module.scss';
import Header from "../components/Header";



export default function Hub() {

    const { t } = useTranslation();

    return (
        <div>
            <Header text={t("KPI")} />
        </div>
    );
}
