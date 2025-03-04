import styles from '../styles/components/Title.module.scss';

interface TitleProps {
    text: string;
}

const Title = ({text}: TitleProps) => {
    return (
        <div className={styles.title}>
            <h1>{text}</h1>
        </div>
    );
};

export default Title;
