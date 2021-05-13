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

    var query = `
        SELECT 
            *
        FROM tbl_sales_tags
        WHERE
        status=1
    `;

	conn.connect()
	conn.query(query, (err,results,fields)=>{
		return res.status(200).json({results: results, msg: 'success'})
	})
	conn.end()
});



router.get('/top', (req, res, next) => {
	const conn = mysql.createConnection({
		host     : process.env.DB_HOST,
		user     : process.env.DB_USER,
		password : process.env.DB_PWD,
		database : process.env.DB_DATABASE,
	});

    var query = `
        SELECT 
            st_id, 
            st_title,
            COUNT(*) AS cnt
        FROM tbl_sales_tags
        WHERE
        status=1
        GROUP BY st_title
        ORDER BY cnt DESC
        LIMIT 0,10
    `;

	conn.connect()
	conn.query(query, (err,results,fields)=>{
		return res.status(200).json({results: results, msg: 'success'})
	})
	conn.end()
});


module.exports = router;