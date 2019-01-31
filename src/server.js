// Currently does not support foreign addresses
// with special characters
const config = require('../config.js')
const accountSid = config.twilioSid
const authToken = config.twilioToken
const twilio = require('twilio')
const express = require('express')
const client = new twilio(accountSid, authToken)
const NodeGeocoder = require('node-geocoder')
const bodyParser = require('body-parser')
const axios = require('axios')
const port = 8080

const app = express()
const MessagingResponse = twilio.twiml.MessagingResponse;

const BASE_URL = 'https://api.mapbox.com/directions/v5/mapbox/'
const MAPBOX_TOKEN = config.mapBoxToken
const METER_PER_MILE = 1609.34
const FT_PER_METER = 3.281

app.use(bodyParser.urlencoded({ extended: false }))

var options = {
  provider: 'openstreetmap'
}

var geocoder = NodeGeocoder(options)

let add0 = 'driving/'
let add1 = '1330 boren ave, seattle'
let add2 = '658 vashon pl ne, renton'

test()
async function test () {
  let startPos = await getGeocode(add1)
  let allRoutes = await getAllRoutes(add2)
  let shortestRoute = await getClosestRoute(allRoutes, startPos)
  if (shortestRoute == undefined || startPos == undefined) {
    console.log('No available route :(')
    return
  } else {
    let url = createUrl({
      profile: add0,
      lon1: startPos.lon,
      lat1: startPos.lat,
      lon2: shortestRoute.longitude,
      lat2: shortestRoute.latitude
    })
    let directions = await returnDirections(url)
    let distanceMeters = await collectDistance(url)
    let distanceMiles = convertToMiles(distanceMeters)
    let steps =  'Total Distance: ' + distanceMiles + ' miles\n' +
    getSteps(directions).toString().replace(/,/g, '\n')
    console.log(steps)
  }
}

//TODO: Let users decide unit, imperial or metric
function getSteps (dir) {
  let instructions = []
  for (let s = 0; s < dir.length - 1; s++) {
    let unit
    let distanceUnit
    let distanceMeter = dir[s].distance
    if (distanceMeter < 304.8) {
      unit = 'feet'
      distanceUnit = convertToFeet(distanceMeter)
    } else {
      unit = 'mile(s)'
      distanceUnit = convertToMiles(distanceMeter)
    }
    instructions.push(dir[s].maneuver.instruction +
      ' for ' + distanceUnit + ' ' +unit
    )
  }
  let arrivalMsg = dir[dir.length - 1].maneuver.instruction.replace(/,/g, '')
  instructions.push(arrivalMsg)
  return instructions
}

function getAllRoutes (add) {
  return geocoder.geocode(add)
    .then((res) => {
      if (!res.length) {
        return
      }
      return res
    })
    .catch((err) => {
      console.log('Cannot find all routes for ' +add)
    })
}

async function getGeocode (add) {
  return geocoder.geocode(add)
    .then((res) => {
      if (res == undefined || !res.length) {
        return
      }
      return {
        lon: res[0].longitude,
        lat: res[0].latitude
      }
    })
    .catch((err) => {
      console.log('Cannot find geocode for '+add)
    })
}

function createUrl (params) {
  let url =
    BASE_URL +
    params.profile +
    params.lon1 + ',' + params.lat1 +
    ';' + params.lon2 + ',' + params.lat2 +
    '?'+'steps=true&access_token=' + MAPBOX_TOKEN
    return url
}

async function collectDistance (url) {
  return await axios.get(url)
    .then((res) => {
      if (res.code == 'InvalidInput' || res.code == 'NoRoute') {
        return
      } else {
        return res.data.routes[0].distance
      }
    })
    .catch((err) => {
      console.log('Cannot get distance (meters) ' + err)
    })
}

function isEmpty(obj) {
  return (Object.entries(obj).length === 0 &&
  obj.constructor === Object)
}

async function getClosestRoute (routes, startPos) {
  if (routes == undefined || routes == null) {
    return
  }
  let distances = {}
  for (let i = 0; i < routes.length; i++) {
    let url = createUrl({
      profile: 'walking/',
      lon1: startPos.lon,
      lat1: startPos.lat,
      lon2: routes[i].longitude,
      lat2: routes[i].latitude
    })
    let meters = await collectDistance(url)
    if (meters !== undefined && meters < 241402) {
      distances[meters] = routes[i]
    }
  }
  if (isEmpty(distances)) {
    return
  }
  let shortest = Math.min(...Object.keys(distances))
  return distances[shortest]
}

async function returnDirections (url) {
  return axios.get(url)
    .then((res) => {
      let steps = res.data.routes[0].legs[0].steps
      return steps
    })
    .catch((err) => {
      console.log('Cannot get url ' + err)
    })
}

function convertToMiles (meters) {
  return Math.round((meters / METER_PER_MILE) * 10) / 10
}

function convertToFeet (meters) {
  return Math.round(meters * FT_PER_METER)
}

app.post('/sms', async (req, res) => {
  var twiml = new MessagingResponse()
  let response
  let addresses = req.body.Body.split(':')
  let action = addresses[0].toLowerCase().concat('/')
  let startPos = await getGeocode(addresses[1])
  let allRoutes = await getAllRoutes(addresses[2])
  let shortestRoute = await getClosestRoute(allRoutes, startPos)
  if (req.body.Body.toUpperCase() == 'HELP-SMS') {
      response = 'To get more accurate directions, ' +
      'please follow this format:' +
      '\n\n<driving/walking>:<starting_address>, <city>:<ending_address>, <city>\n\n' +
      'You can also type in a general location (a store, for instance), ' +
      'but you must include the city in your message. \n\n' +
      "Providing a more accurate starting position will help you find where you're looking for!"
  } else if (shortestRoute == undefined || startPos == undefined) {
      response = "Sorry, we can't recognize one of your addresses. " +
      "Please text 'HELP-SMS' for instructions on how to format your addresses."
  } else {
    let url = createUrl({
      profile: action,
      lon1: startPos.lon,
      lat1: startPos.lat,
      lon2: shortestRoute.longitude,
      lat2: shortestRoute.latitude
    })
    let distanceMeters = await collectDistance(url)
    let distanceMiles = convertToMiles(distanceMeters)
    let directions = await returnDirections(url)
      response = 'Total Distance: ' + distanceMiles + 'miles\n' +
      getSteps(directions).toString().replace(/,/g, '\n')
  }
  twiml.message(response)
  res.writeHead(200, {'Content-Type': 'text/xml'})
  res.end(twiml.toString())
})

app.listen(port, () => {
  console.log('listening on port '+ port)
})
