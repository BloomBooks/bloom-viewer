import React, { useEffect, useState } from "react";
import "./App.css";
// I couldn't get   import 'react-toastify/dist/ReactToastify.css'; to work, so I copied it in.
import "./ReactToastify.min.css";
import { Viewer } from "./Viewer";
import { StartScreen } from "./StartScreen";
import { toast, ToastContainer } from "react-toastify";
import { Octokit } from "@octokit/rest";
import compareVersions from "compare-versions";

let setZipPathStatic: (path: string) => void;

const App: React.FunctionComponent<{ initialFilePath: string }> = (props) => {
  const [zipPath, setZipPath] = useState(props.initialFilePath);
  setZipPathStatic = setZipPath;
  useEffect(() => {
    if (zipPath) {
      window.electronApi.addRecentDocument(zipPath);
    }
  }, [zipPath]);
  checkForNewVersion();

  return (
    <>
      <ToastContainer></ToastContainer>
      {(zipPath && <Viewer zipFilePath={zipPath} />) || (
        <StartScreen></StartScreen>
      )}
    </>
  );
};

export default App;

export function showBook(zipFilePath: string) {
  setZipPathStatic(zipFilePath);
}

function checkForNewVersion() {
  const octokit = new Octokit();
  octokit.repos
    .getLatestRelease({ owner: "bloombooks", repo: "bloompub-viewer" })
    .then((data) => {
      //strip out the leading "v" in "v1.2.3";
      const version = data.data.tag_name.replace(/v/gi, "");
      if (compareVersions(version, require("../../package.json").version) > 0) {
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
              window.electronApi.openExternal(data.data.html_url);
            },
          }
        );
      }
    })
    .catch((err: Error) => {
      console.error("Error getting latest release info from github: \n", err);
    });
}
