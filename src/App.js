import logo from './logo.svg';
import { useEffect, useState, useCallback } from "react";
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress'
import Collapse from '@mui/material/Collapse';
import Grid from '@mui/material/Unstable_Grid2';
import TextField from '@mui/material/TextField';
import jwt_decode from 'jwt-decode';

import ClientList from './components/ClientList'
import DatePicker from './components/DatePicker'
import Scanner from './components/Scanner';
import SessionStats from './components/SessionStats';
import ClientFormDialog from './components/ClientFormDialog';

import Client from './Client';

import './App.css';
import { StayPrimaryLandscapeOutlined } from '@mui/icons-material';



const useSessionStorage = (storageKey, fallbackState) => {
  const [value, setValue] = useState(
    JSON.parse(sessionStorage.getItem(storageKey)) ?? fallbackState
  );

  useEffect(() => {
    sessionStorage.setItem(storageKey, JSON.stringify(value));
  }, [value, storageKey]);

  return [value, setValue];
};


const Search = (props) => console.log("Render Search") || (
  <TextField id="search" fullWidth label="Search Clients by Name or ID Number" type="search" 
      onChange={props.onSearch}
    />
);





function App() {


    /* exported gapiLoaded */
    /* exported gisLoaded */
  
  const CLIENT_ID = '550174706281-ji890svg8tuadu0fifgdmuh1qssk2ect.apps.googleusercontent.com';
  const API_KEY = 'AIzaSyDIt0cxWOmicBKtuLGsQ5MMLQmingWfgrY';
  const SPREADSHEET = '1idxMHE3OYeawKb6jQEpIofWAFJ3UbRqmyh2Qy5C-hXQ';
  const SHEET = "Client List"
  const COLUMN_OFFSET = 1; // How many cols to skip before reading data

  // Discovery doc URL for APIs used by the quickstart
  const DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';

  // Authorization scopes required by the API; multiple scopes can be
  // included, separated by spaces.
  const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

  

  const [propertyToColumnMap, setPropertyColumnMap] = useState([]);
  const [distributionDates, setDistributionDates] = useState([]);

  const [todayStr, setTodayStr] = useState(formatDateForColumn(new Date()));
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

  const [clientListLoading, setClientListLoading] = useState(true);

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


    
  const handleDateChange = (newDate) => {
    // TODO : Parse the date string into a date
    setTodayStr(formatDateForColumn(newDate));
  }

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

  let [tokenClient, setTokenClient] = useState();
  let gapiInited = false;
  let gisInited = false;
  const [authInterval, setAuthInterval] = useState();

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
    const tC = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: '', // defined later
    });
    setTokenClient(tC);
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
  // handler for when token expires
async function getNewToken(err, tC) {
  if (err.result.error.code == 401 || (err.result.error.code == 403) &&
      (err.result.error.status == "PERMISSION_DENIED")) {

    // The access token is missing, invalid, or expired, prompt for user consent to obtain one.
    await new Promise((resolve, reject) => {
      try {
        // Settle this promise in the response callback for requestAccessToken()
        tC.callback = (resp) => {
          if (resp.error !== undefined) {
            reject(resp);
          }
          // GIS has automatically updated gapi.client with the newly issued access token.
          console.log('gapi.client access token: ' + JSON.stringify(gapi.client.getToken()));
          resolve(resp);
        };
        tC.requestAccessToken({ hint: user.email, prompt: ''});
      } catch (err) {
        console.log(err);
      }
    });
  } else {
    // Errors unrelated to authorization: server errors, exceeding quota, bad requests, and so on.
    throw new Error(err);
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
      setClientListLoading(true);
      let latestClients = await loadClientData();
      if (latestClients) setClients(latestClients);
      setClientListLoading(false);
    };
    if (gapi.client.getToken() === null) {
      // Prompt the user to select a Google Account and ask for consent to share their data
      // when establishing a new session.
      console.log("User does not have a token");
      tokenClient.requestAccessToken({hint: user.email, prompt: ''}); // 'consent'
    } else {
      // Skip display of account chooser and consent dialog for an existing session.
      console.log("User has a token");
      setClientListLoading(true);
      let latestClients = await loadClientData();
      if (latestClients) setClients(latestClients);
      setClientListLoading(false);
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

    if (typeof(gapi) == "undefined" || typeof(google) == "undefined" ) {
      showError("There was a problem connecting to Google.  Please check your internet connection");
      return;
    }

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

  async function loadClientData() {
    /* global gapi */

    let response;

    /*
    gapi.client.sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET, includeGridData: true})
    .then(sheetsAPIResponse => {response = sheetsAPIResponse})
  .catch(err  => getNewToken(err))  // for authorization errors obtain an access token
  .then(retry => gapi.client.sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET, includeGridData: true}))
  .then(sheetsAPIResponse => {response = sheetsAPIResponse})
  .catch(err  => console.log(err));   // cancelled by user, timeout, etc.
  */
    try {
      response =  await gapi.client.sheets.spreadsheets.get({spreadsheetId: SPREADSHEET, includeGridData: true});
    } catch (err) {
      getNewToken(err, tokenClient);
      try {
        response =  await gapi.client.sheets.spreadsheets.get({spreadsheetId: SPREADSHEET, includeGridData: true});
      } catch (err) {
        let errorStr = "There was a problem requesting the client data from Google.";
        if (err && err.result && err.result.error) {
          errorStr += "'" + err.result.error.message + "'";
        }
        showError(errorStr);
        return;
      }
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
    let propertyToColumnMap = [];
    let distributionDates = [];
    //console.log(clientRows);
    // Figure out which column corresponds with each Client property.
    // This may be overkill, but it means the spreadsheet can handle some column shuffling,
    // and this application will still work.
    // Remember the column numbers in a map, for writing data back later. 
    for (i=0;i<headers.length;i++) {
      let thisHeader = headers[i].formattedValue;
      if (!thisHeader) { continue; }
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
          case 'street address 2' :
            propertyToColumnMap['address2'] = i;
            break;
        case 'tefap date' :
          propertyToColumnMap['legalDate'] = i;
          break;
        case 'town' :
        case 'phone' :
        case 'adults' :
        case 'children' :
        case 'seniors' :
        case 'state' :
        case 'zipcode' :
          propertyToColumnMap[thisHeader.toLowerCase()] = i;
          break;
        default:
          propertyToColumnMap[thisHeader.toLowerCase()] = i;
          // Each visit date can also be a column, so try to spot those as well. 
          // See if trying to parse it as a date returns a plausible value 
          if (Date.parse(thisHeader) > 1420088400000) { // Jan 1, 2015, chosen arbitrarily.
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
        address2:  thisClientRow[propertyToColumnMap['address2' ]].formattedValue,
        state:  thisClientRow[propertyToColumnMap['state' ]].formattedValue,
        zipcode:  thisClientRow[propertyToColumnMap['zipcode' ]].formattedValue,
        town:  thisClientRow[propertyToColumnMap['town' ]].formattedValue,
        phone:  thisClientRow[propertyToColumnMap['phone' ]].formattedValue,
        children:  thisClientRow[propertyToColumnMap['children' ]].formattedValue,
        adults:  thisClientRow[propertyToColumnMap['adults' ]].formattedValue,
        seniors:  thisClientRow[propertyToColumnMap['seniors' ]].formattedValue,
        legalDate:  thisClientRow[propertyToColumnMap['legalDate' ]].formattedValue,
        memberId:  thisClientRow[propertyToColumnMap['memberId' ]].formattedValue,
        sheetRow: sheetRow
        // TODO: Other properties here
      }


      let thisClient = new Client(thisClientData);

      // Fill in the dates they visited
      distributionDates.forEach(function(distributionDate){
        //console.log(thisClientRow[propertyToColumnMap[distributionDate]]);
        if (thisClientRow[propertyToColumnMap[distributionDate]] && thisClientRow[propertyToColumnMap[distributionDate]].hasOwnProperty('formattedValue')) {
          
          thisClient.visits[distributionDate] = thisClientRow[propertyToColumnMap[distributionDate]].formattedValue;
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

    setPropertyColumnMap(propertyToColumnMap);
    setDistributionDates(distributionDates);
    //setClients(updatedClients);

    return updatedClients;
  }
/*
  function handleSignout(event){
    setUser({});
    document.getElementById("signInDiv").hidden = false;
  }
*/

  function colName(n) {   // TODO: Memoize this
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
      let pTCM = propertyToColumnMap;
      pTCM[todayStr] = Object.keys(propertyToColumnMap).length;
      setPropertyColumnMap(pTCM);

      let dDs = distributionDates;
      dDs.push(todayStr);
      setDistributionDates(dDs);
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
    console.log(clientToSave);
    
    // Loading data before every save was slow (and paranoid), so I've commented it out
      //let latestClientData = await loadClientData();  // May be paranoid.  Just being sure nothing changed
      //if (!latestClientData) { console.log("Could not load Client Data for saving changes"); return; }
    let latestClientData = clients;
    
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
      if (property == "visit") { continue; } // This gets done below
      if (propertyToColumnMap[property] != null) {
        //console.log(clientToSave[property]);
        valuesToWrite[propertyToColumnMap[property] - COLUMN_OFFSET] = clientToSave[property];
      }
    }

    // Determine visits
    distributionDates.forEach(function(distributionDate) {
      if (!propertyToColumnMap[distributionDate]) { return; }
      if (clientToSave.isCheckedIn(distributionDate)) {
        valuesToWrite[propertyToColumnMap[distributionDate] - COLUMN_OFFSET] = clientToSave.visits[distributionDate];
        //valuesToWrite[propertyToColumnMap[distributionDate]] = 1;
      } else {
        valuesToWrite[propertyToColumnMap[distributionDate] - COLUMN_OFFSET] = "";
      }
    });

    // Determine the range values
    const startColumn = colName(COLUMN_OFFSET); 
    const endColumn = colName(Object.keys(propertyToColumnMap).length - 1 + COLUMN_OFFSET);


    valueRanges.push({
      "range": SHEET + "!" + startColumn + rowToUpdate + ":" + endColumn + rowToUpdate,
      "majorDimension": "ROWS",
      "values": [
        valuesToWrite
      ]
    });

    /* global gapi */
    let response;
    console.log( SHEET + "!" + startColumn + rowToUpdate + ":" + endColumn + rowToUpdate);
    console.log(valuesToWrite);

    
    const body = {
      valueInputOption: 'RAW',
      data: [ valueRanges ],
    }
    let saveSuccess = false;

    
    try {
      /*
      let err = {result : {error : {code : 401}}};
      console.log("Getting new token with tokenClient");
      console.log(tokenClient);
      getNewToken(err, tokenClient);
      */
      response =  await gapi.client.sheets.spreadsheets.values.batchUpdate({ spreadsheetId:  SPREADSHEET }, body);
    } catch (err) {
      getNewToken(err, tokenClient);
      try {
        response =  await gapi.client.sheets.spreadsheets.values.batchUpdate({ spreadsheetId:  SPREADSHEET }, body);
      } catch (err) {
        showError("There was a problem saving data to Google: " + err.message);
        return;
      }
    }
    
    //const result = response.result;
    if (saveSuccess) {
      latestClientData[clientIndexToUpdate] = clientToSave;
      setClients(latestClientData);
    }
    return saveSuccess;
  }

  async function checkClientIn(client, asPlusOne = false) {
    if (!(todayStr in client.visits)) {
      client.visits[todayStr] = asPlusOne ? "Plus One" : "Normal";
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
    //updateGoogleAuth(); 

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

    if (checkIn !== null) {
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
        valuesToWrite[propertyToColumnMap[property] - COLUMN_OFFSET] = clientToSave[property];
      }
    }
    for (var visit in clientToSave.visits) {
    //clientToSave.visits.forEach(function(visit) {
      //console.log(visit);
      if (propertyToColumnMap[visit]) {
        //console.log("1");
        valuesToWrite[propertyToColumnMap[visit] - COLUMN_OFFSET] = clientToSave.visits[visit];
      }
    //});
    }


    // Determine the range values
    const startColumn = colName(COLUMN_OFFSET);
    const endColumn = colName(Object.keys(propertyToColumnMap).length - 1 + COLUMN_OFFSET);


    valueRanges.push({
      "range": SHEET + "!" + startColumn + rowToUpdate + ":" + endColumn + rowToUpdate,
      "majorDimension": "ROWS",
      "values": [
        valuesToWrite
      ]
    });

    // Save row
    let response;
    console.log( SHEET + "!" + startColumn + rowToUpdate + ":" + endColumn + rowToUpdate);
    const body = {
      valueInputOption: 'RAW',
      data: [ valueRanges ],
    }

    try {
      response =  await gapi.client.sheets.spreadsheets.values.batchUpdate({spreadsheetId:  SPREADSHEET}, body );
    } catch (err) {
      getNewToken(err, tokenClient);  
      try {
        response =  await gapi.client.sheets.spreadsheets.values.batchUpdate({spreadsheetId:  SPREADSHEET}, body );
      } catch (err) {
        showError("There was a problem saving data to Google: " + err.message);
        console.log(err);
        return;
      }
    }
    //const result = response.result;
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
                  {/* User photo has some timing issues, remove for now
                  <img with="50" height="50" src={user.picture} alt={user.name} />   
                  */}
                  {user.name} &nbsp;
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
               {clientListLoading && 
                <CircularProgress />
                }
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
          <DatePicker todayStr={todayStr} onChange={handleDateChange}/>
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
