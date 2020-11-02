import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App, { showBook } from "./App";

updateMainMenu();
const zipFilePath = window.electronApi.sendSync("get-file-that-launched-me");

const title = window.electronApi.getTitle();

window.electronApi.setTitle(title);

ReactDOM.render(
  <App initialFilePath={zipFilePath} />,
  document.getElementById("root")
);

function updateMainMenu() {
  const macMenu = {
    label: `BloomPUB Viewer`,
    submenu: [
      {
        label: `Quit`,
        accelerator: "Command+Q",
        click() {
          window.electronApi.quit();
        },
      },
    ],
  };

  const fileMenu = {
    label: "&" + `File`,
    submenu: [
      {
        label: "&" + `Open BloomPUB...`,
        accelerator: "Ctrl+O",
        click: () => {
          showOpenFile();
        },
      },
      {
        label: "&" + `Start Screen`,

        click: () => {
          showBook("");
        },
      },
    ],
  };
  if (fileMenu && process.platform !== "darwin") {
    //fileMenu.submenu.push({ type: "separator" });
    fileMenu.submenu.push({ role: "quit" } as any);
  }

  const template = Array<any>();
  if (process.platform === "darwin") {
    template.push(macMenu);
  }

  template.push(fileMenu);
  window.electronApi.setApplicationMenu(template);
}
export function showOpenFile() {
  const options /*:Electron.OpenDialogOptions*/ = {
    title: "Open BloomPUB File",
    properties: ["openFile"],
    filters: [
      {
        name: "BloomPUB Book",
        extensions: ["bloomd", "bloompub"],
      },
    ],
  };
  window.electronApi.showOpenDialog(options, (filepath: string) => {
    if (filepath) {
      showBook(filepath);
    }
  });
}
