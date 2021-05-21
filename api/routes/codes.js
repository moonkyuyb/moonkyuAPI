const express = require('express');
const mysql = require('mysql');

const router = express.Router();

router.get('/', (req, res, next) => {
	const conn = mysql.createConnection({
		host     : process.env.DB_HOST,
		user     : process.env.DB_USER,
		password : process.env.DB_PWD,
		database : process.env.DB_DATABASE,
	});

	conn.connect()
	conn.query(`SELECT * FROM tbl_code`, (err,results,fields)=>{
		return res.status(200).json({codes: results, msg: 'success'})
	})
	conn.end()
});

router.get('/:division',(req, res, next)  =>{
    const division = req.params.division;
    const conn = mysql.createConnection({
		host     : process.env.DB_HOST,
		user     : process.env.DB_USER,
		password : process.env.DB_PWD,
		database : process.env.DB_DATABASE,
	});

	conn.connect()
	conn.query(`SELECT * FROM tbl_code WHERE division='${division}'`, (err,results,fields)=>{
		if (err) {
			return res.status(400).json({err:err.message, msg:'DB Error... check [err]'})
		}
		if (results.length > 0) {
			return res.status(200).json({results: results, resultCode:"0000", msg: 'success'})
		}else {
			return res.status(200).json({results: results,resultCode:"XXXX", msg: 'success'})
		}
	})
	conn.end()

})


async function getCode (division) {
	const conn = mysql.createConnection({
		host     : process.env.DB_HOST,
		user     : process.env.DB_USER,
		password : process.env.DB_PWD,
		database : process.env.DB_DATABASE,
	});
	conn.connect()
	return await conn.query(`SELECT * FROM tbl_code WHERE division='${division}'`)
	conn.end()
}



router.get('/filter_list/all',(req, res, next)  =>{
	console.log("filter list");

	var contractQuery 	= `SELECT * FROM tbl_code WHERE division='contract_shape'`;
	var saleTypeQuery 	= `SELECT * FROM tbl_code WHERE division='sale_type'`;
	var livingQuery 	= `SELECT * FROM tbl_code WHERE division='living'`;
	var securityQuery 	= `SELECT * FROM tbl_code WHERE division='security'`;
	var etcQuery 		= `SELECT * FROM tbl_code WHERE division='etc'`;
	var heatingQuery 	= `SELECT * FROM tbl_code WHERE division='heating'`;
	var tagQuery 		= `SELECT st_id, st_title,COUNT(*) AS cnt FROM tbl_sales_tags WHERE 1=1 GROUP BY st_title ORDER BY cnt DESC LIMIT 0,10 `;
	
	var resultData = {};

	const conn = mysql.createConnection({
		host     : process.env.DB_HOST,
		user     : process.env.DB_USER,
		password : process.env.DB_PWD,
		database : process.env.DB_DATABASE,
	});
	conn.connect()

	var contractDone = false;
	var saleTypeDone = false;
	var livingDone = false;
	var securityDone = false;
	var etcDone = false;
	var heatingDone = false;
	var tagDone = false;

	conn.query(contractQuery, (err,results,fields)=>{
		if(err) {
			conn.end()
			return res.status(400).json({err:err.message, msg:'DB Error... check [err]'})
		}else {
			resultData["contract"] = results
			contractDone = true
			if (contractDone == true &&
				saleTypeDone == true &&
				livingDone == true &&
				securityDone == true &&
				etcDone == true &&
				heatingDone == true &&
				tagDone == true 
				) {
					conn.end()
					return res.status(200).json({results: resultData, resultCode:"0000", msg: 'success'})
				}


		}
	
	})

	conn.query(saleTypeQuery, (err,results,fields)=>{
		if(err) {
			conn.end()
			return res.status(400).json({err:err.message, msg:'DB Error... check [err]'})

		}else {

			resultData["saleType"] = results
			saleTypeDone = true
			if (contractDone == true &&
				saleTypeDone == true &&
				livingDone == true &&
				securityDone == true &&
				etcDone == true &&
				heatingDone == true &&
				tagDone == true 
				) {
					conn.end()
					return res.status(200).json({results: resultData, resultCode:"0000", msg: 'success'})
				}
		}
	
	})


	conn.query(livingQuery, (err,results,fields)=>{
		if(err) {
			conn.end()
			return res.status(400).json({err:err.message, msg:'DB Error... check [err]'})

		}else {

			resultData["living"] = results
			livingDone = true
			if (contractDone == true &&
				saleTypeDone == true &&
				livingDone == true &&
				securityDone == true &&
				etcDone == true &&
				heatingDone == true &&
				tagDone == true 
				) {
					conn.end()
					return res.status(200).json({results: resultData, resultCode:"0000", msg: 'success'})
				}
		}
	
	})

	conn.query(securityQuery, (err,results,fields)=>{
		if(err) {
			conn.end()
			return res.status(400).json({err:err.message, msg:'DB Error... check [err]'})

		}else {

			resultData["security"] = results
			securityDone = true
			if (contractDone == true &&
				saleTypeDone == true &&
				livingDone == true &&
				securityDone == true &&
				etcDone == true &&
				heatingDone == true &&
				tagDone == true 
				) {
					conn.end()
					return res.status(200).json({results: resultData, resultCode:"0000", msg: 'success'})
				}
		}
	
	})

	conn.query(etcQuery, (err,results,fields)=>{
		if(err) {
			conn.end()
			return res.status(400).json({err:err.message, msg:'DB Error... check [err]'})

		}else {

			resultData["etc"] = results
			etcDone = true
			if (contractDone == true &&
				saleTypeDone == true &&
				livingDone == true &&
				securityDone == true &&
				etcDone == true &&
				heatingDone == true &&
				tagDone == true 
				) {
					conn.end()
					return res.status(200).json({results: resultData, resultCode:"0000", msg: 'success'})
				}
		}
	
	})

	conn.query(heatingQuery, (err,results,fields)=>{
		if(err) {
			conn.end()
			return res.status(400).json({err:err.message, msg:'DB Error... check [err]'})

		}else {

			resultData["heating"] = results
			heatingDone = true
			if (contractDone == true &&
				saleTypeDone == true &&
				livingDone == true &&
				securityDone == true &&
				etcDone == true &&
				heatingDone == true &&
				tagDone == true 
				) {
					conn.end()
					return res.status(200).json({results: resultData, resultCode:"0000", msg: 'success'})
				}
		}
	
	})

	conn.query(tagQuery, (err,results,fields)=>{
		if(err) {
			conn.end()
	return res.status(400).json({err:err.message, msg:'DB Error... check [err]'})

		}else {

			resultData["tag"] = results
			tagDone = true
			if (contractDone == true &&
				saleTypeDone == true &&
				livingDone == true &&
				securityDone == true &&
				etcDone == true &&
				heatingDone == true &&
				tagDone == true 
				) {
					conn.end()
					return res.status(200).json({results: resultData, resultCode:"0000", msg: 'success'})
				}
		}
	
	})

	/*
    const conn = mysql.createConnection({
		host     : process.env.DB_HOST,
		user     : process.env.DB_USER,
		password : process.env.DB_PWD,
		database : process.env.DB_DATABASE,
	});

	conn.connect()
	
	conn.query(`SELECT * FROM tbl_code WHERE division='contract_shape'`, (err,results,fields)=>{
		if (err) {
			return res.status(400).json({err:err.message, msg:'DB Error... check [err]'})
		}
		if (results.length > 0) {
			return res.status(200).json({results: results, resultCode:"0000", msg: 'success'})
		}else {
			return res.status(200).json({results: results,resultCode:"XXXX", msg: 'success'})
		}
	})
	conn.end()
	*/

})
module.exports = router;


