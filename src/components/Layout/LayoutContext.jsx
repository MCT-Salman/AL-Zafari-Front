import { createContext, useContext, useState } from "react";

const LayoutContext = createContext({});

export function LayoutProvider({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <LayoutContext.Provider value={{ 
      collapsed, 
      setCollapsed, 
      mobileMenuOpen, 
      setMobileMenuOpen 
    }}>
      {children}
    </LayoutContext.Provider>
  );
}

export const useLayout = () => useContext(LayoutContext);