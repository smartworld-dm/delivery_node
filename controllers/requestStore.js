
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

var Config = require('./config').Config;
var Notification = require('./notification');
var socketController = require('./socket');
var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport(Config.emailConfig);

exports.acceptHomeStoreRequest = function (req, res, next) {
	logger.info('EXPRESS: post("/acceptHomeStoreRequest") --> RECEIVED'.event);
	var status, message, data;

	var schema = {
		type: 'object',
		properties: {
			request_id: {
				type: 'string'
			},
		}
	};

	var params = req.body;
	

	var validationresult = inspector.validate(schema, params);

	if (!validationresult.valid) {
		status = 0;
		message = validationresult.format();
		logger.log(validationresult.format());

		makeResponse(res, status, message, data);
	} else {
		logger.info('Validation passed');

		FBase.ref('requestHomeStores').orderByChild('id').equalTo(`${params.request_id}`).once('value', function (snapshot) {
			var requests = snapshot.val();
			if (!requests) {
				status = 0;
				message = 'no homestore request in database';
				logger.info(requests);
				makeResponse(res, status, message, data);
			} else {
				logger.info(requests);

				var homeStore, request;
				for (var key in requests) {
					request = requests[key];
					homeStore = requests[key];
				}

				logger.info(requests);

				request.status = 'accepted';
				request.reason = params.reason;


				FBase.ref('users/' + data.uid).once('value', function (snapshot) {
					var user = snapshot.val();

					if (user) {
						var sockets = socketController.getOnlineSockets();
						
						for (var i = 0; i < sockets.length; i++) {
							var socket = sockets[i];
							if (socket.id === user.socketID) {
								socket.emit('messageFromAdmin', {
									message: request.reason
								});
							}
						}

					}
				});


				var sRef = FBase.ref('stores').push();
				homeStore.id = sRef.key;

				homeStore.status = 'accepted';
				homeStore.type = 'homeStore';

				var d = new Date();
				homeStore.timestamp = d.getTime();
				homeStore.date = d.getFullYear() + '/' + (d.getMonth() + 1) + '/' + d.getDate();

				FBase.ref('requestHomeStores/' + params.request_id).set(request);

				socketController.makeNotification(homeStore.owner.uid, params.reason);

				sRef.set(homeStore, function (err) {
					if (err) {
						status = 0;
						message = err;
					} else {
						status = 1;
						data = homeStore;



						if (homeStore.owner) {
							FBase.ref('users/' + homeStore.owner.uid + '/type').set('owner');

							// eventually let the new home owner know his request was approved
							// ...
							Notification.sendPushNotification(
								homeStore.owner.uid,
								'userIsStoreOwner',
								Config.dict.USER_IS_STORE_OWNER_TITLE,
								Config.dict.USER_IS_STORE_OWNER_MESSAGE
							);
						}

						status = 1;
						data = homeStore;
						makeResponse(res, status, message, data);
					}
				});
			}
		});
	}
};

exports.acceptStoreRequest = function (req, res, next) {
	logger.info('EXPRESS: post("/acceptStoreRequest") --> RECEIVED'.event);
	var status, message, data;

	var schema = {
		type: 'object',
		properties: {
			request_id: {
				type: 'string'
			},
		}
	};

	var params = req.body;
	

	var validationresult = inspector.validate(schema, params);

	if (!validationresult.valid) {
		status = 0;
		message = validationresult.format();
		logger.log(validationresult.format());

		makeResponse(res, status, message, data);
	} else {
		logger.info('Validation passed');

		FBase.ref('requestStores').orderByChild('id').equalTo(`${params.request_id}`).once('value', function (snapshot) {
			var requests = snapshot.val();
			if (!requests) {
				status = 0;
				message = 'no store request in database';
				logger.info(requests);
				makeResponse(res, status, message, data);
			} else {
				logger.info(requests);

				var store, request;
				for (var key in requests) {
					store = requests[key];
					request = requests[key];
				}

				request.status = 'accepted';
				request.reason = params.reason;

				FBase.ref('users/' + data.uid).once('value', function (snapshot) {
					var user = snapshot.val();

					if (user) {
						var sockets = socketController.getOnlineSockets();
						
						for (var i = 0; i < sockets.length; i++) {
							var socket = sockets[i];
							if (socket.id === user.socketID) {
								socket.emit('messageFromAdmin', {
									message: request.reason
								});
							}
						}

					}
				});


				var sRef = FBase.ref('stores').push();
				store.id = sRef.key;

				store.status = 'accepted';
				store.type = 'store';

				var d = new Date();
				store.timestamp = d.getTime();

				FBase.ref('requestStores/' + params.request_id).set(request);
				socketController.makeNotification(store.owner.uid, params.reason);

				sRef.set(store, function (err) {
					if (err) {
						status = 0;
						message = err;
					} else {
						status = 1;
						data = store;



						if (store.owner) {

							// eventually let the new home owner know his request was approved
							// ...
							Notification.sendPushNotification(
								store.owner.uid,
								'userIsStoreOwner',
								Config.dict.USER_IS_STORE_OWNER_TITLE,
								Config.dict.USER_IS_STORE_OWNER_MESSAGE
							);


						}
						makeResponse(res, status, message, data);
					}
				});
			}
		});
	}
};

exports.rejectHomeStoreRequest = function (req, res, next) {
	logger.info('EXPRESS: post("/rejectHomeStoreRequest") --> RECEIVED'.event);
	var status, message, data;

	var schema = {
		type: 'object',
		properties: {
			request_id: {
				type: 'string'
			},
			reason: {
				type: 'string'
			}
		}
	};

	var params = req.body;
	

	var validationresult = inspector.validate(schema, params);

	if (!validationresult.valid) {
		status = 0;
		message = validationresult.format();
		logger.log(validationresult.format());

		makeResponse(res, status, message, data);
	} else {
		logger.info('Validation passed');

		FBase.ref('requestHomeStores').orderByChild('id').equalTo(`${params.request_id}`).once('value', function (snapshot) {
			var request = snapshot.val();
			if (!request) {
				status = 0;
				message = 'no homestore request in database';
				logger.info(request);
				makeResponse(res, status, message, data);
			} else {
				logger.info(request);


				for (var key in request) {
					data = request[key];
				}

				logger.info(data);
				data.status = 'rejected';
				data.reason = params.reason;

				FBase.ref('requestHomeStores/' + params.request_id).set(data);

				FBase.ref('users/' + data.uid).once('value', function (snapshot) {
					var user = snapshot.val();

					if (user) {
						var sockets = socketController.getOnlineSockets();
						
						for (var i = 0; i < sockets.length; i++) {
							var socket = sockets[i];
							if (socket.id === user.socketID) {
								socket.emit('messageFromAdmin', {
									message: data.reason
								});
							}
						}
					}
				});


				socketController.makeNotification(data.owner.uid, Config.dict.HOME_STORE_REGISTRATION_REQUEST_REJECTED + params.reason).then(
					function (s) {
						status = 1;
						makeResponse(res, status, message, data);
					},
					function (e) {
						status = 0;
						message = e;
						makeResponse(res, status, message, data);
					}
				);

			}
		});
	}
};

exports.rejectStoreRequest = function (req, res, next) {
	logger.info('EXPRESS: post("/rejectStoreRequest") --> RECEIVED'.event);
	var status, message, data;

	var schema = {
		type: 'object',
		properties: {
			request_id: {
				type: 'string'
			},
			reason: {
				type: 'string'
			}
		}
	};

	var params = req.body;
	

	var validationresult = inspector.validate(schema, params);

	if (!validationresult.valid) {
		status = 0;
		message = validationresult.format();
		logger.log(validationresult.format());

		makeResponse(res, status, message, data);
	} else {
		logger.info('Validation passed');

		FBase.ref('requestStores').orderByChild('id').equalTo(`${params.request_id}`).once('value', function (snapshot) {
			var request = snapshot.val();
			if (!request) {
				status = 0;
				message = 'no store request in database';
				logger.info(request);
				makeResponse(res, status, message, data);
			} else {
				logger.info(request);


				for (var key in request) {
					data = request[key];
				}

				logger.info(data);
				data.status = 'rejected';
				data.reason = params.reason;
				FBase.ref('requestStores/' + params.request_id).set(data);


				FBase.ref('users/' + data.uid).once('value', function (snapshot) {
					var user = snapshot.val();

					if (user) {
						var sockets = socketController.getOnlineSockets();
						
						for (var i = 0; i < sockets.length; i++) {
							var socket = sockets[i];
							if (socket.id === user.socketID) {
								socket.emit('messageFromAdmin', {
									message: data.reason
								});
							}
						}

					}
				});

				socketController.makeNotification(data.owner.uid, params.reason).then(
					function (s) {
						status = 1;
						makeResponse(res, status, message, data);
					},
					function (e) {
						status = 0;
						message = e;
						makeResponse(res, status, message, data);
					}
				);

			}
		});
	}
};


exports.getAllHomeStoreRequests = function (req, res, next) {
	logger.info('post("/getAllHomeStoreRequests") --> RECEIVED'.event);
	var status, message, data;
	var requests = [];

	FBase.ref('requestHomeStores').once('value', function (snapshot) {
		var response = snapshot.val();
		if (!response) {
			status = 0;
			message = 'No homestore requets in database';
			makeResponse(res, status, message, data);
		} else {
			logger.info(response);
			for (var key in response)
				requests.push(response[key]);
			status = 1;
			data = requests;
			makeResponse(res, status, message, data);
		}
	});
}

exports.getHomeStoreRequestsPending = function (req, res, next) {
	logger.info('post("/getHomeStoreRequestsPending") --> RECEIVED'.event);
	var status, message, data;
	var requests = [];

	FBase.ref('requestHomeStores').orderByChild('status').equalTo(`pending`).once('value', function (snapshot) {
		var response = snapshot.val();
		if (!response) {
			status = 0;
			message = 'No pending homestore requets in database';
			makeResponse(res, status, message, data);
		} else {
			logger.info(response);
			for (var key in response)
				requests.push(response[key]);
			status = 1;
			data = requests;
			makeResponse(res, status, message, data);
		}
	});
}

exports.getHomeStoreRequestsAccepted = function (req, res, next) {
	logger.info('post("/getHomeStoreRequestsAccepted") --> RECEIVED'.event);
	var status, message, data;
	var requests = [];

	FBase.ref('requestHomeStores').orderByChild('status').equalTo(`accepted`).once('value', function (snapshot) {
		var response = snapshot.val();
		if (!response) {
			status = 0;
			message = 'No accepted homestore requets in database';
			makeResponse(res, status, message, data);
		} else {
			logger.info(response);
			for (var key in response)
				requests.push(response[key]);
			status = 1;
			data = requests;
			makeResponse(res, status, message, data);
		}
	});
}


exports.getHomeStoreRequestsRejected = function (req, res, next) {
	logger.info('post("/getHomeStoreRequestsRejected") --> RECEIVED'.event);
	var status, message, data;
	var requests = [];

	FBase.ref('requestHomeStores').orderByChild('status').equalTo(`rejected`).once('value', function (snapshot) {
		var response = snapshot.val();
		if (!response) {
			status = 0;
			message = 'No rejected homestore requets in database';
			makeResponse(res, status, message, data);
		} else {
			logger.info(response);
			for (var key in response)
				requests.push(response[key]);
			status = 1;
			data = requests;
			makeResponse(res, status, message, data);
		}
	});
}

exports.getAllStoreRequests = function (req, res, next) {
	logger.info('post("/getAllStoreRequests") --> RECEIVED'.event);
	var status, message, data;
	var requests = [];

	FBase.ref('requestStores').once('value', function (snapshot) {
		var response = snapshot.val();
		if (!response) {
			status = 0;
			message = 'No store requets in database';
			makeResponse(res, status, message, data);
		} else {
			for (var key in response)
				requests.push(response[key]);
			status = 1;
			data = requests;
			makeResponse(res, status, message, data);
		}
	});
}

exports.getStoreRequestsPending = function (req, res, next) {
	logger.info('post("/getStoreRequestsPending") --> RECEIVED'.event);
	var status, message, data;
	var requests = [];

	FBase.ref('requestStores').orderByChild('status').equalTo(`pending`).once('value', function (snapshot) {
		var response = snapshot.val();
		if (!response) {
			status = 0;
			message = 'No pending store requets in database';
			makeResponse(res, status, message, data);
		} else {
			for (var key in response)
				requests.push(response[key]);
			status = 1;
			data = requests;
			makeResponse(res, status, message, data);
		}
	});
}

exports.getStoreRequestsAccepted = function (req, res, next) {
	logger.info('post("/getStoreRequestsAccepted") --> RECEIVED'.event);
	var status, message, data;
	var requests = [];

	FBase.ref('requestStores').orderByChild('status').equalTo(`accepted`).once('value', function (snapshot) {
		var response = snapshot.val();
		if (!response) {
			status = 0;
			message = 'No accepted store requets in database';
			makeResponse(res, status, message, data);
		} else {
			logger.info(response);
			for (var key in response)
				requests.push(response[key]);
			status = 1;
			data = requests;
			makeResponse(res, status, message, data);
		}
	});
}


exports.getStoreRequestsRejected = function (req, res, next) {
	logger.info('post("/getStoreRequestsRejected") --> RECEIVED'.event);
	var status, message, data;
	var requests = [];

	FBase.ref('requestStores').orderByChild('status').equalTo(`rejected`).once('value', function (snapshot) {
		var response = snapshot.val();
		if (!response) {
			status = 0;
			message = 'No rejected store requets in database';
			makeResponse(res, status, message, data);
		} else {
			logger.info(response);
			for (var key in response)
				requests.push(response[key]);
			status = 1;
			data = requests;
			makeResponse(res, status, message, data);
		}
	});
}

exports.addHomeStoreRequest = function (req, res, next) {
	logger.info('EXPRESS: post("/addHomeStoreRequest") --> RECEIVED'.event);

	var status, message, data;

	var schema = {
		type: 'object',
		properties: {
			name: {
				type: 'string'
			},
			city: {
				type: 'string'
			},
			address: {
				type: 'string'
			}
		}
	};

	var params = req.body;
	

	var validationresult = inspector.validate(schema, params);

	if (!validationresult.valid) {
		status = 0;
		message = validationresult.format();
		logger.log(validationresult.format());

		makeResponse(res, status, message, data);
	} else {
		logger.info('Validation passed');

		var store = params;

		if (store.owner) {
			var owner = store.owner;

			store.owner = {
				uid: owner.uid,
				location: owner.location,
				phone: owner.phone,
				email: owner.email
			};
		}

		store.status = 'pending';

		var d = new Date();
		store.timestamp = d.getTime();
		store.date = d.getFullYear() + '/' + (d.getMonth() + 1) + '/' + d.getDate();

		var hsRef = FBase.ref('requestHomeStores').push();
		store.id = hsRef.key;
		store.request_type = 'homeStore';
		var products = store.products;
		var arrProduct = [];
		for (var key in products) {
			if (products[key] !== '') {
				arrProduct.push(products[key]);
			}
		}
		store.products = arrProduct;

		hsRef.set(store, function (err) {
			if (err) {
				status = 0;
				message = err;
				makeResponse(res, status, message, data);

				var mailOptions = {
					from: 'noreply@test.com',
					to: 'managementdp@outlook.sa',
					subject: 'A New HomeStore Request',
					text: 'A New HomeStore Request'
				};


				transporter.sendMail(mailOptions, function (error, info) {
					if (error) {
						console.log(error);
					} else {
						console.log('Email sent: ' + info.response);
					}
				});

				mailOptions = {
					from: 'noreply@test.com',
					to: 'StoresDP@outlook.sa',
					subject: 'A New HomeStore Request',
					text: 'A New HomeStore Request'
				};


				transporter.sendMail(mailOptions, function (error, info) {
					if (error) {
						console.log(error);
					} else {
						console.log('Email sent: ' + info.response);
					}
				});

			} else {
				status = 1;
				data = store;
				makeResponse(res, status, message, data);
			}
		});
	}
};

exports.addStoreRequest = function (req, res, next) {
	logger.info('EXPRESS: post("/addStoreRequest") --> RECEIVED'.event);

	var status, message, data;

	var schema = {
		type: 'object',
		properties: {
			name: {
				type: 'string'
			},
			city: {
				type: 'string'
			},
			address: {
				type: 'string'
			}
		}
	};

	var params = req.body;
	

	var validationresult = inspector.validate(schema, params);

	if (!validationresult.valid) {
		status = 0;
		message = validationresult.format();
		logger.log(validationresult.format());

		makeResponse(res, status, message, data);
	} else {
		logger.info('Validation passed');

		var store = params;

		var owner = store.owner;

		store.owner = {
			uid: owner.uid,
			location: owner.location,
			phone: owner.phone,
			email: owner.email
		};

		store.status = 'pending';

		var d = new Date();
		store.timestamp = d.getTime();
		var hsRef = FBase.ref('requestStores').push();
		store.id = hsRef.key;
		store.request_type = 'store';
		var products = store.products;
		var arrProduct = [];
		for (var key in products) {
			if (products[key] !== '') {
				arrProduct.push(products[key]);
			}
		}
		store.products = arrProduct;

		hsRef.set(store, function (err) {
			if (err) {
				status = 0;
				message = err;
				makeResponse(res, status, message, data);

				var mailOptions = {
					from: 'noreply@test.com',
					to: 'managementdp@outlook.sa',
					subject: 'A New HomeStore Request',
					text: 'A New HomeStore Request'
				};


				transporter.sendMail(mailOptions, function (error, info) {
					if (error) {
						console.log(error);
					} else {
						console.log('Email sent: ' + info.response);
					}
				});

				mailOptions = {
					from: 'noreply@test.com',
					to: 'StoresDP@outlook.sa',
					subject: 'A New HomeStore Request',
					text: 'A New HomeStore Request'
				};


				transporter.sendMail(mailOptions, function (error, info) {
					if (error) {
						console.log(error);
					} else {
						console.log('Email sent: ' + info.response);
					}
				});

			} else {
				status = 1;
				data = store;
				makeResponse(res, status, message, data);
			}
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



