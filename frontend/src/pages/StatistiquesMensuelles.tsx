import { Link } from "react-router-dom";
import { useRef, useState } from "react";
import { saveAs } from "file-saver";

import { useTranslation } from "../hooks/useTranslation";

import Header from "../components/Header";
import MonthPickerStats, {MonthPickerStatsHandle,} from "../components/MonthPickerStats";
import Telephonie from "../components/Telephonie";
import DisponibiliteMPLS from "../components/DisponibiliteMPLS";
import DisponibiliteESX from "../components/DisponibiliteESX";

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
            <div>
                <div>
                    <p>Statistiques pour le rapport mensuel "Indicateur de la performance SIC"</p>
                    <p>Toutes les données en rouge seront enregistrées dans le rapport à la fin de la manipulation</p>
                    <Link to={`/statistiques_annuelles?year=${currentYear}`}>
                        <button>Aller au rapport annuel</button> 
                    </Link>
                </div>
                <div> 
                    <h2>Donnée Clarilog</h2>
                    <MonthPickerStats ref={monthPickerRef} />
                </div>
                <div>
                    <h2>Taux de disponibilité du réseau</h2>
                    <DisponibiliteMPLS onAvailabilityData={handleNetworkAvailabilityChange}/>
                </div>
                <div>
                    <h2>Taux de disponibilité de la téléphonie</h2>
                    <Telephonie onMaintenanceDataChange={handleMaintenanceDataChange}/>
                </div>
                <div>
                    <h2>Taux de disponibilité du système</h2>
                    <DisponibiliteESX onAvailabilityData={handleNetworkAvailabilityESXChange}/>
                </div>
                <button onClick={handleExportToExcel}>
                    Confirmer les données et télécharger le rapport
                </button>
            </div>
        </>
    );
}