import React from 'react';

function ConditionalComponent({ show, isActive }) {
  return (
    <div className="container">
      {/* Conditional rendering with && */}
      {show && <div className="modal">Modal Content</div>}
      
      {/* Ternary operator */}
      {isActive ? (
        <button className="active-btn" id="active-button">Active</button>
      ) : (
        <button className="inactive-btn" id="inactive-button">Inactive</button>
      )}
      
      {/* Nested conditional */}
      {show && (
        <div className="wrapper">
          {isActive && <span className="badge">New</span>}
        </div>
      )}
    </div>
  );
}

export default ConditionalComponent;

