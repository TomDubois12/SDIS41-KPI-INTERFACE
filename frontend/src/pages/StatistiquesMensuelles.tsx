import { Link } from "react-router-dom";
import { useRef, useState } from "react";
import { saveAs } from "file-saver";

import { useTranslation } from "../hooks/useTranslation";

import styles from "../styles/pages/StatistiqueRapport.module.scss"

import Header from "../components/Header";
import MonthPickerStats, { MonthPickerStatsHandle } from "../components/MonthPickerStats";
import Telephonie from "../components/Telephonie";
import DisponibiliteMPLS from "../components/DisponibiliteMPLS";
import DisponibiliteESX from "../components/DisponibiliteESX";
import Button from "../components/Button";
import Title from "../components/Title";

export default function StatistiquesMensuelles() {
    const { t } = useTranslation();
    const today = new Date();
    const currentYear = today.getFullYear().toString();
    const monthPickerRef = useRef<MonthPickerStatsHandle>(null);
    const [maintenanceMinutes, setMaintenanceMinutes] = useState<string>("");
    const [telephonyAvailability, setTelephonyAvailability] = useState<string>("100%");
    const [networkAvailability, setNetworkAvailability] = useState<string | null>(null);
    const [networkAvailabilityESX, setNetworkAvailabilityESX] = useState<string | null>(null)

    const handleMaintenanceDataChange = (
        maintenance: boolean,
        minutes: string
    ) => {
        setMaintenanceMinutes(minutes);
        setTelephonyAvailability(maintenance ? "99.9%" : "100%");
    };

    const handleExportToExcel = async () => {
        try {
        if (!monthPickerRef.current) {
            console.error("MonthPicker ref not available");
            return;
        }
        const { countTicketCreated, resolutionRate } =
            monthPickerRef.current.getTicketData();
        const response = await fetch(
            "http://localhost:3001/api/excel/generate-report",
            {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                countTicketCreated,
                resolutionRate,
                telephonyAvailability,
                maintenanceMinutes,
                upMeanTimeMPLS: networkAvailability,
                upMeanTimeESX: networkAvailabilityESX,
            }),
            }
        );
        if (!response.ok) {
            throw new Error("Erreur lors de la génération du rapport");
        }
        const blob = await response.blob();
        const fileName = `Indicateur de la performance SIC.xlsx`;
        saveAs(blob, fileName);
        } catch (error) {
            console.error("Erreur lors de l'exportation des données:", error);
            alert("Une erreur est survenue lors de l'exportation des données.");
        }
    };

    const handleNetworkAvailabilityChange = (availability: string) => {
        setNetworkAvailability(availability);
    };

    const handleNetworkAvailabilityESXChange = (availability: string) => {
        setNetworkAvailabilityESX(availability);
    };

    return (
        <>
            <Header text={t("Titles.StatsRapport")} />
            <div className={styles.container}>
                <div className={styles.containerP}>
                    <p>{t("Rapport.titleStatMensuel")}</p>
                    <p>{t("Rapport.DonneeRouge")}</p>
                </div>
                <Link to={`/statistiques_annuelles?year=${currentYear}`}>
                    <Button 
                        backgroundColor={"#2B3244"}
                        text={t("Rapport.GoToYear")} 
                        textColor={"white"} 
                    /> 
                </Link>
                <div> 
                    <div className={styles.gestionTitle}>
                        <Title text={t("Rapport.DonneeClarilog")} />
                    </div>
                    <MonthPickerStats ref={monthPickerRef} />
                </div>
                <div>
                    <div className={styles.gestionTitle}>
                        <Title text={t("Rapport.DispoReseau")} />
                    </div>
                    <DisponibiliteMPLS onAvailabilityData={handleNetworkAvailabilityChange}/>
                </div>
                <div>
                    <div className={styles.gestionTitle}>
                        <Title text={t("Rapport.DispoTelephonie")} />
                    </div>
                    <Telephonie onMaintenanceDataChange={handleMaintenanceDataChange}/>
                </div>
                <div>
                    <div className={styles.gestionTitle}>
                        <Title text={t("Rapport.DispoSysteme")} />
                    </div>
                    <DisponibiliteESX onAvailabilityData={handleNetworkAvailabilityESXChange}/>
                </div>
                <div className={styles.lastButton}>
                    <Button 
                        backgroundColor={"#2B3244"}
                        text={t("Rapport.Telecharger")} 
                        textColor={"white"} 
                        onClick={handleExportToExcel}
                    />
                </div>  
            </div>
        </>
    );
}