import { useEffect, memo } from "react";
import {Html5QrcodeScanner, Html5QrcodeSupportedFormats} from "html5-qrcode"

// Scanner library has some re-draw issues, so use memo
const Scanner = memo((props) => {

    useEffect(() => {
      /* global Html5QrcodeSupportedFormats */
        let html5QrcodeScanner = new Html5QrcodeScanner(
          "reader",
          { 
              fps: 10, 
              qrbox: {width: 175, height: 175},
              
              formatsToSupport: [ Html5QrcodeSupportedFormats.QR_CODE, Html5QrcodeSupportedFormats.CODE_128 ] 
       
            },
          /* verbose= */ false);
        html5QrcodeScanner.render(props.onScanSuccess);
    }, []); 
  
    return (
      <div style={{width: '250px'}} id="reader"></div>
    )
  });

export default Scanner;