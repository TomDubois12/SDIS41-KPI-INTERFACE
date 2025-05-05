import { useState } from "react";
import { useTranslation } from "../hooks/useTranslation";

import styles from '../styles/components/Telephonie.module.scss';

/**
 * Définit les propriétés acceptées par le composant Telephonie.
 * @property onMaintenanceDataChange Fonction de rappel appelée lorsque l'état de maintenance
 * ou le nombre de minutes change. Reçoit le nouvel état de maintenance (booléen)
 * et les minutes (chaîne) en arguments.
 */
interface TelephonieProps {
    onMaintenanceDataChange: (maintenance: boolean, minutes: string) => void;
}

/**
 * Composant React permettant à l'utilisateur d'indiquer si une maintenance
 * a eu lieu sur la téléphonie et, le cas échéant, d'en saisir la durée en minutes.
 * Affiche un taux de disponibilité simplifié (100% ou 99.9%) basé sur l'état de maintenance.
 * Informe le composant parent des changements via la fonction de rappel `onMaintenanceDataChange`.
 *
 * @param props Les propriétés du composant, voir `TelephonieProps`.
 * @returns Le composant JSX avec la case à cocher et le champ de saisie conditionnel.
 */
export default function Telephonie({ onMaintenanceDataChange }: TelephonieProps) {
    const { t } = useTranslation();
    const [maintenance, setMaintenance] = useState(false);
    const [minutes, setMinutes] = useState("");

    /**
     * Gère les changements dans le champ de saisie des minutes.
     * Valide que l'entrée ne contient que des chiffres.
     * Met à jour l'état `minutes` et appelle `onMaintenanceDataChange`.
     * @param e L'événement de changement de l'input HTML.
     */
    const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (/^\d*$/.test(value)) {
            setMinutes(value);
            onMaintenanceDataChange(maintenance, value);
        }
    };

    /**
     * Gère le changement d'état de la case à cocher "Maintenance".
     * Met à jour l'état `maintenance` et appelle `onMaintenanceDataChange`.
     * @param e L'événement de changement de l'input checkbox HTML.
     */
    const handleMaintenanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newMaintenance = e.target.checked;
        setMaintenance(newMaintenance);
        onMaintenanceDataChange(newMaintenance, minutes);
    };

    return (
        <div className={styles.container}>
            <div>
                <input
                    type="checkbox"
                    id="maintenance"
                    checked={maintenance}
                    onChange={handleMaintenanceChange}
                />
                <label htmlFor="maintenance">{t("Rapport.Maintenance")}</label>
            </div>
            {maintenance && (
                <div className={styles.tpsMaintenance}>
                    <span>{t("Rapport.TempsMaintenance")}</span>
                    <input
                        type="text"
                        pattern="[0-9]*"
                        inputMode="numeric"
                        value={minutes}
                        onChange={handleMinutesChange}
                    />
                    <span>minutes</span>
                </div>
            )}
            <p>{t("Rapport.TauxDispoTelephonie")} : <span className={styles.result}>{maintenance ? "99.9%" : "100%"}</span> </p>
        </div>
    );
}