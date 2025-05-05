import { Tooltip } from "react-tooltip";

import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { useTranslation } from "../hooks/useTranslation";

import Calendar from "react-calendar";
import Button from "../components/Button";

import '../styles/components/Calendar.css';
import styles from '../styles/components/Calendar.module.scss'

/**
 * Composant React affichant un calendrier interactif (`react-calendar`)
 * permettant à l'utilisateur de naviguer vers différentes vues de rapports (Clarilog)
 * en sélectionnant une date (jour), un mois ou une année.
 * Gère l'état de la date sélectionnée et la vue actuelle du calendrier (mois/année/décennie).
 * Redirige l'utilisateur vers les URL appropriées en fonction de ses interactions.
 *
 * @returns Le composant JSX affichant le calendrier et un bouton de navigation annuelle.
 */
const CalendarComponent = () => {
    const { t, lang } = useTranslation();
    const [date, setDate] = useState<Date | null>(new Date());
    const [calendarView, setCalendarView] = useState<'month' | 'year' | 'decade'>('month');
    const navigate = useNavigate();

    /**
     * Gère le changement de date sélectionnée par l'utilisateur sur le calendrier.
     * Met à jour l'état `date` et navigue vers la vue journalière (`/clarilog`)
     * avec la date sélectionnée (formatée en YYYY-MM-DD du jour *suivant*).
     * @param newDate La nouvelle date sélectionnée (ou null).
     */
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

    /**
     * Gère le changement de la période affichée par le calendrier (mois/année/décennie).
     * Si la vue est 'month' (changement de mois), navigue vers la vue mensuelle (`/clarilog_mensuel`)
     * avec le mois et l'année correspondants.
     * @param activeStartDate La date de début de la nouvelle période affichée.
     * @param view La nouvelle vue ('month', 'year', 'decade').
     */
    const handleMonthYearChange = ({ activeStartDate, view }: { activeStartDate: Date | null, view: 'month' | 'year' | 'decade' }) => {
        if (activeStartDate) {
            if (view === 'month') {
                const month = (activeStartDate.getMonth() + 1).toString();
                const year = activeStartDate.getFullYear().toString();
                navigate(`/clarilog_mensuel?month=${month}&year=${year}`);
            }
        }
    };

    /**
     * Gère le clic sur le bouton personnalisé "Accéder à la page annuelle".
     * Navigue vers la vue annuelle (`/clarilog_annuel`) pour l'année en cours.
     */
    const handleYearPageClick = () => {
        const year = new Date().getFullYear();
        navigate(`/clarilog_annuel?year=${year}`);
    };

    /**
     * Fonction pour ajouter des classes CSS personnalisées aux tuiles du calendrier.
     * Actuellement ajoute une classe spécifique pour les années en vue 'year'.
     * @param date La date de la tuile.
     * @param view La vue actuelle du calendrier.
     * @returns Le nom de la classe CSS ou null.
     */
    const tileClassName = ({ date, view }) => {
        if (view === 'year' && date.getFullYear() === date.getFullYear()) {
            return 'react-calendar__year-view__years__year';
        }
        return null;
    };

    /**
     * Fonction pour ajouter du contenu personnalisé à l'intérieur des tuiles du calendrier.
     * Ajoute une infobulle (Tooltip) affichant la date complète au survol des jours/mois/années.
     * @param date La date de la tuile.
     * @param view La vue actuelle du calendrier.
     * @returns Le contenu JSX à ajouter ou null.
     */
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
    
    /**
     * Met à jour l'état interne `calendarView` lorsque la vue du calendrier change.
     * @param view La nouvelle vue active ('month', 'year', 'decade').
     */
    const handleViewChange = ({ view }: { view: 'month' | 'year' | 'decade' }) => {
        setCalendarView(view);
    };

    /**
     * Gère le clic sur l'en-tête principal du calendrier pour changer de vue (zoom/dezoom).
     * Cycle : mois -> année -> décennie.
     */
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
            <div className={styles.buttonGoTo}>
                <Button
                    backgroundColor={"#2B3244"}
                    text={t("Calendar.GoToYear")}
                    textColor={"white"}
                    onClick={handleYearPageClick}
                />
            </div>
        </div>
    );
};
export default CalendarComponent;