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

    return (
        <DatePicker
            selected={selectedDate}
            onChange={handleChange}
            showYearPicker
            dateFormat="yyyy"
        />
    );
};

export default YearPicker;