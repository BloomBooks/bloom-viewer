import { contextBridge, ipcRenderer, remote, shell } from "electron";
import { Octokit } from "@octokit/rest";
import compareVersions from "compare-versions";
import { toast } from "react-toastify";

// Expose protected methods that allow the renderer process to use
// ipcRenderer, remote, and shell without exposing the entire objects
contextBridge.exposeInMainWorld("electronApi", {
  sendSync: (channel: string, data) => {
    // whitelist channels
    let validChannels = ["get-file-that-launched-me"];
    if (validChannels.includes(channel)) {
      ipcRenderer.sendSync(channel, data);
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
    shell.openExternal("https://bloomlibrary.org/browse");
  },

  addRecentDocument: (zipPath: string) => {
    remote.app.addRecentDocument(zipPath);
  },

  getTitle: () => {
    return "BloomPUB Viewer " + require("../package.json").version;
  },

  setTitle: (title: string) => {
    remote.getCurrentWindow().setTitle(title);
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
                //   showBook(result.filePaths[0]);
          func(result.filePaths[0]);
        } else {
          func("");
        }
      });
  },

  checkForNewVersion: () => {
    const octokit = new Octokit();
    octokit.repos
      .getLatestRelease({ owner: "bloombooks", repo: "bloompub-viewer" })
      .then((data) => {
        //strip out the leading "v" in "v1.2.3";
        const version = data.data.tag_name.replace(/v/gi, "");
        if (compareVersions(version, require("../package.json").version) > 0) {
          toast.success(
            `Click to get new version of BloomPUB Viewer (${data.data.name})`,
            {
              position: "bottom-right",
              autoClose: 15000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
              onClick: () => {
                shell.openExternal(data.data.html_url);
              },
            }
          );
        }
      });
  },
});
