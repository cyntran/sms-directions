let errorMsg = "Sorry, we can't recognize your search. " +
"Please text 'HELP-SMS' for instructions on how to format your search."
let helpMsg = 'To get more accurate directions, ' +
'please follow this format and specification:' +
'\n\n<metric/imperial>:<driving/walking>:<starting_address>, <city>:<ending_address>, <city>\n\n' +
'--For example-- \n\n' +
'metric:walking:seattle space needle, seattle:starbucks reserve roastery, seattle\n\n' +
'OR \n' +
'imperial:driving:400 Broad St, Seattle:1124 Pike St, Seattle\n\n' +
'If no distance unit is provided, the default system will be imperial.\n' +
"Providing a more accurate starting position will help you find where you're looking for!"
let processSteps = (steps, totalDistance) => {
  return 'Total Distance: ' + totalDistance + '\n' +
    steps.toString().replace(/,/g, '\n')
}

module.exports = {
  processSteps: processSteps,
  errorMsg: errorMsg,
  helpMsg: helpMsg
}
