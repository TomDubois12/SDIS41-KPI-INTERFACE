import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useNavigate, useSearchParams } from 'react-router-dom';

interface YearPickerProps {
    initialYear?: number;
}

const YearPicker: React.FC<YearPickerProps> = ({ initialYear }) => {
    const [selectedDate, setSelectedDate] = useState<Date | null>(initialYear ? new Date(initialYear, 0) : null);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const handleChange = (date: Date | null) => {
        setSelectedDate(date);
        if (date) {
            const year = date.getFullYear();
            navigate(`/clarilog_annuel?year=${year}`);
        }
    };

    const handleMonthRedirect = () => {
        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1; // Mois commence à 0 en JavaScript
        navigate(`/clarilog_mensuel?year=${year}&month=${month}`);
    };

    return (
        <div>
            <DatePicker
                selected={selectedDate}
                onChange={handleChange}
                showYearPicker
                dateFormat="yyyy"
            />
            <button onClick={handleMonthRedirect}>
                Voir les statistiques mensuelles
            </button>
        </div>
    );
};

export default YearPicker;