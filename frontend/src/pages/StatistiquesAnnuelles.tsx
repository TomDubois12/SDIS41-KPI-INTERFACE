import { Link } from "react-router-dom";
import { useRef, useState } from "react";
import { saveAs } from 'file-saver';


import { useTranslation } from "../hooks/useTranslation";

import Header from "../components/Header";
import YearPickerStats, { YearPickerStatsHandle } from "../components/YearPickerStats";
import Telephonie from "../components/Telephonie";

export default function StatistiquesAnnuelles() {
    const { t } = useTranslation();
    const today = new Date();
    const currentMonth = (today.getMonth() + 1).toString(); // Mois 1-indexé
    const currentYear = today.getFullYear().toString();
    const yearPickerRef = useRef<YearPickerStatsHandle>(null);
    const [maintenanceMinutes, setMaintenanceMinutes] = useState<string>("");
    const [telephonyAvailability, setTelephonyAvailability] = useState<string>("100%");
    
    const handleMaintenanceDataChange = (
        maintenance: boolean,
        minutes: string
    ) => {
        setMaintenanceMinutes(minutes);
        setTelephonyAvailability(maintenance ? "99.9%" : "100%");
    };
    
    const handleExportToExcel = async () => {
        try {
            if (!yearPickerRef.current) {
                console.error("YearPicker ref not available");
                return;
            }
            const { countTicketCreated, resolutionRate } = 
                yearPickerRef.current.getTicketData();
            const response = await fetch(
                'http://localhost:3001/api/excel/generate-report', 
                {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    countTicketCreated, 
                    resolutionRate,
                    telephonyAvailability, 
                    maintenanceMinutes,
            }),
            }
        );
        if (!response.ok) {
            throw new Error('Erreur lors de la génération du rapport');
        }
        const blob = await response.blob();
        const fileName = `Indicateur de la performance SIC.xlsx`;
        saveAs(blob, fileName);
        } catch (error) {
        console.error("Erreur lors de l'exportation des données:", error);
        alert("Une erreur est survenue lors de l'exportation des données.");
        }
    };

    return (
        <>
            <Header text={t("Titles.StatsRapport")} />
            <div>
                <h2>Donnée Clarilog</h2>
                <YearPickerStats ref={yearPickerRef}/>
            </div>
            <div>
                <h2>Taux de disponibilité du réseau</h2>
                {/* Composant drag n drop */} 
            </div>
            <div>
                <h2>Taux de disponibilité de la téléphonie</h2>
                <Telephonie onMaintenanceDataChange={handleMaintenanceDataChange}/>
                
            </div>
            <div>
                <h2>Taux de disponibilité du système</h2>
                {/* Composant drag n drop */} 
            </div>
            <Link to={`/statistiques_mensuelles?month=${currentMonth}&year=${currentYear}`}>
                <button>Aller au rapport mensuel</button>
            </Link>
            <button onClick={handleExportToExcel}>Confirmer les données et télécharger le rapport</button>
        </>
    );
}