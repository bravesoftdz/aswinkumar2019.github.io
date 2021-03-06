new(function () {

	var ext = this;

	$.getScript('https://aswinkumar2019.github.io/aws_sdk.js', initExtension);

	var accessKeyId = '';
	var secretAccessKey = '';
        var bucketsource;
	var sourceimg;
	var inputimg;
	var polly;
	var rekognition;
	var voice = 'Joanna';
	var language = 'English';
	var sourceLanguage = 'English';
	var targetLanguage = 'Spanish';

	var languages = {
		'Chinese': {
			pollyVoice: 'Lucia',
			translateCode: 'zh',
		},
		'English': {
			pollyVoice: 'Joanna',
			translateCode: 'en',
		},
		'Spanish': {
			pollyVoice: 'Penelope',
			translateCode: 'es',
		},
		'Turkish': {
			pollyVoice: 'Filiz',
			translateCode: 'tr',
		},
		'French': {
			pollyVoice: 'Lea',
			translateCode: 'fr',
		},
		'German': {
			pollyVoice: 'Vicki',
			translateCode: 'de',
		},
		'Italian': {
			pollyVoice: 'Carla',
			translateCode: 'it',
		}
	};

	var translatedText = '';
	var detectedText = '';

	function initAWS(region) {
		AWS.config.region = region;
		AWS.config.accessKeyId = accessKeyId;
		AWS.config.secretAccessKey = secretAccessKey;
	}

	function initPolly(region) {
		polly = new AWS.Polly({
			region: region
		});
	}

	function initTranslate(region) {
		translate = new AWS.Translate({
			region: region
		});
	}

        function initRekognition(region) {
		rekognition = new AWS.Rekognition({
			region: region
		});
	}
	function playAudioFromUrl(url, finishHandler) {
		var audio = new Audio(url);
		audio.onended = function () {
			if (finishHandler)
				finishHandler();
		}
		audio.play();
	}

	function speak(txt, voiceId, callback) {
		var params = {
			OutputFormat: 'mp3',
			Text: txt,
			VoiceId: voiceId,
		};

		polly.synthesizeSpeech(params, function (err, data) {
			if (err)
				console.log(err, err.stack);
			else {
				var uInt8Array = new Uint8Array(data.AudioStream);
				var arrayBuffer = uInt8Array.buffer;
				var blob = new Blob([arrayBuffer]);
				var url = URL.createObjectURL(blob);

				playAudioFromUrl(url, callback);
			}
		});
	};


	function translateText(text, sourceLang, targetLang, translationHandler) {
		var params = {
			Text: text,
			SourceLanguageCode: languages[sourceLang].translateCode,
			TargetLanguageCode: languages[targetLang].translateCode,
		};
		translate.translateText(params, function (err, data) {
			if (err)
				console.log(err, err.stack);
			else
				translationHandler(data.TranslatedText);
		});
	}

	function initExtension() {}

	function initAWSServices(region) {
		initAWS(region);
		initPolly(region);
		initTranslate(region);
		initRekognition(region);
	}

	// Initialization services

	ext.initAWSServices = function (region) {
		if (accessKeyId === '')
			accessKeyId = prompt("Enter the access ID")
		if (secretAccessKey === '')
			secretAccessKey = prompt("Enter the access key")
		bucketsource = prompt("Enter the bucket link")
		sourceimg = prompt("Enter image or video source link if there is any,else leave it blank")
		inputimg = prompt("Enter input image link if there is any,else leave it blank")
		

		initAWSServices(region);
	};
	
	ext.comparebucket = function () {
		var comparams = {
			SimilarityThreshold: 20,
			SourceImage: {
				S3Object: {
					Bucket: bucketsource,
					Name: sourceimg
				}
			},
			TargetImage: {
				S3Object: {
					Bucket: bucketsource,
					Name: inputimg
				}
			}
		};
		rekognition.compareFaces(comparams, function (err, data) {
			if (err) console.log(err, err.stack); // an error occurred
			else console.log(data); // successful response
		});
	};

	ext.makecollection = function () {
		var name = prompt("Enter the name of collection");
		var collect = {
                CollectionId: name /* required */
       };
        rekognition.createCollection(collect, function(err, data) {
            if (err) console.log(err, err.stack); // an error occurred
            else     console.log(data);           // successful response
            });
	};
	// Polly services
	ext.setLanguage = function (lang) {
		language = lang;
		voice = languages[language].pollyVoice;
	};

	ext.speak = function (text, callback) {
		speak(text, voice, callback);
	};

        ext.ListCollections = function () {
		var listit = {
		};
        rekognition.listCollections(listit, function(err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else     console.log(data);           // successful response
        /*
       data = {
       CollectionIds: [
       "myphotos"
       ]
       }
      */
       });
	};
	// Translate services
	
	ext.IndexFaces = function () {
		var name = prompt("Enter the name of collection");
		var category = prompt("Enter the category");
		var params = {
                    CollectionId: name, 
                    DetectionAttributes: [
                    ], 
                    ExternalImageId: category, 
                    Image: {
                    S3Object: {
                    Bucket: bucketsource, 
                    Name: sourceimg
                     }
                    }
                    };
         rekognition.indexFaces(params, function(err, data) {
         if (err) console.log(err, err.stack); // an error occurred
         else     console.log(data);           // successful response
	 });
	};
       ext.DeleteCollections =function () {
		 var name = prompt("Enter the collection to delete");
		 var params = {
                 CollectionId: name
                 };
        rekognition.deleteCollection(params, function(err, data) {
          if (err) console.log(err, err.stack); // an error occurred
          else     console.log(data);           // successful response
          /*
          data = {
          StatusCode: 200
          }
          */
        });
	};
	
	ext.VideoFaceDetection = function () {
		var rolearn = prompt("Enter the Role ARN which gives permissions to access SNS");
		var jobID = prompt("Enter the ID which you like to give for this process");
		var snstopicarn = prompt("Enter the ARN value of the SNS topic");
		var faceattributes = prompt("Enter the face attributes to find,values are DEFAULT or ALL");
		var clientreqtoken = prompt("Enter unique client request token to avoid problem with jobid");
		var params = {
                             Video: { /* required */
                             S3Object: {
                             Bucket: bucketsource,
                             Name: sourceimg
                             //Version: 'STRING_VALUE'
                               }
                             },
                            ClientRequestToken: clientreqtoken,
                            FaceAttributes: faceattributes,
                            JobTag: jobID,
                            NotificationChannel: {
                            RoleArn: rolearn, /* required */
                            SNSTopicArn: snstopicarn /* required */
                               }
                              };
        rekognition.startFaceDetection(params, function(err, data) {
         if (err) console.log(err, err.stack); // an error occurred
         else     console.log(data);           // successful response
         });
	};
	
	ext.videopersontrack = function () {
		var reqtoken = prompt("Enter a Req token");
		var rolearn = prompt("Enter the IAM ARN which gives access to SNS");
		var snsarn = prompt("Enter the ARN value of SNS service");
		var jobid = prompt("Enter a unique job id");
		var params = {
                        Video: { /* required */
                        S3Object: {
                        Bucket: bucketsource,
                        Name: sourceimg
                           }
                         },
                        ClientRequestToken: reqtoken,
                        JobTag: jobid,
                        NotificationChannel: {
                        RoleArn: rolearn, /* required */
                        SNSTopicArn: snsarn /* required */
                           }
                        };
         rekognition.startPersonTracking(params, function(err, data) {
                       if (err) console.log(err, err.stack); // an error occurred
                       else     console.log(data);           // successful response
                         });
	};
	
	ext.getpersontrack = function () {
		var jobid = prompt("Enter the jobID");
		var sort = prompt("Enter the type of sort,value may be INDEX or TIMESTAMP");
		var params = {
                            JobId: jobid, /* required */
                            MaxResults: 1000,
                            SortBy: sort
                            };
                rekognition.getPersonTracking(params, function(err, data) {
                     if (err) console.log(err, err.stack); // an error occurred
                     else     console.log(data);           // successful response
                     });
	};
	
	ext.startlabeldetection = function () {
		var rolearn = prompt("Enter the IAM arn which gives access to SNS");
		var snsarn = prompt("Enter the arn value of sns");
		var jobtag = prompt("Enter a unique job tag value,not compulsory");
		var minconfidence = prompt("Enter the minimum confidence level,it is not compulsory");
		var params = {
                       Video: { /* required */
                       S3Object: {
                       Bucket: bucketsource,
                       Name: sourceimg,
                           }
                       },
                JobTag: jobtag,
                MinConfidence: minconfidence,
                NotificationChannel: {
                RoleArn: rolearn, /* required */
                SNSTopicArn: snsarn /* required */
                    }
                };
        rekognition.startLabelDetection(params, function(err, data) {
              if (err) console.log(err, err.stack); // an error occurred
              else     console.log(data);           // successful response
               });
	};
	
	ext.getlabeldetection = function () {
		var jobid = prompt("Enter the job id returned by startlabeldetection");
		var sort = prompt("Enter the sort type,value maybe NAME or TIMESTAMP");
		var params = {
                         JobId: jobid, /* required */
                         SortBy: sort
                 };
              rekognition.getLabelDetection(params, function(err, data) {
                    if (err) console.log(err, err.stack); // an error occurred
                    else     console.log(data);           // successful response
                        });
	            };
	ext.GetFaceDetection = function () {
		var jobid = prompt("Enter the job ID")
		var params = {
                           JobId: jobid, /* required */
                           MaxResults: 1000,
                           };
                rekognition.getFaceDetection(params, function(err, data) {
                if (err) console.log(err, err.stack); // an error occurred
                else     console.log(data);           // successful response
                });
	       };
	
	ext.startfacesearch = function () {
		var collect = prompt("Enter the collection ID");
		var rolearn = prompt("Enter the IAM arn which gives access to sns");
		var snsarn = prompt("Enter the arn value of SNS");
		var reqtoken = prompt("Enter a unique request token value");
		var matchthreshold = prompt("Enter the face match threshold value");
		var jobtag = prompt("Enter a unique job tag value");
		var params = {
                          CollectionId: 'STRING_VALUE', /* required */
                          Video: { /* required */
                          S3Object: {
                          Bucket: bucketsource,
                          Name: sourceimg,
                              }
                          },
                          ClientRequestToken: reqtoken,
                          FaceMatchThreshold: matchthreshold,
                          JobTag: jobtag,
                          NotificationChannel: {
                          RoleArn: rolearn, /* required */
                          SNSTopicArn: snsarn /* required */
                               }
                          };
                          rekognition.startFaceSearch(params, function(err, data) {
                          if (err) console.log(err, err.stack); // an error occurred
                          else     console.log(data);           // successful response
                              });
	};
	ext.getfacesearch = function () {
		var jobid = prompt("Enter the jobid to get result");
		var sort = prompt("Enter the type of sort for result,values maybe INDEX or TIMESTAMP");
		var params = {
                JobId: jobid, /* required */
                SortBy: sort
                 };
                rekognition.getFaceSearch(params, function(err, data) {
                if (err) console.log(err, err.stack); // an error occurred
                else     console.log(data);           // successful response
                });
	};
	
	ext.ListFaces = function () {
		var name = prompt("Enter the name of the collection");
	        var params = {
                CollectionId: name, 
                MaxResults: 20
            };
        rekognition.listFaces(params, function(err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else     console.log(data);           // successful response
	});
	};
	
	ext.setSourceLanguage = function (lang) {
		sourceLanguage = lang;
	};

	ext.setTargetLanguage = function (lang) {
		targetLanguage = lang;
	};

	ext._shutdown = function () {};

	ext._getStatus = function () {
		return {
			status: 2,
			msg: 'Ready'
		};
	};

	var descriptor = {
		blocks: [
			[' ', 'initialise %s', 'initAWSServices', 'us-east-1'],

			['-'],
			['-'],

			[' ', 'choose language %m.languages', 'setLanguage', 'English'],
			['w', 'say %s', 'speak', 'Hello KIDS'],

			['-'],
			['-'],

			[' ', 'choose source language %m.sourceLanguages', 'setSourceLanguage', 'English'],
			[' ', 'choose target language %m.targetLanguages', 'setTargetLanguage', 'Chinese'],
			[' ', 'Comparefaces', 'comparebucket'],
			[' ', 'CreateCollection', 'makecollection'],
			[' ', 'ListCollection', 'ListCollections'],
			[' ', 'DeleteCollection', 'DeleteCollections'],
			[' ', 'VideoFaceDetection', 'VideoFaceDetection'],
			[' ', 'GetFaceDetection', 'GetFaceDetection'],
			[' ', 'VideoPersonTracking', 'videopersontrack'],
			[' ', 'GetPersonTracking', 'getpersontrack'],
			[' ', 'StartLabelDetection', 'startlabeldetection'],
			[' ', 'GetLabelDetection', 'getlabeldetection'],
			[' ', 'StartFaceSearch', 'startfacesearch'],
			[' ', 'GetFaceSearch', 'getfacesearch'],
			[' ', 'IndexFaces', 'IndexFaces'],
			[' ', 'ListFaces', 'ListFaces']
			],
		menus: {
			languages: ['English', 'Spanish', 'Turkish', 'French', 'German', 'Italian', 'Chinese'],
			sourceLanguages: ['English', 'Spanish', 'Turkish', 'French', 'German', 'Italian', 'Chinese'],
			targetLanguages: ['English', 'Spanish', 'Turkish', 'French', 'German', 'Italian', 'Chinese']
		},
	};

	ScratchExtensions.register('Youcode Intelligence Solutions (Preparing KIDS for AI future)', descriptor, ext);
	})();






