# Time Clock
A configurable time clock system created by Grayson Martin.

## Install
* Clone the repo.
* Install dependencies (`npm install`).

## Run
* Run `node index.js` in the project directory.

The IP address of the web server will be printed out.

The web server port is set to 8000 and the socket port is 8001.

* `{ip_address}:8000/` = main kiosk page
* `{ip_address}:8000/settings` = configuration page
* `{ip_address}:8000/users` = user management
* `{ip_address}:8000/users/new` = create a new user
* `{ip_address}:8000/users/{user_id}` = information about user with id {user_id}
* `{ip_address}:8000/barcode` = barcode generator (used automatically by the user info page)

## Configuration Options

Settings can be configured at `/settings`.

### Kiosk Type
*Options:*
* Barcode Reader - Users can clock in and out with a barcode reader. Simply plug in a standard USB barcode reader and open the kiosk page. Barcodes can be printed out for each user on the user management page (`/users`).
* Touchscreen/Mouse - Users use a simple interface to clock in and out. Buttons are enlarged for easy clicking on touch screens.

### Waivers

**Note: Waivers will only work when Kiosk Type is set to Touchscreen/Mouse.**

*Require Waiver* - Require users to complete and sign a waiver before they can clock in (users will only be prompted with the waiver the first time they clock in.)

*Waiver Text* - The text of the waiver. Will be displayed above the signature pad in a scroll box.
