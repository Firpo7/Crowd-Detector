const ParamsConstants = require('./Constants').ParamsConstants;


function S4() {
  return (((1+Math.random())*0x10000)|0).toString(16).substring(1); 
}

function generateRandomID() {
  return (S4() + S4() + "-" + S4() + "-4" + S4().substr(0,3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();
}

function getListOf(value) {
  let ret = (value || [])
  if (!(ret instanceof Array)) ret = [value]
  return ret
}

function checkParamString(str) {
  return typeof(str) === 'string'
}

function checkNameRegex(str, regex) {
  return str.match(regex)
}

function checkRoomType(roomtype) {
  return ParamsConstants.ROOMTYPES.has(roomtype)
}

function checkNumber(num) {
  return typeof(num) === 'number';
}

function checkGUID(guid) {
  return /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[0-9A-F]{4}-[0-9A-F]{12}$/i.test(guid)
}

function checkOperation(op) {
  return Object.values(ParamsConstants.OPERATIONS).indexOf(op) >= 0
}

function checkOptionRange(op) {
  return Object.values(ParamsConstants.OPTION_RANGES).indexOf(op) >= 0
}


exports.getListOf = getListOf;
exports.generateRandomID = generateRandomID;
exports.checkParamString = checkParamString;
exports.checkNameRegex = checkNameRegex;
exports.checkRoomType = checkRoomType;
exports.checkNumber = checkNumber;
exports.checkGUID = checkGUID;
exports.checkOperation = checkOperation;
exports.checkOptionRange = checkOptionRange;