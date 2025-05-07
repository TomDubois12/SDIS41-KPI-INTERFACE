import { Link } from "react-router-dom";
import { saveAs } from 'file-saver';

import { useRef, useState } from "react";
import { useTranslation } from "../hooks/useTranslation";

import Header from "../components/Header";
import YearPickerStats, { YearPickerStatsHandle } from "../components/YearPickerStats";
import Telephonie from "../components/Telephonie";
import DisponibiliteMPLS from "../components/DisponibiliteMPLS";
import DisponibiliteESX from "../components/DisponibiliteESX";
import Button from "../components/Button";
import Title from "../components/Title";

import styles from "../styles/pages/StatistiqueRapport.module.scss";

/**
 * Composant React représentant la page d'affichage des statistiques annuelles.
 * Orchestre plusieurs sous-composants pour permettre la sélection de l'année,
 * l'upload de fichiers CSV pour les disponibilités réseau/système, la saisie
 * d'informations de maintenance téléphonie, et l'affichage des statistiques résultantes.
 * Permet également l'exportation des données compilées dans un fichier Excel.
 * Très similaire dans sa structure à `StatistiquesMensuelles`.
 *
 * @returns Le composant JSX de la page des statistiques annuelles.
 */
export default function StatistiquesAnnuelles() {
    const { t } = useTranslation();
    const today = new Date();
    const currentMonth = (today.getMonth() + 1).toString();
    const currentYear = today.getFullYear().toString();
    const yearPickerRef = useRef<YearPickerStatsHandle>(null);
    const [maintenanceMinutes, setMaintenanceMinutes] = useState<string>("");
    const [telephonyAvailability, setTelephonyAvailability] = useState<string>("100%");
    const [networkAvailability, setNetworkAvailability] = useState<string | null>(null);
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
     * Récupère les données des tickets via la ref de `YearPickerStats`,
     * collecte les autres données d'état (téléphonie, MPLS, ESX),
     * envoie l'ensemble au backend pour générer un fichier Excel,
     * et déclenche le téléchargement du fichier reçu côté client via `file-saver`.
     */
    const handleExportToExcel = async () => {
        try {
            if (!yearPickerRef.current) {
                console.error("La référence vers YearPicker n'est pas disponible.");
                alert("Erreur : Impossible de récupérer les données du sélecteur d'année.");
                return;
            }
            const { countTicketCreated, resolutionRate } = yearPickerRef.current.getTicketData();

            const reportData = {
                countTicketCreated: countTicketCreated ?? 0,
                resolutionRate: resolutionRate ?? "0.00",
                telephonyAvailability,
                maintenanceMinutes,
                upMeanTimeMPLS: networkAvailability ?? 'N/A',
                upMeanTimeESX: networkAvailabilityESX ?? 'N/A',
            };

            const response = await fetch(
                '/api/excel/generate-report',
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(reportData),
                }
            );

            if (!response.ok) {
                let errorMsg = "Erreur lors de la génération du rapport";
                try { const errorData = await response.json(); errorMsg = errorData?.message || errorMsg; } catch (e) {}
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
    const handleNetworkAvailabilityChange = (availability: string) => {
        setNetworkAvailability(availability);
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
                    <p>{t("Rapport.titleStatAnnuel")}</p>
                    <p>{t("Rapport.DonneeRouge")}</p>
                </div>
                <Link to={`/statistiques_mensuelles?month=${currentMonth}&year=${currentYear}`}>
                    <Button
                        backgroundColor={"#2B3244"}
                        text={t("Rapport.GoToMonth")}
                        textColor={"white"}
                    />
                </Link>
                <div>
                    <div className={styles.gestionTitle}>
                        <Title text={t("Rapport.DonneeClarilog")} />
                    </div>
                    <YearPickerStats ref={yearPickerRef} />
                </div>
                <div>
                    <div className={styles.gestionTitle}>
                        <Title text={t("Rapport.DispoReseau")} />
                    </div>
                    <DisponibiliteMPLS onAvailabilityData={handleNetworkAvailabilityChange} />
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
                    <DisponibiliteESX onAvailabilityData={handleNetworkAvailabilityESXChange} />
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