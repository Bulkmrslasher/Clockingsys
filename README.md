#Time Clock
A configurable time clock system.

##Setup
To install all dependencies, run `npm install` in the project directory.

##Run
To run the server, run `node index.js` in the project directory.

The IP address and port of the web server will be printed out.

`{ip_address}:{port}/` = main kiosk page
`{ip_address}:{port}/settings` = configuration page
`{ip_address}:{port}/users` = user management
`{ip_address}:{port}/users/new` = create a new user
`{ip_address}:{port}/users/{user_id}` = information about user with id {user_id}

##Configuration

Settings can be configured at `/settings`.

###Kiosk Type
*Options:*
* Barcode Reader - Users can clock in and out with a barcode reader. Simply plug in a standard USB barcode reader and open the kiosk page. Barcodes can be printed out for each user on the user management page (`/users`).
* Touchscreen/Mouse - Users use a simple interface to clock in and out. Buttons are enlarged for easy clicking on touch screens.

###Waivers

**Note: Waivers will only work when Kiosk Type is set to Touchscreen/Mouse.**

*Require Waiver* - Require users to complete and sign a waiver before they can clock in (users will only be prompted with the waiver the first time they clock in.)

*Waiver Text* - The text of the waiver. Will be displayed above the signature pad in a scroll box.
