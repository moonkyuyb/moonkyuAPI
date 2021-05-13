const express	= require('express');
const mysql		= require('mysql');
const _ 		= require('lodash')

const router = express.Router();

router.post('/signUp/email', async (req, res, next) => {
	mysql.createConnection({multipleStatements: true});

	const conn = mysql.createConnection({
		host     : process.env.DB_HOST,
		user     : process.env.DB_USER,
		password : process.env.DB_PWD,
		database : process.env.DB_DATABASE,
	});
	conn.connect()

	var queryString = `SELECT * FROM tbl_member WHERE m_username = "${req.body.m_username}";`
	console.log(queryString);

	conn.query(queryString, (err,results,fields)=>{
		if(err){
			return res.status(400).json({err:err.message, msg:'DB Error... check [err]'})
		}
		if(results.length != 0){
			return res.status(400).json({msg:'이미 사용중인 아이디(메일 주소)입니다.'})
		}

		queryString = "INSERT INTO tbl_member SET"
		_.each(req.body,(value,key)=>{
			if(_.isString(value))	{ queryString += `\n${key} = "${value}",` }
			else					{ queryString += `\n${key} = ${value},` }
		})
		queryString += `\nreg_date = now(),\nmod_date = now(),\nstatus = true`

		conn.query(queryString, (err,results,fields)=>{
			if(err){
				console.log(err);
				return res.status(400).json({err:err.message, msg:'DB Error... check [err]'})
			}
			return res.status(200).json({msg:'OK'})
		})
		conn.end()
	})
})

module.exports = router;