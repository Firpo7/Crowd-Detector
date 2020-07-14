const APIconstants = require('./APIConstants').constants;
const Utils = require('./Utils');


function checkIsPresent(value) {
  return (value !== undefined && value !== null)
}

function getNodesController(req, res) {
  if (!checkIsPresent(req.query.building)) { res.send({code: APIconstants.API_CODE_INVALID_DATA}); return; }
  let floors = Utils.getListOf(req.query.floor)
  let types = Utils.getListOf(req.query.type)

  Utils.getNodesFromDB(building=req.query.building, floors=floors, types=types)
  .then((rows) => res.send({code: APIconstants.API_CODE_SUCCESS, listOfNodes: rows}))
  .catch((err) => {res.send({code:APIconstants.API_CODE_GENERAL_ERROR}) ; console.log(err) })
}

function getBuildingController(req, res) {
  Utils.getBuildingsFromDB(req.query.name)
  .then((rows) => res.send({code: APIconstants.API_CODE_SUCCESS, buildings: rows}))
  .catch((err) => {res.send({code:APIconstants.API_CODE_GENERAL_ERROR}) ; console.log(err) })
}

function getStatisticsController(req, res) {
  if( !( req.query.op && typeof(req.query.op)==='string' ) ||
      !( req.query.optionRange && typeof(req.query.optionRange)==='string' ) ||
      !( req.query.id && (typeof(req.query.id)==='string' || req.query.id instanceof Array) )) {
        res.send ({ code: APIconstants.API_CODE_INVALID_DATA })
        return
  }
  let ids = Utils.getListOf(req.query.id)
  Utils.getStatisticsFromDB(ids, req.query.op.toLowerCase(), req.query.optionRange.toLowerCase())
  .then((rows) => res.send({code: APIconstants.API_CODE_SUCCESS, datas: rows}))
  .catch((err) => {res.send({code: (err.code || APIconstants.API_CODE_GENERAL_ERROR)}) ; if (err.code) console.log(err) })
}

function getSimpleStatisticsController(req, res) {
  if ( !( req.query.id && (typeof(req.query.id)==='string' || req.query.id instanceof Array) )) {
    res.send ({ code: APIconstants.API_CODE_INVALID_DATA })
    return
  }
  let ids = Utils.getListOf(req.query.id)
  Utils.getSimpleStatisticsFromDB(ids)
  .then((rows) => res.send({code: APIconstants.API_CODE_SUCCESS, datas: rows}))
  .catch((err) => {res.send({code:APIconstants.API_CODE_GENERAL_ERROR}) ; console.log(err) })
}

exports.getSimpleStatistics = getSimpleStatisticsController
exports.getNodes = getNodesController;
exports.getBuildings = getBuildingController;
exports.getStatistics = getStatisticsController;