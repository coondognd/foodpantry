# foodpantry
App for checking-in food pantry clients on distribution dates

Still in development, so everything is just in one file for the moment, while I work out
the functionality.

The primary goal is to speed up check-in, which is currently done by searching an Excel 
spreadsheet of 500 rows for a name spoken out loud. 

Secondary goal is to minimize data "leakage" (names and addresses spoken out loud)

Data storage is in Google Sheets, so in case I get hit by a truck, the rest of the food
pantry staff can fall back to the Sheets data and not have to learn React or SQL. :)  

Using Google sheets also allows us to use Google Drive permissions to keep the data secure 
without having to implement access control ourselves.

The UI is Material UI, as it's very clean.

The barcode/QR-code scanning is html5-qrcode.