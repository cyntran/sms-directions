# SMS directions
An SMS navigation service for those who don't care for smartphones. 

## About 
Have a feature phone and don't want to upgrade? Now you can get directions from point A to point B sent right to you via SMS!

This project sends you step-by-step directions through the [Twilio](https://twilio.com) webhook you setup. 
These directions are made possible by [OpenStreetMap](https://openstreetmap.org) geocoding through the [```node-geocoder```](https://github.com/nchaulet/node-geocoder#readme) npm module 
and the [MapBox Directions API](https://docs.mapbox.com/api/navigation/#retrieve-directions). 

## Prerequisites
You will need to create your own <i>Twilio</i> ```SID```, ```token```, ```phone number```, <i>MapBox</i> ```token```, as well as setting up your own webhook URL. 

<b>Note: Twilio gives you one free phone number and a certain amount of money to spend as part of their free trial, 
so use that to your advantage!</b>

For my code, I'm using [```ngrok```](https://ngrok.com/), which allows me to use localhost on a public domain.  

## Installing
After you've configured your Twilio account and MapBox account, clone the project:
```bash
git clone https://github.com/cyntran/sms-directions.git
``` 
Create your own ```config.js``` file with the following: 
```javascript
module.exports = {
  twilioSid: <your-twilio-SID>,
  twilioToken: <your-twilio-token>,
  mapBoxToken: <your-mapbox-token>
}
```
Run the code. 

## Contributing
Feel free to make any contributions to this project by submitting a pull request or issue I can review. 

## Support
You may also contact me through my email for suggestions and/or feedback. 

## License
This project is licensed under [GNU General Public License (GPL)](/LICENSE.txt) version 2 or later


