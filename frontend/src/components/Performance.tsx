import axios from 'axios';

import { useState, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation';

import styles from '../styles/components/Performance.module.scss';

/**
 * Définit les propriétés acceptées par le composant Performance.
 * @property date La date (format YYYY-MM-DD) pour laquelle calculer la performance.
 */
interface PerformanceProps {
    date: string;
}

/**
 * Composant React affichant un indicateur de performance simple (✅ ou ❌).
 * La performance est déterminée en comparant le nombre de tickets résolus pour une date donnée
 * (récupéré via API) à un objectif fixe (moyenne).
 * Affiche une infobulle explicative au survol de l'indicateur.
 *
 * @param props Les propriétés du composant, voir `PerformanceProps`.
 * @returns Le composant JSX affichant l'indicateur de performance et son infobulle.
 */
const Performance: React.FC<PerformanceProps> = ({ date }) => {
    const { t } = useTranslation();
    const [resolvedTickets, setResolvedTickets] = useState<number>(0);
    const [performance, setPerformance] = useState<'✅' | '❌'>('❌');
    const averageTickets = 6;
    const [isTooltipVisible, setIsTooltipVisible] = useState(false);

    /**
     * Effet pour récupérer le nombre de tickets résolus pour la date spécifiée.
     * Met à jour l'état `resolvedTickets` lorsque la prop `date` change.
     */
    useEffect(() => {
        axios.get<{ count: number }>(`/tickets/count-resolved?date=${date}`)
            .then(response => setResolvedTickets(response.data.count))
            .catch(error => console.error("Erreur lors de la récupération du nombre de tickets résolus :", error));
    }, [date]);

    /**
     * Effet pour mettre à jour l'indicateur de performance (✅/❌)
     * lorsque le nombre de tickets résolus change.
     */
    useEffect(() => {
        if (resolvedTickets >= averageTickets) {
            setPerformance('✅');
        } else {
            setPerformance('❌');
        }
    }, [resolvedTickets, averageTickets]);

    return (
        <div
            onMouseEnter={() => setIsTooltipVisible(true)}
            onMouseLeave={() => setIsTooltipVisible(false)}
            style={{ position: 'relative' }}
        >
            <p className={styles.title}>Performance: {performance}</p>
            {isTooltipVisible && (
                <div
                    style={{
                        position: 'absolute',
                        background: 'white',
                        border: '1px solid #ccc',
                        padding: '10px',
                        zIndex: 1,
                        top: '100%',
                        left: '0',
                        width: '200px',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                    }}
                >
                    {performance === '✅' ? (
                        <p>{t("Performance.Atteint")} {averageTickets} {t("Performance.Suite")}</p>
                    ) : (
                        <p>{t("Performance.PasAtteint")} {averageTickets} {t("Performance.Suite")}</p>
                    )}
                </div>
            )}
        </div>
    );
};
export default Performance;