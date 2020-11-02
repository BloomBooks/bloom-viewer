import React, { useEffect, useState } from "react";
import "./App.css";
// I couldn't get   import 'react-toastify/dist/ReactToastify.css'; to work, so I copied it in.
import "./ReactToastify.min.css";
import { useCheckForNewVersion } from "./useCheckForNewVersion";
import { Viewer } from "./Viewer";
import { StartScreen } from "./StartScreen";

let setZipPathStatic: (path: string) => void;

const App: React.FunctionComponent<{ initialFilePath: string }> = (props) => {
  const [zipPath, setZipPath] = useState(props.initialFilePath);
  setZipPathStatic = setZipPath;
  useEffect(() => {
    if (zipPath) {
      window.electronApi.addRecentDocument(zipPath);
    }
  }, [zipPath]);
  useCheckForNewVersion();

  return (
    <>
      {(zipPath && <Viewer zipFilePath={zipPath} />) || (
        <StartScreen></StartScreen>
      )}
    </>
  );
};

// export default hot(App);
export default App;

export function showBook(zipFilePath: string) {
  setZipPathStatic(zipFilePath);
}
