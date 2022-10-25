import { useEffect } from "react";
import Button from '@mui/material/Button';
import CloseIcon from '@mui/icons-material/Close';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Unstable_Grid2';
import IconButton from '@mui/material/IconButton';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';


const ClientFormDialog = (props) => {
  const { open, mode, clientBeingEdited, onSave,  onClose } = props;

  useEffect(() => {
    console.log("Render ClientFormDialog");
  });

  const handleClientFormSave = () => {
    clientBeingEdited.firstName = document.getElementById(mode + "FirstName").value;
    clientBeingEdited.lastName = document.getElementById(mode + "LastName").value;
    clientBeingEdited.address = document.getElementById(mode + "Address").value;
    clientBeingEdited.town = document.getElementById(mode + "Town").value;
    clientBeingEdited.phone = document.getElementById(mode + "Phone").value;
    clientBeingEdited.children = document.getElementById(mode + "Children").value - 0;
    clientBeingEdited.adults = document.getElementById(mode + "Adults").value - 0;
    clientBeingEdited.seniors = document.getElementById(mode + "Seniors").value - 0;
    if (document.getElementById(mode + "MemberId").value) {
      clientBeingEdited.memberId = document.getElementById(mode + "MemberId").value - 0;
    }
    let checkIn = false;
    if (mode == "add") {
      // TODO: Support As+1 when adding new client.  No | Yes | Yes, as +1
      checkIn = document.getElementById(mode + "AlsoCheckIn").checked? "1" : null;
    }
    let saveSuccess = onSave(clientBeingEdited,  checkIn);
    if (saveSuccess) {
      onClose();
    }
  };
  const handleClientFormCancel = () => {
    onClose();
  };

  return (
    <Dialog open={open} id="{mode}ClientForm" onClose={handleClientFormCancel}
    sx={{
          backdropFilter: "blur(5px)",
          //other styles here
        }}
    >
      <DialogTitle>Client Information
      <IconButton
          aria-label="close"
          onClick={handleClientFormCancel}
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
      <Grid container spacing={2}
      component="form"
      autoComplete="off"
      p={2}
    >
      <Grid xs={12}><TextField id={mode + "FirstName"} label="First Name" defaultValue={clientBeingEdited.firstName} required fullWidth /></Grid>
      <Grid xs={12}><TextField id={mode + "LastName"} label="Last Name" defaultValue={clientBeingEdited.lastName} required fullWidth  /></Grid>
      <Grid xs={12}><TextField id={mode + "Address"} label="Street Address" defaultValue={clientBeingEdited.address} required fullWidth  /></Grid>
      <Grid xs={12}><TextField id={mode + "Town"} label="Town" defaultValue={clientBeingEdited.town} required fullWidth /></Grid>
      <Grid xs={12}><TextField id={mode + "Phone"} label="Phone" defaultValue={clientBeingEdited.phone} type="phone"/></Grid>
      
      <Grid xs={12}>Household:</Grid>
      <Grid xs={1}></Grid><Grid xs={11}><TextField id={mode + "Children"} label="Number of Children" defaultValue={clientBeingEdited.children} type="number"/></Grid>
      <Grid xs={1}></Grid><Grid xs={11}><TextField id={mode + "Adults"} label="Number of Adults" defaultValue={clientBeingEdited.adults} type="number"/></Grid>
      <Grid xs={1}></Grid><Grid xs={11}><TextField id={mode + "Seniors"} label="Number of Seniors" defaultValue={clientBeingEdited.seniors} type="number"/></Grid>

      <Grid xs={12}><TextField id={mode + "MemberId"} label="Member Number (Optional)" defaultValue={clientBeingEdited.memberId} type="number"/></Grid>
      {mode == "add" && 
        <Grid xs={12}><FormControlLabel control={<Switch defaultChecked id={mode + "AlsoCheckIn"}/>} label="Also check them in for today" /></Grid>
      }
      
    </Grid>
    </DialogContent>
        <DialogActions>
          <Button className="saveClientFormButton" onClick={() => handleClientFormSave()}>Save</Button>
          <Button className="cancelClientFormButton" onClick={handleClientFormCancel}>Cancel</Button>
        </DialogActions>
    </Dialog>
  );
}
export default ClientFormDialog;