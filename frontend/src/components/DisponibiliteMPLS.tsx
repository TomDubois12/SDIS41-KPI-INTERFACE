import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";

interface DisponibiliteMPLSProps {
    onAvailabilityData: (availability: string) => void;
}

export default function DisponibiliteMPLS({ onAvailabilityData }: DisponibiliteMPLSProps) {
    const [file, setFile] = useState<File | null>(null);
    const [availability, setAvailability] = useState<string | null>(null);
    const [validationMessage, setValidationMessage] = useState<string | null>(null);

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
            const upMeanTimeMPLS = response.data?.upMeanTime || 'N/A'; // Extract upMeanTime
            setAvailability(upMeanTimeMPLS);
            onAvailabilityData(upMeanTimeMPLS);
            setValidationMessage("Données validées avec succès.");
        } catch (error) {
            console.error("Upload Error:", error);
            setValidationMessage("Erreur lors de la validation des données.");
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

    return (
        <div>
            <p>
                Veuillez sélectionner le CSV correspondant aux rapports de disponibilités
                des MPLS ci-dessous <button>?</button>
            </p>

            <div
                {...getRootProps()}
                style={{
                    border: "2px dashed gray",
                    padding: "20px",
                    textAlign: "center",
                    cursor: "pointer",
                }}
            >
                <input {...getInputProps()} />
                {isDragActive ? (
                    <p>Déposez le fichier ici...</p>
                ) : (
                    <p>Faites glisser et déposez un fichier CSV ici, ou cliquez pour sélectionner un fichier</p>
                )}
            </div>

            {file && (
                <div>
                    <p>Fichier sélectionné : {file.name}</p>
                    <button onClick={handleValidate}>Valider les données</button>
                </div>
            )}

            {validationMessage && (
                <p>{validationMessage}</p>
            )}

            {availability && (
                <div>
                    <p>Taux de disponibilité du réseau : {availability} <button>Détail</button></p>
                </div>
            )}
        </div>
    );
}