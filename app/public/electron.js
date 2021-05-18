const electron = require("electron");
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const isDev = require("electron-is-dev");
let mainWindow;
const settings = isDev?require("../src/settings.json"):{fullscreen:true}

var express = require('express'),
    bodyParser = require('body-parser'),
    expressApp = express();



const path = require('path');

function createWindow() {
	app.allowRendererProcessReuse= false;
	mainWindow = new BrowserWindow({
	    width: 1290,
	    height: 840,
	    enableLargerThanScreen: true,
	    kiosk: false,
	    fullscreen: false,
	    frame: true,
	    webPreferences: {
		  nodeIntegration: true,
		  enableRemoteModule:true,
		  contextIsolation: false,
		  webSecurity:false
	    }
  	});

	//const startUrl = (process.env.ELECTRON_START_URL!= undefined)?'http://localhost:3000': `file://${path.join(__dirname, '../build/index.html')}`;
	const startUrl = isDev? "http://localhost:3000": `file://${path.join(__dirname, '../build/index.html')}`;

	mainWindow.loadURL(startUrl);

	if (isDev&&!settings.fullscreen) mainWindow.webContents.openDevTools();
	mainWindow.on("closed", () => (mainWindow = null));



	// expressApp.use(bodyParser.json());

	// Express Server Listening for incoming Strapi Webhook
	var server = expressApp.listen(settings.webhookPort, function () {

	    var host = server.address().address
	    var port = server.address().port

	    console.log('Example app listening at http://%s:%s', host, port)

	});

	expressApp.post('/refresh', function (req, res) {
	  console.log("Received Refresh Hook")
		mainWindow.reload()
	});
}

app.on("ready", createWindow);
app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
	app.quit();
}
});
app.on("activate", () => {
	if (mainWindow === null) {
		createWindow();
	}
});
