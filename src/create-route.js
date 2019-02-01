const config = require('../config.js')
const axios = require('axios')
const messages = require('./responses.js')
const NodeGeocoder = require('node-geocoder')
const ERR_MSG = messages.errorMsg
const HELP_MSG = messages.helpMsg
const BASE_URL = 'https://api.mapbox.com/directions/v5/mapbox/'
const MAPBOX_TOKEN = config.mapBoxToken
const METER_PER_MILE = 1609.34
const FT_PER_METER = 3.281
const METER_PER_1000FT = 304.8
const METER_PER_KM = 1000
const options = { provider: 'openstreetmap' }
var geocoder = NodeGeocoder(options)


//TODO:
//CHECK if starting address & ending address is the same

function unitCalculation (meters, unitChoice) {
  let unit, distanceUnit
  if (unitChoice.toUpperCase() == 'METRIC') {
    if (meters >= METER_PER_KM) {
      unit = 'km'
      distanceUnit = convertToKm(meters)
    } else {
      unit = 'm'
      distanceUnit = meters
    }
  } else {
    if (meters < METER_PER_1000FT) {
      unit = 'feet'
      distanceUnit = convertToFt(meters)
    } else {
      unit = 'miles(s)'
      distanceUnit = convertToMiles(meters)
    }
  }
  return distanceUnit + ' ' + unit
}

function getSteps (dir, unit) {
  let instructions = []
  for (let s = 0; s < dir.length - 1; s++) {
    instructions.push(dir[s].maneuver.instruction + ' for ' +
      unitCalculation(dir[s].distance, unit))
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
        zip: res[0].zipcode,
        lon: res[0].longitude,
        lat: res[0].latitude
      }
    })
    .catch((err) => {
      console.log('Cannot find geocode for ' + add)
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

async function getClosestRoute (routes, startPos, action) {
  if (routes == undefined || routes == null) {
    return
  }
  let distances = {}
  for (let i = 0; i < routes.length; i++) {
    let url = createUrl({
      profile: action,
      lon1: startPos.lon,
      lat1: startPos.lat,
      lon2: routes[i].longitude,
      lat2: routes[i].latitude
    })
    let meters = await collectDistance(url)
    if (meters != undefined && meters < 241402) {
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

function convertToKm (meters) {
  return Math.round((meters / METER_PER_KM) * 10) / 10
}

function convertToMiles (meters) {
  return Math.round((meters / METER_PER_MILE) * 10) / 10
}

function convertToFt (meters) {
  return Math.round(meters * FT_PER_METER)
}


// Maybe modulate this more ?
async function processInput (usrInput) {
  if (usrInput.toUpperCase() == 'HELP-SMS') return HELP_MSG
  let input = await isValidInput(usrInput)
  if (input != null) {
    let startPos = await getGeocode(input.startPos)
    let allRoutes = await getAllRoutes(input.endPos)
    let shortestRoute = await getClosestRoute(allRoutes, startPos, input.action)
    if (allRoutes == undefined || shortestRoute == undefined) return ERR_MSG
    let url = createUrl({
      profile: input.action,
      lon1: startPos.lon,
      lat1: startPos.lat,
      lon2: shortestRoute.longitude,
      lat2: shortestRoute.latitude
    })
    let distanceMeters = await collectDistance(url)
    let totalDistance = unitCalculation(distanceMeters, input.unit)
    let directions = await returnDirections(url)
    let steps = getSteps(directions, input.unit)
    return messages.processSteps(steps, totalDistance)
  } else {
    return ERR_MSG
  }
}

function adjustInput (input) {
  return ((input.length === 4) ? {
    unit: input[0],
    action: input[1],
    startPos: input[2],
    endPos: input[3]
  } : {
    unit: 'imperial',
    action: input[0],
    startPos: input[1],
    endPos: input[2]
  })
}

async function validateInput (unit, action, startPos, endPos) {
  let badUnit = (unit.toLowerCase() != 'metric' && unit.toLowerCase() != 'imperial')
  let badAction = (action.toLowerCase() != 'walking' && action.toLowerCase() != 'driving')
  let badAddress = (await getGeocode(startPos) == undefined || await getGeocode(endPos) == undefined)
  if (badUnit || badAction || badAddress) {
    return null
  } else {
    return {
      unit: unit,
      action: action.toLowerCase().concat('/'),
      startPos: startPos,
      endPos: endPos
    }
  }
}

async function isValidInput (userRequest) {
  let unit = 'imperial'
  let input = userRequest.split(':')
  if (input.length < 3 || input.length > 4) {
    return null
  }
  let adjusted = adjustInput(input)
  unit = adjusted.unit
  let action = adjusted.action, startPos = adjusted.startPos, endPos = adjusted.endPos
  return await validateInput(unit, action, startPos, endPos)
}

module.exports = processInput
