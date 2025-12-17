import React from 'react';
import './ThemeToggle.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun, faMoon } from '@fortawesome/free-solid-svg-icons';

const ThemeToggle = ({ isDarkMode, toggleTheme }) => {
  return (
    <div className="theme-toggle" onClick={toggleTheme}>
      <FontAwesomeIcon icon={faSun} className={`icon sun ${!isDarkMode ? 'active' : ''}`} />
      <div className={`toggle-ball ${isDarkMode ? 'dark' : ''}`}></div>
      <FontAwesomeIcon icon={faMoon} className={`icon moon ${isDarkMode ? 'active' : ''}`} />
    </div>
  );
};

export default ThemeToggle;
