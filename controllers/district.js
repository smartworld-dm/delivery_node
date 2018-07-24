
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

var db_district = 'districts';

exports.addDistrict = function (req, res, next) {
	logger.info('EXPRESS: post("/addDistrict") --> RECEIVED'.event);
	var status, message, data;

	var schema = {
		type: 'object',
		properties: {
			name: {
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

		FBase.ref(db_district).orderByChild('name').equalTo(`${params.name}`).once('value', function (snapshot) {
			logger.info('district ');
			var district = snapshot.val();
			if (district) {
				status = 0;
				message = 'This district exists in database';
				logger.info(message);
				makeResponse(res, status, message, data);
			} else {
				var uRef = FBase.ref(db_district).push();
				var id = uRef.key;

				var district = params;
				district.id = id;

				uRef.set(district, function (err) {
					if (err) {
						status = 0;
						message = err;
					} else {
						status = 1;
						data = district;
					}
					logger.info(message);
					makeResponse(res, status, message, data);
				});
			}
		});
	}
};

exports.deleteDistrict =  function (req, res, next) {
	logger.info('EXPRESS: post("/addDistrict") --> RECEIVED'.event);
	var status, message, data;

	var schema = {
		type: 'object',
		properties: {
			district_id: {
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

		FBase.ref('districts/' + params.district_id ).remove(function(err) {
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

exports.getAllDistricts = function(req,res,next) {
	logger.info('post("/getAllDistricts") --> RECEIVED'.event);
	var status, message, data;
	var districts = [];

	FBase.ref('districts').once('value', function(snapshot) {
		var response = snapshot.val();
		if (!response) {
			status = 0;
			message = 'No districts in database';
			makeResponse(res, status, message, data);
		} else {
			logger.info(response);
			for (var key in response) 
				districts.push(response[key]);
			status = 1;
			data = districts;
			makeResponse(res, status, message, data);
		}
	});
}

function makeResponse(res, status, message, data) {
	res.set('Access-Control-Allow-Origin', '*');
	res.status(200).json({
		status: status,
		message: message,
		data: data
	});
}

