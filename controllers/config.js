var Config = {
    httpPort: 11000,
    cyclesToRepeatForSelectingAvailableAgent: 1000,
    WebAPIKey: 'AAAAQqGjQBY:APA91bHhzQ4A_fl7Whd-ddjUkq42E59suuQD8rdDnzRSUPf5-hazECel2_Bsx5tPEToNU2VRqpnzO3Ortc9fTR9rgU8ySJ_cDmMQjwgrMJvlUd8z9BqGjuFHNCNVrBvhIQ_oo9uEVVPz',

    // emailConfig: {
    //     service: 'outlook.sa',
    //     auth: {
    //         user: 'managementdp@outlook.sa',
    //         pass: 'dp777444'
    //     }
    // }

     emailConfig: {
         host:  "smtp-mail.gmail.com", port: 587, secureConnection: false,	
	auth: {
             user: 'App.DeliveryPlan@gmail.com',
             pass: 'Rst1414Rst'
         }
     }


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


exports.Config = Config;