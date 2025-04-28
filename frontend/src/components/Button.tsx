import styles from '../styles/components/Button.module.scss';

interface ButtonProps {
    onClick?: () => void,
    backgroundColor: string;
    text: string;
    textColor: string;
    className?: string;
    disabled?: boolean;
}

const Button = ({onClick, backgroundColor, text, textColor, className, disabled}: ButtonProps) => {

  const combinedClassName = [
      styles.button,
      className
  ].filter(Boolean).join(' ');

  return ( 
    <button 
        onClick={onClick}
        className={combinedClassName} 
        style={{ 
            backgroundColor: backgroundColor, 
            color: textColor,
        }}
        disabled={disabled}
        >
            {text}
    </button>
  );
};

export default Button;
