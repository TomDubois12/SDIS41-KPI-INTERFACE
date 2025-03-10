// TODO : CALENDRIER DE LA PAGE "CalendrierPage"
import { useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { Tooltip } from "react-tooltip";
import { useNavigate } from 'react-router-dom'; // Importez useNavigate

const CalendarComponent = () => {
    const [date, setDate] = useState<Date | null>(new Date());
    const navigate = useNavigate();

    const handleDateChange = (newDate: Date | null) => {
        setDate(newDate);
        if (newDate) {
            // Ajouter 1 jour à la date
            const nextDay = new Date(newDate);
            nextDay.setDate(newDate.getDate() + 1);

            // Obtenir la date au format YYYY-MM-DD
            const formattedDate = nextDay.toLocaleDateString('en-CA', { 
                timeZone: 'UTC', 
                year: 'numeric', 
                month: '2-digit', 
                day: '2-digit' 
            });
            navigate(`/clarilog?date=${formattedDate}`);
        }
    };

    const handleActiveStartDateChange = ({ activeStartDate }: { activeStartDate: Date | null }) => {
        if (activeStartDate) {
            const month = (activeStartDate.getMonth() + 1).toString(); // 1-indexé
            const year = activeStartDate.getFullYear().toString();
            navigate(`/clarilog_mensuel?month=${month}&year=${year}`);
        }
    };
    

    return (
        <div>
            <h2>Calendrier de visualisation mensuel de la performance</h2>
            <Calendar
                onChange={handleDateChange}
                value={date}
                onActiveStartDateChange={handleActiveStartDateChange}
                tileContent={({ date }) => (
                    <div>
                        <span
                            data-tooltip-id={`tooltip-${date.toISOString()}`}
                            data-tooltip-content={date.toLocaleDateString("fr-FR")}
                        />
                        <Tooltip id={`tooltip-${date.toISOString()}`} />
                    </div>
                )}
            />
        </div>
    );
};

export default CalendarComponent;