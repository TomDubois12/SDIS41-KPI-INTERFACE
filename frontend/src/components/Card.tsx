import { Link } from "react-router-dom";

import Button from './Button';

import styles from '../styles/components/Card.module.scss';

interface CardProps {
    img: string;
    text: string;
    buttonText: string;
    path: string;
}

const Card = ({ img, text, buttonText, path }: CardProps) => {
    return (
        <div className={styles.card}>
            <div className={styles.imageContainer}>
                <img src={img} alt={text} className={styles.img} />
            </div>
            <div className={styles.titleContainer}>
                <h1>{text}</h1>
            </div>
            <div className={styles.buttonContainer}>
                <Link to={path}>
                    <Button
                        backgroundColor={'#2B3244'}
                        text={buttonText}
                        textColor={'white'}
                    />
                </Link>
            </div>
        </div>
    );
};
export default Card;
