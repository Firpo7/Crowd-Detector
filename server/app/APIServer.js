const APIconstants = require('./APIConstants').APIConstants;
const ParamsCostants = require('./APIConstants').ParamsConstants;
const Utils = require('./Utils');


function registerNewNodeController(req, res) {
  if( !( Utils.checkParamString(req.body.name) && Utils.checkNameRegex(req.body.name, ParamsCostants.REGEX_PARAM_NAME) ) ||
      !( Utils.checkParamString(req.body.max_people) && Utils.checkNumber(req.body.max_people) ) ||
      !( Utils.checkParamString(req.body.floor) && Utils.checkNumber(req.body.floor) ) ||
       ( parseInt(req.body.max_people) < 1 && parseInt(req.body.floor) < 0) ||
      !( Utils.checkParamString(req.body.type) && Utils.checkRoomType(req.body.type) ) ||
      !( Utils.checkParamString(req.body.building) && Utils.checkNameRegex(req.body.building, ParamsCostants.REGEX_PARAM_NAME) )) {
        res.send ({ code: APIconstants.API_CODE_INVALID_DATA })
        return
  }

  let public_id = Utils.generateRandomID()
  let private_id = Utils.generateRandomID()

  Utils.checkFloorBuilding(req.body.building, req.body.floor)
  .then(() => Utils.insertDataIntoDB('sensor', {
    'public_id' : public_id,
    'private_id' : private_id,
    'name' : req.body.name,
    'max_people' : req.body.max_people,
    'floor' : req.body.floor,
    'roomtype' : req.body.type,
    'building' : req.body.building
  })).then(() => { res.send({code: APIconstants.API_CODE_SUCCESS, id: private_id}) })
  .catch((err) => { res.send({ code: (err.code || APIconstants.API_CODE_GENERAL_ERROR) }); console.log((err.err || err)) })
}

function registerNewBuildingController(req, res) {
  if( !( Utils.checkParamString(req.body.name) && Utils.checkNameRegex(req.body.name, ParamsCostants.REGEX_PARAM_NAME) ) ||
      !( Utils.checkParamString(req.body.floor) && Utils.checkNumber(req.body.floor) ) ||
       ( parseInt(req.body.numFloors) < 1 ) ) {
        res.send ({ code: APIconstants.API_CODE_INVALID_DATA })
        return
  }
  Utils.insertDataIntoDB('building', {
    'name' : req.body.name,
    ...(typeof(req.body.address)==='string' && {address : req.body.address}),
    'numfloors' : req.body.numFloors
  }).then(() => {res.send({code: APIconstants.API_CODE_SUCCESS})})
  .catch((err) => {res.send({ code: (err.code || APIconstants.API_CODE_GENERAL_ERROR) }); console.log((err.err || err))})
}

function deleteBuildingController(req, res) {
  if( !( Utils.checkParamString(req.body.name) && Utils.checkNameRegex(req.body.name, ParamsCostants.REGEX_PARAM_NAME) ) ) {
    res.send ({ code: APIconstants.API_CODE_INVALID_DATA })
    return
  }
  Utils.deleteFromDB('building', {'name': req.body.name})
  .then(() => {res.send({code: APIconstants.API_CODE_SUCCESS})})
  .catch((err) => {res.send({ code: (err.code || APIconstants.API_CODE_GENERAL_ERROR) }); console.log((err.err || err))})
}

function deleteNodeController(req, res) {
  if( !( Utils.checkParamString(req.body.id) && Utils.checkGUID(req.body.id) ) ) {
    res.send ({ code: APIconstants.API_CODE_INVALID_DATA })
    return
  }

  let public_id
  Utils.getPublicID(req.body.id)
  .then((id) => public_id = id)
  .then(() => Utils.deleteFromDB('sensor', {'private_id': req.body.id}))
  .then(() => Utils.deleteFromCache(public_id))
  .then(() => Utils.deleteFromCache(req.body.id))
  .then(() => res.send({code: APIconstants.API_CODE_SUCCESS}))
  .catch((err) => {res.send({ code: (err.code || APIconstants.API_CODE_GENERAL_ERROR) }); console.log((err.err || err))})
}

function updateCrowdController(req, res) {
  if( !( Utils.checkParamString(req.body.id) && Utils.checkGUID(req.body.id) ) ||
      !( Utils.checkParamString(req.body.current) && Utils.checkNumber(req.body.current) ) ||
      !( Utils.checkParamString(req.body.new) && Utils.checkNumber(req.body.new) ) ||
      ( parseInt(req.body.current) < 0 ) ||
      ( parseInt(req.body.new) < 0) ) {
        res.send ({ code: APIconstants.API_CODE_INVALID_DATA })
        return
  }

  Utils.getPublicID(req.body.id)
  .then((public_id) => Utils.insertDataIntoDB('sensor_data', {
    'sensor_id': public_id,
    'time': new Date(),
    'current_people': req.body.current,
    'new_people': req.body.new
  })).then(() => res.send({code: APIconstants.API_CODE_SUCCESS}) )
  .catch((err) => { res.send({ code: (err.code || APIconstants.API_CODE_GENERAL_ERROR) }); console.log((err.err || err)) })
}

function manageAdminRequests(req, res, callback) {
  let token = req.body.token
  if(!token) { res.send({ code: APIconstants.API_CODE_UNAUTHORIZED_ACCESS }); return }

  Utils.checkValidityToken(token)
  .then(() => callback(req, res))
  .catch((err) => { res.send({ code: (err.code || APIconstants.API_CODE_GENERAL_ERROR) }); console.log((err.err || err)) })
}


exports.updateCrowd = updateCrowdController;
exports.deleteNode = deleteNodeController;
exports.deleteBuilding = deleteBuildingController;
exports.registerNewNode = registerNewNodeController;
exports.registerNewBuilding = registerNewBuildingController;
exports.manageAdminRequests = manageAdminRequests;