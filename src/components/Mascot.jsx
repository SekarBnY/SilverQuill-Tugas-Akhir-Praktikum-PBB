import React from 'react';

export const Mascot = ({ mood = "neutral", size = 64, className }) => {
    // This points to the file you put in the public folder
    // If you want different photos for different moods later, 
    // you could use: const imagePath = `/mascot-${mood}.png`;
    const imagePath = "/mascot.png"; 

    return (
        <img 
            src={imagePath}
            alt={`Mascot feeling ${mood}`}
            // We use the 'size' prop to keep it compatible with the rest of the app
            style={{ width: size, height: size }} 
            className={`object-contain transition-transform duration-300 ${className}`}
        />
    );
};