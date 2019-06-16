//Routing Mechanism - URL Define Here.
const express = require('express');

var ObjectId = require('mongodb').ObjectID;
//Express Only Get Data If Body-Parser Is Worked.
//To Get Value Of Any Control Body-Parser Is Compulsory.
var bodyParser = require('body-parser');

//Object of Express
const app = express();
app.use(express.static('views'))


app.get('/', (req, res) => {
	res.render('home');
});


//Httpserver Port Number 3000.
app.listen(process.env.PORT || 3000, function(){
  console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});

//Set The File Type To App As EJS.
app.set('view engine', 'ejs');