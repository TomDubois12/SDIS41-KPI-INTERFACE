import styles from '../styles/components/Button.module.scss';

interface ButtonProps {
    backgroundColor: string;
    text: string;
    textColor: string;
}

const Button = ({backgroundColor, text, textColor}: ButtonProps) => {
  return (
    <button 
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
