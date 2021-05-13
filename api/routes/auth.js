const express	= require('express');
const mysql		= require('mysql2');
const jwt		= require('jsonwebtoken');
const {beforeLogin, afterLogin, verifyToken} = require('./middlewares');

const router = express.Router()

router.post('/signin', beforeLogin, (req, res, next) => {
	const m_username = req.body.m_username
	const m_password = req.body.m_password
	const m_auth_provider = req.body.m_auth_provider

	const conn = mysql.createConnection({
		host     : process.env.DB_HOST,
		user     : process.env.DB_USER,
		password : process.env.DB_PWD,
		database : process.env.DB_DATABASE,
	});

	const queryString = `
		SELECT *
		FROM tbl_member
		WHERE
			1 = 1
			AND m_username = '${m_username}'
			AND m_password = '${m_password}'
			AND m_auth_provider = '${m_auth_provider}'
	`
	conn.connect()
	conn.query(queryString, (err,results,fields)=>{
		if(err){
			console.log(err.message);
			return res.status(400).json({err:err.message, msg:'DB Error... check [err]'})
		}
		if (results.length !== 1) {
			return res.status(404).json({msg:'아이디 혹은 비밀번호가 일치하는 사용자를 찾을 수 없습니다.'})
		}

		req.params.m_id = results[0].m_id
		delete results[0].m_password
		const {...some} = results[0]

		const token = jwt.sign(some, process.env.JWT_SECRET, { expiresIn: '10m', issuer: 'admin' })

		afterLogin(req,res,()=>{
			return res.status(200).json({token, msg: 'success'})
		})
	})
	conn.end()
})

router.post('/token', verifyToken, (req, res, next) => {
	const decoded = req.decoded
	console.log(decoded)
	return res.status(200).json(decoded)
})

module.exports = router;