import { saveAs } from "file-saver";

import { Link } from "react-router-dom";
import { useState, useRef } from "react";
import { useTranslation } from "../hooks/useTranslation";  

import Header from "../components/Header";  
import MonthPickerStats, { MonthPickerStatsHandle } from "../components/MonthPickerStats";  
import Telephonie from "../components/Telephonie";  
import DisponibiliteMPLS from "../components/DisponibiliteMPLS";  
import DisponibiliteESX from "../components/DisponibiliteESX";  
import Button from "../components/Button"; 
import Title from "../components/Title";  

import styles from "../styles/pages/StatistiqueRapport.module.scss";

/**
 * Composant React représentant la page d'affichage des statistiques mensuelles.
 * Orchestre plusieurs sous-composants pour permettre la sélection du mois/année,
 * l'upload de fichiers CSV pour les disponibilités réseau/système, la saisie
 * d'informations de maintenance téléphonie, et l'affichage des statistiques résultantes.
 * Permet également l'exportation des données compilées dans un fichier Excel.
 *
 * @returns Le composant JSX de la page des statistiques mensuelles.
 */
export default function StatistiquesMensuelles() {
    const { t } = useTranslation();
    const today = new Date();
    const currentYear = today.getFullYear().toString();
    const monthPickerRef = useRef<MonthPickerStatsHandle>(null);
    const [maintenanceMinutes, setMaintenanceMinutes] = useState<string>("");
    const [telephonyAvailability, setTelephonyAvailability] = useState<string>("100%");
    const [networkAvailabilityMPLS, setNetworkAvailabilityMPLS] = useState<string | null>(null);
    const [networkAvailabilityESX, setNetworkAvailabilityESX] = useState<string | null>(null);

    /**
     * Fonction de rappel pour mettre à jour l'état local lorsque les données
     * de maintenance (état et durée) changent dans le composant enfant `Telephonie`.
     * @param maintenance Indique si la maintenance a eu lieu (boolean).
     * @param minutes La durée de la maintenance en minutes (string).
     */
    const handleMaintenanceDataChange = (maintenance: boolean, minutes: string) => {
        setMaintenanceMinutes(minutes);
        setTelephonyAvailability(maintenance ? "99.9%" : "100%");
    };

    /**
     * Gère le clic sur le bouton "Télécharger le rapport".
     * Récupère les données des tickets via la ref de `MonthPickerStats`,
     * collecte les autres données d'état (téléphonie, MPLS, ESX),
     * envoie l'ensemble au backend pour générer un fichier Excel,
     * et déclenche le téléchargement du fichier reçu côté client via `file-saver`.
     */
    const handleExportToExcel = async () => {
        try {
            if (!monthPickerRef.current) {
                console.error("La référence vers MonthPicker n'est pas disponible.");
                alert("Erreur : Impossible de récupérer les données du sélecteur de date.");
                return;
            }
            const { countTicketCreated, resolutionRate } = monthPickerRef.current.getTicketData();

            const reportData = {
                countTicketCreated: countTicketCreated ?? 0,
                resolutionRate: resolutionRate ?? "0.00",
                telephonyAvailability,
                maintenanceMinutes,
                upMeanTimeMPLS: networkAvailabilityMPLS ?? 'N/A',
                upMeanTimeESX: networkAvailabilityESX ?? 'N/A',
            };

            const response = await fetch(
                "http://localhost:3001/api/excel/generate-report",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(reportData),
                }
            );

            if (!response.ok) {
                let errorMsg = "Erreur lors de la génération du rapport";
                try {
                    const errorData = await response.json();
                    errorMsg = errorData?.message || errorMsg;
                } catch (e) {}
                throw new Error(errorMsg);
            }

            const blob = await response.blob();
            const fileName = `Indicateur_de_la_performance_SIC.xlsx`;
            saveAs(blob, fileName);

        } catch (error) {
            console.error("Erreur lors de l'exportation des données:", error);
            alert(`Une erreur est survenue lors de l'exportation des données: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
        }
    };

    /**
     * Fonction de rappel pour mettre à jour l'état local lorsque la disponibilité MPLS
     * est calculée par le composant enfant `DisponibiliteMPLS`.
     * @param availability La chaîne de caractères représentant la disponibilité MPLS.
     */
    const handleNetworkAvailabilityMPLSChange = (availability: string) => {
        setNetworkAvailabilityMPLS(availability);
    };

    /**
     * Fonction de rappel pour mettre à jour l'état local lorsque la disponibilité ESX
     * est calculée par le composant enfant `DisponibiliteESX`.
     * @param availability La chaîne de caractères représentant la disponibilité ESX.
     */
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
                    <DisponibiliteMPLS
                        onAvailabilityData={handleNetworkAvailabilityMPLSChange}
                    />
                </div>
                <div>
                    <div className={styles.gestionTitle}>
                        <Title text={t("Rapport.DispoTelephonie")} />
                    </div>
                    <Telephonie onMaintenanceDataChange={handleMaintenanceDataChange} />
                </div>
                <div>
                    <div className={styles.gestionTitle}>
                        <Title text={t("Rapport.DispoSysteme")} />
                    </div>
                    <DisponibiliteESX
                        onAvailabilityData={handleNetworkAvailabilityESXChange}
                    />
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