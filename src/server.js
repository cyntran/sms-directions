
const config = require('../config.js')
const accountSid = config.twilioSid
const authToken = config.twilioToken
const twilio = require('twilio')
const express = require('express')
const client = new twilio(accountSid, authToken)
const NodeGeocoder = require('node-geocoder')
const bodyParser = require('body-parser')
const axios = require('axios')
const port = 1337

const app = express()
const MessagingResponse = twilio.twiml.MessagingResponse;

app.use(bodyParser.urlencoded({ extended: false }))

var options = {
  provider: 'openstreetmap'
}

var geocoder = NodeGeocoder(options)

var params = {
  lon: 0,
  lat: 0,
  profile: 'walking/',
  baseUrl: 'https://api.mapbox.com/directions/v5/mapbox/',
  token: config.mapBoxToken
}

let add1 = 'Qfc'
let add2 = 'Bartell Drugs'

// let c1 = {lon: -122.161945668981, lat: 47.49320805}
// let c2 = {lon: -122.3276958, lat: 47.6124208}
test()
async function test () {
  // getSteps(await getGeocode(add1), await getGeocode(add2)).then(value => { console.log(value.toString()) })
  console.log(await getGeocode(add1))

}
// getSteps(c1, c2).then(value => console.log(value.toString()))

async function getSteps (code1, code2) {
  let steps = await returnDirections(code1, code2)
  let instructions = []
  for (let s = 0; s < steps.length; s++) {
    if (s == steps.length - 1) {
      return instructions
    }
    instructions.push(steps[s].maneuver.instruction)
  }
}

//TODO: Return only the longitude & latitude of the
//closer (filter by city?) location to the starting address
function getGeocode (add) {
  return geocoder.geocode(add)
    .then((res) => {
      return {
        res: res
        // lon: res[0].longitude,
        // lat: res[0].latitude
      }
    })
    .catch((err) => {
      console.log(err)
    })
}

async function returnDirections (coords1, coords2) {
  let url = params.baseUrl+params.profile+coords1.lon+','+coords1.lat+';'+coords2.lon+','+coords2.lat+'?'+'steps=true&access_token='+params.token
  return axios.get(url)
    .then((res) => {
      let steps = res.data.routes[0].legs[0].steps
      return steps
    })
    .catch((err) => {
      console.log(err)
    })
}

app.post('/sms', async (req, res) => {
  var twiml = new MessagingResponse()
  let addresses = req.body.Body.split(':')
  let startPos = await getGeocode(addresses[0])
  let endPos = await getGeocode(addresses[1])
  let message = await getSteps(startPos, endPos).then(arr => { return arr.toString() })
  twiml.message(message)
  res.writeHead(200, {'Content-Type': 'text/xml'})
  res.end(twiml.toString())
})

app.listen(port, () => {
  console.log('listening on port '+ port)
})
