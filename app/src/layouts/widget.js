import React, {
    Children,
    Component
  } from 'react';

export default (props) => {


    return(
        <div className="widget" style={{height:props.height}}>
            <h1>{props.titel}</h1>
            {props.children}          
        </div>
    );
}