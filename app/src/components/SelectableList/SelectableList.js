import React, {
    useState,
    Component
    
  } from 'react';


  


const SelectableList = (props) => {
    const files = props.loadedFiles;
    const [activeName, setActiveName] = React.useState("");
  
    const handleOnClick = file => {
      if(props.selectable()){

        setActiveName(file.name);
        props.handleClick(file);
      }
    }
    
  
    const listItems = files.map((file) => {
      return (
        <li 
          key={file.name}
          onClick={() => handleOnClick(file)} // pass the index
          className={activeName === file.name ? "active" : "disabled"}
        >
          {file.name}
        </li>
        )
    }
    );
    return (
      
      <ul className="ul-files-window">{listItems}</ul>
      
    )
  }

  export default SelectableList;
  