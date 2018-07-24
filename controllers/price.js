
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


exports.addPrice = function (req, res, next) {
	logger.info('EXPRESS: post("/addPrice") --> RECEIVED'.event);
	var status, message, data;

	var schema = {
		type: 'object',
		properties: {
			from_district: {
				type: 'object'
			},
			to_district: {
				type: 'object'
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

		FBase.ref('prices').once('value', function (snapshot) {
			var prices = snapshot.val();
			var found = false;
			for (var key in prices) {
				var price = prices[key];
				if (price.from_district.id === params.from_district.id && price.to_district.id === params.to_district.id)
					found = true;
			}

			if (found) {
				status = 0;
				message = 'This price exists in database';
				logger.info(message);
				makeResponse(res, status, message, data);
				return;
			}
			
			var uRef = FBase.ref('prices').push();
			var id = uRef.key;

			var price = params;
			price.id = id;

			uRef.set(price, function (err) {
				if (err) {
					status = 0;
					message = err;
				} else {
					status = 1;
					data = price;
					message = 'price is added successfully';
				}
				logger.info(message);
				makeResponse(res, status, message, data);
			});
		});
	}
};

exports.deletePrice = function (req, res, next) {
	logger.info('EXPRESS: post("/deletePrice") --> RECEIVED'.event);
	var status, message, data;

	var schema = {
		type: 'object',
		properties: {
			price_id: {
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

		FBase.ref('prices/' + params.price_id).remove(function (err) {
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

exports.getAllPrices = function (req, res, next) {
	logger.info('post("/getAllPrices") --> RECEIVED'.event);
	var status, message, data;
	var prices = [];

	FBase.ref('prices').once('value', function (snapshot) {
		var response = snapshot.val();
		if (!response) {
			status = 0;
			message = 'No prices in database';
			makeResponse(res, status, message, data);
		} else {
			logger.info(response);
			for (var key in response)
				prices.push(response[key]);
			status = 1;
			data = prices;
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

