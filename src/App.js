import logo from './logo.svg';
import { useEffect, useState, memo, useCallback } from "react";
import CloseIcon from '@mui/icons-material/Close';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import Collapse from '@mui/material/Collapse';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import JsBarcode from 'jsbarcode';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Switch from '@mui/material/Switch';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Unstable_Grid2';
import jwt_decode from 'jwt-decode';

import './App.css';
import {Html5QrcodeScanner, Html5QrcodeSupportedFormats} from "html5-qrcode"

const useSessionStorage = (storageKey, fallbackState) => {
  const [value, setValue] = useState(
    JSON.parse(sessionStorage.getItem(storageKey)) ?? fallbackState
  );

  useEffect(() => {
    sessionStorage.setItem(storageKey, JSON.stringify(value));
  }, [value, storageKey]);

  return [value, setValue];
};

class Client {
  constructor (props) {
    if (props) {
      this.fill(props);
    }
    this.visits = {}; // [];
  } 

  fill(props) {

    if (!props) { return; }
    this.firstName = props.firstName;
    this.lastName = props.lastName;
    this.address = props.address;
    this.town = props.town;
    this.phone = props.phone;
    this.children = parseInt(props.children) || 0;
    this.adults = parseInt(props.adults) ||  0;
    this.seniors = parseInt(props.seniors) || 0;
    this.legalDate = props.legalDate;
    this.memberId = parseInt(props.memberId);
    this.sheetRow = props.sheetRow; // The row on the spreadsheet where this client was stored.  Don't trust this for long


    // Member IDs are still rolling out, so not everyone hase one
    // So we need to rely on name for those without and hope for the best.
    // Also, This can't be computed on the fly, because editing name would cause the identifier to change
    // mid-session
    if (this.memberId || this.lastName) {
      this.identifier = (this.memberId) ? this.memberId : (this.lastName + this.firstName).toLowerCase();
    }
  }

  getIdentifier() {
    return (this.memberId) ? this.memberId : this.identifier;
  }
  getFamilySize() {
    return this.adults + this.children + this.seniors;
  }
  hasLargeFamily() {
    // TODO:  Make this configurable?  Not sure if that's a good idea.
    return  this.getFamilySize() >= 7;
  }
  isCheckedIn(checkInDate) {
    //return this.visits.indexOf(checkInDate) > -1;
    return this.visits.hasOwnProperty(checkInDate) && this.visits[checkInDate] == "1";
  }
  isCheckedInAsPlusOne(checkInDate) {
    //return this.visits.indexOf(checkInDate) > -1;
    return this.visits.hasOwnProperty(checkInDate) && this.visits[checkInDate] == "P";
  }
}


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
          <Button className="edit"  onClick={() => props.onClickAssignMemberNumber(props.client)}>Assign Barcode</Button>
          :
          <Button onClick={() => props.onClickViewMemberNumber(props.client)}>View Barcode</Button>
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

const Search = (props) => console.log("Render Search") || (
  <TextField id="search" fullWidth label="Search Clients by Name or ID Number" type="search" 
      onChange={props.onSearch}
    />
);

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

const SessionStats = (props) => console.log("Render SessionStats") || (
  <Table aria-label="Today's Numbers">
    <TableBody>
      <TableRow>
        <TableCell>
          Total Clients Today:
        </TableCell>
        <TableCell>
          {props.clientsToday}
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell>
          Adults Today: 
        </TableCell>
        <TableCell>
          {props.adultsToday}
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell>
          Children Today:
        </TableCell>
        <TableCell>
          {props.childrenToday}
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell>
          Seniors Today
        </TableCell>
        <TableCell>
          {props.seniorsToday}
        </TableCell>
      </TableRow>
      
      
      <TableRow>
        <TableCell>
          By Town
        </TableCell>
        <TableCell>
        </TableCell>
      </TableRow>

      {Object.keys(clientsTodayByTown).map((town, total) => {
          <TableRow>
            <TableCell>{town}</TableCell>
            <TableCell>{total}</TableCell>
          </TableRow>
      })}
    </TableBody>
  </Table>
);

function App() {


    /* exported gapiLoaded */
    /* exported gisLoaded */
  
  const CLIENT_ID = '550174706281-ji890svg8tuadu0fifgdmuh1qssk2ect.apps.googleusercontent.com';
  const API_KEY = 'AIzaSyDIt0cxWOmicBKtuLGsQ5MMLQmingWfgrY';
  const SPREADSHEET = '1idxMHE3OYeawKb6jQEpIofWAFJ3UbRqmyh2Qy5C-hXQ';
  const SHEET = "Client List"

  // Discovery doc URL for APIs used by the quickstart
  const DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';

  // Authorization scopes required by the API; multiple scopes can be
  // included, separated by spaces.
  const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

  

  let propertyToColumnMap = [];
  let distributionDates = [];

  const todayStr = formatDateForColumn(new Date());
  const [clientsToday, setClientsToday] = useState(0);
  const [childrenToday, setChildrenToday] = useState(0);
  const [adultsToday, setAdultsToday] = useState(0);
  const [seniorsToday, setSeniorsToday] = useState(0);
  const [clientsTodayByTown, setClientsTodayByTown] = useState({"Not Yet Available" : ""});

  const [user, setUser] = useSessionStorage('user', {});//useState();
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState([]);
  const [errorOpen, setErrorOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const [nextAvailableMemberNumber, setNextAvailableMemberNumber] = useState(0); // For assigning Member IDs to new clients



  const onClickAdd = () => {
    //let newClient = new Client();
    /* This is a bad idea, since it takes so long to fill out the form, the id might get taken
    console.log("Add member " + nextAvailableMemberNumber);
    if (nextAvailableMemberNumber > 0) {
      newClient.memberId = nextAvailableMemberNumber;
    }
    */
    //setClientBeingEdited(newClient);
    setAddOpen(true);
  };

  const handleAddClose = (value) => {
    setAddOpen(false);
  };

  const onScanSuccess = useCallback((decodedText, decodedResult) => {
    // TODO: Only accept scans every 5 seconds or so
    console.log(`Code matched = ${decodedText}`, decodedResult);
    document.getElementById('audio').play();
    //setSearchTerm(decodedText);
    setSearch(decodedText);
  });
  
  function onScanFailure(error) {
    // handle scan failure, usually better to ignore and keep scanning.
    // for example:
    //console.warn(`Code scan error = ${error}`);
  }


  const setSearch = (term) => {
    let searchField = document.getElementById('search');
    // A bit hacky
    searchField.value = term;
    searchFor(term);
    searchField.focus();
    //var event = new Event('change', { bubbles: true });

    // Dispatch it.
    //searchField.dispatchEvent(event);
    //setSearchTerm(term);
  }
  const searchFor = (term) => {
    setSearchTerm(term);
    console.log("Searching " + clients.length + " clients for " + term );

  }

  const handleSearch = (event) => {
    searchFor(event.target.value)
  };

/*
  useEffect(() => {
    // A bit hacky
    console.log("Redrawing search because clients changed");
    handleSearch({target: { value: document.getElementById('search').value}});
  }, [clients]);
*/
  const showError = (message) => {
    document.getElementById('error').innerHTML = message;
    setErrorOpen(true);
    // setTimeout(hideError, 5000);
  }
  const hideError = () => {
    setErrorOpen(false);
  }

  const searchedClients = (searchTerm == "") ? clients : clients.filter((client) =>
    (client.memberId + client.firstName + " " + client.lastName).toLowerCase().includes(searchTerm.toLowerCase())
  );


/*
 *  START GOOGLE STUFF
 *
 */ 

  let tokenClient;
  let gapiInited = false;
  let gisInited = false;
  const [authInterval, setAuthInterval] = useState();

  // document.getElementById('signInButton').style.visibility = 'hidden';
  // document.getElementById('signOutButton').style.visibility = 'hidden';

  /**
   * Callback after api.js is loaded.
   */
  
  function gapiLoaded() {
    gapi.load('client', intializeGapiClient);
  }

  /**
   * Callback after the API client is loaded. Loads the
   * discovery doc to initialize the API.
   */
  async function intializeGapiClient() {
    await gapi.client.init({
      apiKey: API_KEY,
      discoveryDocs: [DISCOVERY_DOC],
      client_id: CLIENT_ID, 
    });
    gapiInited = true;

    let token = readGoogleAuthToken();
    if (token != null) {
      gapi.client.setToken({access_token : token });
      
      //let initialClients = await loadClientData();
      //if (initialClients) setClients(initialClients);
    } 
    /*
    else {
      handleSignoutClick();
    }
    */
    console.log("gapiLoaded");
    maybeEnableButtons();
  }

  /**
   * Callback after Google Identity Services are loaded.
   */
  function gisLoaded() {

    /* global google */
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: '', // defined later
    });
    console.log("gisLoaded");
    gisInited = true;
    maybeEnableButtons();
  }

  /**
   * Enables user interaction after all libraries are loaded.
   */
  async function maybeEnableButtons() {
    if (gapiInited && gisInited) {
      //document.getElementById('signInArea').style.visibility = 'visible';
      //TODO: Only try this if we know we're logging in
      //if (userIsSignedIn()) {
      //  console.log("User logged in, getting data");
        //console.log(user);
        //if (gapi.client.getToken() !== null) {
          //setAuthInterval(setInterval(updateGoogleAuth, 1000 * 60 * 30));
        //  let initialClients = await loadClientData();
        // if (initialClients) setClients(initialClients);
        //}
    //}
    }
  }

  function saveGoogleAuthToken() {
    let expire = new Date();
    expire.setTime(expire.getTime() + 1 * 3600 * 1000);
    sessionStorage.setItem('gToken', gapi.client.getToken().access_token + "|" + expire.getTime());
    /*
    let expire = new Date();
    expire.setTime(expire.getTime() + 1 * 3600 * 1000);
    document.cookie="gToken=" + gapi.client.getToken().access_token + ";";
    document.cookie = "expires=" + expire.toUTCString() + ";";
    */
  }

  function userIsSignedIn() {
    return Object.keys(user).length > 0;
  }
  function readGoogleAuthToken() {
    let tokenAndExp = sessionStorage.getItem('gToken');
    if (tokenAndExp) {
      let [token, exp] = tokenAndExp.split("|", 2);
      let expDate = new Date();
      expDate.setTime(exp);
      let now = new Date();
      if (now.getTime() < expDate.getTime()) {
        return token;
      }
    }
  }

  function updateGoogleAuth() {
    let tokenAndExp = sessionStorage.getItem('gToken');
    if (tokenAndExp) {
      let [token, exp] = tokenAndExp.split("|", 2);
      let expDate = new Date();
      expDate.setTime(exp);
      let now = new Date();
      if (expDate.getTime() - now.getTime() < 1000 * 60 * 45) {
        
        console.log("Updating google token periodically");
    /*
    gapi.auth.authorize({
      client_id: CLIENT_ID,
      scope: SCOPES,
      immediate: true,
      callback: 'saveGoogleAuthToken'
    })
    */
   
        tokenClient.requestAccessToken({ hint: user.email, prompt: ''});
      }
    }
  }

  /**
   *  Sign in the user upon button click.
   */
  async function handleAuthClick() {
    tokenClient.callback = async (resp) => {
      console.log("Callback complete");
      if (resp.error !== undefined) {
        throw (resp);
      }
      console.log(resp);
      saveGoogleAuthToken();
      document.getElementById('signOutButton').style.visibility = 'visible';
      //document.getElementById('signInButton').innerText = 'Refresh';
      //setAuthInterval(setInterval(updateGoogleAuth, 1000 * 60 * 30));
      //await listMajors();
      console.log("Auth complete, loading data");
      let latestClients = await loadClientData();
      if (latestClients) setClients(latestClients);
    };
    if (gapi.client.getToken() === null) {
      // Prompt the user to select a Google Account and ask for consent to share their data
      // when establishing a new session.
      console.log("User does not have a token");
      tokenClient.requestAccessToken({hint: user.email, prompt: ''}); // 'consent'
    } else {
      // Skip display of account chooser and consent dialog for an existing session.
      console.log("User has a token");
      //tokenClient.requestAccessToken({ hint: user.email, prompt: ''});
      let latestClients = await loadClientData();
      if (latestClients) setClients(latestClients);
    }
  }

  /**
   *  Sign out the user upon button click.
   */
  function handleSignoutClick() {
    const token = gapi.client.getToken();
    if (token !== null) {
      //google.accounts.oauth2.revoke(token.access_token);
      gapi.client.setToken('');
      //document.getElementById('signInButton').innerText = 'Sign In';
      document.getElementById('signOutButton').style.visibility = 'hidden';
    }
    document.getElementById('GISButtons').style.visibility = 'visible';
    setUser({});
  }


  useEffect(() => {

    gapiLoaded();
    gisLoaded();          
    google.accounts.id.initialize({
      client_id: CLIENT_ID,
      auto_select: true, 
      callback: handleGISComplete
    });
      google.accounts.id.renderButton(
        document.getElementById("GISButtons"),
        { theme: "outline", size: "large", 
        auto_select: true, }  // customization attributes
      );
      //if (userIsSignedIn()) {
        //document.getElementById('GISButtons').style.visibility = 'hidden';
        document.getElementById('user').style.visibility = 'visible';
      //} 
        google.accounts.id.prompt(); // also display the One Tap dialog
  
  }, []);
  /*
    // useEffect is a way to get something to only run once
    useEffect(() => {
      console.log("Initializing");
      // global google 
      google.accounts.id.initialize({
        client_id: "550174706281-ji890svg8tuadu0fifgdmuh1qssk2ect.apps.googleusercontent.com",
        callback: handleGoogleIdentificationCallbackResponse
      });
  
      google.accounts.id.renderButton(
        document.getElementById("signInDiv"),
        {theme : "outline", size: "large"}
      );
      google.accounts.id.prompt();
    }, []);
  */

    const handleGISComplete = (response) => {
      console.log("Signed In, maybe?");
      const responsePayload = jwt_decode(response.credential);
 
      console.log("ID: " + responsePayload.sub);
      console.log('Full Name: ' + responsePayload.name);
      console.log('Given Name: ' + responsePayload.given_name);
      console.log('Family Name: ' + responsePayload.family_name);
      console.log("Image URL: " + responsePayload.picture);
      console.log("Email: " + responsePayload.email);
      console.log(responsePayload);
      setUser(responsePayload);
      document.getElementById('GISButtons').style.visibility = 'hidden';
      document.getElementById('user').style.visibility = 'visible';
      console.log("User info retrieve from google, now we can retrieve data");
      handleAuthClick();
    }

  /* 
   * END GOOGLE STUFF
   */

  async function loadClientDataClick() {
    console.log("User clicked to load data");
    let latestClientData = await loadClientData();
    setClients(latestClientData);
  }

  async function loadClientData() {
    /* global gapi */
    let response;
    try {
      response =  await gapi.client.sheets.spreadsheets.get({
        spreadsheetId: SPREADSHEET,
        includeGridData: true
      });
    } catch (err) {
      let errorStr = "There was a problem requesting the client data from Google.";
      console.log(err);
      if (err && err.result && err.result.error) {
        errorStr += "'" + err.result.error.message + "'";
        //if (err.result.error.code == "403") { 
        //  handleAuthClick(); // Try to get permissions again? May need to check for user here.
        //}
      }
      showError(errorStr);
      return;
    }
    const result = response.result;
    if (!result || !result.sheets || result.sheets.length == 0) {
      showError('No values found.');
      console.log(response);
      return;
    }
    console.log(response);

    // Find the right sheet in the spreadsheet
    let clientSheet = null;
    let i=0;
    result.sheets.forEach(function(sheet)  {
      if (sheet.properties.title == SHEET) {
        clientSheet = sheet;
      }
    });
    if (!clientSheet) {
      showError('Could not find Client List sheet in spreadsheet');
      console.log(response);
      return;
    }
    //console.log(clientSheet);
    let rows = clientSheet.data[0].rowData;
    //console.log(rows);

    const headers = rows[0].values; // The first row has the column names
    // console.log(headers);
    const clientRows = rows.splice(1);  // The ramaining rows have the column values
    //console.log(clientRows);
    // Figure out which column corresponds with each Client property.
    // This may be overkill, but it means the spreadsheet can handle some column shuffling,
    // and this application will still work.
    // Remember the column numbers in a map, for writing data back later. 
    for (i=0;i<headers.length;i++) {
      let thisHeader = headers[i].formattedValue;
      // console.log(thisHeader);
      switch(thisHeader.toLowerCase()) {
        case 'first name' :
          propertyToColumnMap['firstName'] = i;
          break;
        case 'last name' :
          propertyToColumnMap['lastName'] = i;
          break;
        case 'member number' :
          propertyToColumnMap['memberId'] = i;
          break;
        case 'street address' :
          propertyToColumnMap['address'] = i;
          break;
        case 'town' :
        case 'phone' :
        case 'adults' :
        case 'children' :
        case 'seniors' :
          propertyToColumnMap[thisHeader.toLowerCase()] = i;
          break;
        default:
          // Each visit date can also be a column, so try to spot those as well. 
          // See if trying to parse it as a date returns a plausible value 
          if (Date.parse(thisHeader) > 1420088400000) { // Jan 1, 2015, chosen arbitrarily.
            propertyToColumnMap[thisHeader] = i;
            distributionDates.push(thisHeader);
          }
      }
    }
    //console.log(propertyToColumnMap);

    let updatedClients = [];
    let sheetRow = 1; // The header took the first row, so start at 1
    let clientsTodaySoFar = 0;
    let adultsTodaySoFar = 0;
    let childrenTodaySoFar = 0;
    let seniorsTodaySoFar = 0;
    let clientsTodayByTownSoFar = {};
    let nextAvailableMemberNumberSoFar = 0;
    // Now try to read the clients
    clientRows.forEach(function(thisRow) {
      sheetRow++;
      let thisClientRow = thisRow.values;
      //console.log(thisClientRow[propertyToColumnMap['lastName']]);
      if (!thisClientRow[propertyToColumnMap['firstName']] || !thisClientRow[propertyToColumnMap['lastName']]) {
        return;
      }
      const thisClientData = {
        firstName: thisClientRow[propertyToColumnMap['firstName']].formattedValue,
        lastName:  thisClientRow[propertyToColumnMap['lastName' ]].formattedValue,
        address:  thisClientRow[propertyToColumnMap['address' ]].formattedValue,
        town:  thisClientRow[propertyToColumnMap['town' ]].formattedValue,
        phone:  thisClientRow[propertyToColumnMap['phone' ]].formattedValue,
        children:  thisClientRow[propertyToColumnMap['children' ]].formattedValue,
        adults:  thisClientRow[propertyToColumnMap['adults' ]].formattedValue,
        seniors:  thisClientRow[propertyToColumnMap['seniors' ]].formattedValue,
        memberId:  thisClientRow[propertyToColumnMap['memberId' ]].formattedValue,
        sheetRow: sheetRow
        // TODO: Other properties here
      }


      let thisClient = new Client(thisClientData);

      // Fill in the dates they visited
      distributionDates.forEach(function(distributionDate){
        //console.log(thisClientRow[propertyToColumnMap[distributionDate]]);
        if (thisClientRow[propertyToColumnMap[distributionDate]] && thisClientRow[propertyToColumnMap[distributionDate]].hasOwnProperty('formattedValue')) {
          
          thisClient.visits[distributionDate] = thisClientRow[propertyToColumnMap[distributionDate]];
          //thisClient.visits.push(distributionDate);
          
          if (distributionDate == todayStr) {
            clientsTodaySoFar++;
            adultsTodaySoFar += thisClient.adults;
            childrenTodaySoFar += thisClient.children;
            seniorsTodaySoFar += thisClient.seniors;
            let townForStats = "Other";
            if (thisClient.town) {
              townForStats = thisClient.town;
            }
            if (clientsTodayByTownSoFar.hasOwnProperty(townForStats)) { 
              clientsTodayByTownSoFar[townForStats]++;
            } else {
              clientsTodayByTownSoFar[townForStats] = 0;
            }
          }
        }
      });
      if (thisClient.firstName == "Kevin!") {
        console.log(thisClient);
      }
       
      if (!isNaN(thisClient.memberId) && thisClient.memberId >= nextAvailableMemberNumberSoFar) {
        nextAvailableMemberNumberSoFar = thisClient.memberId + 1;
      }

      // Add the client to the full list
      updatedClients.push(thisClient);
    });
    setClientsToday(clientsTodaySoFar);
    setAdultsToday(adultsTodaySoFar);
    setChildrenToday(childrenTodaySoFar);
    setSeniorsToday(seniorsTodaySoFar);
    setClientsTodayByTown(clientsTodayByTownSoFar);
    setNextAvailableMemberNumber(nextAvailableMemberNumberSoFar);

    //setClients(updatedClients);

    return updatedClients;
  }
/*
  function handleSignout(event){
    setUser({});
    document.getElementById("signInDiv").hidden = false;
  }
*/

  function colName(n) {
    var ordA = 'A'.charCodeAt(0);
    var ordZ = 'Z'.charCodeAt(0);
    var len = ordZ - ordA + 1;
  
    var s = "";
    while(n >= 0) {
        s = String.fromCharCode(n % len + ordA) + s;
        n = Math.floor(n / len) - 1;
    }
    return s;
  }
  function formatDateForColumn(dateToFormat) {
    return (dateToFormat.getMonth()+1) + "/" + dateToFormat.getDate() + "/" + dateToFormat.getFullYear().toString().substr(-2);
  }

  function createDistribuitionColumnPayload() {
    
      // It will go after the last column
      propertyToColumnMap[todayStr] = Object.keys(propertyToColumnMap).length; // + 1;
      distributionDates.push(todayStr);
      let columnName = colName(Object.keys(propertyToColumnMap).length-1); 
      return {
        "range": SHEET + "!" + columnName + "1",
        "majorDimension": "ROWS",
        "values": [
          [ todayStr ]
        ]
      };
  }

  async function saveClient(clientToSave) {
    //console.log(clientToSave);
    let latestClientData = await loadClientData();
    if (!latestClientData) { console.log("Could not load Client Data for saving changes"); return; }
    //console.log(clientToSave);

    // TODO:  If sheet hasn't been modified in last, say, 24 hours, make a backup prior to making changes

    let rowToUpdate = null;
    let clientIndexToUpdate = null;
    for (let i=0;i<latestClientData.length;i++) {
    //latestClientData.forEach(function(client) {
      if (latestClientData[i].getIdentifier() == clientToSave.getIdentifier()) {
        rowToUpdate = latestClientData[i].sheetRow;
        clientIndexToUpdate = i;
        break; // return;
      }
    //});
    }
    if (rowToUpdate == null) { console.log("Could not find client to update"); return; }

    let valueRanges = [];
    // Handle first checkin of a new session.  There won't be a column yet
    if (clientToSave.isCheckedIn(todayStr) && !propertyToColumnMap.hasOwnProperty(todayStr)) {
      valueRanges.push(createDistribuitionColumnPayload());
    }

    let valuesToWrite = new Array();
    //console.log(propertyToColumnMap);
    // Iterate over client object, and arrange the values in the order they should appear in the spreadsheet
    for (const property in clientToSave) {
      //console.log(property);
      if (property == "visit") { continue; }
      if (propertyToColumnMap[property] != null) {
        //console.log(clientToSave[property]);
        valuesToWrite[propertyToColumnMap[property]] = clientToSave[property];
      }
    }
    distributionDates.forEach(function(distributionDate) {
      if (!propertyToColumnMap[distributionDate]) { return; }
      if (clientToSave.isCheckedIn(distributionDate)) {
        valuesToWrite[propertyToColumnMap[distributionDate]] = client.visits[distributionDate];
        //valuesToWrite[propertyToColumnMap[distributionDate]] = 1;
      } else {
        valuesToWrite[propertyToColumnMap[distributionDate]] = "";
      }
    });

    // Determine the range values
    const startColumn = "A";
    const endColumn = colName(Object.keys(propertyToColumnMap).length);


    valueRanges.push({
      "range": SHEET + "!" + startColumn + rowToUpdate + ":" + endColumn + rowToUpdate,
      "majorDimension": "ROWS",
      "values": [
        valuesToWrite
      ]
    });

    //console.log(valueRanges);
    //console.log(propertyToColumnMap.length);
    /* global gapi */
    let response;
    //console.log( SHEET + "!" + startColumn + rowToUpdate + ":" + endColumn + rowToUpdate);
    try {
      const body = {
        valueInputOption: 'RAW',
        data: [ valueRanges ],
      }
      response =  await gapi.client.sheets.spreadsheets.values.batchUpdate({
        spreadsheetId:  SPREADSHEET
      },
        body
      );
    } catch (err) {
      showError("There was a problem saving data to Google: " + err.message);
      console.log(err);
      return;
    }
    const result = response.result;
    latestClientData[clientIndexToUpdate] = clientToSave;
    setClients(latestClientData);
    return true;
  }

  async function checkClientIn(client, asPlusOne = false) {
    if (!client.visits.includes(todayStr)) {
      client.visits[todayStr] = asPlusOne ? "P" : 1;
      //client.visits.push(todayStr);
      await saveClient(client);
      // TODO: Maybe find a way to make this recalculate automatically.
      setClientsToday(clientsToday + 1);
      setAdultsToday(adultsToday + client.adults);
      setChildrenToday(childrenToday + client.children);
      setSeniorsToday(seniorsToday + client.seniors);
      setClientsTodayByTown({"Reload page to view" : ""});
    }

    // Google only seems to support this on button click, so I'm putting it here
    updateGoogleAuth(); 

  }

  async function checkClientOut(client) {
    delete client.visits[todayStr];
    //client.visits = client.visits.filter(visit => visit !== todayStr);
    await saveClient(client);
    // TODO: Maybe find a way to make this recalculate automatically.
    setClientsToday(clientsToday - 1);
    setAdultsToday(adultsToday - client.adults);
    setChildrenToday(childrenToday - client.children);
    setSeniorsToday(seniorsToday - client.seniors);
    setClientsTodayByTown({"Reload page to view" : ""});
  }

  // TODO:  This is 90% the same as saveClient.  Refactor.
  async function addClient(clientToSave, checkIn = null) {
   // Read sheet
    let latestClientData = await loadClientData();

    // Find next empty row
    // Not sure if it's safe to assume the clients are in row order, but let's try that
    const lastClient = latestClientData[latestClientData.length-1];
    let rowToUpdate = lastClient.sheetRow + 1;

    let valueRanges = [];

    if (alsoCheckIn !== null) {
      clientToSave.visits[todayStr] = checkIn;
      if (!propertyToColumnMap.hasOwnProperty(todayStr)) {
        valueRanges.push(createDistribuitionColumnPayload());
      } 
    }

    // Assign the next available memberId if the user wasn't explicitly given one
    if (isNaN(clientToSave.memberId) && nextAvailableMemberNumber > 0) {
      clientToSave.memberId = nextAvailableMemberNumber;
    }

    let valuesToWrite = new Array();
    //console.log(propertyToColumnMap);
    // Iterate over client object, and arrange the values in the order they should appear in the spreadsheet
    for (const property in clientToSave) {
      //console.log(property);
      if (property == "visit") { continue; }
      if (propertyToColumnMap[property] != null) {
        //console.log(clientToSave[property]);
        valuesToWrite[propertyToColumnMap[property]] = clientToSave[property];
      }
    }
    for (var visit in clientToSave.visits) {
    //clientToSave.visits.forEach(function(visit) {
      //console.log(visit);
      if (propertyToColumnMap[visit]) {
        //console.log("1");
        valuesToWrite[propertyToColumnMap[visit]] = clientToSave.visits[visit];
      }
    //});
    }


    // Determine the range values
    const startColumn = "A";
    const endColumn = colName(Object.keys(propertyToColumnMap).length);


    valueRanges.push({
      "range": SHEET + "!" + startColumn + rowToUpdate + ":" + endColumn + rowToUpdate,
      "majorDimension": "ROWS",
      "values": [
        valuesToWrite
      ]
    });

    // Save row
    let response;
    //console.log( SHEET + "!" + startColumn + rowToUpdate + ":" + endColumn + rowToUpdate);
    try {
      const body = {
        valueInputOption: 'RAW',
        data: [ valueRanges ],
      }
      response =  await gapi.client.sheets.spreadsheets.values.batchUpdate({
        spreadsheetId:  SPREADSHEET
      },
       body
      );
    } catch (err) {
      showError("There was a problem saving data to Google: " + err.message);
      console.log(err);
      return;
    }
    const result = response.result;
    //setSearch(clientToSave.memberId);  // This causes problems for some reason
    latestClientData.push(clientToSave);
    setClients(latestClientData);
    setNextAvailableMemberNumber(nextAvailableMemberNumber+1);
    return true;
  }
  


  return (
    <div className="App">
      <Grid container m={2} className="container">
        <Grid xs={12} sx={{ 
          display: 'flex',
          justifyContent: 'flex-end' }}>

            <div id="GISButtons"></div>
            <div id="user">
              {true && 
                <>
                  {/* User photo has some timing issues
                  <img with="50" height="50" src={user.picture} alt={user.name} />   
                  */}
                  {user.name}
                  <Button variant="contained" id="signOutButton" className="g_id_signout" onClick={ (e) => handleSignoutClick(e)}>Sign Out</Button>  
                </>
              }
            </div>
          {/*
          <ButtonGroup variant="contained" aria-label="Sign In Section" id="signInArea">
            <Button variant="contained" id="signInButton" onClick={ (e) => handleAuthClick(e)}>Sign In</Button>
            <Button variant="contained" id="loadClientData" onClick={loadClientDataClick}>Load Client Data</Button>
          </ButtonGroup>
          */}
        </Grid>
        <Grid xs={12}>
          <Collapse in={errorOpen}>
            <Alert severity="error"  onClose={() => {setErrorOpen(false)}}>
              <div id="error">This is an error alert — <strong>check it out!</strong></div>
            </Alert>
          </Collapse>
        </Grid>
        <Grid xs={9}>
          <Grid container>
            <Grid xs={10}><Search search={searchTerm} onSearch={handleSearch} /></Grid>
            <Grid xs={2}><Button variant="contained" id="addButton" onClick={onClickAdd}>Add New Client</Button></Grid>
            <Grid xs={12}>
              <ClientList 
                clients={searchedClients} 
                todayStr={todayStr} 
                addClient={addClient}
                saveClient={saveClient}
                checkClientIn={checkClientIn}
                checkClientOut={checkClientOut}
                />
              </Grid>
          </Grid>
        </Grid>
        <Grid xs={3} >
          <Scanner onScanSuccess={onScanSuccess} />
          <audio id="audio">
            <source src="scanned.mp3" type="audio/mpeg"/>
          </audio>
          <SessionStats 
            clientsToday={clientsToday} 
            adultsToday={adultsToday}
            childrenToday={childrenToday}
            seniorsToday={seniorsToday} 
            clientsTodayByTown={clientsTodayByTown}
            />
        </Grid>
      </Grid>
      <ClientFormDialog
        open={addOpen}
        mode="add"
        clientBeingEdited={new Client()}
        onSave={addClient}
        onClose={handleAddClose}
      />

    </div>
  );
}

export default App;