(function () {
	'use strict';

	/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ DEPENDENCIES - START ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

	var Config = {
		httpPort: 11000,
		cyclesToRepeatForSelectingAvailableAgent: 1000,
		WebAPIKey: 'AAAAQqGjQBY:APA91bHhzQ4A_fl7Whd-ddjUkq42E59suuQD8rdDnzRSUPf5-hazECel2_Bsx5tPEToNU2VRqpnzO3Ortc9fTR9rgU8ySJ_cDmMQjwgrMJvlUd8z9BqGjuFHNCNVrBvhIQ_oo9uEVVPz'
	};

	Config.dict = {
		DELIVERY_REQUEST_NO_AGENT_AVAILABLE_TITLE: 'حول طلبك',
		DELIVERY_REQUEST_NO_AGENT_AVAILABLE_MESSAGE: 'نأسف، لا يوجد مندوب توصيل متاح حالياً. يرجى إرسال طلب جديد في غضون بضع دقائق. وشكرا!',
		USER_IS_STORE_OWNER_TITLE: 'ترقية الحساب',
		USER_IS_STORE_OWNER_MESSAGE: 'مبروك! تمت الموافقة على طلبك. أنت الآن مالك المتجر الرئيسي، يرجى إعادة تشغيل التطبيق للاستفادة من لوحة التحكم الجديدة.',
		NEW_HOME_STORE_DELIVERY_REQUEST_TITLE: 'طلب توصيل جديد',
		NEW_HOME_STORE_DELIVERY_REQUEST_MESSAGE: 'هناك طلب توصيل جديد لمتجرك. الرجاء رؤية التفاصيل!',
		HOME_STORES: 'المتاجر',
		STORES: 'المحلات',
		CUSTOMER_ORDER_TITLE: 'طلبك',
		CUSTOMER_ORDER_MESSAGE: 'تم قبول طلبك للتوصيل. يمكنك الآن رؤية تفاصيل المندوب الخاص بك',
		NEW_DELIVERY_REQUEST_FOR_AGENT_TITLE: 'طلب توصيل جديد',
		NEW_DELIVERY_REQUEST_FOR_AGENT_MESSAGE: 'لديك طلب توصيل جديد من متجر. اطلع على التفاصيل!',
		NEW_DELIVERY_REQUEST_REGISTERED: 'تم تسجيل طلب توصيل جديد',
		NEW_DELIVERY_REQUEST_ACCEPTED: 'تم استلام طلب التوصيل الخاص بك من قبل مندوب توصيل',
		NEW_DELIVERY_REQUEST_NO_AGENT: 'لا يمكن توصيل طلبك في الوقت الحالي. لا يوجد مندوب متاح حالياً.',
		USER_IS_INVITED_AS_AGENT: 'تمت دعوتك لفريق دليفري بلان. هل أنت جاهز؟',
		// USER_IS_INVITED_AS_AGENT: 'مبروك انضمامك لفريق دليفري بلان، نتمنالك التوفيق',
		NO_LONGER_AGENT: 'أنت لم تعد مندوب',
		AUTHENTICATION_FAILED: 'فشل التحقق. الرجاء التأكد من رقم الجوال وكلمة المرور',
		PENDING: 'تحت الإجراء',
		COMPLETED: 'تم التوصيل',
		PHONE_ALREADY_REGISTERED: 'رقم الجوال مستخدم. الرجاء استخدام شاشة تسجيل الدخول لإثبات ذلك',
		EMAIL_ALREADY_REGISTERED: 'البريد الإلكتروني مستخدم بالفعل. الرجاء استخدام شاشة تسجيل الدخول إذا كان لديك حساب بالفعل أو استخدام عنوان بريد إلكتروني آخر للتسجيل',
		USER_PROFILE_USERNAME_IS_MANDATORY: 'اسم المستخدم إلزامي',
		HOME_STORE_REGISTRATION_REQUEST_REJECTED: ':تم رفض طلبك بسبب'
	};

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



	//firebase
	// var firebase = require("firebase");
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

	// var config = {
	// 	apiKey: "AIzaSyAWvJrYSpDUW60HtvUzt3tFYW-zQ_H162Q",
	// 	authDomain: "deliveryplan-7e375.firebaseapp.com",
	// 	databaseURL: "https://deliveryplan-7e375.firebaseio.com",
	// 	projectId: "deliveryplan-7e375",
	// 	storageBucket: "",
	// 	messagingSenderId: "224947743993"
	// };

	// firebase.initializeApp(config);
	// console.log('Firebase --> INITED');


	// var FBase = firebase.database();


//firebase
var firebase = require("firebase");
firebase.initializeApp({
	databaseURL: "https://delivery-plan.firebaseio.com/",
	serviceAccount: __dirname + "/credentials/delivery-plan.json"
});
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

	/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ DEPENDENCIES - END ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

	var router = require('./router');
	router(app);

	/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ RUN THE SERVER ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

	var server = http.createServer(app);
	var socketController = require('./controllers/socket');

	var io = require('socket.io')(server);

	socketController.initializeSocket(io);
	socketController.makeLog();

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

	app.post('/postDeliveryRequest', function (req, res) {
		logger.info('EXPRESS: post("/postDeliveryRequest") --> RECEIVED'.event);

		var status, message, data;

		var schema = {
			type: 'object',
			properties: {
				uid: {
					type: 'string'
				},
				district: {
					type: 'string'
				},
				city: {
					type: 'string'
				},
				mob: {
					type: 'string'
				},
				place: {
					type: 'object'
				},
				location: {
					type: 'string'
				},
				request: {
					type: 'string'
				}
			}
		};

		var params = req.body;
		logger.log('params: %O', params);

		var validationresult = inspector.validate(schema, params);

		if (!validationresult.valid) {
			status = 0;
			message = 'not enough params';
			logger.log(validationresult.format());

			makeResponse(res, status, message, data);
		} else {
			logger.info('Validation passed');

			var request = params;
			request.customerUID = JSON.parse(JSON.stringify(params.uid));
			delete request.uid;

			var d = new Date();
			request.timestamp = d.getTime();
			request.date = d.getHours() + ':' + d.getMinutes() + ' - ' + d.getFullYear() + '/' + (d.getMonth() + 1) + '/' + d.getDate();
			request.status = Config.dict.PENDING;

			var dRef = FBase.ref('pendingRequests').push();
			request.id = dRef.key;

			FBase.ref('totalRequests').once('value', function (snptr) {
				var totalRequests = snptr.val() || 0;

				request.reqNumber = parseInt(totalRequests) + 1;

				FBase.ref('totalRequests').set(request.reqNumber);

				dRef.set(request, function (err) {
					if (err) {
						status = 0;
						message = err;
					} else {
						if (request.place.type === 'homeStore') {
							console.log('ok, ok... this is a home store');
							// just send a notification to the home store owner about it
							notifyHomeStoreOwnerOfNewDeliveryRequest(request.place.owner.uid).then(
								function (success) {
									socket.makeNotification(request.customerUID, Config.dict.NEW_DELIVERY_REQUEST_REGISTERED).then(
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
								},
								function (error) {
									status = 0;
									message = error;
									makeResponse(res, status, message, data);
								}
							);
						} else {
							enlistDeliveryRequest(request).then(
								function (r) {
									status = 1;
									makeResponse(res, status, message, data);
								},
								function (er) {
									status = 0;
									message = er;

									var uid = request.customerUID;
									makeNotification(uid, Config.dict.NEW_DELIVERY_REQUEST_NO_AGENT);

									makeResponse(res, status, message, data);
								}
							);
						}
					}
				});
			});
		}
	});




	app.post('/getUserRequests', function (req, res) {
		logger.info('EXPRESS: post("/getUserRequests") --> RECEIVED'.event);

		var status, message, data;

		var schema = {
			type: 'object',
			properties: {
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

			var requests = [];

			FBase.ref('pendingRequests').once('value', function (snpp) {
				var pRequests = snpp.val();

				for (var p in pRequests) {
					if (pRequests[p].customerUID == params.uid) {
						requests.push(pRequests[p]);
					}
				}

				FBase.ref('inProgressRequests').once('value', function (snpip) {
					var ipRequests = snpip.val();

					for (var ip in ipRequests) {
						if (ipRequests[ip].customerUID == params.uid) {
							requests.push(ipRequests[ip]);
						}
					}

					FBase.ref('deliveredRequests').once('value', function (snpd) {
						var dRequests = snpd.val();

						for (var d in dRequests) {
							if (dRequests[d].customerUID == params.uid) {
								requests.push(dRequests[d]);
							}
						}

						status = 1;
						data = requests;
						makeResponse(res, status, message, data);
					});
				});
			});
		}
	});

	app.post('/acceptHomeStore', function (req, res) {
		logger.info('EXPRESS: post("/acceptHomeStore") --> RECEIVED'.event);

		var status, message, data;

		var schema = {
			type: 'object',
			properties: {
				address: {
					type: 'string'
				},
				city: {
					type: 'string'
				},
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

			var store = params;
			store.status = 'accepted';

			var menus = store.menu;
			var arrMenu = [];
			for (var m in menus) {
				if (menus[m] !== '') {
					arrMenu.push(menus[m]);
				}
			}
			store.menu = arrMenu;

			if (store.owner) {
				// this means this is a customer request to enroll a new home store
				console.log('This is an approval of the admin for a customer request');

				if (store.type == 'store') {
					store.niceType = Config.dict.STORES;
				}

				if (!store.id) {
					var sRef = FBase.ref('stores').push();
					store.id = sRef.key;
					store.type = 'homeStore';
					store.niceType = Config.dict.HOME_STORES;
					store.timestamp = new Date().getTime();
				}

				FBase.ref('stores/' + store.id).set(store, function (err) {
					if (err) {
						status = 0;
						message = err;
					} else {
						FBase.ref('requestedHomeStores/' + store.id).remove();
						FBase.ref('users/' + store.owner.uid + '/type').set('owner');

						// eventually let the new home owner know his request was approved
						// ...
						sendPushNotification(
							store.owner.uid,
							'userIsStoreOwner',
							Config.dict.USER_IS_STORE_OWNER_TITLE,
							Config.dict.USER_IS_STORE_OWNER_MESSAGE
						);

						makeNotification(store.owner.uid, Config.dict.USER_IS_STORE_OWNER_MESSAGE);

						status = 1;
						data = store;
						makeResponse(res, status, message, data);
					}
				});
			} else {
				// this means the admin is adding a new home store, not a customer request
				console.log('This is a new home store added directly by the admin');

				var sRef = FBase.ref('stores').push();
				store.id = sRef.key;

				store.status = 'accepted';
				store.type = 'homeStore';

				var d = new Date();
				store.timestamp = d.getTime();
				store.date = d.getFullYear() + '/' + (d.getMonth() + 1) + '/' + d.getDate();

				sRef.set(store, function (err) {
					if (err) {
						status = 0;
						message = err;
					} else {
						// we should create a user for this home store owner... maybe!?
						// ...

						status = 1;
						data = store;
						makeResponse(res, status, message, data);
					}
				});
			}
		}
	});




	app.post('/rejectHomeStore', function (req, res) {
		logger.info('EXPRESS: post("/rejectHomeStore") --> RECEIVED'.event);

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

			FBase.ref('requestedHomeStores/' + params.request.id + '/status').set('rejected');
			FBase.ref('requestedHomeStores/' + params.request.id + '/rejectReason').set(params.reason);

			makeNotification(params.request.owner.uid, Config.dict.HOME_STORE_REGISTRATION_REQUEST_REJECTED + params.reason).then(
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




	app.post('/acceptStore', function (req, res) {
		logger.info('EXPRESS: post("/acceptStore") --> RECEIVED'.event);

		var status, message, data;

		var schema = {
			type: 'object',
			properties: {
				address: {
					type: 'string'
				},
				city: {
					type: 'string'
				},
				name: {
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

			var store = params;
			store.status = 'accepted';

			var menus = store.menu;
			var arrMenu = [];
			for (var m in menus) {
				if (menus[m] !== '') {
					arrMenu.push(menus[m]);
				}
			}
			store.menu = arrMenu;

			var sRef = FBase.ref('stores').push();
			store.id = sRef.key;

			store.status = 'accepted';
			store.type = 'store';
			store.niceType = Config.dict.STORES;

			var d = new Date();
			store.timestamp = d.getTime();
			store.date = d.getFullYear() + '/' + (d.getMonth() + 1) + '/' + d.getDate();

			sRef.set(store, function (err) {
				if (err) {
					status = 0;
					message = err;
				} else {
					status = 1;
					data = store;
					makeResponse(res, status, message, data);
				}
			});
		}
	});

	app.post('/getPendingOrders', function (req, res) {
		logger.info('EXPRESS: post("/getPendingOrders") --> RECEIVED'.event);

		var status, message, data;

		var schema = {
			type: 'object',
			properties: {
				user: {
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

			var pOrders = [];

			FBase.ref('pendingRequests').once('value', function (snapshot) {
				var requests = snapshot.val();

				if (params.user.type == 'admin') {
					for (var r in requests) {
						if (requests[r].status == 'pending') {
							pOrders.push(requests[r]);
						}
					}
				} else if (params.user.type == 'agent') {
					for (var r in requests) {
						if (requests[r].agent_id && requests[r].agent_id == params.user.uid) {
							pOrders.push(requests[r]);
						}
					}
				} else if (params.user.type == 'owner') {
					for (var r in requests) {
						if (requests[r].place.owner && requests[r].place.owner.uid == params.user.uid) {
							pOrders.push(requests[r]);
						}
					}
				}

				FBase.ref('inProgressRequests').once('value', function (snapshot) {
					var iPRequests = snapshot.val();

					if (params.user.type == 'admin') {
						for (var r in iPRequests) {
							if (iPRequests[r].status == 'inProgress') {
								pOrders.push(iPRequests[r]);
							}
						}
					} else if (params.user.type == 'agent') {
						for (var r in iPRequests) {
							if (iPRequests[r].agent_id == params.user.uid) {
								pOrders.push(iPRequests[r]);
							}
						}
					} else if (params.user.type == 'owner') {
						for (var r in iPRequests) {
							if (iPRequests[r].place.owner.uid == params.user.uid) {
								// pOrders.push(iPRequests[r]);
							}
						}
					}

					status = 1;
					data = pOrders;
					makeResponse(res, status, message, data);
				});
			});
		}
	});




	app.post('/getArchivedOrders', function (req, res) {
		logger.info('EXPRESS: post("/getArchivedOrders") --> RECEIVED'.event);

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

			var aOrders = [];

			FBase.ref('completedRequests').once('value', function (snapshot) {
				var requests = snapshot.val();

				if (params.user.type == 'admin') {
					for (var r in requests) {
						if (requests[r].status == Config.dict.COMPLETED) {
							aOrders.push(requests[r]);
						}
					}
				} else if (params.user.type == 'agent') {
					for (var r in requests) {
						if (requests[r].agent_id && requests[r].agent_id == params.user.uid) {
							aOrders.push(requests[r]);
						}
					}
				}

				status = 1;
				data = aOrders;
				makeResponse(res, status, message, data);
			});
		}
	});

	app.post('/rejectDeliveryRequest', function (req, res) {
		logger.info('EXPRESS: post("/rejectDeliveryRequest") --> RECEIVED'.event);

		var status, message, data;

		var schema = {
			type: 'object',
			properties: {
				uid: {
					type: 'string'
				},
				deliveryRequest: {
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

			FBase.ref('pendingRequests/' + params.deliveryRequest.id + '/agentsRejectingDelivery').push(params.uid, function (err) {
				if (err) {
					status = 0;
					message = err;
					makeResponse(res, status, message, data);
				} else {
					FBase.ref('pendingRequests/' + params.deliveryRequest.id + '/agentsRejectingDelivery').once('value', function (snpa) {
						var agents = snpa.val();
						var aa = [];
						for (var a in agents) {
							aa.push(agents[a]);
						}

						enlistDeliveryRequest(params.deliveryRequest, aa).then(
							function (r) {
								status = 1;
								message = 'Rejection posted, invitation skipped to another agent';
								makeResponse(res, status, message, data);
							},
							function (e) {
								// do something about the fact there are no available agents
								notifyCustomerThereIsNoAvailableAgent(params.deliveryRequest);
								FBase.ref('pendingRequests/' + params.deliveryRequest.id).remove(function (erro) {
									if (erro) {
										status = 0;
										message = erro;
										makeResponse(res, status, message, data);
									} else {
										var uid = params.deliveryRequest.customerUID;
										makeNotification(uid, Config.dict.NEW_DELIVERY_REQUEST_NO_AGENT).then(
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
						);
					});
				}
			});
		}
	});




	app.post('/acceptDeliveryRequest', function (req, res) {
		logger.info('EXPRESS: post("/acceptDeliveryRequest") --> RECEIVED'.event);

		var status, message, data;

		var schema = {
			type: 'object',
			properties: {
				uid: {
					type: 'string'
				},
				deliveryRequest: {
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

			FBase.ref('pendingRequests/' + params.deliveryRequest.id).remove(function (err) {
				if (err) {
					status = 0;
					message = err;
					makeResponse(res, status, message, data);
				} else {
					params.deliveryRequest.agent_id = params.uid;
					params.deliveryRequest.status = 'inProgress';
					FBase.ref('inProgressRequests/' + params.deliveryRequest.id).set(params.deliveryRequest, function (er) {
						if (er) {
							status = 0;
							message = er;
							makeResponse(res, status, message, data);
						} else {
							notifyCustomerOfRequestAcceptance(params.deliveryRequest).then(
								function (ssuccess) {
									// send customer "bill" notification
									var uid = params.deliveryRequest.customerUID;
									makeNotification(uid, Config.dict.NEW_DELIVERY_REQUEST_ACCEPTED).then(
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
								},
								function (eerror) {
									status = 0;
									message = eerror;
									makeResponse(res, status, message, data);
								}
							);
						}
					});
				}
			});
		}
	});


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




	/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ ROUTES - END ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */



	
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