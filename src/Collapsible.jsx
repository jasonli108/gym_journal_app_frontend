import React, { useState } from 'react';

const Collapsible = ({ children, title, isOpen = false }) => {
  const [isCollapsed, setIsCollapsed] = useState(!isOpen);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div>
      <button onClick={toggleCollapse} style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', padding: '10px 0' }}>
        <strong>{title}</strong>
      </button>
      {!isCollapsed && <div>{children}</div>}
    </div>
  );
};

export default Collapsible;
