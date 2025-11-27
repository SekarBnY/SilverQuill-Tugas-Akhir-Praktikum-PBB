import React from 'react';

export const Mascot = ({ mood = "neutral", size = 64, className }) => {

    const imagePath = "/mascot.png"; 

    return (
        <img 
            src={imagePath}
            alt={`Mascot feeling ${mood}`}
            style={{ width: size, height: size }} 
            className={`object-contain transition-transform duration-300 ${className}`}
        />
    );
};