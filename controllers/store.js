
var firebase = require("firebase");
var FBase = firebase.database();
//debugging
var colors = require('colors');
colors.setTheme({
    info: 'green',
    data: 'magenta',
    warn: 'yellow',
    error: 'red',
    event: 'cyan',
    receivedEvent: 'lightcyan'
});


//trace
var logger = require('tracer').colorConsole({
    format: [
        '{{timestamp}} (in line: {{line}}) >> {{message}}', //default format
        {
            error: '{{timestamp}} <{{title}}> {{message}} (in {{file}}:{{line}})\nCall Stack:\n{{stack}}' // error format
        }
    ],
    dateformat: 'HH:MM:ss.L',
    preprocess: function (data) {
        data.title = data.title.toUpperCase();
    }
});
var inspector = require('schema-inspector');

exports.getStores = function (req, res, next) {
    logger.info('EXPRESS: post("/getStores") --> RECEIVED'.event);

    var status, message, data;
    var homeStores = [];

    FBase.ref('stores').orderByChild('type').equalTo(`store`).once('value', function (snapshot) {
        var stores = snapshot.val();

        if (!stores) {
            status = 0;
            message = 'No stores in database';
            makeResponse(res, status, message, data);
        }
        else {
            for (var s in stores) {
                homeStores.push(stores[s]);
            }
            status = 1;
            data = homeStores;
            makeResponse(res, status, message, data);
        }
    });
};

exports.getHomeStores = function (req, res, next) {
    logger.info('EXPRESS: post("/getHomeStores") --> RECEIVED'.event);

    var status, message, data;
    var homeStores = [];

    FBase.ref('stores').orderByChild('type').equalTo(`homeStore`).once('value', function (snapshot) {
        var stores = snapshot.val();

        if (!stores) {
            status = 0;
            message = 'No stores in database';
            makeResponse(res, status, message, data);
        }
        else {
            for (var s in stores) {
                homeStores.push(stores[s]);
            }
            status = 1;
            data = homeStores;
            makeResponse(res, status, message, data);
        }
    });
};


exports.getMyStore = function (req, res, next) {
    logger.info('EXPRESS: post("/getMyStore") --> RECEIVED'.event);

    var status, message, data;

    var schema = {
        type: 'object',
        parameters: {
            uid: {
                type: 'string'
            }
        }
    };

    var params = req.body;
    logger.log('params: %O', params);

    var validationresult = inspector.validate(schema, params);

    if (!validationresult.valid) {
        status = 0;
        message = validationresult.format();
        logger.log(validationresult.format());

        makeResponse(res, status, message, data);
    } else {
        logger.info('Validation passed');

        FBase.ref('stores').once('value', function (snapshot) {
            var stores = snapshot.val();
            var store;

            for (var s in stores) {
                if (stores[s].owner.uid == params.uid) {
                    store = stores[s];
                    break;
                }
            }

            status = 1;
            data = store;
            makeResponse(res, status, message, data);
        });
    }
};



exports.getPlaces = function (req, res, next) {
    logger.info('EXPRESS: post("/getPlaces") --> RECEIVED'.event);

    var status, message, data;

    var schema = {
        type: 'object'
    };

    var params = req.body;
    logger.log('params: %O', params);

    var validationresult = inspector.validate(schema, params);

    if (!validationresult.valid) {
        status = 0;
        message = validationresult.format();
        logger.log(validationresult.format());

        makeResponse(res, status, message, data);
    } else {
        logger.info('Validation passed');

        var places = [];

        FBase.ref('stores').once('value', function (snapshot) {
            var stores = snapshot.val();

            for (var s in stores) {
                places.push(stores[s]);
            }

            status = 1;
            data = places;
            makeResponse(res, status, message, data);

        });
    }
};


exports.deleteStore =  function (req, res, next) {
	logger.info('EXPRESS: post("/deleteStore") --> RECEIVED'.event);
	var status, message, data;

	var schema = {
		type: 'object',
		properties: {
			store_id: {
				type: 'string'
			},
		}
	};

	var params = req.body;
	logger.log('params: %O', params);

	var validationresult = inspector.validate(schema, params);

	if (!validationresult.valid) {
		status = 0;
		message = validationresult.format();
		logger.log(validationresult.format());

		makeResponse(res, status, message, data);
	} else {
		logger.info('Validation passed');

		FBase.ref('stores/' + params.store_id ).remove(function(err) {
			if (err) {
				status = 0;
				message = err;
			} else {
				status = 1;
			}

			makeResponse(res, status, message, data);
		});
	}	
}

exports.updateHomeStore =  function (req, res, next) {
    logger.info('EXPRESS: post("/updateHomeStore") --> RECEIVED'.event);

    var status, message, data;

    var schema = {
        type: 'object'
    };

    var params = req.body;
    logger.log('params: %O', params);

    var validationresult = inspector.validate(schema, params);

    if (!validationresult.valid) {
        status = 0;
        message = validationresult.format();
        logger.log(validationresult.format());

        makeResponse(res, status, message, data);
    } else {
        logger.info('Validation passed');

        FBase.ref('stores/' + params.id).set(params, function (err) {
            if (err) {
                status = 0;
                message = err;
            } else {
                status = 1;
            }

            makeResponse(res, status, message, data);
        });
    }
};


exports.updateStore =  function (req, res, next) {
    logger.info('EXPRESS: post("/updateStore") --> RECEIVED'.event);

    var status, message, data;

    var schema = {
        type: 'object'
    };

    var params = req.body;
    logger.log('params: %O', params);

    var validationresult = inspector.validate(schema, params);

    if (!validationresult.valid) {
        status = 0;
        message = validationresult.format();
        logger.log(validationresult.format());

        makeResponse(res, status, message, data);
    } else {
        logger.info('Validation passed');

        FBase.ref('stores/' + params.id).set(params, function (err) {
            if (err) {
                status = 0;
                message = err;
            } else {
                status = 1;
            }

            makeResponse(res, status, message, data);
        });
    }
};


function makeResponse(res, status, message, data) {
    res.set('Access-Control-Allow-Origin', '*');
    res.status(200).json({
        status: status,
        message: message,
        data: data
    });
}



