import { createContext, useContext, useState } from "react";
import PropTypes from "prop-types";

const SegmentationContext = createContext();

export function SegmentationProvider({ children }) {
  const [result, setResult] = useState(null);

  return (
    <SegmentationContext.Provider value={{ result, setResult }}>
      {children}
    </SegmentationContext.Provider>
  );
}

SegmentationProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useSegmentation() {
  return useContext(SegmentationContext);
}
