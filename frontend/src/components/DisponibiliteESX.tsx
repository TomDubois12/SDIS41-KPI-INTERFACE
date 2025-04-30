import axios from "axios";

import { Link } from "react-router-dom";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useTranslation } from "../hooks/useTranslation";

import Button from "./Button";

import styles from '../styles/components/DisponibiliteMPLSESX.module.scss';

/**
 * Définit les propriétés acceptées par le composant DisponibiliteESX.
 * @property onAvailabilityData Fonction de rappel appelée lorsque les données de disponibilité sont validées,
 * transmettant la valeur de disponibilité (ex: pourcentage) au composant parent.
 */
interface DisponibiliteESXProps {
    onAvailabilityData: (availability: string) => void;
}

/**
 * Composant React permettant à l'utilisateur de téléverser un fichier CSV
 * contenant des données de disponibilité ESX. Le fichier est envoyé à une API
 * pour validation et traitement. Le composant affiche ensuite la disponibilité calculée
 * (typiquement `upMeanTime`) et offre la possibilité d'afficher les données détaillées
 * retournées par l'API dans un tableau. Utilise `react-dropzone` pour le téléversement.
 *
 * @param props Les propriétés du composant, voir `DisponibiliteESXProps`.
 * @returns Le composant JSX gérant l'upload et l'affichage des résultats.
 */
export default function DisponibiliteESX({ onAvailabilityData }: DisponibiliteESXProps) {
    const { t } = useTranslation();
    const [file, setFile] = useState<File | null>(null);
    const [availability, setAvailability] = useState<string | null>(null);
    const [validationMessage, setValidationMessage] = useState<string | null>(null);
    const [isValidationClicked, setIsValidationClicked] = useState(false);
    const [detailedData, setDetailedData] = useState<any[] | null>(null);
    const [showDetails, setShowDetails] = useState(false);

    /**
     * Fonction de rappel pour `react-dropzone` appelée lorsqu'un ou plusieurs fichiers
     * sont déposés ou sélectionnés. Valide si le fichier est de type CSV et met à jour l'état `file`.
     * Réinitialise les états liés à la validation précédente lors de la sélection d'un nouveau fichier.
     * @param acceptedFiles Tableau des fichiers acceptés (normalement un seul ici).
     */
    const onDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (file && file.type === "text/csv") {
            setFile(file);
            setValidationMessage(null);
            setAvailability(null);
            setDetailedData(null);
            setShowDetails(false);
            setIsValidationClicked(false);
        } else {
            alert("Veuillez sélectionner un fichier CSV valide.");
            setFile(null);
        }
    }, []);

    /**
     * Gère le clic sur le bouton "Valider les données".
     * Vérifie si un fichier est sélectionné, l'envoie à l'API via une requête POST multipart/form-data,
     * traite la réponse pour extraire la disponibilité et les données détaillées,
     * met à jour l'état et appelle la fonction de rappel `onAvailabilityData`.
     */
    const handleValidate = async () => {
        if (!file) {
            setValidationMessage("Veuillez sélectionner un fichier CSV.");
            return;
        }
        const formData = new FormData();
        formData.append("file", file);
        setValidationMessage("Validation en cours...");
        try {
            const response = await axios.post("http://localhost:3001/csv/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            const data = response.data;
            setDetailedData(data.data);
            const upMeanTimeESX = data?.upMeanTime || 'N/A';
            setAvailability(upMeanTimeESX);
            onAvailabilityData(upMeanTimeESX);
            setIsValidationClicked(true);
            setValidationMessage("Données validées avec succès.");
        } catch (error) {
            console.error("Upload Error:", error);
            setValidationMessage("Erreur lors de la validation des données.");
            setAvailability(null);
            setDetailedData(null);
            setShowDetails(false);
        }
    };

    /**
     * Bascule l'état d'affichage de la section des détails (tableau).
     */
    const toggleDetails = () => {
        setShowDetails(!showDetails);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

    return (
        <div className={styles.container}>
            <p>{t("Rapport.SelectionnerCSVESX")}
                <Link to={"/howtogetcsv"}>
                    <button>?</button>
                </Link>
            </p>
            <div className={styles.dragdrop} {...getRootProps()}>
                <input {...getInputProps()} />
                {isDragActive ? (
                    <p>{t("Rapport.DragActive")}</p>
                ) : (
                    <p>{t("Rapport.InfoDragDrop")}</p>
                )}
            </div>
            {file && (
                <div>
                    <p>{t("Rapport.FichierSelectionne")} : {file.name}</p>
                    {!isValidationClicked && (
                        <Button
                            backgroundColor={"#2B3244"}
                            text={t("Rapport.ValideDonnee")}
                            textColor={"white"}
                            onClick={handleValidate}
                        />
                    )}
                </div>
            )}
            {validationMessage && (
                <p>{validationMessage}</p>
            )}
            {availability && (
                <div>
                    <p>{t("Rapport.DispoReseau")} : <span className={styles.red}>{availability}</span></p>
                    <div className={styles.detailsbutton}>
                        <Button
                            backgroundColor={"#2B3244"}
                            text={t("Global.Details")}
                            textColor={"white"}
                            onClick={toggleDetails}
                        />
                    </div>
                    {showDetails && detailedData && detailedData.length > 0 && (
                        <div className={styles.tablecontainer}>
                            <h2>Détails</h2>
                            <table className={styles.tickettable}>
                                <thead>
                                    <tr>
                                        {Object.keys(detailedData[0]).map(key => (
                                            <th key={key}>{key}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {detailedData.map((row, index) => (
                                        <tr key={index}>
                                            {Object.values(row).map((value: any, i) => (
                                                <td key={i}>{typeof value === 'object' ? JSON.stringify(value) : value}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {showDetails && (!detailedData || detailedData.length === 0) && (
                        <p>Aucune donnée détaillée disponible.</p>
                    )}
                </div>
            )}
        </div>
    );
}