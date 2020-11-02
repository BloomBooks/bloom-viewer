import { app, BrowserWindow, ipcMain, protocol } from "electron";
import * as fs from "fs";
import * as unzipper from "unzipper";
import * as temp from "temp";
import * as Path from "path";
import { setupAutoUpdate } from "./autoUpdate";

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== "development") {
  global.__static = require("path")
    .join(__dirname, "/static")
    .replace(/\\/g, "\\\\");
}

protocol.registerSchemesAsPrivileged([
  { scheme: "bpub", privileges: { standard: true, bypassCSP: true } },
]);

let mainWindow: BrowserWindow | null;
temp.track();

const winURL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:9080"
    : `file://${__dirname}/index.html`;

const preloadPath =
  process.env.NODE_ENV === "development"
    ? Path.join(app.getAppPath(), "preload.js")
    : Path.join(__dirname, "preload.js");

function createWindow() {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    height: 563,
    useContentSize: true,
    width: 1000,
    webPreferences: {
      nodeIntegration: false,
      webSecurity: true,
      contextIsolation: true,
      preload: preloadPath,
    },
    //windows
    icon: Path.join(__dirname, "../../build/windows.ico"),
  });

  mainWindow.loadURL(winURL);

  if (process.env.NODE_ENV === "development") {
    console.log(
      "*****If you hang when doing a 'yarn dev', it's possible that Chrome is trying to pause on a breakpoint. Disable the mainWindow.openDevTools(), run 'dev' again, open devtools (ctrl+alt+i), turn off the breakpoint settings, then renable."
    );

    mainWindow.webContents.openDevTools();
  } else if (process.env.DEBUG_BLOOMPUB_VIEWER === "yes") {
    // Sometimes it's useful to poke around to see what the production build is doing.
    mainWindow.webContents.openDevTools();
  }

  /* This is still in progress, held up while we decide if we can put the necessary certificate in github
    secrets. Without that, we can't sign, and without signing, we can' auto update anyways.
    setupAutoUpdate();*/

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.on("ready", () => {
  createWindow();
});

function convertUrlToPath(requestUrl: string): string {
  const bloomPlayerOrigin = "bpub://bloom-player/";
  const baseUrl = decodeURI(requestUrl);
  const urlPath = baseUrl.startsWith(bloomPlayerOrigin)
    ? baseUrl.substr(bloomPlayerOrigin.length)
    : baseUrl.substr(7); // not from same origin? shouldn't happen.
  const playerFolder =
    process.env.NODE_ENV === "development"
      ? Path.normalize(
          Path.join(app.getAppPath(), "../../node_modules/bloom-player/dist")
        )
      : __dirname;
  let path: string;
  if (urlPath.startsWith("bloomplayer.htm?allowToggleAppBar")) {
    path = Path.join(playerFolder, "bloomplayer.htm");
  } else if (
    urlPath.startsWith("bloomPlayer-") &&
    urlPath.endsWith(".min.js")
  ) {
    path = Path.join(playerFolder, urlPath);
  } else if (urlPath.includes("?")) {
    path = Path.normalize(urlPath.substr(0, urlPath.indexOf("?")));
  } else {
    path = Path.normalize(urlPath);
  }
  //console.log("bpub handler: path=" + path);
  return path;
}

app.whenReady().then(() => {
  protocol.registerFileProtocol("bpub", (request, callback) => {
    callback(convertUrlToPath(request.url));
  });
});

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

ipcMain.on("get-file-that-launched-me", (event, arg) => {
  // using app.isPackaged because the 2nd argument is a javascript path in dev mode
  if (app.isPackaged && process.argv.length >= 2) {
    console.log(JSON.stringify(process.argv));
    var openFilePath = process.argv[1];
    event.returnValue = openFilePath;
  } else {
    event.returnValue = ""; //"D:\\temp\\The Moon and the Cap.bloomd";
  }
});

ipcMain.on("unpack-zip-file", (event, zipFilePath) => {
  const slashIndex = zipFilePath.replace(/\\/g, "/").lastIndexOf("/");
  const unpackedFolder = temp.mkdirSync("bloomPUB-viewer-");
  const stream = fs.createReadStream(zipFilePath);
  // This will wait until we know the readable stream is actually valid before piping
  stream.on("open", () => {
    stream.pipe(
      unzipper
        .Extract({ path: unpackedFolder })
        // unzipper calls this when it's done unzipping
        .on("close", () => {
          let filename = "index.htm";
          if (!fs.existsSync(Path.join(unpackedFolder, filename))) {
            // it must be the old method, where we named the htm the same as the bloomd (which was obviously fragile):
            const bookTitle = zipFilePath.substring(
              slashIndex + 1,
              zipFilePath.length
            );
            filename = bookTitle
              .replace(/\.bloomd/gi, ".htm")
              .replace(/\.bloompub/gi, ".htm");
            if (!fs.existsSync(Path.join(unpackedFolder, filename))) {
              // maybe it's the old format AND the user changed the name
              filename =
                fs
                  .readdirSync(unpackedFolder)
                  .find((f) => Path.extname(f) === ".htm") ||
                "no htm file found";
            }
          }
          event.reply(
            "zip-file-unpacked",
            zipFilePath,
            Path.join(unpackedFolder, filename).replace(/\\/g, "/")
          );
        })
    );
  });
});

/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'
autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})
app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
 */
