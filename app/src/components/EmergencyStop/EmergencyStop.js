import React, {
    Component
  } from 'react';
  
const EmergenyStop = (props) => {
    return (
      <div className="EmergencyStop">
        
          <button onClick={props.handleClick}>
            <h2>STOP</h2>
          </button>
        
      </div>
    ); 
  }

  export default EmergenyStop
  
