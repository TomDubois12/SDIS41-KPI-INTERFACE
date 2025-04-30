import React, { useState } from 'react'; // Import React si pas déjà global
import { useNavigate } from 'react-router-dom';
import { useTranslation } from "../hooks/useTranslation"; // Assurez-vous que le chemin est correct

import styles from '../styles/components/YearPicker.module.scss'; // Assurez-vous que le chemin est correct

/**
 * Définit les propriétés acceptées par le composant YearPicker.
 * @property initialYear? L'année initiale à sélectionner dans le dropdown. Défaut: année actuelle.
 */
interface YearPickerProps {
    initialYear?: number;
}

/**
 * Composant React affichant un menu déroulant (`<select>`) permettant à l'utilisateur
 * de choisir une année parmi une plage prédéfinie (les 15 dernières années).
 * Lors de la sélection d'une année, le composant navigue vers la page
 * des statistiques annuelles correspondante (`/clarilog_annuel`).
 *
 * @param props Les propriétés du composant, voir `YearPickerProps`.
 * @returns Le composant JSX affichant le sélecteur d'année.
 */
const YearPicker: React.FC<YearPickerProps> = ({ initialYear }) => {
    const { t } = useTranslation();
    const [selectedYear, setSelectedYear] = useState<number>(initialYear || new Date().getFullYear());
    const navigate = useNavigate();

    /**
     * Gère le changement de sélection dans le menu déroulant de l'année.
     * Met à jour l'état `selectedYear` et déclenche la navigation vers la page
     * des statistiques annuelles pour l'année choisie.
     * @param event L'événement de changement du select HTML.
     */
    const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const year = parseInt(event.target.value, 10);
        setSelectedYear(year);
        navigate(`/clarilog_annuel?year=${year}`);
    };

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 15 }, (_, i) => currentYear - 14 + i);

    return (
        <div className={styles.container}>
            <h2 className={styles.title}>{t("Calendar.SelectDate")} :</h2>
            <select value={selectedYear} onChange={handleChange} className={styles.yearSelect}>
                {years.map((year) => (
                    <option key={year} value={year}>
                        {year}
                    </option>
                ))}
            </select>
        </div>
    );
};
export default YearPicker;