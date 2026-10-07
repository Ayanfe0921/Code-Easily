import React, { useEffect } from 'react'
import { useSandpack } from '@codesandbox/sandpack-react'

const SandpackErrorMonitor = ({onErrorChange}) => {
    const { sandpack } = useSandpack()
    const {error} = sandpack;

    useEffect(()=>{
        if(error){
            const msg = error.message || "";
            // Keep Sandpack's error visible when its remote bundler is
            // unreachable. Hiding this overlay leaves the template's starter
            // screen visible, which looks like the generated app was ignored.
            const isNetworkError =
                msg.toLowerCase().includes("failed to fetch") ||
                msg.toLowerCase().includes("col.csbops.io") ||
                msg.toLowerCase().includes("err_connection_timed_out") ||
                msg.toLowerCase().includes("net::err");

            if (isNetworkError) {
                onErrorChange(true);
                return;
            }
        }
        onErrorChange(true)
    },[error, onErrorChange])
  return null
}

export default SandpackErrorMonitor
