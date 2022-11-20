import { useEffect, useState } from "react";
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';


import Client from '../Client';
import ClientFormDialog from './ClientFormDialog';
import MemberNumberDialog from './MemberNumberDialog';

//import '../Client.js';

const ClientListing = (props) => (
  <TableRow className="clientListing"
    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
  >
    <TableCell component="th" scope="row">
        <span className="clientName">{props.client.firstName} {props.client.lastName}</span> 
    </TableCell>
    <TableCell align="right">{props.client.town}</TableCell>
    <TableCell align="right"> 
      <span title="Adults: {props.client.adults} | Kids: {props.client.children | Seniors {props.client.seniors}"
      className={props.client.hasLargeFamily() ? "family largeFamily" : "family smallFamily"} 
      >{props.client.getFamilySize()}
      </span>
    </TableCell>
    <TableCell align="right">
      <ButtonGroup variant="outlined" size="small" aria-label="Client Actions">
        {!props.client.isCheckedIn(props.todayStr) && !props.client.isCheckedInAsPlusOne(props.todayStr)
          ? 
            <>
              <Button className="checkInButton" onClick={() => props.checkClientIn(props.client)}>Check In</Button>
              <Button className="checkInPlusOneButton" onClick={() => props.checkClientIn(props.client, true)}>Check In As +1</Button>
            </>
          :
            <Button className="checkOutButton" onClick={() => props.checkClientOut(props.client)}>Undo Check In</Button> 
          }
        <Button className="edit"  onClick={() => props.onClickEdit(props.client)}>Edit</Button>
        { isNaN(props.client.memberId) ? 
          <Button className="clientListingBarcodeButton edit"  onClick={() => props.onClickAssignMemberNumber(props.client)}>Assign Barcode</Button>
          :
          <Button className="clientListingBarcodeButton" onClick={() => props.onClickViewMemberNumber(props.client)}>View Barcode</Button>
        }
      </ButtonGroup>
    </TableCell>
  </TableRow>
);
  
const ClientList = (props) => {
  useEffect(() => {
    console.log("Render ClienList");
  });


  // Dialogs
  const [editOpen, setEditOpen] = useState(false);
  const [memberNumberOpen, setMemberNumberOpen] = useState(false);
  const [clientBeingEdited, setClientBeingEdited] = useState(new Client());

  const onClickEdit = (client) => {
    setClientBeingEdited(client);
    setEditOpen(true);
  };


  const handleEditClose = (value) => {
    setEditOpen(false);
  };


  const onClickViewMemberNumber = (client) => {
    
    
    console.log("Showing dialog");
    setMemberNumberOpen(true);

    console.log("Configuring dialog info");
    setClientBeingEdited(client);

    

  };
  const handleMemberNumberClose = () => {
    setMemberNumberOpen(false);
  }

  const onClickAssignMemberNumber = (client) => {
    onClickViewMemberNumber(client);
  };

  return (
    <>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell align="right">Town</TableCell>
              <TableCell align="right">Family Size</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {props.clients.map((client) => (
              <ClientListing 
                key={client.getIdentifier()} 
                client={client} 
                checkClientIn={props.checkClientIn}
                checkClientOut={props.checkClientOut}
                onClickEdit={onClickEdit} 
                onClickViewMemberNumber={onClickViewMemberNumber}
                onClickAssignMemberNumber={onClickAssignMemberNumber}
                todayStr={props.todayStr}/>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    
      <ClientFormDialog
        open={editOpen}
        mode="edit"
        clientBeingEdited={clientBeingEdited}
        onSave={props.saveClient}
        onClose={handleEditClose}
      /> 
      <MemberNumberDialog
        open={memberNumberOpen}
        client={clientBeingEdited}
        onClose={handleMemberNumberClose}
      />
  </>
  );
};
export default ClientList;