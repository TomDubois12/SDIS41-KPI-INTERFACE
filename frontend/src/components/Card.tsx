import styles from '../styles/components/Card.module.scss';
import Button from './Button';

interface CardProps {
    img: string;
    text: string;
    buttonText: string;
}

const Card = ({ img, text, buttonText }: CardProps) => {
    return (
        <div className={styles.card}>
            <div className={styles.imageContainer}>
                <img src={img} alt={text} className={styles.img} />
            </div>
            <div className={styles.titleContainer}>
                <h1>{text}</h1>
            </div>
            <div className={styles.buttonContainer}>
                <Button 
                    backgroundColor={'#2B3244'} 
                    text={buttonText} 
                    textColor={'white'} 
                />
            </div>
        </div>
    );
};

export default Card;
