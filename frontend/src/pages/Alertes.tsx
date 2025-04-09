import { useTranslation } from "../hooks/useTranslation";

import Header from "../components/Header";
import Card from "../components/Card";
import Feu from '../assets/images/Feu.png';

export default function Alertes() {

    const { t } = useTranslation();
    
    return (
        <>
            <Header text={t("Titles.Alertes")} />
            <Card 
                img={Feu}
                text={"Alertes Onduleurs"}
                buttonText={t("Global.Entrer")}
                path="/alertes_onduleurs"
            />
        </>
    );
}