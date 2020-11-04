# Enzomill #
This simple but usefull tool is for controlling most GCODE based DIY CNC Machines like the MPCNC.
Move your Spindle, Set the Zero Point for each axis, load a GCODE file and start Milling.

<img src="https://raw.githubusercontent.com/laurensrinke/Enzomill/master/app/src/assets/preview.png" width="90%"></img>

### How do I start? ###
* Download the installer from the releases tab https://github.com/laurensrinke/Enzomill/releases
* Install the Programm on your PC
* It will start automatically the first time
* Connect to your COM port your CNC is connected to by selecting it in the "Connection" menu
* If connected you can start moving and loading files.
* If you have selected a file for milling before connecting to the CNC, click on that file again and the start milling.

### How do I get set up dev environment? ###
Clone the repository to your harddrive.
Install Node.js including the optional windows tools for compiling native modules
From an powershell Window:
* run "npm install" in project folder
* run "npm run dev" to start developing with react and electron
* Dev tools automatically enabled in dev mode
* Build Application with installer by running "npm run build" you will find a "dist" folder with your installable application inside
