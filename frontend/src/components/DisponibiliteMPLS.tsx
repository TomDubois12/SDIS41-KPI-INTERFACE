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
            const upMeanTimeMPLS = response.data?.upMeanTime || 'N/A';
            setAvailability(upMeanTimeMPLS);
            onAvailabilityData(upMeanTimeMPLS);
            setValidationMessage("Données validées avec succès.");
            setIsValidationClicked(true); // Mise à jour de l'état après le clic
        } catch (error) {
            console.error("Upload Error:", error);
            setValidationMessage("Erreur lors de la validation des données.");
        }
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
                    <Link to={"/csvdetails"}>
                        <Button 
                            backgroundColor={"#2B3244"}
                            text={t("Global.Details")} 
                            textColor={"white"} 
                        />
                    </Link> 
                </div>
            )}
        </div>
    );
}