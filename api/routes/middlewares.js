const jwt		= require('jsonwebtoken');
const mysql		= require('mysql2');
const publicIp 	= require('public-ip');
const device	= require('device');

exports.beforeLogin = async (req, res, next) => {
	if(!req.body.m_username || !req.body.m_password || !req.body.m_auth_provider){
		return res.status(400).json({msg:'missing required parameter(s)'})
	}
	const ll_ip = await publicIp.v4();

	const mydevice = device(req.headers['user-agent'])
	const ll_device = mydevice.type

	const m_username = req.body.m_username, m_auth_provider = req.body.m_auth_provider
	const ll_login_success = false

	const conn = mysql.createConnection({
		host     : process.env.DB_HOST,
		user     : process.env.DB_USER,
		password : process.env.DB_PWD,
		database : process.env.DB_DATABASE,
	});

	const queryString = `
		INSERT INTO tbl_log_login
		SET
			ll_ip = '${ll_ip}',
			ll_device = '${ll_device}',
			m_username = '${m_username}',
			m_auth_provider = '${m_auth_provider}',
			ll_login_success = ${ll_login_success},
			reg_date = NOW(),
			mod_date = NOW(),
			status = 1
	`
	conn.connect()
	conn.query(queryString, (err,results,fields)=>{
		req.params.ll_id = results.insertId
		next()
	})
	conn.end()
}

exports.afterLogin = (req, res, next) => {
	if(req.params.ll_id && res.statusCode === 200 && req.params.m_id){
		const queryString = `
			UPDATE tbl_log_login
			SET
				ll_login_success=true,
				m_id = ${req.params.m_id},
				mod_date = now()
			WHERE ll_id = ${req.params.ll_id};
		`
		const conn = mysql.createConnection({
			host     : process.env.DB_HOST,
			user     : process.env.DB_USER,
			password : process.env.DB_PWD,
			database : process.env.DB_DATABASE,
		});
		conn.connect()
		conn.query(queryString)
		conn.end()
	}
	next()
}

exports.verifyToken = (req, res, next) => {
	console.log(req.headers.authorization);
	if(!req.headers.authorization){
		return res.status(401).json({
			msg:'unauthorization: token is missing'
		})
	}

	const token = req.headers.authorization.split('Bearer ')[1]
	console.log(token);
	if(!token){
		return res.status(401).json({
			msg:'unauthorization: token is invalid'
		})
	}
	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET)
		req.decoded = decoded
		return next();
	} catch (e) {
		if(e.name==='TokenExpiredError'){
			return res.status(419).json({
				msg: 'Token Expired'
			})
		}
		return res.status(401).json({
			msg:'unauthorization: something goes wrong... '
		})
	}
}