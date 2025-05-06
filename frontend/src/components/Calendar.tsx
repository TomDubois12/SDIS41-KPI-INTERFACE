import { Tooltip } from "react-tooltip";
import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { useTranslation } from "../hooks/useTranslation";

// Importe Calendar et les types nécessaires qui SONT exportés
import Calendar from "react-calendar";
import type {
    CalendarProps, // Type principal des props
    // Value n'est PAS exporté, on le définit ci-dessous
    TileClassNameFunc,
    TileContentFunc,
    OnClickFunc
} from 'react-calendar';

import Button from "../components/Button";

import '../styles/components/Calendar.css';
import styles from '../styles/components/Calendar.module.scss';

// Définit manuellement le type de la valeur retournée par onChange
// Il peut s'agir d'une date, de null, ou d'un tableau [début, fin] si selectRange=true
type CalendarValue = Date | null | [Date | null, Date | null];
// Définit le type pour la vue du calendrier en utilisant le type de la prop
type CalendarView = CalendarProps['view']; // 'month' | 'year' | 'decade' | 'century'

/**
 * Composant React affichant un calendrier interactif (`react-calendar`)
 * permettant à l'utilisateur de naviguer vers différentes vues de rapports (Clarilog)
 * en sélectionnant une date (jour), un mois ou une année.
 * Gère l'état de la date sélectionnée et la vue actuelle du calendrier.
 * Redirige l'utilisateur vers les URL appropriées en fonction de ses interactions.
 *
 * @returns Le composant JSX affichant le calendrier et un bouton de navigation annuelle.
 */
const CalendarComponent = () => {
    const { t, lang } = useTranslation();
    const [date, setDate] = useState<CalendarValue>(new Date()); // Utilise CalendarValue
    const [calendarView, setCalendarView] = useState<CalendarView>('month');
    const navigate = useNavigate();

    /**
     * Gère le changement de date sélectionnée par l'utilisateur sur le calendrier.
     * Correspond à la prop `onChange` de `react-calendar`.
     * @param value La nouvelle valeur sélectionnée.
     * @param _event L'événement clic de la souris (non utilisé).
     */
    // La signature doit correspondre à CalendarProps['onChange']
    const handleDateChange: CalendarProps['onChange'] = (value: CalendarValue, _event: React.MouseEvent<HTMLButtonElement>) => { // _event préfixé
        if (value instanceof Date) {
            setDate(value);
            const nextDay = new Date(value);
            nextDay.setDate(value.getDate() + 1);
            const formattedDate = nextDay.toLocaleDateString('en-CA', {
                timeZone: 'UTC',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
            navigate(`/clarilog?date=${formattedDate}`);
        } else {
             setDate(value); // Met à jour l'état même si ce n'est pas une date simple (ex: null ou range)
        }
    };

    /**
     * Gère le changement de la période affichée par le calendrier.
     * Correspond à la prop `onActiveStartDateChange` de `react-calendar`.
     * @param args Objet contenant les détails de l'événement.
     */
    const handleMonthYearChange: CalendarProps['onActiveStartDateChange'] = ({ activeStartDate, view }) => {
        if (activeStartDate && view === 'month') {
            const month = (activeStartDate.getMonth() + 1).toString();
            const year = activeStartDate.getFullYear().toString();
            navigate(`/clarilog_mensuel?month=${month}&year=${year}`);
        }
    };

    /**
     * Gère le clic sur le bouton personnalisé "Accéder à la page annuelle".
     */
    const handleYearPageClick = () => {
        const year = new Date().getFullYear();
        navigate(`/clarilog_annuel?year=${year}`);
    };

    /**
     * Fonction pour ajouter des classes CSS personnalisées aux tuiles du calendrier.
     * @param args Objet contenant la date et la vue de la tuile.
     * @returns Le nom de la classe CSS ou null/undefined.
     */
    const tileClassName: TileClassNameFunc = ({ date, view }) => {
        // view est de type CalendarView
        if (view === 'year' && date.getFullYear() === new Date().getFullYear()) {
            return styles.currentYearTile;
        }
        return null;
    };

    /**
     * Fonction pour ajouter du contenu personnalisé (ex: Tooltip) à l'intérieur des tuiles.
     * @param args Objet contenant la date et la vue de la tuile.
     * @returns Le contenu ReactNode à ajouter ou null.
     */
    const tileContent: TileContentFunc = ({ date, view }) => {
        // view est de type CalendarView
        if (view === 'month' || view === 'year' || view === 'decade') {
            const dateString = date.toISOString();
            const displayDate = date.toLocaleDateString(lang || "fr-FR", {
                day: view === 'month' ? 'numeric' : undefined,
                month: (view === 'month' || view === 'year') ? 'long' : undefined,
                year: 'numeric'
            });
            return (
                <React.Fragment key={dateString}>
                    <span
                        data-tooltip-id={`tooltip-${dateString}`}
                        data-tooltip-content={displayDate}
                        data-tooltip-place="top"
                    />
                    <Tooltip id={`tooltip-${dateString}`} />
                </React.Fragment>
            );
        }
        return null;
    };

    /**
     * Met à jour l'état interne `calendarView` lorsque l'utilisateur change de vue.
     * Correspond à la prop `onViewChange` de `react-calendar`.
     * @param args Objet contenant les détails de l'événement de changement de vue.
     */
    const handleViewChange: CalendarProps['onViewChange'] = ({ view }) => {
         // view est de type CalendarView
        setCalendarView(view);
    };

    /**
     * Gère le clic sur un mois dans la vue année. Force le retour à la vue mois.
     * Correspond à la prop `onClickMonth` de `react-calendar`.
     * @param _value La date (début du mois) cliquée (non utilisée).
     * @param _event L'événement clic (non utilisé).
     */
    const handleMonthClick: OnClickFunc = (_value, _event) => {
         setCalendarView('month');
    };

     /**
     * Gère le clic sur une année dans la vue décennie. Force le retour à la vue année.
     * Correspond à la prop `onClickYear` de `react-calendar`.
     * @param _value La date (début de l'année) cliquée (non utilisée).
     * @param _event L'événement clic (non utilisé).
     */
    const handleYearClick: OnClickFunc = (_value, _event) => {
         setCalendarView('year');
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
                onClickMonth={handleMonthClick}
                onClickYear={handleYearClick}
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