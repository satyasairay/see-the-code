import React from 'react';

function TestComponent() {
  return (
    <div className="test-container" id="test-id">
      <button className="submit-btn" data-testid="submit-button">
        Submit
      </button>
      <div className={`dynamic ${isActive ? 'active' : 'inactive'}`}>
        Dynamic content
      </div>
    </div>
  );
}

export default TestComponent;

