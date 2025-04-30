import { useState } from "react";
import { useTranslation } from "../hooks/useTranslation";

import styles from '../styles/components/Telephonie.module.scss';

interface TelephonieProps {
    onMaintenanceDataChange: (maintenance: boolean, minutes: string) => void;
}

export default function Telephonie({ onMaintenanceDataChange }: TelephonieProps) {
    const { t } = useTranslation();
    const [maintenance, setMaintenance] = useState(false);
    const [minutes, setMinutes] = useState("");

    const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (/^\d*$/.test(value)) {
            setMinutes(value);
            onMaintenanceDataChange(maintenance, value);
        }
    };

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