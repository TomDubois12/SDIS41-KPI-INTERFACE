import { useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { Tooltip } from "react-tooltip";
import { useNavigate } from 'react-router-dom';

const CalendarComponent = () => {
    const [date, setDate] = useState<Date | null>(new Date());
    const [calendarView, setCalendarView] = useState<'month' | 'year' | 'decade'>('month');
    const navigate = useNavigate();

    const handleDateChange = (newDate: Date | null) => {
        setDate(newDate);
        if (newDate) {
            const nextDay = new Date(newDate);
            nextDay.setDate(newDate.getDate() + 1);

            const formattedDate = nextDay.toLocaleDateString('en-CA', { 
                timeZone: 'UTC', 
                year: 'numeric', 
                month: '2-digit', 
                day: '2-digit' 
            });
            navigate(`/clarilog?date=${formattedDate}`);
        }
    };

    const handleMonthYearChange = ({ activeStartDate, view }: { activeStartDate: Date | null, view: 'month' | 'year' | 'decade' }) => {
        if (activeStartDate) {
            if (view === 'month') {
                const month = (activeStartDate.getMonth() + 1).toString();
                const year = activeStartDate.getFullYear().toString();
                navigate(`/clarilog_mensuel?month=${month}&year=${year}`);
            }
        }
    };

    const handleYearPageClick = () => {
        const year = new Date().getFullYear();
        navigate(`/clarilog_annuel?year=${year}`); // Redirection avec l'année
    };

    const tileClassName = ({ date, view }) => {
        if (view === 'year' && date.getFullYear() === date.getFullYear()) {
            return 'react-calendar__year-view__years__year';
        }
        return null;
    };

    const tileContent = ({ date, view }) => {
        if (view === 'month' || view === 'decade') {
            return (
                <div>
                    <span
                        data-tooltip-id={`tooltip-${date.toISOString()}`}
                        data-tooltip-content={date.toLocaleDateString("fr-FR")}
                    />
                    <Tooltip id={`tooltip-${date.toISOString()}`} />
                </div>
            );
        }
        return null;
    };

    const handleViewChange = ({ activeStartDate, view }: { activeStartDate: Date | null, view: 'month' | 'year' | 'decade' }) => {
        setCalendarView(view);
    };

    const handleHeaderClick = () => {
        if (calendarView === 'month') {
            setCalendarView('year');
        } else if (calendarView === 'year') {
            setCalendarView('decade');
        }
    };

    return (
        <div>
            <h2>Calendrier de visualisation mensuel de la performance</h2>
            <Calendar
                onChange={handleDateChange}
                value={date}
                onActiveStartDateChange={handleMonthYearChange}
                tileClassName={tileClassName}
                tileContent={tileContent}
                view={calendarView}
                onViewChange={handleViewChange}
                onClickMonth={() => setCalendarView('month')}
                onClickYear={() => setCalendarView('year')}
                onClickDecade={() => setCalendarView('decade')}
                onClickView={handleHeaderClick}
            />
            <button onClick={handleYearPageClick}>Voir les statistiques annuelles</button>
        </div>
    );
};

export default CalendarComponent;