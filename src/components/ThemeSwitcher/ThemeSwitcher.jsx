import { useEffect, useState } from 'react';
import css from './ThemeSwitcher.module.css';

const ThemeSwitcher = () => {
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'theme-red');

    useEffect(() => {
        document.documentElement.className = theme;
        localStorage.setItem('theme', theme);
    }, [theme]);

    const handleChange = (e) => {
        setTheme(e.target.value);
    };

    return (
        <div className={css.themeWrap} style={{ margin: '1rem 0' }}>
            <label className={css.themeTitle} htmlFor="theme-select">Choose Theme: </label>
            <select className={css.themeItem} id="theme-select" value={theme} onChange={handleChange}>
                <option className={css.red} value="theme-orange">Orange</option>
                <option className={css.blue} value="theme-blue">Blue</option>
                <option className={css.dark} value="theme-green">Green</option>
            </select>
        </div>
    );
};

export default ThemeSwitcher;