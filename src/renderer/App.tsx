import React, { useEffect, useState } from "react";
import "./App.css";
// I couldn't get   import 'react-toastify/dist/ReactToastify.css'; to work, so I copied it in.
import "./ReactToastify.min.css";
import { hot } from "react-hot-loader/root";
import { ToastContainer } from "react-toastify";
import * as fs from "fs";
import * as unzipper from "unzipper";
import * as temp from "temp";
import { useCheckForNewVersion } from "./useCheckForNewVersion";

const bloomPlayerHtml = "bloomplayer.htm";
const App: React.FunctionComponent<{ zipFilePath: string }> = (props) => {
  const [htmPath, setHtmPath] = useState("");
  useCheckForNewVersion();
  useEffect(() => {
    console.log("bloom htmlpath=" + bloomPlayerHtml);
    const slashIndex = props.zipFilePath
      .replace(/\\/g, "/")

      .lastIndexOf("/");
    let bookTitle: string;
    bookTitle = props.zipFilePath.substring(
      slashIndex + 1,
      props.zipFilePath.length
    );
    const filename = bookTitle
      .replace(/\.bloomd/gi, ".htm")
      .replace(/\.bloompub/gi, ".htm");
    temp.track();
    temp.mkdir("bloom-reader-", (err, p) => {
      fs.createReadStream(props.zipFilePath).pipe(
        unzipper.Extract({ path: p })
      );
      console.log("booktitle = " + bookTitle);
      console.log("filename = " + filename);
      console.log("temp path = " + p);
      // for some reason electron isn't actually ready for bloom-player to make requests yet
      // initially, hence the delay
      window.setTimeout(
        () => setHtmPath((p + "\\" + filename).replace(/\\/g, "/")),
        1000
      );
    });
  }, [props.zipFilePath]);

  console.log("htmPath = " + htmPath);
  return (
    <div className="App">
      {htmPath && (
        <iframe
          style={{ width: "100%", height: "100%" }}
          src={`${bloomPlayerHtml}?allowToggleAppBar=true&url=file:///${htmPath}`}
        />
      )}
      <ToastContainer />
    </div>
  );
}; ////https://s3.amazonaws.com/bloomharvest/benjamin%40aconnectedplanet.org%2f130b6829-5367-4e5c-80d7-ec588aae5281/bloomdigital%2findex.htm"

export default hot(App);
