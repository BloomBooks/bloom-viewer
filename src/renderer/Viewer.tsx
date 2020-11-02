import React, { useEffect, useState } from "react";

const bloomPlayerProtocol = "bpub://bloom-player/";
const bloomPlayerHtml = "bloomplayer.htm";
export const Viewer: React.FunctionComponent<{ zipFilePath: string }> = (
  props
) => {
  const [htmPath, setHtmPath] = useState("");
  useEffect(() => {
    window.electronApi.send("unpack-zip-file", props.zipFilePath);
    window.electronApi.receive(
      "zip-file-unpacked",
      (origZip: string, indexPath: string) => {
        if (origZip === props.zipFilePath) {
          setHtmPath(indexPath);
        }
      }
    );
  }, [props.zipFilePath]);

  const rawUrl = getUrlFromFilePath(htmPath);
  console.log(`path = ${htmPath} (encoded to ${rawUrl})`);

  const iframeSource = `${bloomPlayerProtocol}${bloomPlayerHtml}?allowToggleAppBar=true&url=${rawUrl}&host=bloompubviewer`;
  console.log(`iframe src set to ${iframeSource}`);

  return (
    <div className="App">
      {htmPath && (
        <iframe style={{ width: "100%", height: "100%" }} src={iframeSource} />
      )}
    </div>
  );
}; ////https://s3.amazonaws.com/bloomharvest/benjamin%40aconnectedplanet.org%2f130b6829-5367-4e5c-80d7-ec588aae5281/bloomdigital%2findex.htm"

// Converts a filePath into a URL. Applies appropriate encoding to any special characters.
function getUrlFromFilePath(htmPath: string): string {
  // see https://issues.bloomlibrary.org/youtrack/issue/BL-8652 and BL-9041
  const encodedPath = htmPath.split(/[\\/]/g).map(encodeURIComponent).join("/");
  return `${bloomPlayerProtocol}${encodedPath}`; // need this bloomPlayerProtocol so as to not be cross origin.
}