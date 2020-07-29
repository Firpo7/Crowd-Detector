const APIconstants = require('./Constants').APIConstants;
const ParamsConstants = require('./Constants').ParamsConstants;
const Utils = require('./Utils');
const UtilsDB = require('./UtilsDB');


function getNodesController(req, res) {
  if (!Utils.checkParamString(req.query.building) || !Utils.checkNameRegex(req.query.building, ParamsConstants.REGEX_PARAM_NAME)) {
    res.send({code: APIconstants.API_CODE_INVALID_DATA}); return;
  }

  let floors = Utils.getListOf(req.query.floor)
  let types = Utils.getListOf(req.query.type)

  UtilsDB.getNodesFromDB(building=req.query.building, floors=floors, types=types)
  .then((rows) => res.send({code: APIconstants.API_CODE_SUCCESS, listOfNodes: rows}))
  .catch((err) => {res.send({ code: (err.code || APIconstants.API_CODE_GENERAL_ERROR) }); console.log((err.err || err))})
}

function getBuildingController(req, res) {
  // if name it's present, then it should match the REGEX
  if (Utils.checkParamString(req.query.name) && !Utils.checkNameRegex(req.query.name, ParamsConstants.REGEX_PARAM_NAME)) {
    res.send({code: APIconstants.API_CODE_INVALID_DATA}); return;
  }

  UtilsDB.getBuildingsFromDB(req.query.name)
  .then((rows) => res.send({code: APIconstants.API_CODE_SUCCESS, buildings: rows}))
  .catch((err) => {res.send({ code: (err.code || APIconstants.API_CODE_GENERAL_ERROR) }); console.log((err.err || err))})
}

function getStatisticsController(req, res) {
  if( !( Utils.checkParamString(req.query.op) && Utils.checkOperation(req.query.op) ) ||
      !( Utils.checkParamString(req.query.optionRange) && Utils.checkOptionRange(req.query.optionRange) ) ||
      !( (Utils.checkParamString(req.query.id) && Utils.checkGUID(req.query.id))  || 
         (req.query.id instanceof Array && req.query.id.every(Utils.checkGUID)) )
      ) {
        res.send ({ code: APIconstants.API_CODE_INVALID_DATA })
        return
  }
  let ids = Utils.getListOf(req.query.id)
  UtilsDB.getStatisticsFromDB(ids, req.query.op.toLowerCase(), req.query.optionRange.toLowerCase())
  .then((rows) => res.send({code: APIconstants.API_CODE_SUCCESS, datas: rows}))
  .catch((err) => {res.send({code: (err.code || APIconstants.API_CODE_GENERAL_ERROR)}) ; if (err.code) console.log(err) })
}

function getSimpleStatisticsController(req, res) {
  if ( !( (Utils.checkParamString(req.query.id) && Utils.checkGUID(req.query.id))  || 
     (req.query.id instanceof Array && req.query.id.every(Utils.checkGUID)) ) ) {
    res.send ({ code: APIconstants.API_CODE_INVALID_DATA })
    return
  }
  let ids = Utils.getListOf(req.query.id)
  UtilsDB.getSimpleStatisticsFromDB(ids)
  .then((rows) => res.send({code: APIconstants.API_CODE_SUCCESS, datas: rows}))
  .catch((err) => {res.send({ code: (err.code || APIconstants.API_CODE_GENERAL_ERROR) }); console.log((err.err || err))})
}

exports.getSimpleStatistics = getSimpleStatisticsController
exports.getNodes = getNodesController;
exports.getBuildings = getBuildingController;
exports.getStatistics = getStatisticsController;