import React, {
  useState,
  useRef,
  useEffect
} from 'react';

import './stylesheets/main.scss';
import settings from './settings.json';



import isElectron from 'is-electron';

// COMPONENTS

import Button from './components/Button/Button';
import EmergenyStop from './components/EmergencyStop/EmergencyStop';
import SelectableList from './components/SelectableList/SelectableList';

// LAYOUTS
import Widget from './layouts/widget';


const electron = window.require('electron').remote;
const {Menu, MenuItem} = electron;

const menuTemplate = [
  // { role: 'appMenu' }
  ...(electron.isMac ? [{
    label: electron.app.name,
    submenu: [
      { role: 'about' },
      { type: 'separator' },
      { role: 'services' },
      { type: 'separator' },
      { role: 'hide' },
      { role: 'hideothers' },
      { role: 'unhide' },
      { type: 'separator' },
      { role: 'quit' }
    ]
  }] : []),
  // { role: 'fileMenu' }
  {
    label: 'File',
    submenu: [
      electron.isMac ? { role: 'close' } : { role: 'quit' }
    ]
  }
]



const fs = electron.require('fs');
const serialport = electron.require('serialport');
const Readline = electron.require('@serialport/parser-readline');
const savePath = './assets/files/';


const App = () => {
  


  // ----------------- App States ------------------- //
  const [openPort, setOpenPort] = useState(false);
  const [terminalContent, setTerminalContent] = useState([]);
  const [updateTerminal, setUpdateTerminal] = useState(false);
  const [inputCommand, setInputCommand] = useState("");
  const [loadedFiles, setLoadedFiles] = useState([]);
  const [fileMeta, setFileMeta] = useState("");
  const [fileProgress, setFileProgress] = useState(0);
  const cmdIsBusy = useRef(false);
  const port = useRef();
  const parser = useRef();
  const cmdBuffer = useRef([]);
  let terminalText = useRef([]);
  const terminalEnd = useRef()
  let portsList = useRef([]);
  const fileSelector = useRef();
  const filePrinter = useRef();



  const speed = 1600;
  const speedZ = 180;

  
  
  useEffect(() => {
    if(updateTerminal)setUpdateTerminal(false);
  },[updateTerminal]);
// -------------Component did mount------------//
  useEffect(() => {
    fileSelector.current = buildFileSelector();
    serialListPorts();
    setLoadedFiles(getCurrentFilenames(savePath));
  }, []);

  // ----------------- SERIALPORT ------------------- //

  const serialListPorts = async () => {
    portsList.current = [];
    return serialport.list().then(ports => {
      ports.forEach(function(port) {
        
        portsList.current.push(port.path);
      });
      updateMenu();
      
    })
  }




  useEffect(()=>{
    if(openPort){
      parser.current.on('data', function (data) {
        if(!isEmptyOrSpaces(data.toString())){
          terminalAddContent(data.toString(),true)
          if(cmdIsBusy.current){
            if(data.includes("ok")){
              cmdIsBusy.current = false;
              processCmdQueue();
            }
          }
        }
      })

      if(filePrinter.current){
          
        const fileName = filePrinter.current.fileName;
        loadedFiles.forEach(file => {if(file.name === fileName) handlePrintFile(file); return});
        
      }
    }else{
      if(parser.current){
        parser.current.end();
      }
    }
  },[openPort])

  const initPort = (portName) => {
    port.current = new serialport(portName, {
      baudRate: 115200,
      databits: 8,
      parity: 'none',
      autoOpen: false
    });

    port.current.open((error) => {
      if (error) {
        console.log('Error while opening the port ' + error);
        terminalAddContent('Error while opening the port ' + error)
        setOpenPort(false);
      } else {
        console.log('Serial port: '+port.current.path+' open');
        terminalAddContent('Serial port: '+port.current.path+' open')
        setOpenPort(true);
        updateMenu();
      }
    });

    parser.current = port.current.pipe(new Readline());

    

  }

  const sendMoveCommand = (cmd) => {
    if(openPort){
      const start = "G91";
      const end = "G90";
      sendCommand(start)
      sendCommand(cmd);
      sendCommand(end);
      
    }else{
      terminalAddContent("Not Connected, connect to CNC first")
    }
  }

  const sendCommand = (cmd) => {
    if(openPort){
      cmdBuffer.current.push(cmd);
      if(cmdIsBusy.current) return;
      processCmdQueue();
    }else{
      terminalAddContent("Not Connected, connect to CNC first")
    }
  }

  const processCmdQueue = () =>{
    let next = cmdBuffer.current.shift();
    if (!next) {
        cmdIsBusy.current = false;
        return
    }
    const cmd = `${next}\n`;
    port.current.write(cmd);
    terminalAddContent(next);
    cmdIsBusy.current = true;
    if(filePrinter.current){
    if(filePrinter.current.run){
      
      if(cmdBuffer.current.length<filePrinter.current.lowBuffer){
        filePrinter.current.print();
      }
    }}
  }
  


//---------------- File Writer -------------------//

const FileReader = (input) => new Promise((resolve) => {
  
  
  const fileCommands =[];
  const fileMeta = [];

  fs.readFile(input,'utf8',(err, data)=>{
    if(data){
      const inputFile = data.split("\n");
      inputFile.forEach(row => {
        if(!isEmptyOrSpaces(row)){
          if(row.startsWith(";")){
            fileMeta.push(row);
          }
          if(row.startsWith("M")||row.startsWith("G"))
          { 
            fileCommands.push(row);
          }
        }
      })
    }
    if (err) throw err; 
    resolve({
      meta: getMeta(),
      commands: getCommands()
    }) 
  })


  const getMeta = ()=>{
    return fileMeta;
  
  }
  const getCommands = ()=>{
    return fileCommands;
  }

  return ({
    meta: getMeta(),
    commands: getCommands()
  })

  
  
})



class FilePrinter{
  constructor(fileName,file){
    this.fileName= fileName
    this.file = file
    this.run = false
    this.line = 0
    this.bufferSize = 20;
    this.lowBuffer = 10;
  }
  
  print = ()=>{
    setFileProgress(mapRange(this.line,0,this.file.length,0,100));
    if(this.line<this.file.length){
      while(cmdBuffer.current.length<this.bufferSize){
        sendCommand(this.file[this.line], false)   
        if(this.line<this.file.length){
          this.line++
        }
      }
    }else{
      if(cmdBuffer.current[0] === this.file[this.file.length]){
        terminalAddContent("Finished file");
        this.run=false;
        this.reset();
      }
      
    }
  }

  start = ()=>{
    if(openPort){
    this.run = true;
    terminalAddContent("Start machining from file");
    this.print();
    }else{
      terminalAddContent("Not Connected, connect to CNC first")
    }
  }

  pause = ()=>{
    if(this.run){
    this.run = false
    while(this.line>0){
      if(cmdBuffer.current[0]===this.file[this.line]) break;
      this.line--
    }
    cmdBuffer.current = [];    
    terminalAddContent("Paused")
  }else{
    terminalAddContent("Nothing to pause")
  }
  }

  reset = ()=>{
    if(this.run){
      terminalAddContent("Stopped and resettet file");
      cmdBuffer.current = [];
    }
    this.run = false
    this.line = 0;
    setFileProgress(0);
    
  }
}





const handlePrintFile = (infile)=>{
  const fileName = infile.name;
  const filePath = infile.path;
  console.log(fileName)
  if(!filePrinter.current||!filePrinter.current.run){
    FileReader(filePath).then((file)=>{
      const meta = fileName+'\n'+file.meta.slice(0,3).join("\n").replace(/;/,"");
      setFileMeta(meta);
      filePrinter.current = new FilePrinter(infile.name, file.commands);
    });
  }
  
  
  

}
const handlePrintStart = ()=>{
  if(filePrinter.current){
    if (window.confirm("Is the spindle running?")) { 
      filePrinter.current.start();
    }
  }
}
const handlePrintPause = ()=>{
  if(filePrinter.current)
  filePrinter.current.pause();
}

const handlePrintAbort = ()=>{
  if(filePrinter.current){
    if (window.confirm("Are you sure you want to abort?")) { 
      filePrinter.current.reset();
    }
  }
  
}
//---------------- Terminal Functions -------------------//


const terminalAddContent = (data, inout) => {
  if(!data.startsWith("T:")){
  const maxLength = 200;
  const length = terminalText.current.length;
      if(length<maxLength){
        terminalText.current.push((inout?"Recv: ":"Send: ")+data);
      }else{
        for(let i = 0; i<maxLength; i++){
          terminalText.current[i]=terminalText.current[i+1];
        }
        terminalText.current[maxLength]= (inout?"Recv: ":"Send: ")+data;
      }
      
      setTerminalContent(terminalText.current.join("\n"));
      scrollToBottom();
      setUpdateTerminal(true);
  }
}

// --------------- Update Window Menu -------------------//
const updateMenu = ()=>{

    const menu = electron.Menu.buildFromTemplate(menuTemplate);
    let portSubmenu = [];
    portsList.current.forEach((portName)=>{
      portSubmenu.push({
        label: portName,
        click: () => {
          if(port.current){
            port.current.close((error) => {
              if (error) {
                console.log('Error while closing the port ' + error);
              } else {
                console.log('Serial port: '+port.current.path+' closed');
                port.current = null;
                setOpenPort(false);
              }
            });;
          }
          initPort(portName)
          updateMenu()
        }
      })
    });
    portSubmenu.push(
      {
        label: 'Reload',
        click: () => {
          serialListPorts();
      }
      })
    if(port.current)portSubmenu.push(
      {
        label: 'Disconnect',
        click: () => {
          if(port.current){
            port.current.close((error) => {
              if (error) {
                console.log('Error while closing the port ' + error);
              } else {
                console.log('Serial port: '+port.current.path+' closed');
                setOpenPort(false);
                port.current = null;
                updateMenu();
               
              }
            });;
          }
          
      }
      }
    );
    
    const menuItem = new MenuItem({ label: 'Connection', submenu:portSubmenu });
    menu.append(menuItem) 
    electron.Menu.setApplicationMenu(menu);

  }
//---------------Helper Functions--------------//
function containsObject(obj, list) {
  
  for (var i = 0; i < list.length; i++) {
      if (list[i].name === obj.name) {
          return true;
      }
  }

  return false;
}


function isEmptyOrSpaces(str){
  return str === null || str.match(/^ *$/) !== null|| str === '\n';
}


function sleep(ms) {
return new Promise(resolve => {
  setTimeout(resolve, ms)
})
}

const mapRange = (value, x1, y1, x2, y2) => (value - x1) * (y2 - x2) / (y1 - x1) + x2;

const getCurrentFilenames = (_dirname) => { 
  if (fs.existsSync(_dirname)) {
  let files = []
  fs.readdirSync(_dirname).forEach(file => { 
    files.push({name:file, path: _dirname+file});
  });
  return files;
}
return [];
} 

//---------------Click Handler-----------------//


function buildFileSelector(){
  const fileSelector = document.createElement('input');
  fileSelector.setAttribute('type', 'file');
  fileSelector.setAttribute('accept', '.gcode');
  fileSelector.onchange = handleFileSelect;
  return fileSelector;
}

const handleOpenFileSelect = (e) => {
  fileSelector.current.click();
}

const handleFileSelect = (e) => {
  if(fileSelector.current){
  const file = fileSelector.current.files[0].name;
  const filePath = fileSelector.current.files[0].path;
  const copy = () => {
    if(fs.existsSync(savePath+file)) fs.unlinkSync(savePath+file);
        
    fs.copyFile(filePath, savePath+file, (err)=>{
      if (err) { 
        console.log("Error Found:", err); 
      } 
      else { 
        const files = getCurrentFilenames(savePath);
        setLoadedFiles(files);
        if(filePrinter.current){
          const fileName = filePrinter.current.fileName;
          files.forEach(file => {if(file.name === fileName) handlePrintFile(file); return})
        }
      }
  
    })
  }

  if (!fs.existsSync(savePath)) {
    fs.mkdir(savePath, {
      recursive:true }, (err) => {
        if(err){
          console.log("Error creating dir", err)
        }else{
          copy();
        }
      })
  }else{
   
    copy();
  }
}
}



const handleInputChange = (event) => {
  setInputCommand(event.target.value,false);
}

const handleInputSubmit = (event) => {
  
  sendCommand(inputCommand, false);
  setInputCommand("");
  }

const handleInputSubmitEnter = (event) => {
  if(event.key ==='Enter'){
  sendCommand(inputCommand,false);
  setInputCommand("");
  
}
}

const handleMoveButton = (cmd)=>{
  
  const movecmd = "G0 F"+cmd.startsWith("Z")?speedZ:speed+" "+cmd;
  sendMoveCommand(movecmd);
}

const handleCodeButton = (cmd)=>{
  sendCommand(cmd,false);
}

const handleEmergencyButton = (cmd)=>{
  cmdIsBusy.current = false;
  cmdBuffer.current = []; 
  sendCommand(cmd,false);
  
}

const scrollToBottom = () => {
  terminalEnd.current.scrollIntoView({ behavior: "smooth" });
}

const StatusBar = (props) => {
  
  const style = {
    width: props.progress+'%'
  }
  return(
    <div className="files-status-bar-progress inset-field" style={style}></div>
  )
}

const selectable = ()=>{
  if(!filePrinter.current||!filePrinter.current.run) return true;
  else return false;
}

//-------------------App Render------------------//
  return (

    <div className="App">
      
      <EmergenyStop handleClick={(event)=>{handleEmergencyButton("M112");}}/>
      <Widget height="579px" titel="Control">
        <h3>Move Axis</h3>
        <div className="XY" style={{display:"inline-block"}}>
          <div className="cross-verti">
            <ul className="ulVerti">
              <li><Button label="10" handleClick={(event)=>{handleMoveButton("Y10")}}></Button></li>
              <li><Button label="1.0" handleClick={(event)=>{handleMoveButton("Y1")}}></Button></li>
              <li><Button label="0.1" handleClick={(event)=>{handleMoveButton("Y0.1")}}></Button></li>
            </ul>
          </div>
          <div>
            <ul className="ulHori">
              <li><Button label="10" rotate="-90" handleClick={(event)=>{handleMoveButton("X-10")}}></Button></li>
              <li><Button label="1.0" rotate="-90" handleClick={(event)=>{handleMoveButton("X-1")}}></Button></li>
              <li><Button label="0.1" rotate="-90" handleClick={(event)=>{handleMoveButton("X-0.1")}}></Button></li>
            </ul>
            <ul className="ulHori">
              <li style={{width:"54px", height:"auto"}}><h2>XY</h2></li>
            </ul>
            <ul className="ulHori">
              <li><Button label="0.1" rotate="90" handleClick={(event)=>{handleMoveButton("X0.1")}}></Button></li>
              <li><Button label="1.0" rotate="90" handleClick={(event)=>{handleMoveButton("X1")}}></Button></li>
              <li><Button label="10" rotate="90" handleClick={(event)=>{handleMoveButton("X10")}}></Button></li>
            </ul>
          </div>
          <div className="cross-verti">
          <ul className="ulVerti">
              <li><Button label="0.1" handleClick={(event)=>{handleMoveButton("Y-0.1")}}></Button></li>
              <li><Button label="1.0" handleClick={(event)=>{handleMoveButton("Y-1")}}></Button></li>
              <li><Button label="10" handleClick={(event)=>{handleMoveButton("Y-10")}}></Button></li>
            </ul>
          </div>
        </div>
        <div className="Z" style={{display:"inline-block", marginLeft:"50px", verticalAlign:"top", marginTop:"7px"}}>
          
            <ul className="ulVerti">
              <li><Button label="10" handleClick={(event)=>{handleMoveButton("Z10")}}></Button></li>
              <li><Button label="1.0" handleClick={(event)=>{handleMoveButton("Z1")}}></Button></li>
              <li><Button label="0.1" handleClick={(event)=>{handleMoveButton("Z0.1")}}></Button></li>
            </ul>
            <ul className="ulVerti">
              <li style={{padding:"6px 0"}}><h2>Z</h2></li>
            </ul>
            <ul className="ulVerti">
              <li><Button label="0.1" handleClick={(event)=>{handleMoveButton("Z-0.1")}}></Button></li>
              <li><Button label="1.0" handleClick={(event)=>{handleMoveButton("Z-1")}}></Button></li>
              <li><Button label="10" handleClick={(event)=>{handleMoveButton("Z-10")}}></Button></li>
            </ul>
          
        </div>
        <div className="div-axis">
          <h3>Set Zero Point</h3>
          <ul className="ul-axis">
            <li><Button label="XYZ" handleClick={(event)=>{handleCodeButton("G92 X0 Y0 Z0")}}></Button></li>
            <li><Button label="XY"  handleClick={(event)=>{handleCodeButton("G92 X0 Y0")}}></Button></li>
          </ul>
          <ul className="ul-axis">
            <li><Button label="X" handleClick={(event)=>{handleCodeButton("G92 X0")}}></Button></li>
            <li><Button label="Y" handleClick={(event)=>{handleCodeButton("G92 Y0")}}></Button></li>
            <li><Button label="Z" handleClick={(event)=>{handleCodeButton("G92 Z0")}}></Button></li>
          </ul>
        </div>
        <div className="div-axis">
          <h3>Go To Zero</h3>
          <ul className="ul-axis">
            <li><Button label="XY" handleClick={(event)=>{handleCodeButton("G0 "+speed+" X0.000 Y0.000")}}></Button></li>
            <li><Button label="Z" handleClick={(event)=>{handleCodeButton("G0 "+speedZ+" Z0.000")}}></Button></li>
          </ul>
        </div>
        <div className="div-axis">
          <h3>Config</h3>
          <ul className="ul-axis">
            <li><Button label="Motors Off" handleClick={(event)=>{handleCodeButton("M18")}}></Button></li>
          </ul>
        </div>
      </Widget>
      <Widget height="295px" titel="Terminal">
        <div className="div-terminal inset-field">
          <p>{terminalContent}</p>
          <div ref={terminalEnd}></div>
        </div>
        <div>
        <ul className="ul-terminal-in">
          <li><input type="text" value={inputCommand} className="inset-field" onKeyDown={handleInputSubmitEnter} onChange={handleInputChange}/></li>
          <li><Button label="Send" handleClick={handleInputSubmit}></Button></li>
        </ul>
        </div>
      </Widget>
      <Widget height="579px" titel="Mill File">
       <Button label="Open" handleClick={handleOpenFileSelect}/>
       <div className="div-files-window inset-field">
         <SelectableList handleClick={(file)=>{handlePrintFile(file)}} loadedFiles={loadedFiles} selectable={selectable} ></SelectableList>
         
       </div>
       <div className="div-files-status">
         <h3>Status</h3>
         <div className="files-status-bar inset-field">
          {(fileProgress>0)&&<StatusBar progress={fileProgress}/>}
         </div>
        <div className="files-status-meta">{fileMeta}</div>
         <ul className="ul-files-control">
           <li><Button label="Start" handleClick={handlePrintStart}/></li>
           <li><Button label="Pause" handleClick={handlePrintPause}/></li>
           <li><Button label="Abort" handleClick={handlePrintAbort}/></li>
         </ul>
       </div>
      </Widget>
    </div>
  );


}








export default App;
