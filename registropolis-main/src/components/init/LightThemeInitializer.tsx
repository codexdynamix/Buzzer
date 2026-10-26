
import { useEffect } from "react";

const LightThemeInitializer = () => {
  useEffect(() => {
    try {
      // Set light theme only
      const root = window.document.documentElement;
      
      // Clear existing theme classes
      root.classList.remove('dark');
      
      // Set light theme class
      root.classList.add('light');
      
      // Clean up any legacy attributes
      document.documentElement.removeAttribute('data-accent-color');
      document.documentElement.removeAttribute('data-text-size');
      
      console.log('Light theme applied');
    } catch (error) {
      console.error("Error initializing light theme:", error);
    }
  }, []);
  
  return null;
};

export default LightThemeInitializer;
