import { Tooltip } from "react-tooltip";

import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { useTranslation } from "../hooks/useTranslation";

import Calendar from "react-calendar";
import Button from "../components/Button";

import '../styles/components/Calendar.css';

const CalendarComponent = () => {
    const { t, lang } = useTranslation();
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
        navigate(`/clarilog_annuel?year=${year}`);
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
            <h2>{t("Calendar.TitleCalendar")}</h2>
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
                locale={lang}
            />
            <Button
                backgroundColor={"#2B3244"}
                text={t("Calendar.GoToYear")}
                textColor={"white"}
                onClick={handleYearPageClick}
            />
        </div>
    );
};
export default CalendarComponent;