# README #

This README would normally document whatever steps are necessary to get your application up and running.

### What is this repository for? ###

* Template for React App bundled with electron
* Version 1.0

### How do I get set up? ###
* Check Wiki Page: http://wiki.17k.de/index.php?title=Electron_App
* Install newest NodeJs (LTS) check the installer for windows-build-tools (to compile native modules)
* windows-build-tools and python are needed for this repo if not installed during NodeJs install run npm install --global windows-build-tools --production from an admin powershell
* run "npm install" from commandline in project folder
* run "npm run dev" to start developing with react and electron
* develop react app in "./app/src/" folder
* Look at ./app/src/settings.json for fullscreen and at ./app/public/electron.js for window dimensions
* Dev tools automatically enabled in dev mode
* don't put big assets like movies in git (ignore them in .gitignore)
* Build Application with installer by running "npm run build" you will find a "dist" folder with your installable application inside

### How do I build a non react app? ###
* create a build folder inside app folder
* copy an instance of ./app/public/electron.js to that build folder
* copy your html5 app to that build folder
* run "npm run electron-build" inside app folder

### Who do I talk to? ###

* Repo owner or admin
* Other community or team contact