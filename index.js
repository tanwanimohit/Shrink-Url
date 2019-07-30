//Routing Mechanism - URL Define Here.
const express = require('express');

//Mongo Object
var ObjectId = require('mongodb').ObjectID;
//Express Only Get Data If Body-Parser Is Worked.

//To Get Value Of Any Control Body-Parser Is Compulsory.
var bodyParser = require('body-parser');


//Object of Express
const app = express();
app.use(express.static('views'));
app.use(bodyParser.urlencoded({ extended: true }));

//Node Session and cookies
var cookieParser = require('cookie-parser');
var session = require('express-session');

// initialize cookie-parser to allow us access the cookies stored in the browser. 
app.use(cookieParser());

// initialize express-session to allow us track the logged-in user across sessions.
app.use(session({
    key: 'user_sid',
    secret: 'ss',
    resave: false,
    saveUninitialized: false,
    cookie: {
        expires:  7*24*3600*1000
    }
}));



//URL Of MongoDB Server.
const url = process.env.MongoURL;

//Mongo Client Variable
const MongoClient = require('mongodb').MongoClient;

//Database Name.
const dbName =  process.env.dbName;


// This middleware will check if user's cookie is still saved in browser and user is not set, then automatically log the user out.
// This usually happens when you stop your express server after login, your cookie still remains saved in the browser.
app.use((req, res, next) => {
    if (req.cookies.user_sid && !req.session.user) {
        res.clearCookie('user_sid');        
    }
    next();
});

// middleware function to check for logged-in users
var sessionChecker = (req, res, next) => {
    if (req.session.user && req.cookies.user_sid) {
		
		res.redirect('/Dashboard');
		
    } else {
        next();
    }    
};

// middleware function to check for logged-in users
var LoginChecker = (req, res, next) => {
    if (req.session.user && req.cookies.user_sid) {
		console.log("User Signed IN :- "+req.session.user.email);
		
		
		next();
    } else {
        res.redirect('/');
    }    
};

//Replace with your Own Google Client ID For Sign In Perpose.
var CLIENT_ID = process.env.clientID;


//to verifythe login (using google's own function to verify)
const {OAuth2Client} = require('google-auth-library');
const client = new OAuth2Client(CLIENT_ID);
async function verify(token,req,res) {
	var response="";
	var user={};
	try
	{
		
	  const ticket = await client.verifyIdToken({
		  idToken: token,
		  audience: CLIENT_ID,  
	  });
	const payload = ticket.getPayload();
  
	user.userid = payload['sub'];
  
	//console.log(payload);
	
	response="success";
	user.email=payload['email'];
	user.name=payload['name'];
	user.picture=payload['picture'];
	
	}
	catch(e)
	{
		//error
		console.log("error"+e);
		response="error";
	}
	finally
	{
		//console.log(response);
		if(response=="success")
		{
			//Setting the Session
			req.session.user=user;
			
			res.send("success");
		}
		else
		{

			res.send("error");			
		}
	}
	
}


app.get('/',sessionChecker, (req, res) => {
	
	res.render('home');
});

// route for user logout
app.get('/logout', (req, res) => {
    if (req.session.user && req.cookies.user_sid) {
        res.clearCookie('user_sid');
        res.redirect('/');
		
	
    } else {
        res.redirect('/');
    }
});


//404 Page
app.get('/404', (req, res) => {
	
	res.render('404');
});

//Edit Short URL
app.post('/Edit',LoginChecker, (req, res) => {
	//console.log(req.body.token);
	var id=ObjectId(req.body.token);
	MongoClient.connect(url,{ useNewUrlParser: true },function(err,client){
		
				const db = client.db(dbName);
				const collection = db.collection('links');
				
				collection.find({ _id : id , owner : req.session.user.email}).toArray(function(err,docs)
				{
					//console.log(docs);
					if(docs.length==1)
					{
						
						res.render('Edit',{data:docs});
					}	
					else
					{
						//Else Home.
						res.redirect('/');
					}
				});
				client.close();
				
			});
	
});

//Edit URL Next Step
app.post('/EditURL',LoginChecker, (req, res) => {
	//console.log(req.body.token);
	var id=ObjectId(req.body.token);
	MongoClient.connect(url,{ useNewUrlParser: true },function(err,client){
		
				const db = client.db(dbName);
				const collection = db.collection('links');
				
	collection.updateOne(
				{_id: id, owner : req.session.user.email},
				{$set:{
					url: req.body.long,
					linkkey: req.body.short
				}}
			, function(err, result){
				if(err) res.send("Something Went Wrong");
				res.redirect("/Dashboard");
			});
			
	});
	
});

//Edit URL Next Step
app.post('/DeleteURL',LoginChecker, (req, res) => {
	//console.log(req.body.token);
	var id=ObjectId(req.body.token);
	
	MongoClient.connect(url,{ useNewUrlParser: true },function(err,client){
		
				const db = client.db(dbName);
				const collection = db.collection('links');
				
	collection.removeOne(
				{_id: id, owner : req.session.user.email}
			, function(err, result){
				if(err) res.send("Something Went Wrong");
				res.redirect("/Dashboard");
			});
			
	});
	
});

//Dashboard
app.get('/Dashboard',LoginChecker, (req, res) => {
	MongoClient.connect(url,{ useNewUrlParser: true },function(err,client){
		
				const db = client.db(dbName);
				const collection = db.collection('users');
				
				collection.find({ Email : req.session.user.email }).toArray(function(err,docs)
				{
					//console.log(docs);
					//for New User
					if(docs.length==0)
					{
						insertData(req,res);
					}	
					else
					{
						//Registered User
						GetHistory(req,res);
					}
				});
				client.close();
				
			});
});


//Verify the google login 
app.post('/verifylogin', (req, res) => {
	
	verify(req.body.token,req, res);
	
});

//Short URL (Signed in user)
app.post('/shorturl',LoginChecker, (req, res) => {
	
	var longurl=req.body.longurl;
	var shorturl=req.body.shorturl;
	shorturl=shorturl.replace(/[^a-zA-Z0-9 ]/g, "");
	shorturl=shorturl.replace(" ","");
	
	//If no Custom URL is Given / Random URl generation
	if(shorturl==undefined || shorturl==null || shorturl=="" || shorturl==" " || shorturl=='')
	{
		var newshort=shorturl;
		if(shorturl==undefined || shorturl==null || shorturl=="" || shorturl==" " || shorturl=='')
		{
			console.log("Generating Random URL...");
			var t=2;
			var temp=getrandom(t);
			while(CheckAvailability(temp)==0)
			{
				//Increasing the size of Random URL
				temp=getrandom(t++);
			}
			newshort=temp;
			
		}
		
		//To check wheather URL is vaild or not.
		IsVaildURL(longurl,newshort,req,res);
	}
	else
	{
		//Checking if Custom URl is available or not
		MongoClient.connect(url,{ useNewUrlParser: true },function(err,client){
			
					const db = client.db(dbName);
					const collection = db.collection('links');
					
					collection.find({ linkkey : shorturl }).toArray(function(err,docs)
					{
						//console.log(docs);
						if(docs.length==0)
						{
							//URL Vaildaiton
							IsVaildURL(longurl,shorturl,req,res);
						}	
						else
						{
							res.send("Ahhh! This Custom URL is already Occupied :(");
						}
					});
					client.close();
					
		});	
	}
	
	
});

function IsVaildURL(longurl,shorturl,req,res)
{	
	if(CheckURL(longurl))
	{
		if(longurl.includes("tinyfor.me"))
		{
			res.send("This URL is not allowed.");
		}
		else
		{
			//Main Step to enter the data in DB.
			ShortURL(longurl,shorturl,req,res);
		}	
	}
	
	else
	{
		res.send("Please Enter a vaild URL.");
	}
}

function ShortURL(longurl,shorturl,req,res)
{
	//Just Entering the Data in DB.
	MongoClient.connect(url,{ useNewUrlParser: true },function(err,client){
		
				const db = client.db(dbName);
				const collection = db.collection('links');
				
				collection.insertOne(
				{
					
					linkkey: shorturl,
					url:longurl,
					owner:req.session.user.email,
					DateOfCreation:new Date().toLocaleString(),
					status:'on',
					count:"0"
						
				},function(data,err)
				{
					res.send('https://tinyfor.me/'+shorturl);
				});
				client.close();
				
			});
		
}

//Checking Random URL is Available or not.
function CheckAvailability(temp)
{
	
	MongoClient.connect(url,{ useNewUrlParser: true },function(err,client){
		
				const db = client.db(dbName);
				const collection = db.collection('links');
				
				collection.find({ linkkey : temp }).toArray(function(err,docs)
				{
					console.log(docs);
					if(docs.length==0)
					{
						return 1;
					}	
					else
					{
						return 0;
					}
				});
				client.close();
				
	});
}

//Getting Short URLs History
function GetHistory(req,res)
{
	MongoClient.connect(url,{ useNewUrlParser: true },function(err,client){
		
				const db = client.db(dbName);
				const collection = db.collection('links');
				
				collection.find({ owner : req.session.user.email }).toArray(function(err,docs)
				{
					res.render('dashboard',{data:req.session.user,history:docs});
					
				});
				client.close();
				
	});
	
}

//inserting New User Data
function insertData(req,res)
{
	MongoClient.connect(url,{ useNewUrlParser: true },function(err,client){
		
				const db = client.db(dbName);
				const collection = db.collection('users');
				
				collection.insertOne(
				{
					
					Name: req.session.user.name,
					Email:req.session.user.email,
					Profile:req.session.user.picture,
					UserId:req.session.user.userid,
					DateOfCreation:new Date().toLocaleString()
						
				},function(data,err)
				{
					GetHistory(req,res);
				});
				client.close();
				
			});
}

//Public API for Short URL almost same as Private without having Custom URL Support
app.post('/api/shorturl', (req, res) => {
	
	var longurl=req.body.longurl;
	var newshort="";

	console.log("Generating Random URL...");
	var t=2;
	var temp=getrandom(t);
	while(CheckAvailability(temp)==0)
	{
		temp=getrandom(t++);
	}
	newshort=temp;
		
	if(CheckURL(longurl))
	{
		if(longurl.includes("tinyfor.me"))
		{
			res.send("This URL is not allowed.");
		}
		else
		{
			MongoClient.connect(url,{ useNewUrlParser: true },function(err,client){
		
				const db = client.db(dbName);
				const collection = db.collection('links');
				
				collection.insertOne(
				{
					
					linkkey: newshort,
					url:longurl,
					DateOfCreation:new Date().toLocaleString(),
					status:'on',
					count:"0"
						
				},function(data,err)
				{
					res.send('https://tinyfor.me/'+newshort);
				});
				client.close();
				
			});
		}	
	}
	else
	{
		res.send("Please Enter a vaild URL.");
	}
	
});

//Redirecting to the Main URL
app.get('/:id', (req, res) => {
	MongoClient.connect(url,{ useNewUrlParser: true },function(err,client){
		
				const db = client.db(dbName);
				const collection = db.collection('links');
				var id=req.params.id;
				collection.find({ linkkey : id , status : 'on'}).toArray(function(err,docs)
				{
					//console.log(docs);
					if(docs.length==1)
					{
						//Maintaining the Count.
						UpdateCount(res,req,docs[0].linkkey,docs[0].url,docs[0].count);
					}	
					else
					{
						//Else 404.
						res.redirect('/404');
					}
				});
				client.close();
				
			});
});

//Random URl Generation
function getrandom(no){
    var random_string = Math.random().toString(32).substring(2, no) + Math.random().toString(32).substring(2, 5);    
	//console.log(random_string);
	return random_string;
}

//Using Regular Exprssion to checking the string is url or not.
function CheckURL(str)
{
	
	//Regular Expression to Check Wheather URL is Vaild or not !
	var expression = /https?:[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi;
	var regex = new RegExp(expression);
	var t = str;

	if (t.match(regex)) {
	  return true;
	} else { 	
	  return false;
	}

}

//When User Opens the links, to maintain the count of oppening of the url
function UpdateCount(res,req,shorturl,murl,count)
{
	MongoClient.connect(url,{ useNewUrlParser: true },function(err,client){
		const db = client.db(dbName);
		const collection = db.collection('links');
		var newcount=1 + parseInt(count, 10);
		collection.updateOne({ linkkey : shorturl }, {$set : {count : newcount}},function(err,docs)
		{
			
			if(err)
			{
				res.redirect('/404');
				
			}	
			else
			{
				res.redirect(murl);
			}
		});
		client.close();
		
	});
}


//Httpserver Port Number 3000.
app.listen(process.env.PORT || 3000, function(){
  console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});

//Set The File Type To App As EJS.
app.set('view engine', 'ejs');