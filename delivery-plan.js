(function () {
	'use strict';

	/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ DEPENDENCIES - START ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/


	var Config = require('./controllers/config').Config;

	var sockets = [];
	var onlineAgents = [];

	// pmx
	var pmx = require('pmx');
	pmx.init();

	// http
	var http = require('http');
	// promise
	var q = require('q');
	//inspector
	var inspector = require('schema-inspector');

	// push
	var FCM = require('fcm-push');
	var fcm = new FCM(Config.WebAPIKey);

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
	var firebase = require("firebase");


	// firebase.initializeApp({
	// 	databaseURL: "https://delivery-plan.firebaseio.com/",
	// 	serviceAccount: __dirname + "/credentials/delivery-plan.json"
	// });

	// var config = {
	//     apiKey: "AIzaSyAoFDSFnOfSwxAJ050QlV0jMFr6bfP1hng",
	//     authDomain: "delivery-plan.firebaseapp.com",
	//     databaseURL: "https://delivery-plan.firebaseio.com",
	//     storageBucket: "delivery-plan.appspot.com",
	//     messagingSenderId: "286179672086"
	// };

	var config = {
		apiKey: "AIzaSyAWvJrYSpDUW60HtvUzt3tFYW-zQ_H162Q",
		authDomain: "deliveryplan-7e375.firebaseapp.com",
		databaseURL: "https://deliveryplan-7e375.firebaseio.com",
		projectId: "deliveryplan-7e375",
		storageBucket: "",
		messagingSenderId: "224947743993"
	};

	firebase.initializeApp(config);
	// console.log('Firebase --> INITED');

	// firebase.initializeApp({
	// 	databaseURL: "https://delivery-plan.firebaseio.com/",
	// 	serviceAccount: __dirname + "/credentials/delivery-plan.json"
	// });
	var FBase = firebase.database();


	//express
	var express = require('express');
	var morgan = require('morgan');
	var bodyParser = require('body-parser');

	var app = express();
	app.use(express.static(__dirname + '/public'));
	app.use(morgan('dev'));
	app.use(bodyParser.json({
		limit: "50mb",
		type: 'application/json'
	}));
	app.use(bodyParser.urlencoded({
		limit: '50mb',
		'extended': true,
		type: 'application/x-www-form-urlencoding'
	}));

	app.use(function (req, res, next) {
		res.header('Access-Control-Allow-Origin', '*');
		res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
		res.header('Access-Control-Allow-Headers', 'X-Requested-With,Content-Type,Cache-Control');
		if (req.method === 'OPTIONS') {
			res.statusCode = 204;
			return res.end();
		} else {
			return next();
		}
	});

	 const nodemailer = require('nodemailer');

	 var transporter = nodemailer.createTransport({
	   service: 'gmail',
	   auth: {
	 	user: 'icss666@gmail.com',
 		pass: 'nanowork'
	   }
	 });
	
	 var mailOptions = {
		from: 'customer@mail.com',
	   to: 'greatroyalone@outlook.com',
	   subject: 'Sending Email using Node.js',
	   text: 'That was easy!'
	 };
	
	 transporter.sendMail(mailOptions, function(error, info){
	   if (error) {
	 	console.log(error);
	   } else {
	 	console.log('Email sent: ' + info.response);
	   }
	 });
	/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ DEPENDENCIES - END ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

	var router = require('./router');
	router(app);

	/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ RUN THE SERVER ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

	var server = http.createServer(app);
	var socketController = require('./controllers/socket');

	var io = require('socket.io')(server);

	socketController.initializeSocket(io);

	server.listen(Config.httpPort, function () {
		console.log(' ');
		console.log(' ');
		console.log(' ');
		console.log(' ');
		console.log(' ');
		console.log('                                |~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~|'.error);
		console.log('                                |~~~~~~~~~~~~~~~~~~~ '.error + 'SERVER READY'.info + ' ~~~~~~~~~~~~~~~~~~~~|'.error);
		console.log('                                |~~~~~~~~~~~ '.error + 'App listening on port '.event + Config.httpPort + ' ~~~~~~~~~~~~~|'.error);
		console.log('                                |~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~|'.error);
		console.log('                                |~~~~'.error + ' TDEQC MMWCS RAVAH LMARI YPEMQ ECKRQ CBLST A '.warn + '~~~~|'.error);
		console.log('                                |~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~|'.error);
	});


	// default route
	app.get('*', function (req, res) {
		logger.info('EXPRESS: get("*") --> RECEIVED'.event);

		res.set('Access-Control-Allow-Origin', '*');
		res.sendFile('./public/404.html', {
			root: __dirname
		});
	});

	app.use(pmx.expressErrorHandler());

	/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ ROUTES - START ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/




	app.post('/newHomeStoreDeliveryRequestForAgent', function (req, res) {
		logger.info('EXPRESS: post("/newHomeStoreDeliveryRequestForAgent") --> RECEIVED'.event);

		var status, message, data;

		var schema = {
			type: 'object',
			parameters: {
				orders: {
					type: 'object'
				},
				agent: {
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

			notifyAgentOfNewDeliveryRequest(params.agent, params.orders).then(
				function (success) {
					status = 1;
					makeResponse(res, status, message, data);
				},
				function (error) {
					status = 0;
					message = error;
					makeResponse(res, status, message, data);
				}
			);
		}
	});


	app.post('/markOrderAsCompleted', function (req, res) {
		logger.info('EXPRESS: post("/markOrderAsCompleted") --> RECEIVED'.event);

		var status, message, data;

		var schema = {
			type: 'object',
			parameters: {
				order: {
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
			var order = params.order;

			FBase.ref('inProgressRequests/' + order.id).remove();

			order.status = Config.dict.COMPLETED;
			order.completedAt = new Date().getTime();

			FBase.ref('completedRequests/' + order.id).set(order, function (err) {
				if (err) {
					status = 0;
					message = err;
				} else {
					status = 1;
				}

				makeResponse(res, status, message, data);
			});
		}
	});




	app.post('/getPendingRequestsByIDs', function (req, res) {
		logger.info('EXPRESS: post("/getPendingRequestsByIDs") --> RECEIVED'.event);

		var status, message, data;

		var schema = {
			type: 'object',
			parameters: {
				orders: {
					type: 'array'
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

			FBase.ref('pendingRequests').once('value', function (snapshot) {
				var requests = snapshot.val();
				var pRequests = [];

				for (var r in requests) {
					for (var o in params.orders) {
						if (requests[r].id == params.orders[o]) {
							pRequests.push(requests[r]);
						}
					}
				}

				status = 1;
				data = pRequests;
				makeResponse(res, status, message, data);
			});
		}
	});

	/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ PRIVATE METHODS - START ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

	function makeResponse(res, status, message, data) {
		res.set('Access-Control-Allow-Origin', '*');
		res.status(200).json({
			status: status,
			message: message,
			data: data
		});
	}

	function enlistDeliveryRequest(dRequest, agentsRejectingDelivery) {
		logger.info('agentsRejectingDelivery: %O', agentsRejectingDelivery);

		var defer = q.defer();
		var agent;
		var counter = 0;
		var noAvailableAgent = false;
		var searchingForAgent = true;

		while (searchingForAgent) {
			logger.info('Trying to find an available agent that wasn\'t asked before. Iteration (%s)', counter);

			agent = getRandomElements(onlineAgents, 1)[0];

			if (!agentsRejectingDelivery) {
				searchingForAgent = false;
			} else {
				var notOnTheList = false;
				for (var n in agentsRejectingDelivery) {
					if (agent.uid === agentsRejectingDelivery[n]) {
						notOnTheList = true;
						break;
					}
				}
				if (!notOnTheList) {
					searchingForAgent = false;
				}
			}

			counter++;
			if (counter === Config.cyclesToRepeatForSelectingAvailableAgent) {
				noAvailableAgent = true;
				searchingForAgent = false;
			}
		}

		if (noAvailableAgent) {
			logger.info(Config.dict.DELIVERY_REQUEST_NO_AGENT_AVAILABLE_MESSAGE);
			defer.reject(Config.dict.DELIVERY_REQUEST_NO_AGENT_AVAILABLE_MESSAGE);
		} else {
			if (!agent) {
				logger.info('No online agents');
				defer.reject(Config.dict.DELIVERY_REQUEST_NO_AGENT_AVAILABLE_MESSAGE);
			} else {
				logger.info('Selected agent socket.id: %s', agent.socket.id);

				agent.socket.emit('deliveryRequest', dRequest);
				logger.info('Socket (deliveryRequest) --> SENT '.event);

				defer.resolve(true);
			}
		}

		return defer.promise;
	}

	function getRandomElements(arr, quantity) {
		var tmp = arr.slice(arr);
		var ret = [];

		for (var i = 0; i < quantity; i++) {
			var index = Math.floor(Math.random() * tmp.length);
			var removed = tmp.splice(index, 1);
			ret.push(removed[0]);
		}
		return ret;
	}
	/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ PRIVATE METHODS - END ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

})();
