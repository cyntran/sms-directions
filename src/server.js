// Currently does not support foreign addresses
// with special characters
const config = require('../config.js')
const accountSid = config.twilioSid
const authToken = config.twilioToken
const twilio = require('twilio')
const express = require('express')
const client = new twilio(accountSid, authToken)
const bodyParser = require('body-parser')
const createRoute = require('./create-route.js')
const app = express()
const MessagingResponse = twilio.twiml.MessagingResponse;
const PORT = 8080

app.use(bodyParser.urlencoded({ extended: false }))

let textSMS = 'walking:seattle reserve roastery:raygun, seattle'

test()
async function test () {
  let messageResponse = await createRoute(textSMS)
  console.log(messageResponse)
}

app.post('/sms', async (req, res) => {
  let twiml = new MessagingResponse()
  let input = req.body.Body
  let messageResponse = await createRoute(input)
  twiml.message(messageResponse)
  res.writeHead(200, {'Content-Type': 'text/xml'})
  res.end(twiml.toString())
})

app.listen(PORT, () => {
  console.log('listening on PORT '+ PORT)
})
