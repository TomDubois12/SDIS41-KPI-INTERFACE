import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useTranslation } from "../hooks/useTranslation";

import styles from '../styles/components/YearPicker.module.scss';

interface YearPickerProps {
    initialYear?: number;
}

const YearPicker: React.FC<YearPickerProps> = ({ initialYear }) => {
    const { t } = useTranslation();
    const [selectedYear, setSelectedYear] = useState<number>(initialYear || new Date().getFullYear());
    const navigate = useNavigate();

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