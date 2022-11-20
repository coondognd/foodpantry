export default class Client {
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
    this.address2 = props.address2;
    this.town = props.town;
    this.state = props.state;
    this.zipcode = props.zipcode;
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
    return this.visits.hasOwnProperty(checkInDate) && this.visits[checkInDate] == "Normal";
  }
  isCheckedInAsPlusOne(checkInDate) {
    //return this.visits.indexOf(checkInDate) > -1;
    return this.visits.hasOwnProperty(checkInDate) && this.visits[checkInDate] == "Plus One";
  }
}