import { useState } from "react";

interface TelephonieProps {
    onMaintenanceDataChange: (maintenance: boolean, minutes: string) => void;
}

export default function Telephonie({ onMaintenanceDataChange }: TelephonieProps) {
    const [maintenance, setMaintenance] = useState(false);
    const [minutes, setMinutes] = useState("");

    const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (/^\d*$/.test(value)) {
        setMinutes(value);
        onMaintenanceDataChange(maintenance, value); // Envoyer les données modifiées
        }
    };

    const handleMaintenanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newMaintenance = e.target.checked;
        setMaintenance(newMaintenance);
        onMaintenanceDataChange(newMaintenance, minutes); // Envoyer les données modifiées
    };

    return (
        <div>
            <div>
                <input
                type="checkbox"
                id="maintenance"
                checked={maintenance}
                onChange={handleMaintenanceChange}
                />
                <label htmlFor="maintenance">Une maintenance a-t-elle eu lieu ?</label>
            </div>

            {maintenance && (
                <div>
                <span>Temps de la maintenance ?</span>
                <input
                    type="text"
                    value={minutes}
                    onChange={handleMinutesChange}
                />
                <span>minutes</span>
                <button>?</button>
                </div>
            )}

            <p>
                Taux de disponibilité du réseau : {maintenance ? "99.9%" : "100%"}
            </p>
        </div>
    );
}