# BM206-TextService
The TextService written in node.js used on the Belgian BrandMeister Network
Feel free to use this script on your own masterserver.
Note that this script won't work out of the box!
It is currently configured to work with the belgian masterserver only.

##Messages
###Help
Sends a message with all available commands
###Info [repeater]
Selects all info from the mysql database (if you don't have a custom repeater database in your country you can delete this text or modify it however you like).
###Whois [dmr id or callsign]
Selects the info of a specific user from the database and returns it in a text.
NOTE: for this you need a database containing all DMR users.
The script that is being used to create this database table in Belgium will be released as soon as possible.
###WX [location]
Uses the Yahoo Query Language to request the weather for a specific location.

##Disclaimer
At the moment only support for hytera terminals has been tested.
It is known that the Connect Systems CS700 has issues with the usage of this service.

Comments, improvements, something else! Use the git, that's what it's for! :-)
Tags: hamr, hamradio, BrandMeister, BM, BM206, ON3YH, HAM-DMR, DMR, Hytera, Motorola, Connect Systems
