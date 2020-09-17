const APIconstants = require('./Constants').APIConstants;
const ParamsCostants = require('./Constants').ParamsConstants;
const Utils = require('./Utils');
const UtilsDB = require('./UtilsDB');
const UtilsMQTT = require('./UtilsMQTT');


function registerNewNodeController(req, res) {
  if( !( Utils.checkParamString(req.body.name) && Utils.checkNameRegex(req.body.name, ParamsCostants.REGEX_PARAM_NAME) ) ||
      !( Utils.checkNumber(req.body.max_people) ) ||
      !( Utils.checkNumber(req.body.floor) ) ||
       ( req.body.max_people < 1 || req.body.floor < 0 ) ||
      !( Utils.checkParamString(req.body.type) && Utils.checkRoomType(req.body.type) ) ||
      !( Utils.checkParamString(req.body.building) && Utils.checkNameRegex(req.body.building, ParamsCostants.REGEX_PARAM_NAME) )) {
        console.error('invalid data received:', req.body)
        res.send ({ code: APIconstants.API_CODE_INVALID_DATA })
        return
  }

  let public_id = Utils.generateRandomID()
  let private_id = Utils.generateRandomID()

  UtilsDB.checkFloorBuilding(req.body.building, req.body.floor)
  .then(() => UtilsDB.insertDataIntoDB('sensor', {
    'public_id' : public_id,
    'private_id' : private_id,
    'name' : req.body.name,
    'maxpeople' : req.body.max_people,
    'floor' : req.body.floor,
    'roomtype' : req.body.type,
    'building' : req.body.building
  })).then(() => { res.send({code: APIconstants.API_CODE_SUCCESS, id: private_id}) })
  .catch((err) => { res.send({ code: (err.code || APIconstants.API_CODE_GENERAL_ERROR) }); console.error((err.err || err)) })
}

function registerNewBuildingController(req, res) {
  if( !( Utils.checkParamString(req.body.name) && Utils.checkNameRegex(req.body.name, ParamsCostants.REGEX_PARAM_NAME) ) ||
      !( Utils.checkNumber(req.body.numFloors) ) ||
       ( req.body.numFloors < 1 ) ) {
        console.error('invalid data received:', req.body)
        res.send ({ code: APIconstants.API_CODE_INVALID_DATA })
        return
  }
  UtilsDB.insertDataIntoDB('building', {
    'name' : req.body.name,
    ...(typeof(req.body.address)==='string' && {address : req.body.address}),
    'numfloors' : req.body.numFloors
  }).then(() => {res.send({code: APIconstants.API_CODE_SUCCESS})})
  .catch((err) => {res.send({ code: (err.code || APIconstants.API_CODE_GENERAL_ERROR) }); console.error((err.err || err))})
}

function deleteBuildingController(req, res) {
  if( !( Utils.checkParamString(req.body.name) && Utils.checkNameRegex(req.body.name, ParamsCostants.REGEX_PARAM_NAME) ) ) {
    console.error('invalid data received:', req.body)
    res.send ({ code: APIconstants.API_CODE_INVALID_DATA })
    return
  }
  UtilsDB.deleteFromDB('building', {'name': req.body.name})
  .then(() => {res.send({code: APIconstants.API_CODE_SUCCESS})})
  .catch((err) => {res.send({ code: (err.code || APIconstants.API_CODE_GENERAL_ERROR) }); console.error((err.err || err))})
}

function deleteNodeController(req, res) {
  if( !( Utils.checkParamString(req.body.id) && Utils.checkGUID(req.body.id) ) ) {
    console.error('invalid data received:', req.body)
    res.send ({ code: APIconstants.API_CODE_INVALID_DATA })
    return
  }

  let public_id
  UtilsDB.getPublicID(req.body.id)
  .then((id) => public_id = id)
  .then(() => UtilsDB.deleteFromDB('sensor', {'private_id': req.body.id}))
  .then(() => UtilsDB.deleteFromCache(public_id))
  .then(() => UtilsDB.deleteFromCache(req.body.id))
  .then(() => res.send({code: APIconstants.API_CODE_SUCCESS}))
  .catch((err) => {res.send({ code: (err.code || APIconstants.API_CODE_GENERAL_ERROR) }); console.error((err.err || err))})
}

function updateCrowdController(req, res) {
  if( !( Utils.checkParamString(req.body.id) && Utils.checkGUID(req.body.id) ) ||
      !( Utils.checkNumber(req.body.current) ) ||
      !( Utils.checkNumber(req.body.new) ) ||
      !( Utils.checkParamString(req.body.time) ) ||
      ( req.body.current < 0 ) ||
      ( req.body.new < 0 ) ||
      ( req.body.new > req.body.current )) {
        console.error('invalid data received:', req.body)
        res.send ({ code: APIconstants.API_CODE_INVALID_DATA })
        return
  }

  let id;
  let data = {
    'time': req.body.time,
    'current_people': req.body.current,
    'new_people': req.body.new
  }
  UtilsDB.getPublicID(req.body.id)
  .then((public_id) => {id = public_id})
  .then(() => UtilsDB.insertDataIntoDB('sensor_data', {...data, sensor_id: id}))
  .then(() => UtilsMQTT.publishSensorDataOnMqtt(id,{...data, sensor_id: id}))
  .then(() => res.send({code: APIconstants.API_CODE_SUCCESS}) )
  .catch((err) => { res.send({ code: (err.code || APIconstants.API_CODE_GENERAL_ERROR) }); console.error((err.err || err)) })
}

function manageAdminRequests(req, res, callback) {
  let token = req.body.token
  
  if(!token) { 
    console.error('/!\\ INVALID TOKEN:', req.body.token)
    res.send({ code: APIconstants.API_CODE_UNAUTHORIZED_ACCESS })
    return 
  }

  UtilsDB.checkValidityToken(token)
  .then(() => callback(req, res))
  .catch((err) => { 
    if (/^TOKEN_ERR:.*$/.test(err)) {
      let bad_token = err.split(':')[1]
      console.log(`/!\\ Unauthorized access with token: ${bad_token}`)
      res.send({ code: APIconstants.API_CODE_UNAUTHORIZED_ACCESS })
      return
    }
    res.send({ code: (err.code || APIconstants.API_CODE_GENERAL_ERROR) }); console.error((err.err || err)) })
}


exports.updateCrowd = updateCrowdController;
exports.deleteNode = deleteNodeController;
exports.deleteBuilding = deleteBuildingController;
exports.registerNewNode = registerNewNodeController;
exports.registerNewBuilding = registerNewBuildingController;
exports.manageAdminRequests = manageAdminRequests;