import { useEffect } from "react";
import Button from '@mui/material/Button';
import CloseIcon from '@mui/icons-material/Close';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import JsBarcode from 'jsbarcode';

const MemberNumberDialog = (props) => {
  const { open, client, onClose } = props;

  useEffect(() => {
    console.log("Rending barcode");
    setTimeout(function() {JsBarcode("#barcode").init()}, 1500); // TODO; Avoid needing a timeout for this
    /*
      JsBarcode("#barcode", client.memberId, {
        displayValue: true
      });  
    */
  }, [client]);

  return (
    <Dialog open={open} id="memberNumberDialog" onClose={onClose}
      sx={{
        backdropFilter: "blur(5px)",
        //other styles here
      }}>
      <DialogTitle>Client Member Number
      <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        <canvas id="barcode"
          jsbarcode-value={client.memberId}
          jsbarcode-displayvalue="true"
          jsbarcode-fontoptions="bold">
        </canvas>
      </DialogContent>
      <DialogActions>
          <Button onClick={onClose}>OK</Button>
      </DialogActions>
      
    </Dialog>
  );
}
export default MemberNumberDialog;  