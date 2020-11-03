import React, {
  Component
} from 'react';
const Button = (props) => {


  const cStyle = {
    transform: "rotate("+props.rotate+"deg)",
    margin:props.rotate?"12.5px 0 0 -12.5px":"0",
  }


  return (
    <button className={props.className !== undefined? "Button "+props.className : "Button"} style={cStyle} onClick={props.handleClick}>
      {props.label}
    </button>
  ); 
}

export default Button;

 