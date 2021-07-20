import { contextBridge, ipcRenderer, remote, shell } from "electron";

// Expose protected methods that allow the renderer process to use
// ipcRenderer, remote, and shell without exposing the entire objects
contextBridge.exposeInMainWorld("electronApi", {
  sendSync: (channel: string, data) => {
    // whitelist channels
    let validChannels = ["get-file-that-launched-me"];
    if (validChannels.includes(channel)) {
      return ipcRenderer.sendSync(channel, data);
    }
  },
  send: (channel: string, data) => {
    // whitelist channels
    let validChannels = ["unpack-zip-file"];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  receive: (channel: string, func) => {
    let validChannels = ["zip-file-unpacked"];
    if (validChannels.includes(channel)) {
      // Deliberately strip event as it includes `sender`
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },
  openLibrary: () => {
    shell.openExternal("https://bloomlibrary.org");
  },
  openExternal: (externalLink: string) => {
    shell.openExternal(externalLink);
  },

  addRecentDocument: (zipPath: string) => {
    remote.app.addRecentDocument(zipPath);
  },

  quit: () => {
    remote.app.quit();
  },

  setApplicationMenu: (template: Array<any>) => {
    const menu = remote.Menu.buildFromTemplate(
      template as Electron.MenuItemConstructorOptions[]
    );
    remote.Menu.setApplicationMenu(menu);
  },

  showOpenDialog: (options, func) => {
    remote.dialog
      .showOpenDialog(options as Electron.OpenDialogOptions)
      .then((result) => {
        if (!result.canceled && result.filePaths.length > 0) {
          func(result.filePaths[0]);
        } else {
          func("");
        }
      });
  },
});
