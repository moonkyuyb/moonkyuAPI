var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter		= require('./routes/index');
const testRouter	= require('./routes/test');
const salesRouter	= require('./routes/sales');
const memberRouter	= require('./routes/member');
const authRouter	= require('./routes/auth');
const chatRouter	= require('./routes/chat');
const sigunguRouter	= require('./routes/sigungu');
const codeRouter	= require('./routes/code');
const codesRouter	= require('./routes/codes');
const addressRouter = require('./routes/address');
const fileUploadRouter = require('./routes/fileUpload');


///////added////////////
const tagsRouter    = require('./routes/tags');


var app = express();
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb'}));
//app.use(express.json({limit: '5000000'}));
//app.use(express.urlencoded({limit: '5000000'}));

require('dotenv').config()


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/data', express.static(path.join(__dirname, 'public')));
app.use('/map', express.static(path.join(__dirname, 'public/html/map')));

app.use('/',		indexRouter);
app.use('/test', 	testRouter);
app.use('/sales', 	salesRouter);
app.use('/member', 	memberRouter);
app.use('/auth', 	authRouter);
app.use('/chat', 	chatRouter);
app.use('/sigungu',	sigunguRouter);
app.use('/code',	codeRouter);

app.use('/codes', 	codesRouter);
app.use('/address', 	addressRouter);
app.use('/fileUpload', fileUploadRouter);

///added
app.use('/tags', tagsRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
	next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};

	// render the error page
	res.status(err.status || 500);
	res.render('error');
});

module.exports = app;
