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
        expires: 3600000
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
		console.log(req.session.user);
		
		
		next();
    } else {
        res.redirect('/');
    }    
};

var CLIENT_ID = process.env.clientID;

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
		console.log("error"+e);
		response="error";
	}
	finally
	{
		console.log(response);
		if(response=="success")
		{
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

app.get('/Dashboard',LoginChecker, (req, res) => {
	MongoClient.connect(url,{ useNewUrlParser: true },function(err,client){
		
				const db = client.db(dbName);
				const collection = db.collection('users');
				
				collection.find({ Email : req.session.user.email }).toArray(function(err,docs)
				{
					console.log(docs);
					if(docs.length==0)
					{
						console.log("New User :)");
						collection.insertOne(
						{
							Name: "jjj"
							

						},function(err,result){
								res.render('dashboard',{data:req.session.user});
						});
					}	
					else
					{
						res.render('dashboard',{data:req.session.user});
					}
				});
				client.close();
				
			});
});

app.post('/verifylogin', (req, res) => {
	
	var response=verify(req.body.token,req, res);
	
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


MongoClient.connect(url,{ useNewUrlParser: true },function(err,client){
		
				const db = client.db(dbName);
				const collection = db.collection('users');
				
				collection.insertOne(
				{
					
					Name: "jjj",
					Email:"Mohit"
						
				});
				client.close();
				
			});


//Httpserver Port Number 3000.
app.listen(process.env.PORT || 3000, function(){
  console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});

//Set The File Type To App As EJS.
app.set('view engine', 'ejs');