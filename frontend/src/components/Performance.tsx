import axios from 'axios';

import { useState, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation';

import styles from '../styles/components/Performance.module.scss'

interface PerformanceProps {
    date: string;
}

const Performance: React.FC<PerformanceProps> = ({ date }) => {
    const { t } = useTranslation();
    const [resolvedTickets, setResolvedTickets] = useState<number>(0);
    const [performance, setPerformance] = useState<'✅' | '❌'>('❌');
    const averageTickets = 6;
    const [isTooltipVisible, setIsTooltipVisible] = useState(false);

    useEffect(() => {
        axios.get<{ count: number }>(`http://localhost:3001/tickets/count-resolved?date=${date}`)
            .then(response => setResolvedTickets(response.data.count))
            .catch(error => console.error("Erreur lors de la récupération du nombre de tickets résolus :", error));
    }, [date]);

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
                        width: '200px'
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