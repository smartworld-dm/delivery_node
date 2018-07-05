(function() {
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


	//util
	var util = require('util');
	var fs = require('fs');


	//inspector
	var inspector = require('schema-inspector');


	// push
	var FCM = require('fcm-push');
	var fcm = new FCM(Config.WebAPIKey);


	// multipart ( for file upload )
	var multipart = require('connect-multiparty');
	var multipartMiddleware = multipart();
	var multiparty = require('multiparty');


	//trace
	var logger = require('tracer').colorConsole({
		format: [
			'{{timestamp}} (in line: {{line}}) >> {{message}}', //default format
			{
				error: '{{timestamp}} <{{title}}> {{message}} (in {{file}}:{{line}})\nCall Stack:\n{{stack}}' // error format
			}
		],
		dateformat: 'HH:MM:ss.L',
		preprocess: function(data) {
			data.title = data.title.toUpperCase();
		}
	});



	//firebase
	var firebase = require("firebase");
	firebase.initializeApp({
		databaseURL: "https://delivery-plan.firebaseio.com/",
		serviceAccount: __dirname + "/credentials/delivery-plan.json"
	});
	var FBase = firebase.database();


	// cloudinary
	var cloudinary = require('cloudinary');
	cloudinary.config({
		cloud_name: 'setreflex',
		api_key: '834788356866988',
		api_secret: 'ne5hfapoxazxDOV4jVsEsRJ_Fu0'
	});



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

	app.use(function(req, res, next) {
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




	/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ ROUTES - START ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

	app.post('/test', function(req, res) {
		logger.info('EXPRESS: post("/test") --> RECEIVED'.event);

		var status, message, data;

		var params = req.body;

		logger.log('params:');
		logger.log('%O', params);

		makeResponse(res, status, message, data);
	});




	app.get('/clearAllPushTokens', function(req, res) {
		logger.info('EXPRESS: get("/clearAllPushTokens") --> RECEIVED'.event);

		var status, message, data;

		FBase.ref('users').once('value', function(snapshot) {
			var users = snapshot.val();

			for (var u in users) {
				FBase.ref('users/' + u + '/pushTokens').remove();
			}
			logger.info('All pushTokens cleared!');

			status = 1;
			makeResponse(res, status, message, data);
		});
	});




	app.post('/registerUser', function(req, res) {
		logger.info('EXPRESS: post("/registerUser") --> RECEIVED'.event);

		var status, message, data;

		var schema = {
			type: 'object',
			properties: {
				phone: {
					type: 'string'
				},
				email: {
					type: 'email'
				},
				password: {
					type: 'string'
				},
				type: {
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

			FBase.ref('users').once('value', function(snapshot) {
				var users = snapshot.val();

				var phone, email;
				for (var u in users) {
					if (users[u].phone == params.phone) {
						phone = true;
						break;
					}
					if (users[u].email == params.email) {
						email = true;
						break;
					}
				}

				if (phone) {
					status = 0;
					message = Config.dict.PHONE_ALREADY_REGISTERED;
					makeResponse(res, status, message, data);
				} else if (email) {
					status = 0;
					message = Config.dict.EMAIL_ALREADY_REGISTERED;
					makeResponse(res, status, message, data);
				} else {
					var uRef = FBase.ref('users').push();
					var uid = uRef.key;

					var user = params;
					user.uid = uid;

					uRef.set(user, function(err) {
						if (err) {
							status = 0;
							message = err;
						} else {
							status = 1;
							data = user;
						}

						makeResponse(res, status, message, data);
					});
				}
			});
		}
	});




	app.post('/getUserData', function(req, res) {
		logger.info('EXPRESS: post("/getUserData") --> RECEIVED'.event);

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

			FBase.ref('users/' + params.uid).once('value', function(snapshot) {
				var user = snapshot.val();

				if (!user) {
					status = 0;
					message = 'No such user in database';
				} else {
					status = 1;
					data = user;
				}

				makeResponse(res, status, message, data);
			});
		}
	});




	app.post('/authenticateUser', function(req, res) {
		logger.info('EXPRESS: post("/authenticateUser") --> RECEIVED'.event);

		var status, message, data;

		var schema = {
			type: 'object',
			properties: {
				phone: {
					type: 'string'
				},
				password: {
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

			FBase.ref('users').once('value', function(snapshot) {
				var users = snapshot.val();

				if (!users) {
					status = 0;
					message = 'No users in database';
				} else {
					var user;

					for (var u in users) {
						if (users[u].phone == params.phone && users[u].password == params.password) {
							user = users[u];
							break;
						}
					}

					if (!user) {
						status = 0;
						message = Config.dict.AUTHENTICATION_FAILED;
					} else {
						status = 1;
						data = user;
					}
				}

				makeResponse(res, status, message, data);
			});
		}
	});




	app.post('/resetPassword', function(req, res) {
		logger.info('EXPRESS: post("/resetPassword") --> RECEIVED'.event);

		var status, message, data;

		var schema = {
			type: 'object',
			properties: {
				email: {
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

			FBase.ref('users').once('value', function(snapshot) {
				var users = snapshot.val();

				if (!users) {
					status = 0;
					message = 'No users in database';
					makeResponse(res, status, message, data);
				} else {
					var user;

					for (var u in users) {
						if (users[u].email == params.email) {
							user = users[u];
							break;
						}
					}

					if (!user) {
						status = 0;
						message = 'This email is not registered with us. Please check it and submit again.';
					} else {
						var email = user.email;

						// create new password

						// write new password to FBase

						// send new password by email

						// respond

					}
				}


			});
		}
	});




	app.post('/getCustomers', function(req, res) {
		logger.info('EXPRESS: post("/getCustomers") --> RECEIVED'.event);

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

			FBase.ref('users').once('value', function(snapshot) {
				var users = snapshot.val();

				if (!users) {
					status = 0;
					message = 'No users in database';
					makeResponse(res, status, message, data);
				} else {
					var customers = [];

					for (var u in users) {
						if (users[u].type === 'customer') {
							customers.push(users[u]);
						}
					}

					status = 1;
					data = customers;
					makeResponse(res, status, message, data);
				}
			});
		}
	});




	app.post('/uploadImage', function(req, res) {
		logger.info('EXPRESS: post("/uploadImage") --> RECEIVED'.event);

		var status, message, data;

		var form = new multiparty.Form();

		console.log(req);
		form.parse(req, function(err, fields, files) {
			logger.info('err: %O', err);
			logger.info('fields: %O', fields);
			logger.info('files: %O', files);

			var filePath = files.file[0].path;

			cloudinary.uploader.upload(
				filePath,
				function(result) {
					logger.info('cloudinary upload result: %O', result);

					var url = result.secure_url;

					status = 1;
					data = url;
					makeResponse(res, status, message, data);
				}
			);
		});
	});




	app.post('/saveUserProfile', function(req, res) {
		logger.info('EXPRESS: post("/saveUserProfile") --> RECEIVED'.event);

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

			if (params.avatar) {
				FBase.ref('users/' + params.uid + '/avatar').set(params.avatar);
			}

			if (params.email) {
				FBase.ref('users/' + params.uid + '/email').set(params.email);
			}

			if (params.location) {
				FBase.ref('users/' + params.uid + '/location').set(params.location);
			}

			if (params.username) {
				FBase.ref('users/' + params.uid + '/username').set(params.username);

			}

			status = 1;
			makeResponse(res, status, message, data);
		}
	});




	app.post('/changeUserPassword', function(req, res) {
		logger.info('EXPRESS: post("/changeUserPassword") --> RECEIVED'.event);

		var status, message, data;

		var schema = {
			type: 'object',
			properties: {
				uid: {
					type: 'string'
				},
				password: {
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

			FBase.ref('users/' + params.uid + '/password').set(params.password, function(error) {
				if (error) {
					status = 0;
					message = error;
					makeResponse(res, status, message, data);
				} else {
					status = 1;
					makeResponse(res, status, message, data);
				}
			});
		}
	});




	app.post('/getPlaces', function(req, res) {
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

			FBase.ref('stores').once('value', function(snapshot) {
				var stores = snapshot.val();

				for (var s in stores) {
					places.push(stores[s]);
				}

				FBase.ref('homeStores').once('value', function(snp) {
					var hstores = snp.val();

					for (var h in hstores) {
						places.push(hstores[h]);
					}

					status = 1;
					data = places;
					makeResponse(res, status, message, data);
				});
			});
		}
	});




	app.post('/getCities', function(req, res) {
		logger.info('EXPRESS: post("/getCities") --> RECEIVED'.event);

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

			var cities = [
				'جـــدة',
				'مـكــة'
			];

			status = 1;
			data = cities;
			makeResponse(res, status, message, data);
		}
	});




	app.post('/postDeliveryRequest', function(req, res) {
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

			FBase.ref('totalRequests').once('value', function(snptr) {
				var totalRequests = snptr.val() || 0;

				request.reqNumber = parseInt(totalRequests) + 1;

				FBase.ref('totalRequests').set(request.reqNumber);

				dRef.set(request, function(err) {
					if (err) {
						status = 0;
						message = err;
					} else {
						if (request.place.type === 'homeStore') {
							console.log('ok, ok... this is a home store');
							// just send a notification to the home store owner about it
							notifyHomeStoreOwnerOfNewDeliveryRequest(request.place.owner.uid).then(
								function(success) {
									makeNotification(request.customerUID, Config.dict.NEW_DELIVERY_REQUEST_REGISTERED).then(
										function(s) {
											status = 1;
											makeResponse(res, status, message, data);
										},
										function(e) {
											status = 0;
											message = e;
											makeResponse(res, status, message, data);
										}
									);
								},
								function(error) {
									status = 0;
									message = error;
									makeResponse(res, status, message, data);
								}
							);
						} else {
							enlistDeliveryRequest(request).then(
								function(r) {
									status = 1;
									makeResponse(res, status, message, data);
								},
								function(er) {
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




	app.post('/getUserRequests', function(req, res) {
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

			FBase.ref('pendingRequests').once('value', function(snpp) {
				var pRequests = snpp.val();

				for (var p in pRequests) {
					if (pRequests[p].customerUID == params.uid) {
						requests.push(pRequests[p]);
					}
				}

				FBase.ref('inProgressRequests').once('value', function(snpip) {
					var ipRequests = snpip.val();

					for (var ip in ipRequests) {
						if (ipRequests[ip].customerUID == params.uid) {
							requests.push(ipRequests[ip]);
						}
					}

					FBase.ref('deliveredRequests').once('value', function(snpd) {
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




	app.post('/addRequestForHomeStore', function(req, res) {
		logger.info('EXPRESS: post("/addRequestForHomeStore") --> RECEIVED'.event);

		var status, message, data;

		var schema = {
			type: 'object',
			properties: {
				logo: {
					type: 'string'
				},
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

			var owner = store.owner;

			store.owner = {
				uid: owner.uid,
				location: owner.location,
				phone: owner.phone,
				email: owner.email
			};

			store.status = 'pending';
			store.type = 'homeStore';
			store.niceType = Config.dict.HOME_STORES;

			var d = new Date();
			store.timestamp = d.getTime();
			store.date = d.getFullYear() + '/' + (d.getMonth() + 1) + '/' + d.getDate();

			var hsRef = FBase.ref('requestedHomeStores').push();
			store.id = hsRef.key;

			var menus = store.menu;
			var arrMenu = [];
			for (var m in menus) {
				if (menus[m] !== '') {
					arrMenu.push(menus[m]);
				}
			}
			store.menu = arrMenu;

			hsRef.set(store, function(err) {
				if (err) {
					status = 0;
					message = err;
					makeResponse(res, status, message, data);
				} else {
					status = 1;
					data = store;
					makeResponse(res, status, message, data);
				}
			});
		}
	});




	app.post('/getHomeStores', function(req, res) {
		logger.info('EXPRESS: post("/getHomeStores") --> RECEIVED'.event);

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
			var homeStores = [];

			FBase.ref('stores').once('value', function(snapshot) {
				var stores = snapshot.val();

				for (var s in stores) {
					if (stores[s].type == 'homeStore') {
						homeStores.push(stores[s]);
					}
				}

				status = 1;
				data = homeStores;
				makeResponse(res, status, message, data);
			});
		}
	});




	app.post('/getPendingHomeStoresRequests', function(req, res) {
		logger.info('EXPRESS: post("/getPendingHomeStoresRequests") --> RECEIVED'.event);

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
			var homeStores = [];

			FBase.ref('requestedHomeStores').once('value', function(snapshot) {
				var stores = snapshot.val();
				var rStores = [];

				for (var s in stores) {
					if (stores[s].status == 'pending') {
						rStores.push(stores[s]);
					}
				}
				status = 1;
				data = rStores;
				makeResponse(res, status, message, data);
			});
		}
	});




	app.post('/acceptHomeStore', function(req, res) {
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

				FBase.ref('stores/' + store.id).set(store, function(err) {
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

				sRef.set(store, function(err) {
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




	app.post('/rejectHomeStore', function(req, res) {
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
				function(s) {
					status = 1;
					makeResponse(res, status, message, data);
				},
				function(e) {
					status = 0;
					message = e;
					makeResponse(res, status, message, data);
				}
			);
		}
	});




	app.post('/acceptStore', function(req, res) {
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

			sRef.set(store, function(err) {
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




	app.post('/getStores', function(req, res) {
		logger.info('EXPRESS: post("/getStores") --> RECEIVED'.event);

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

			var sarr = [];

			FBase.ref('stores').once('value', function(snapshot) {
				var stores = snapshot.val();

				for (var s in stores) {
					if (stores[s].type == 'store') {
						sarr.push(stores[s]);
					}
				}

				status = 1;
				data = sarr;
				makeResponse(res, status, message, data);
			});
		}
	});




	app.post('/getPendingOrders', function(req, res) {
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

			FBase.ref('pendingRequests').once('value', function(snapshot) {
				var requests = snapshot.val();

				if (params.user.type == 'admin') {
					for (var r in requests) {
						if (requests[r].status == 'pending') {
							pOrders.push(requests[r]);
						}
					}
				} else if (params.user.type == 'agent') {
					for (var r in requests) {
						if (requests[r].agentID && requests[r].agentID == params.user.uid) {
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

				FBase.ref('inProgressRequests').once('value', function(snapshot) {
					var iPRequests = snapshot.val();

					if (params.user.type == 'admin') {
						for (var r in iPRequests) {
							if (iPRequests[r].status == 'inProgress') {
								pOrders.push(iPRequests[r]);
							}
						}
					} else if (params.user.type == 'agent') {
						for (var r in iPRequests) {
							if (iPRequests[r].agentID == params.user.uid) {
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




	app.post('/getArchivedOrders', function(req, res) {
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

			FBase.ref('completedRequests').once('value', function(snapshot) {
				var requests = snapshot.val();

				if (params.user.type == 'admin') {
					for (var r in requests) {
						if (requests[r].status == Config.dict.COMPLETED) {
							aOrders.push(requests[r]);
						}
					}
				} else if (params.user.type == 'agent') {
					for (var r in requests) {
						if (requests[r].agentID && requests[r].agentID == params.user.uid) {
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




	app.post('/getAgents', function(req, res) {
		logger.info('EXPRESS: post("/getAgents") --> RECEIVED'.event);

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

			var agents = [];

			FBase.ref('users').once('value', function(snapshot) {
				var users = snapshot.val();

				for (var u in users) {
					if (users[u].type == 'agent') {
						agents.push(users[u]);
					}
				}

				status = 1;
				data = agents;
				makeResponse(res, status, message, data);
			});
		}
	});




	app.post('/inviteAsAgent', function(req, res) {
		logger.info('EXPRESS: post("/inviteAsAgent") --> RECEIVED'.event);

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

			var agents = [];

			FBase.ref('users/' + params.uid + '/invitedAsAgent').set(true, function(err) {
				if (err) {
					status = 0;
					message = err;
					makeResponse(res, status, message, data);
				} else {
					makeNotification(params.uid, Config.dict.USER_IS_INVITED_AS_AGENT).then(
						function(s) {
							status = 1;
							makeResponse(res, status, message, data);
						},
						function(e) {
							status = 0;
							message = e;
							makeResponse(res, status, message, data);
						}
					);
				}
			});
		}
	});




	app.post('/rejectInvitationAsAgent', function(req, res) {
		logger.info('EXPRESS: post("/rejectInvitationAsAgent") --> RECEIVED'.event);

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

			var agents = [];

			FBase.ref('users/' + params.uid + '/invitedAsAgent').remove(function(err) {
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




	app.post('/acceptInvitationAsAgent', function(req, res) {
		logger.info('EXPRESS: post("/acceptInvitationAsAgent") --> RECEIVED'.event);

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

			var agents = [];

			FBase.ref('users/' + params.uid + '/invitedAsAgent').remove(function(err) {
				if (err) {
					status = 0;
					message = err;
				} else {
					FBase.ref('users/' + params.uid + '/type').set('agent', function(e) {
						if (e) {
							status = 0;
							message = e;
						} else {
							status = 1;
						}

						makeResponse(res, status, message, data);
					});
				}
			});
		}
	});




	app.post('/rejectDeliveryRequest', function(req, res) {
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

			FBase.ref('pendingRequests/' + params.deliveryRequest.id + '/agentsRejectingDelivery').push(params.uid, function(err) {
				if (err) {
					status = 0;
					message = err;
					makeResponse(res, status, message, data);
				} else {
					FBase.ref('pendingRequests/' + params.deliveryRequest.id + '/agentsRejectingDelivery').once('value', function(snpa) {
						var agents = snpa.val();
						var aa = [];
						for (var a in agents) {
							aa.push(agents[a]);
						}

						enlistDeliveryRequest(params.deliveryRequest, aa).then(
							function(r) {
								status = 1;
								message = 'Rejection posted, invitation skipped to another agent';
								makeResponse(res, status, message, data);
							},
							function(e) {
								// do something about the fact there are no available agents
								notifyCustomerThereIsNoAvailableAgent(params.deliveryRequest);
								FBase.ref('pendingRequests/' + params.deliveryRequest.id).remove(function(erro) {
									if (erro) {
										status = 0;
										message = erro;
										makeResponse(res, status, message, data);
									} else {
										var uid = params.deliveryRequest.customerUID;
										makeNotification(uid, Config.dict.NEW_DELIVERY_REQUEST_NO_AGENT).then(
											function(s) {
												status = 1;
												makeResponse(res, status, message, data);
											},
											function(e) {
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




	app.post('/acceptDeliveryRequest', function(req, res) {
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

			FBase.ref('pendingRequests/' + params.deliveryRequest.id).remove(function(err) {
				if (err) {
					status = 0;
					message = err;
					makeResponse(res, status, message, data);
				} else {
					params.deliveryRequest.agentID = params.uid;
					params.deliveryRequest.status = 'inProgress';
					FBase.ref('inProgressRequests/' + params.deliveryRequest.id).set(params.deliveryRequest, function(er) {
						if (er) {
							status = 0;
							message = er;
							makeResponse(res, status, message, data);
						} else {
							notifyCustomerOfRequestAcceptance(params.deliveryRequest).then(
								function(ssuccess) {
									// send customer "bill" notification
									var uid = params.deliveryRequest.customerUID;
									makeNotification(uid, Config.dict.NEW_DELIVERY_REQUEST_ACCEPTED).then(
										function(s) {
											status = 1;
											makeResponse(res, status, message, data);
										},
										function(e) {
											status = 0;
											message = e;
											makeResponse(res, status, message, data);
										}
									);
								},
								function(eerror) {
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




	app.post('/updateHomeStore', function(req, res) {
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

			FBase.ref('stores/' + params.id).set(params, function(err) {
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




	app.post('/getAboutData', function(req, res) {
		logger.info('EXPRESS: post("/getAboutData") --> RECEIVED'.event);

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

			FBase.ref('settings/about').once('value', function(snapshot) {
				data = snapshot.val();
				status = 1;
				makeResponse(res, status, message, data);
			});
		}
	});




	app.post('/saveAbout', function(req, res) {
		logger.info('EXPRESS: post("/saveAbout") --> RECEIVED'.event);

		var status, message, data;

		var schema = {
			type: 'object',
			properties: {
				about: {
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

			FBase.ref('settings/about').set(params.about, function(err) {
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




	app.post('/getTerms', function(req, res) {
		logger.info('EXPRESS: post("/getTerms") --> RECEIVED'.event);

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

			FBase.ref('settings/terms').once('value', function(snapshot) {
				data = snapshot.val();
				status = 1;
				makeResponse(res, status, message, data);
			});
		}
	});




	app.post('/saveTerms', function(req, res) {
		logger.info('EXPRESS: post("/saveTerms") --> RECEIVED'.event);

		var status, message, data;

		var schema = {
			type: 'object',
			properties: {
				terms: {
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

			FBase.ref('settings/terms').set(params.terms, function(err) {
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




	app.post('/saveSupport', function(req, res) {
		logger.info('EXPRESS: post("/saveSupport") --> RECEIVED'.event);

		var status, message, data;

		var schema = {
			type: 'object',
			properties: {
				support: {
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

			FBase.ref('settings/support').set(params.support, function(err) {
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




	app.post('/demoteAgents', function(req, res) {
		logger.info('EXPRESS: post("/demoteAgents") --> RECEIVED'.event);

		var status, message, data;

		var schema = {
			type: 'object',
			properties: {
				agents: {
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

			for (var p in params.agents) {
				FBase.ref('users/' + params.agents[p].uid + '/type').set('customer');
				makeNotification(params.agents[p].uid, Config.dict.NO_LONGER_AGENT);
			}

			status = 1;
			makeResponse(res, status, message, data);
		}
	});




	app.post('/getOnlineAgents', function(req, res) {
		logger.info('EXPRESS: post("/getOnlineAgents") --> RECEIVED'.event);

		var status, message, data;

		var schema = {
			type: 'object',
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

			FBase.ref('users').once('value', function(snapshot) {
				var users = snapshot.val();
				var onlineAgents = [];

				for (var u in users) {
					if (users[u].type === 'agent' && users[u].socketID) {
						onlineAgents.push(users[u]);
					}
				}

				status = 1;
				data = onlineAgents;
				makeResponse(res, status, message, data);
			});
		}
	});




	app.post('/getSupportData', function(req, res) {
		logger.info('EXPRESS: post("/getSupportData") --> RECEIVED'.event);

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

			FBase.ref('settings/support').once('value', function(snapshot) {
				data = snapshot.val();
				status = 1;
				makeResponse(res, status, message, data);
			});
		}
	});




	app.post('/getAboutMoney', function(req, res) {
		logger.info('EXPRESS: post("/getAboutMoney") --> RECEIVED'.event);

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

			FBase.ref('settings/aboutMoney').once('value', function(snapshot) {
				data = snapshot.val();
				status = 1;
				makeResponse(res, status, message, data);
			});
		}
	});




	app.post('/newHomeStoreDeliveryRequestForAgent', function(req, res) {
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
				function(success) {
					status = 1;
					makeResponse(res, status, message, data);
				},
				function(error) {
					status = 0;
					message = error;
					makeResponse(res, status, message, data);
				}
			);
		}
	});




	app.post('/getMyStore', function(req, res) {
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

			FBase.ref('stores').once('value', function(snapshot) {
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
	});




	app.post('/markOrderAsCompleted', function(req, res) {
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

			FBase.ref('completedRequests/' + order.id).set(order, function(err) {
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




	app.post('/getPendingRequestsByIDs', function(req, res) {
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

			FBase.ref('pendingRequests').once('value', function(snapshot) {
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




	// default route
	app.get('*', function(req, res) {
		logger.info('EXPRESS: get("*") --> RECEIVED'.event);

		res.set('Access-Control-Allow-Origin', '*');
		res.sendFile('./public/404.html', {
			root: __dirname
		});
	});

	app.use(pmx.expressErrorHandler());

	/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ ROUTES - END ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */



	/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ RUN THE SERVER ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

	var server = http.createServer(app);

	var io = require('socket.io')(server);

	server.listen(Config.httpPort, function() {

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
		console.log(' ');
		console.log(' ');
		console.log(' ');
		console.log('   8888888888                   d8b                                                 888      888                  ');
		console.log('   888                          Y8P                                                 888      888                  ');
		console.log('   888                                                                              888      888                  ');
		console.log('   8888888    88888b.   .d88b.  888 88888b.   .d88b.   .d88b.  888d888 .d88b.   .d88888      88888b.  888  888    ');
		console.log('   888        888 "88b d88P"88b 888 888 "88b d8P  Y8b d8P  Y8b 888P"  d8P  Y8b d88" 888      888 "88b 888  888    ');
		console.log('   888        888  888 888  888 888 888  888 88888888 88888888 888    88888888 888  888      888  888 888  888    ');
		console.log('   888        888  888 Y88b 888 888 888  888 Y8b.     Y8b.     888    Y8b.     Y88b 888      888 d88P Y88b 888    ');
		console.log('   8888888888 888  888  "Y88888 888 888  888  "Y8888   "Y8888  888     "Y8888   "Y88888      88888P"   "Y88888    ');
		console.log('                            888                                                                            888    ');
		console.log('                       Y8b d88P                                                                       Y8b d88P    ');
		console.log('                        "Y88P"                                                                         "Y88P"     ');
		console.log('                                      888    8888888b.           .d888 888                                            ');
		console.log('                                      888    888   Y88b         d88P"  888                                            ');
		console.log('                                      888    888    888         888    888                                            ');
		console.log('       d8b d8b      .d8888b   .d88b.  888888 888   d88P .d88b.  888888 888  .d88b.  888  888      d8b d8b             ');
		console.log('       Y8P Y8P      88K      d8P  Y8b 888    8888888P" d8P  Y8b 888    888 d8P  Y8b `Y8bd8P\'      Y8P Y8P             ');
		console.log('                    "Y8888b. 88888888 888    888 T88b  88888888 888    888 88888888   X88K                            ');
		console.log('       d8b d8b           X88 Y8b.     Y88b.  888  T88b Y8b.     888    888 Y8b.     .d8""8b.      d8b d8b             ');
		console.log('       Y8P Y8P       88888P\'  "Y8888   "Y888 888   T88b "Y8888  888    888  "Y8888  888  888      Y8P Y8P             ');
		console.log(' ');
		console.log(' ');
		console.log(' ');

	});


	/*---------------------------------------------------------------------------------------------------*/




	/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
	/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ SOCKET EVENTS - START ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

	io.on('connection', function(socket) {
		logger.info('User connected. Socket.id: %s'.info, socket.id);
		sockets.push(socket);


		socket.on('test', function(user) {
			logger.info('Socket (test) <-- RECEIVED '.event);
		});

		socket.on('pushIsRegistered', function(obj) {
			logger.info('Socket (pushIsRegistered) <-- RECEIVED '.event);
			logger.info('OBJ: %O', obj);

			FBase.ref('users').once('value', function(snpu) {
				var usrs = snpu.val();

				for (var u in usrs) {
					if (usrs[u].pushTokens) {
						for (var p in usrs[u].pushTokens) {
							if (usrs[u].pushTokens[p].token == obj.token) {
								FBase.ref('users/' + u + '/pushTokens/' + p).remove();
							}
						}
					}
				}

				FBase.ref('users/' + obj.uid + '/pushTokens').once('value', function(snapshot) {
					var tokens = snapshot.val();

					var flag = false;
					for (var t in tokens) {
						if (tokens[t].token == obj.token) {
							flag = true;
							break;
						}
					}

					if (!flag) {
						var newToken = obj;
						FBase.ref('users/' + obj.uid + '/pushTokens').push(newToken, function(err) {
							if (err) {
								socket.emit('error', err);
								logger.info('Socket (error) --> SENT '.event);
							}
						});
					}

					FBase.ref('users/' + obj.uid + '/socketID').set(socket.id, function(er) {
						if (er) {
							socket.emit('error', err);
							logger.info('Socket (error) --> SENT '.event);
						}
					});
				});
			});
		});

		socket.on('markNotificationsAsRead', function(obj) {
			logger.info('Socket (markNotificationsAsRead) <-- RECEIVED '.event);
			logger.info('OBJ: %O', obj);

			FBase.ref('users/' + obj.uid).once('value', function(snpu) {
				var user = snpu.val();

				for (var n in user.notifications) {
					user.notifications[n].status = 'read';
				}

				FBase.ref('users/' + obj.uid).set(user, function(err) {
					var respo = {};

					if (err) {
						respo.status = 0;
						respo.message = err;
					} else {
						respo.status = 1;
					}

					socket.emit('notifications', user.notifications);
				});
			});
		});


		socket.on('agentOnline', function(user) {
			logger.info('Socket (agentOnline) <-- RECEIVED '.event);
			logger.info('socket.id: %s'.event, socket.id);
			logger.info('user: %O', user);

			onlineAgents.push({
				uid: user.uid,
				socket: socket
			});
			// console.log('socket: %O', socket);

			// socket.emit('deliveryRequest', socket.id);
		});


		socket.on('logout', function(user) {
			logger.info('Socket (logout) <-- RECEIVED '.event);

			for (var i = 0; i < sockets.length; i++) {
				if (sockets[i].id == socket.id) {
					sockets.splice(i, 1);
					break;
				}
			}

			for (var o = 0; o < onlineAgents.length; o++) {
				if (socket.id == onlineAgents[o].socket.id) {
					onlineAgents.splice(o, 1);
					break;
				}
			}

			FBase.ref('users').once('value', function(snapshot) {
				var users = snapshot.val();

				for (var u in users) {
					if (users[u].socketID == socket.id) {
						FBase.ref('users/' + u + '/socketID').remove();
						break;
					}
				}
			});
		});




		/**********************************************************************************************/
		socket.on('disconnect', function() {
			logger.info('User %s DISCONNECTED'.error, socket.id);

			for (var i = 0; i < sockets.length; i++) {
				if (sockets[i].id == socket.id) {
					sockets.splice(i, 1);
					break;
				}
			}

			for (var o = 0; o < onlineAgents.length; o++) {
				if (socket.id == onlineAgents[o].socket.id) {
					onlineAgents.splice(o, 1);
					break;
				}
			}

			FBase.ref('users').once('value', function(snapshot) {
				var users = snapshot.val();

				for (var u in users) {
					if (users[u].socketID == socket.id) {
						FBase.ref('users/' + u + '/socketID').remove();
						break;
					}
				}
			});
		});
		/**********************************************************************************************/

	});

	/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ SOCKET EVENTS - END ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
	/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/




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

	function notifyCustomerThereIsNoAvailableAgent(dRequest) {
		sendPushNotification(
			dRequest.customerUID,
			'noAgentAvailable',
			Config.dict.DELIVERY_REQUEST_NO_AGENT_AVAILABLE_TITLE,
			Config.dict.DELIVERY_REQUEST_NO_AGENT_AVAILABLE_MESSAGE
		);
	}

	function notifyHomeStoreOwnerOfNewDeliveryRequest(uid) {
		logger.info('Need to push notification to user.uid: %s', uid);

		var defer = q.defer();

		sendPushNotification(
				uid,
				'newOrderForHomeStoreOwner',
				Config.dict.NEW_HOME_STORE_DELIVERY_REQUEST_TITLE,
				Config.dict.NEW_HOME_STORE_DELIVERY_REQUEST_MESSAGE
			)
			.then(
				function(success) {
					defer.resolve(true);
				},
				function(error) {
					defer.reject(error);
				}
			);

		return defer.promise;
	}

	function notifyCustomerOfRequestAcceptance(dRequest) {
		var defer = q.defer();

		var ownerUID = dRequest.customerUID;
		console.log('About to send a push notification to user with uid: %s, saying his request have been accepted!', ownerUID);

		sendPushNotification(
			ownerUID,
			'requestAcceptedForCustomer',
			Config.dict.CUSTOMER_ORDER_TITLE,
			Config.dict.CUSTOMER_ORDER_MESSAGE
		).then(
			function(success) {
				defer.resolve(true);
			},
			function(error) {
				defer.reject(error);
			}
		);

		return defer.promise;
	}

	function notifyAgentOfNewDeliveryRequest(agent, orders) {
		var defer = q.defer();

		sendPushNotification(
				agent.uid,
				'newDeliveryRequestForAgent',
				Config.dict.NEW_DELIVERY_REQUEST_FOR_AGENT_TITLE,
				Config.dict.NEW_DELIVERY_REQUEST_FOR_AGENT_MESSAGE,
				orders
			)
			.then(
				function(success) {
					defer.resolve(true);
				},
				function(error) {
					defer.reject(error);
				}
			);

		return defer.promise;
	}

	function sendPushNotification(uid, scope, title, msg, orders) {
		var defer = q.defer();

		FBase.ref('users/' + uid).once('value', function(snapshot) {
			var user = snapshot.val();
			var tokensToBeNotified = [];
			var message;
			var orderIDs = [];

			if (orders) {
				for (var o in orders) {
					orderIDs.push(orders[o].id);
				}
			}

			message = {
				priority: 'high',
				collapse_key: 'test_colapse_key',
				data: {
					scope: scope,
					message: msg,
					title: title
				},
				notification: {
					title: title,
					body: msg,
					sound: 'default',
					click_action: 'FCM_PLUGIN_ACTIVITY',
					iconkey: 'fcm_push_icon',
				}
			};

			if (orderIDs.length > 0) {
				message.data.orders = orderIDs;
			}

			if(user!=undefined)
			for (var t in user.pushTokens) {
				message.to = user.pushTokens[t].token,

					//callback style
					fcm.send(message, function(err, response) {
						if (err) {
							console.log("Something has gone wrong with the push: %O", err);
						} else {
							console.log("Successfully sent push, with response: %O", response);
						}
					});
			}

			defer.resolve(true);
		});

		return defer.promise;
	}

	function makeNotification(uid, message) {
		var defer = q.defer();

		var notification = {
			text: message,
			timestamp: new Date().getTime(),
			status: 'unread'
		};

		FBase.ref('users/' + uid + '/notifications').push(notification, function(e) {
			if (e) {
				defer.reject(e);
			} else {
				FBase.ref('users/' + uid).once('value', function(snpn) {
					var user = snpn.val();

					for (var s in sockets) {
						if (sockets[s].id == user.socketID) {
							sockets[s].emit('notifications', user.notifications);
							break;
						}
					}

					defer.resolve(true);
				});
			}
		});

		return defer.promise;
	}

	/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ PRIVATE METHODS - END ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

})();