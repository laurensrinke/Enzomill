

const electron = window.require('electron').remote;
const fs = electron.require('fs');
const serialport = electron.require('serialport');
const Readline = electron.require('@serialport/parser-readline');
// ----------------- SERIALPORT ------------------- //

class Machine{
    constructor(){
        this.port;
        this.parser;
        this.bufferSize = 20;
        this.minBuffer = 10;
        this.run = false;
        this.pause = false;
        this.file = "";
        this.connected = false;
        this.IsBusy = false;
        this.cmdBuffer = [];
        this.logBuffer = [];
        this.portsList = [];
    }


getPortsList = () => {
    this.portsList = [];
    serialport.list().then(ports => {
      ports.forEach(function(port) {
        this.portsList.push(port.path);
      });
      return this.portsList;
    })
    
}


openPipe = () => {
      this.parser.on('data', function (data) {
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
}

terminalAddContent = (c) => {

}

updateMenu = () => {

}

initPort = (portName) => {
    this.port = new serialport(portName, {
      baudRate: 115200,
      databits: 8,
      parity: 'none',
      autoOpen: false
    });

    this.port.open((error) => {
      if (error) {
        console.log('Error while opening the port ' + error);
        terminalAddContent('Error while opening the port ' + error)
        setOpenPort(false);
      } else {
        console.log('Serial port: '+port.current.path+' open');
        terminalAddContent('Serial port: '+port.current.path+' open')
        this.connected= true;
        updateMenu();
      }
    });

    parser.current = port.current.pipe(new Readline());

  }

  sendMoveCommand = (cmd) => {
    if(this.connected){
      const start = "G91";
      const end = "G90";
      sendCommand(start)
      sendCommand(cmd);
      sendCommand(end);
      
    }else{
      terminalAddContent("Not Connected, connect to CNC first")
    }
  }

sendCommand = (cmd) => {
    if(this.connected){
      cmdBuffer.current.push(cmd);
      if(cmdIsBusy.current) return;
      processCmdQueue();
    }else{
      terminalAddContent("Not Connected, connect to CNC first")
    }
  }

processCmdQueue = () =>{
    let next = this.cmdBuffer.shift();
    if (!next) {
        this.IsBusy = false;
        return
    }
    const cmd = `${next}\n`;
    this.port.write(cmd);
    terminalAddContent(next);
    this.isBusy = true;
    if(this.filePrinter){
    if(this.filePrinter.run){
      if(this.cmdBuffer.length<this.minBuffer){
        this.filePrinter.print();
      }
    }}
  }
  


//---------------- File Writer -------------------//
isEmptyOrSpaces = (str) => {
    return str === null || str.match(/^ *$/) !== null|| str === '\n';
}

FileReader = (input) => new Promise((resolve) => {
  
  
  const fileCommands =[];
  const fileMeta = [];

  fs.readFile(input,'utf8',(err, data)=>{
    if(data){
      const inputFile = data.split("\n");
      inputFile.forEach(row => {
        if(!this.isEmptyOrSpaces(row)){
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
  constructor(file){
    this.file = file
    this.run = false
    this.line = 0
    this.bufferSize = 20;
    this.lowBuffer = 10;
  }
  
  print = ()=>{
    fileProgress.current = mapRange(this.line,this.file.length,0,100);
    if(this.line<this.file.length){
      while(cmdBuffer.current.length<this.bufferSize){
        sendCommand(this.file[this.line], false)   
        if(this.line<this.file.length){
          this.line++
        }
      }
    }else{
      terminalAddContent("Finished file");
      this.run=false;
      this.reset();
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
    set
    
  }
}
}


module.exports = Machine;