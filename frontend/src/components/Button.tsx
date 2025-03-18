import styles from '../styles/components/Button.module.scss';

interface ButtonProps {
    onClick?: () => void,
    backgroundColor: string;
    text: string;
    textColor: string;
}

const Button = ({onClick, backgroundColor, text, textColor}: ButtonProps) => {
  return (
    <button 
        onClick={onClick}
        className={styles.button} 
        style={{ 
            backgroundColor: backgroundColor, 
            color: textColor,
        }}
        >
            {text}
    </button>
  );
};

export default Button;
