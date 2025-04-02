import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { Link } from "react-router-dom";
import { useTranslation } from "../hooks/useTranslation";
import styles from '../styles/components/DisponibiliteMPLSESX.module.scss';
import Button from "./Button";

interface DisponibiliteMPLSProps {
    onAvailabilityData: (availability: string) => void;
}

export default function DisponibiliteMPLS({ onAvailabilityData }: DisponibiliteMPLSProps) {
    const { t } = useTranslation();
    const [file, setFile] = useState<File | null>(null);
    const [availability, setAvailability] = useState<string | null>(null);
    const [validationMessage, setValidationMessage] = useState<string | null>(null);
    const [isValidationClicked, setIsValidationClicked] = useState(false);
    const [detailedData, setDetailedData] = useState<any[] | null>(null);
    const [showDetails, setShowDetails] = useState(false);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (file && file.type === "text/csv") {
            setFile(file);
        } else {
            alert("Veuillez sélectionner un fichier CSV valide.");
        } 
    }, []);

    const handleValidate = async () => {
        if (!file) {
            setValidationMessage("Veuillez sélectionner un fichier CSV.");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await axios.post("http://localhost:3001/csv/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            const data = response.data;
            setDetailedData(data.data);
            const upMeanTimeMPLS = data?.upMeanTime || 'N/A';
            setAvailability(upMeanTimeMPLS);
            onAvailabilityData(upMeanTimeMPLS);
            setIsValidationClicked(true);
            setValidationMessage("Données validées avec succès.");
        } catch (error) {
            console.error("Upload Error:", error);
            setValidationMessage("Erreur lors de la validation des données.");
        }
    };

    const toggleDetails = () => {
        setShowDetails(!showDetails);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

    return (
        <div className={styles.container}>
            <p>{t("Rapport.SelectionnerCSVMPLS")}
                <Link to={"/howtogetcsv"}>
                    <button>?</button>
                </Link>
            </p>
            <div className={styles.dragdrop}
                {...getRootProps()}
            >
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
                    {showDetails && detailedData && (
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
                                            {Object.values(row).map((value, index) => (
                                                <td key={index}>{value}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}