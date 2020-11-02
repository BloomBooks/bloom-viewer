import { useEffect } from "react";
export function useCheckForNewVersion() {
  useEffect(() => {
    window.electronApi.checkForNewVersion();
  }, []);
}
