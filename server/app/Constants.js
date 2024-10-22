const api = {
    // response codes
    API_CODE_SUCCESS: 42,
    API_CODE_GENERAL_ERROR: 442,
    API_CODE_INVALID_DATA: 443,
    API_CODE_UNAUTHORIZED_ACCESS: 444,
    
    // client API
    API_ENDPOINT_GETNODES: '/getNodes',
    API_ENDPOINT_GET_BUILDINGS: '/getBuildings',
    API_ENDPOINT_GET_STAT: '/getStatistics',
    API_ENDPOINT_GET_SIMPLE_STAT: '/getSimpleStatistics',

    // admin API
    API_ENDPOINT_REGISTER_NEW_NODE: '/registerNewNode',
    API_ENDPOINT_DELETE_NODE: '/deleteNode',
    API_ENDPOINT_UPDATE_CROWD: '/updateCrowd',
    API_ENDPOINT_REGISTER_NEW_BUILDING: '/registerNewBuilding',
    API_ENDPOINT_DELETE_BUILDINGS: '/deleteBuilding'
}

const params = {
    REGEX_PARAM_NAME: /^[A-Za-z][A-Za-z0-9\-_, ]+$/i,
    ROOMTYPES: new Set(['lecture room', 'library', 'office', 'common room', 'reserved room', 'study room', 'laboratory']),
    OPERATIONS: {
        MAX_NUMBER_OF_PEOPLE: "max",
        AVG_NUMBER_OF_PEOPLE: "avg",
        NUMBER_OF_DISTICT_PEOPLE: "distinct",
        ALL_STATISTICS: "all"
      },
    OPTION_RANGES: {
        TODAY: "today",
        YESTERDAY: "yesterday",
        LAST_WEEK: "lastweek",
        LAST_MONTH: "lastmonth"
      },
}

exports.APIConstants = Object.freeze(api)
exports.ParamsConstants = Object.freeze(params)