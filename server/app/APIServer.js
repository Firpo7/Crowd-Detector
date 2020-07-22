const APIconstants = require('./APIConstants').constants;
const Utils = require('./Utils');


function registerNewNodeController(req, res) {
  if( !( req.body.name && typeof(req.body.name)==='string' ) ||
      !( req.body.max_people && typeof(req.body.max_people)==='string' ) ||
      !( req.body.type && typeof(req.body.type)==='string' ) ||
      !( req.body.floor && typeof(req.body.floor)==='string' ) ||
      !( req.body.building && typeof(req.body.building)==='string' ) ||
       ( parseInt(req.body.max_people) < 1 ) ) { //aggiungere il controllo sul tipo di stanza quando metteremo una lista comune ) {
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
    'maxpeople' : req.body.max_people,
    'floor' : req.body.floor,
    'roomtype' : req.body.type,
    'building' : req.body.building
  })).then(() => { res.send({code: APIconstants.API_CODE_SUCCESS, id: private_id}) })
  .catch((err) => { res.send({ code: APIconstants.API_CODE_GENERAL_ERROR }); console.log(err) })
}

function registerNewBuildingController(req, res) {
  if( !( req.body.name && typeof(req.body.name)==='string' ) ||
      !( req.body.numFloors && typeof(req.body.numFloors)==='string' ) ||
       ( parseInt(req.body.numFloors) < 1 ) ) {
        res.send ({ code: APIconstants.API_CODE_INVALID_DATA })
        return
  }
  Utils.insertDataIntoDB('building', {
    'name' : req.body.name,
    ...(typeof(req.body.address)==='string' && {address : req.body.address}),
    'numfloors' : req.body.numFloors
  }).then(() => {res.send({code: APIconstants.API_CODE_SUCCESS})})
  .catch((err) => {res.send({ code: APIconstants.API_CODE_GENERAL_ERROR }); console.log(err)})
}

function deleteBuildingController(req, res) {
  if( !( req.body.name && typeof(req.body.name)==='string' ) ) {
    res.send ({ code: APIconstants.API_CODE_INVALID_DATA })
    return
  }
  Utils.deleteFromDB('building', {'name': req.body.name})
  .then(() => {res.send({code: APIconstants.API_CODE_SUCCESS})})
  .catch((err) => {res.send({ code: APIconstants.API_CODE_GENERAL_ERROR }); console.log(err)})
}

function deleteNodeController(req, res) {
  if( !( req.body.id && typeof(req.body.id)==='string' ) ) {
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
  .catch((err) => {res.send({ code: APIconstants.API_CODE_GENERAL_ERROR }); console.log(err)})
}

function updateCrowdController(req, res) {
  if( !( req.body.id && typeof(req.body.id)==='string' ) ||
      !( req.body.current && typeof(req.body.current)==='string' ) ||
      !( req.body.new && typeof(req.body.new)==='string' ) ||
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
  .catch((err) => { res.send({ code: APIconstants.API_CODE_GENERAL_ERROR }); console.log(err) })
}

function manageAdminRequests(req, res, callback) {
  let token = req.body.token
  if(!token) { res.send({ code: APIconstants.API_CODE_UNAUTHORIZED_ACCESS }); return }

  Utils.checkValidityToken(token)
  .then(() => callback(req, res))
  .catch((err) => { res.send({ code: err.code }); console.log(err.err) })
}


exports.updateCrowd = updateCrowdController;
exports.deleteNode = deleteNodeController;
exports.deleteBuilding = deleteBuildingController;
exports.registerNewNode = registerNewNodeController;
exports.registerNewBuilding = registerNewBuildingController;
exports.manageAdminRequests = manageAdminRequests;