import { NavLink } from 'react-router-dom';
import { useState } from 'react';
import ThemeSwitcher from '../../components/ThemeSwitcher/ThemeSwitcher'
import Loader from '../../components/Loader/Loader';

import css from './Home.module.css';

export default function Home() {
    const [loading, setLoading] = useState(false);

    const handleClick = () => {
        setLoading(true);
        setTimeout(() => setLoading(false), 20000);
    }

    return (
        <div className={css.container}>
            <div className={css.homeTitle}>
                <h1 className={css.homeName}>The road to the<span className={css.depths}> depths</span> of the human soul</h1>
                <p className={css.homeText}>We help you to reveal your potential, overcome
                    challenges and find a guide in your own life with the help of our
                    experienced psychologists.</p>
                <NavLink to="/psychologists">
                    <button onClick={handleClick} className={css.homeBtn} type='submit'>
                        Get started
                        <svg className={css.homeIcon} width="15" height="17">
                            <use className={css.defaultIcon} href="/icons.svg#icon-arrow-top"></use>
                            <use className={css.hoverIcon} href="/icons.svg#icon-arrow-right"></use>
                        </svg>
                    </button>
                </NavLink>
                {loading && <Loader />} {""}
            </div>
            <div>
                <img className={css.homeImg} src='/image.png' />
                <ThemeSwitcher />
            </div>
            <div className={css.experienced}>
                <div className={css.check}>
                    <svg className={css.checkIcon} width="20" height="16">
                        <use className={css.feCheck} href="/icons.svg#icon-fe_check"></use>
                    </svg>
                </div>
                <div className={css.info}>
                    <p className={css.textExperienced}>Experienced psychologists</p>
                    <p className={css.numberExperienced}>15,000</p>
                </div>
            </div>

      </div>
    );
}