import React, { useState, useEffect } from 'react';

const VicinityAlert = ({ currentAreaPincode, predictedDeficits }) => {
  const [activeAlert, setActiveAlert] = useState(null);

  useEffect(() => {
    // Look for high-risk deficits in the vicinity
    const criticalIssue = Object.values(predictedDeficits).find(d =>
      d.deficit > 25 && d.pincode.substring(0, 3) === currentAreaPincode.substring(0, 3)
    );

    if (criticalIssue) {
      setActiveAlert(criticalIssue);
      // Auto-dismiss after 10 seconds
      const timer = setTimeout(() => setActiveAlert(null), 10000);
      return () => clearTimeout(timer);
    }
  }, [predictedDeficits, currentAreaPincode]);

  if (!activeAlert) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      backgroundColor: '#b71c1c',
      color: 'white',
      padding: '15px',
      borderRadius: '8px',
      boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
      zIndex: 1000,
      borderLeft: '5px solid #ff5252',
      animation: 'slideIn 0.5s ease-out'
    }}>
      <strong>⚠️ REMOTE VICINITY ALERT</strong>
      <p style={{ margin: '5px 0' }}>
        Critical deficit predicted at <strong>{activeAlert.hospitalName}</strong> nearby ({activeAlert.pincode}). [cite: 39]
      </p>
      <small>Dispatching blood units from the grid...</small>
    </div>
  );
};

export default VicinityAlert;