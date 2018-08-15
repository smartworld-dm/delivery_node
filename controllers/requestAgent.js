
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

var Socket = require('./socket');
var Config = require('./config').Config;

var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport(Config.emailConfig);
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

exports.acceptAgentRequest = function(req,res,next) {
	logger.info('EXPRESS: post("/acceptAgentRequest") --> RECEIVED'.event);
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

		FBase.ref('requestAgents').orderByChild('id').equalTo(`${params.request_id}`).once('value', function (snapshot) {
			var request = snapshot.val();
			if (!request) {
				status = 0;
				message = 'no request in database';
				logger.info(request);
				makeResponse(res, status, message, data);
			} else {
                logger.info(request);

                
                for(var key in request){
                    data = request[key];
                }

                logger.info(data);
				data.status = 'accepted';
				data.timestamp = new Date().getTime();
				data.reason = params.reason;
				data.percentage = 10;

				var sockets = Socket.getOnlineSockets();

				for(var i=0; i<sockets.length; i++) {
					var socket = sockets[i];
					if(socket.id === data.socketID) {
						socket.emit('messageFromAdmin', {
							message: data.reason
						});
					}
				}


				FBase.ref('users').orderByChild('uid').equalTo(`${data.uid}`).once('value', function (snapshot) {
					var response = snapshot.val();
					if (response) {
						for (var key in response) {
							var user = response[key];
							user.type = "agent";
							FBase.ref('users/' + data.uid ).set(user);
						}
					}
				});

                FBase.ref('requestAgents/' + params.request_id ).set(data,function(err) {

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
	}	
};

exports.rejectAgentRequest = function(req,res,next) {
	logger.info('EXPRESS: post("/rejectAgentRequest") --> RECEIVED'.event);
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

		FBase.ref('requestAgents').orderByChild('id').equalTo(`${params.request_id}`).once('value', function (snapshot) {
			var request = snapshot.val();
			if (!request) {
				status = 0;
				message = 'no request in database';
				logger.info(request);
				makeResponse(res, status, message, data);
			} else {

                for(var key in request){
                    data = request[key];
                }

				data.status = 'rejected';
				data.reason = params.reason;
				data.timestamp = new Date().getTime();

				var sockets = Socket.getOnlineSockets();

				for(var i=0; i<sockets.length; i++) {
					var socket = sockets[i];
					if(socket.id === data.socketID) {
						socket.emit('messageFromAdmin', {
							message: data.reason
						});
					}
				}

                FBase.ref('requestAgents/' + params.request_id ).set(data,function(err) {

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
	}	
};

exports.getAgentRequestsRejected = function(req,res,next) {
	logger.info('post("/getAgentRequests") --> RECEIVED'.event);
	var status, message, data;
    var requests = [];
    
    FBase.ref('requestAgents').orderByChild('status').equalTo(`rejected`).once('value', function (snapshot) {
		var response = snapshot.val();
		if (!response) {
			status = 0;
			message = 'No rejected agent requets in database';
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

exports.getAgentRequestsPending = function(req,res,next) {
	logger.info('post("/getAgentRequests") --> RECEIVED'.event);
	var status, message, data;
    var requests = [];
    
    FBase.ref('requestAgents').orderByChild('status').equalTo(`pending`).once('value', function (snapshot) {
		var response = snapshot.val();
		if (!response) {
			status = 0;
			message = 'No pending agent requets in database';
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

exports.getAgentRequestsAccepted = function(req,res,next) {
	logger.info('post("/getAgentRequests") --> RECEIVED'.event);
	var status, message, data;
    var requests = [];
    
    FBase.ref('requestAgents').orderByChild('status').equalTo(`accepted`).once('value', function (snapshot) {
		var response = snapshot.val();
		if (!response) {
			status = 0;
			message = 'No accepted agent requets in database';
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


exports.getAgentRequests = function(req,res,next) {
	logger.info('post("/getAgentRequests") --> RECEIVED'.event);
	var status, message, data;
    var requests = [];
    
	FBase.ref('requestAgents').once('value', function(snapshot) {
		var response = snapshot.val();
		if (!response) {
			status = 0;
			message = 'No agent requets in database';
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

exports.addAgentRequest = function (req, res, next) {
    logger.info('EXPRESS: post("/addAgentRequest") --> RECEIVED'.event);
	var status, message, data;

	var schema = {
		type: 'object',
		properties: {
			uid: {
				type: 'string'
            },
            identification: {
                type: 'string'
            },
            nationality: {
                type: 'string'
            },
            // img_identification: {
            //     type: 'string'
            // },
            // img_car_license: {
            //     type: 'string'
            // },
            // avatar: {
            //     type: 'string'
            // },
            // img_driving_license: {
            //     type: 'string'
            // },
            // img_front_car: {
            //     type: 'string'
            // },
            // img_back_car: {
            //     type: 'string'
            // }
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

		FBase.ref('requestAgents').orderByChild('uid').equalTo(`${params.uid}`).once('value', function (snapshot) {
			// var user = snapshot.val();
			// if (user) {
			// 	status = 0;
			// 	message = 'request exists in database';
			// 	logger.info(user);
			// 	makeResponse(res, status, message, data);
			// } else {
              
			// }

			var uRef = FBase.ref('requestAgents').push();
			var id = uRef.key;

			var request = params;
			request.id = id;
			request.status = 'pending';

			uRef.set(request, function (err) {
				if (err) {
					status = 0;
					message = err;
				} else {
					status = 1;
					data = request;
				}
				logger.info(message);

				var mailOptions = {
					from: 'noreply@test.com',
					to: 'managementdp@outlook.sa',
					subject: 'A New HomeStore Request',
					text: 'A New HomeStore Request'
				  };
				  

				transporter.sendMail(mailOptions, function(error, info){
					if (error) {
					  console.log(error);
					} else {
					  console.log('Email sent: ' + info.response);
					}
				  });
				
				mailOptions = {
					from: 'noreply@test.com',
					to: 'careerdp@outlook.sa',
					subject: 'A New HomeStore Request',
					text: 'A New HomeStore Request'
				  };
				  

				transporter.sendMail(mailOptions, function(error, info){
					if (error) {
					  console.log(error);
					} else {
					  console.log('Email sent: ' + info.response);
					}
				  });
				  
				makeResponse(res, status, message, data);
			});

		});
	}
}

function makeResponse(res, status, message, data) {
    res.set('Access-Control-Allow-Origin', '*');
    res.status(200).json({
        status: status,
        message: message,
        data: data
    });
}



