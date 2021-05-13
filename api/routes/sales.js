const express = require('express');
const mysql = require('mysql2');

const router = express.Router();

router.get('/', (req, res, next) => {
	const conn = mysql.createConnection({
		host     : process.env.DB_HOST,
		user     : process.env.DB_USER,
		password : process.env.DB_PWD,
		database : process.env.DB_DATABASE,
	});
	conn.connect()

	const queryString = `
		SELECT
			sales.*,
			ts.codeNm as location1,
			ts2.codeNm as location2,
			ts3.codeNm as location3,
			sales.st_title,
			sales.sf_original_nm

		FROM (
			SELECT 
				ts.s_id, ts.s_deposit, ts.s_monthly_rent, ts.s_trading_price,
				ts.s_building_type, ts.s_sale_type, ts.s_price_type, ts.s_maintenance_cost,
				ts.s_supply_area_m, ts.s_floor, ts.s_loan, ts.m_id,
				tc.string AS building_type,
				tc2.string AS sale_type,
				tc3.string AS price_type,
				tc4.string AS loan,
				tsf.sf_original_nm,
				tags.st_title,

				tsl.sl_building_name, tsl.sl_location1, tsl.sl_location2, tsl.sl_location3, tsl.sl_location4
			FROM zipanda.tbl_sales ts
			
			LEFT JOIN tbl_code tc
			ON ts.s_building_type = tc.code
			
			LEFT JOIN tbl_code tc2
			ON ts.s_sale_type = tc2.code
			
			LEFT JOIN tbl_code tc3
			ON ts.s_price_type = tc3.code
			
			LEFT JOIN tbl_code tc4
			ON ts.s_loan = tc4.code

			LEFT JOIN (
				SELECT rtst.s_id,   GROUP_CONCAT( (SELECT st_title FROM tbl_sales_tags tst WHERE st_id=rtst.st_id) SEPARATOR  ',' )  as st_title
				FROM r_tbl_sales_tags rtst GROUP BY rtst.s_id
			) tags
			ON ts.s_id = tags.s_id
			
			LEFT JOIN (
				SELECT s_id, GROUP_CONCAT( sf_original_nm SEPARATOR ',') AS sf_original_nm
				FROM tbl_sales_file 
				WHERE status=1 GROUP BY s_id
			) tsf
			ON tsf.s_id=ts.s_id

			LEFT JOIN zipanda.tbl_sales_location tsl
			ON ts.s_id = tsl.s_id
			WHERE ts.status != 0
		) sales
		

		LEFT JOIN tbl_sigungu ts
		ON sales.sl_location1 = ts.code
		
		LEFT JOIN tbl_sigungu ts2
		ON concat(sales.sl_location1,sales.sl_location2) =  ts2.code
		
		LEFT JOIN tbl_sigungu ts3
		ON concat(sales.sl_location1,sales.sl_location2,sales.sl_location3) = ts3.code
	`


	conn.query(queryString, (err,results,fields)=>{
		return res.status(200).json({results: results, msg: 'success'})
	})
	conn.end()
});

router.post('/', (req, res, next) => {

	console.log(req.body);
	const body = req.body;
	const conn = mysql.createConnection({
		host     : process.env.DB_HOST,
		user     : process.env.DB_USER,
		password : process.env.DB_PWD,
		database : process.env.DB_DATABASE,
	});
	conn.connect()

	const s_price_type 	= body.priceListSelected;
	const s_sale_type  	= body.saleTypeSelected;
	const living_opt   	= body.livingItemSelected;
	const heating_opt  	= body.heatingItemSelected;
	const security_opt 	= body.securityItemSelected;
	const etc_opt      	= body.etcItemSelected;
	const tags_st_ids  	= body.tagsItemSelected;
	const room_cnt     	= body.roomCnt;
	const bath_cnt     	= body.bathCnt;
	const built_year   	= body.builtYear;
	const parking_cnt  	= body.parkingCnt;
	const deposit_range	= body.depositAmtRange;
	const month_range	= body.monthAmtRange;
	const sale_range	= body.saleAmtRange;
	const area_range 	= body.areaSizeRange;
	const maint_range 	= body.maintenanceAmtRange;
	const floor_range	= body.floorRange;


	const priceWhere = `
		AND (
			/*보증금*/
			(ts.s_deposit BETWEEN 0 AND 1000000000) OR
			/*월세*/
			(ts.s_monthly_rent BETWEEN  0 AND 100) OR
			/*매매*/
			(ts.s_trading_price BETWEEN 0 AND 1000000000)
		)
	`;

	
			/*거래유형 */

	const priceTypeWhere = ``;
	if (s_sale_type.length > 0) {
	 	var str = "";
		s_sale_type.forEach(element => {
			str += "'"+element+"',";
		});
		str = str.slice(0,-1);
		`
			AND ( ts.s_price_type IN (${str}) )
			`
	}

			
	

			/*면적 */
	const areaWhere = `AND ( ts.s_use_area_p BETWEEN 50 AND 140)
			`

			/*층수 */
	const floorWhere = `AND ( ts.s_floor BETWEEN 1 AND 30 )
			`
			
			/*방 개수  */
	const roomCntWhere = `AND ( 
					(ts.s_rooms_cnt = 1) OR
					(ts.s_rooms_cnt = 2) OR 
					(ts.s_rooms_cnt = 3) OR 
					(ts.s_rooms_cnt >= 4) 
				)
			`

			/*욕실 개수  */
	const bathRoomWhere = `AND ( 
					(ts.s_bathrooms_cnt = 1) OR
					(ts.s_bathrooms_cnt = 2) OR 
					(ts.s_bathrooms_cnt = 3) OR 
					(ts.s_bathrooms_cnt >= 4)  
				)
			`

			/*준공 연차 */
	const builtYearWhere = `AND (
					( ts.s_build_year BETWEEN (2021-1) AND 2021 ) OR
					( ts.s_build_year BETWEEN (2021-5) AND 2021 ) OR
					( ts.s_build_year BETWEEN (2021-10) AND 2021 ) OR
					( ts.s_build_year BETWEEN (2021-15) AND 2021 ) OR
					( ts.s_build_year < (2021-15) )
				)
			`
			/*관리비  */
	const costAmtWhere = `AND (
					ts.s_admin_cost_amt BETWEEN 0 AND 2000000
			)
			`
			/*주차*/
	const parkingWhere = `AND (
					( ts.s_parking = 1 ) OR 
					( ts.s_parking >=1 ) OR 
					( ts.s_parking >=2 ) 
			)
			`

			/*유형*/
	const saleTypeWhere = `AND (
				ts.s_sale_type IN ('SaleType_10', 'SaleType_16', 'SaleType_4' )
			)
			`

			/*옵션*/
	const optionWhere = `AND (
				rtso.code IN ( 'CeilAircon', 'WallAircon', 'Closet', 'Refgrt',  'CardKey', 'CCTV', 'EntSecurity', 'FireExginguisher', 'Pet')
			)`

			/*태그*/
	const tagWhere = `AND (
				rtst.st_id IN (
				  3,   1,   2, 208, 216,
					203, 221, 226, 242, 209,
					212, 234, 204
				)
			)`

	
	var queryString = `
	SELECT
			sales.*,
			tsi.codeNm as location1,
			tsi2.codeNm as location2,
			tsi3.codeNm as location3,
			sales.st_title,
			sales.sf_original_nm
 
	 FROM (
		(
			SELECT ts.s_id AS sales_s_id,
						ts.s_id, ts.s_deposit, ts.s_monthly_rent, ts.s_trading_price,
						ts.s_building_type, ts.s_sale_type, ts.s_price_type, ts.s_maintenance_cost,
						ts.s_supply_area_m, ts.s_floor, ts.s_loan, ts.m_id,
						tc.string AS building_type,
						tc2.string AS sale_type,
						tc3.string AS price_type,
						tc4.string AS loan,
						tsf.sf_original_nm,
						tags.st_title,
		
						tsl.sl_building_name, tsl.sl_location1, tsl.sl_location2, tsl.sl_location3, tsl.sl_location4
			
			FROM tbl_sales ts 
			
			LEFT JOIN tbl_code tc
				ON ts.s_building_type = tc.code
					
			LEFT JOIN tbl_code tc2
				ON ts.s_sale_type = tc2.code
					
			LEFT JOIN tbl_code tc3
				ON ts.s_price_type = tc3.code
					
			LEFT JOIN tbl_code tc4
				ON ts.s_loan = tc4.code
		
			LEFT JOIN (
				SELECT rtst.s_id,   GROUP_CONCAT( (SELECT st_title FROM tbl_sales_tags tst WHERE st_id=rtst.st_id) SEPARATOR  ',' )  as st_title
					FROM r_tbl_sales_tags rtst GROUP BY rtst.s_id
				) tags
				ON ts.s_id = tags.s_id
					
			LEFT JOIN (
				SELECT s_id, GROUP_CONCAT( sf_original_nm SEPARATOR ',') AS sf_original_nm
					FROM tbl_sales_file 
					WHERE status=1 GROUP BY s_id
				) tsf
				ON tsf.s_id=ts.s_id
		
			LEFT JOIN zipanda.tbl_sales_location tsl
				ON ts.s_id = tsl.s_id
		
				
		
			
			WHERE  ts.status =1
			
			/*금액 필터*/
			${priceWhere}
			
			/*거래유형 */
			${priceTypeWhere}

			/*면적 */
			${areaWhere}
			
			/*층수 */
			${floorWhere}
			
			/*방 개수  */
			${roomCntWhere}
			
			/*욕실 개수  */
			${bathRoomWhere}
			
			/*준공 연차 */
			${builtYearWhere}
			
			/*관리비  */
			${costAmtWhere}
			
			/*주차*/
			${parkingWhere}
			
			/*건물 유형*/
			${saleTypeWhere}
				
			GROUP BY s_id
				
		
		) sales, 
		 
		
		(
			SELECT rtso.s_id AS opt_s_id  FROM r_tbl_sales_options rtso 
			
			WHERE 1=1 	
			
			/*옵션*/
			${optionWhere}
			
			GROUP BY s_id
		) opts,
		 
		
		
		
		(
			SELECT s_id AS tag_s_id
			
			FROM r_tbl_sales_tags rtst 
			
			WHERE 1=1
			/*태그*/
			${tagWhere}

			GROUP BY s_id
		) tags
		)
		
		LEFT JOIN tbl_sigungu tsi
			ON sl_location1 = tsi.code
				
		LEFT JOIN tbl_sigungu tsi2
			ON concat(sl_location1,sl_location2) =  tsi2.code
				
		LEFT JOIN tbl_sigungu tsi3
			ON concat(sl_location1,sl_location2,sl_location3) = tsi3.code
					
		
		
		WHERE sales.sales_s_id = opts.opt_s_id AND sales.sales_s_id=tags.tag_s_id AND opts.opt_s_id=tags.tag_s_id;
					
	`;




	conn.query(queryString, (err,results,fields)=>{
		return res.status(200).json({results: results, msg: 'success'})
	})
	conn.end()
});

router.get('/:s_id', (req, res, next) => {
	const s_id = req.params.s_id

	if(!s_id){
		return res.status(400).json({msg:'Invaild ID'})
	}

	const conn = mysql.createConnection({
		host     : process.env.DB_HOST,
		user     : process.env.DB_USER,
		password : process.env.DB_PWD,
		database : process.env.DB_DATABASE,
	});
	const queryString = `
			SELECT
				sales.*,
				ts.codeNm as location1,
				ts2.codeNm as location2,
				ts3.codeNm as location3
			FROM (
				SELECT 
					ts.s_id, CEIL (ts.s_deposit/10000) AS s_deposit, (ts.s_monthly_rent/10000) AS s_monthly_rent,  (ts.s_trading_price/10000) AS s_trading_price,
					ts.s_building_type, ts.s_sale_type, ts.s_price_type, ts.s_maintenance_cost,
					ts.s_supply_area_m, ts.s_floor, ts.s_loan, ts.m_id, CEIL ((ts.s_maintenance_cost+ts.s_monthly_rent)/10000) AS monthly_cost,
					tc.string AS building_type,
					tc2.string AS sale_type,
					tc3.string AS price_type,
					tc4.string AS loan,

					tsf.sf_original_nm,
			
					tags.st_title,

					opt.optCode,
			
					tsl.sl_building_name, tsl.sl_location1, tsl.sl_location2, tsl.sl_location3, tsl.sl_location4
				FROM zipanda.tbl_sales ts
				LEFT JOIN tbl_code tc
				ON ts.s_building_type = tc.code
				LEFT JOIN tbl_code tc2
				ON ts.s_sale_type = tc2.code
				LEFT JOIN tbl_code tc3
				ON ts.s_price_type = tc3.code
				LEFT JOIN tbl_code tc4
				ON ts.s_loan = tc4.code
			
			
				LEFT JOIN (
					SELECT rtst.s_id,   GROUP_CONCAT( (SELECT st_title FROM tbl_sales_tags tst WHERE st_id=rtst.st_id) SEPARATOR  ',' )  as st_title
					FROM r_tbl_sales_tags rtst GROUP BY rtst.s_id
				) tags
				ON ts.s_id = tags.s_id
				
				LEFT JOIN (
					SELECT s_id, GROUP_CONCAT( sf_original_nm SEPARATOR ',') AS sf_original_nm
					FROM tbl_sales_file 
					WHERE status=1 GROUP BY s_id
				) tsf
				ON tsf.s_id=ts.s_id
				
				LEFT JOIN (
					SELECT GROUP_CONCAT( (SELECT code FROM tbl_code WHERE code=tso.code) SEPARATOR ',' ) AS optCode, tso.s_id AS s_id FROM r_tbl_sales_options tso GROUP BY tso.s_id
				) opt
				ON opt.s_id=ts.s_id
				
		LEFT JOIN zipanda.tbl_sales_location tsl
		ON ts.s_id = tsl.s_id
		WHERE ts.status != 0
			AND ts.s_id = ${s_id}
		) sales
		LEFT JOIN tbl_sigungu ts
		ON sales.sl_location1 = ts.code
		LEFT JOIN tbl_sigungu ts2
		ON concat(sales.sl_location1,sales.sl_location2) =  ts2.code
		LEFT JOIN tbl_sigungu ts3
		ON concat(sales.sl_location1,sales.sl_location2,sales.sl_location3) = ts3.code
	`

	conn.query(queryString, (err,results,fields)=>{
		if(err){
			return res.status(400).json({err:err.message, msg:'DB Error... check [err]'})
		}
		if (results.length !== 1) {
			return res.status(404).json({msg:'Unknown item'})
		}
		return res.status(200).json({results: results, msg: 'success'})
	})
	conn.end()
});

// 상세
router.get('/detail/:s_id', (req, res, next) => {
	const s_id = req.params.s_id
	if(!s_id){
		return res.status(400).json({msg:'Invaild ID'})
	}

	const conn = mysql.createConnection({
		host     : process.env.DB_HOST,
		user     : process.env.DB_USER,
		password : process.env.DB_PWD,
		database : process.env.DB_DATABASE,
	});

	conn.connect()
	//( SELECT GROUP_CONCAT( sf_original_nm SEPARATOR ',' ) as s_files FROM r_tbl_sales_options  WHERE s_id=${s_id}  ) AS opts

	const salesQuery = `SELECT 
	
	sales.*,
	CEIL(sales.s_deposit/10000) AS deposit,
	CEIL(sales.s_trading_price/10000) AS trading_price,
	CEIL(sales.s_monthly_rent/10000) AS monthly_rent,
	CEIL(sales.s_maintenance_cost/10000) AS m_cost,
	CASE 
		WHEN (sales.s_individual_cost_yn = 'Y') THEN '있음'
		WHEN (sales.s_individual_cost_yn = 'N') THEN '없음'
		ELSE '없음'
	END AS indi_cost_yn,
	(SELECT code.string FROM tbl_code code WHERE code.code = sales.s_loan) AS loan_amt,
	(SELECT GROUP_CONCAT(code.string SEPARATOR '/' ) AS optCode  FROM r_tbl_sales_options opt, tbl_code code WHERE opt.code=code.code AND opt.s_id=sales.s_id AND code.division='admin_cost') AS admin_cost,
	(SELECT string from tbl_code WHERE code=sales.s_price_type ) as price_type_str,
	CASE
		WHEN (sales.s_price_type = 'lease') THEN '전세가'
		WHEN (sales.s_price_type = 'monthly') THEN '보증금/월세'
		WHEN (sales.s_price_type = 'sales') THEN '매매가'
		WHEN (sales.s_price_type = 'short') THEN '임대료'
		ELSE ''
	END AS price_tbl_str,
	CEIL((sales.s_monthly_rent + sales.s_maintenance_cost)/10000) AS monthly_cost,
	(SELECT sl_building_name FROM tbl_sales_location WHERE s_id=sales.s_id) AS building_name,

	(SELECT code.string FROM tbl_code code WHERE code.code = sales.s_building_type) as building_type,
	(SELECT code.string FROM tbl_code code WHERE code.code = sales.s_sale_type) as sale_type,

	CASE
		WHEN (sales.s_room_type = 0) THEN '오픈형'
		WHEN (sales.s_room_type = 1) THEN '분리형'
		ELSE ''
	END AS room_type,

	
	CASE
		WHEN (sales.s_room_direction_from = 0) THEN '안방'
		WHEN (sales.s_room_direction_from = 1) THEN '거실'
		ELSE ''
	END AS room_direction_from,

	CASE
		WHEN (sales.s_room_direction = 1) THEN '동'
		WHEN (sales.s_room_direction = 2) THEN '서'
		WHEN (sales.s_room_direction = 3) THEN '남'
		WHEN (sales.s_room_direction = 4) THEN '북'
		WHEN (sales.s_room_direction = 5) THEN '남동'
		WHEN (sales.s_room_direction = 6) THEN '남서'
		WHEN (sales.s_room_direction = 7) THEN '북서'
		WHEN (sales.s_room_direction = 8) THEN '북동'
		ELSE ''
	END AS room_direction,

	CASE
		WHEN (sales.s_door_type = 1) THEN '계단식'
		WHEN (sales.s_door_type = 2) THEN '복도식'
		WHEN (sales.s_door_type = 3) THEN '복합식'
	END AS door_type,

	(SELECT sl_address1 FROM tbl_sales_location WHERE s_id=sales.s_id) AS address1,
	(SELECT sl_address2 FROM tbl_sales_location WHERE s_id=sales.s_id) AS address2,

	app.*,
	app_detail.*,

	member.m_name,
	member_contact.*

	FROM 
		tbl_sales sales, 
		tbl_sales_appointment app, 
		tbl_sales_appointment_details app_detail, 
		tbl_member member, 
		tbl_member_contact member_contact
	WHERE
	 sales.s_id =${s_id} AND 
	 app.s_id=sales.s_id AND 
	 app.sa_id=app_detail.sa_id AND 
	 member.m_id=sales.m_id AND
	 member.m_id=member_contact.m_id `;

	
	conn.query(salesQuery, (err,results,fields)=>{
		
		if(err){
			return res.status(400).json({err:err.message, msg:'DB Error... check [err]'})
		}
		if (results.length <= 0) {

			const fileQuery = `SELECT sf_original_nm SEPARATOR as s_files FROM tbl_sales_file  WHERE s_id=${s_id}`;
			conn.query(fileQuery, (err,fileResult,fields)=>{
				
				if(err){
					return res.status(400).json({err:err.message, msg:'DB Error... check [err]'})
				}
				else {
					if (fileResult.length <= 0) {
						return res.status(404).json({message:'데이터가 없습니다.'})
					}else {
						results["files"] = fileResult;
						return res.status(200).json({sales: results, msg: 'success'})
					}
						
				}
			
			})

			return res.status(404).json({message:'데이터가 없습니다.'})
		}else {
			return res.status(200).json({data: results, msg: 'success'})
		}
		
	})
});




// 이미지 파일 받기
router.get('/imgs/:s_id', (req, res, next) => {
	console.log("imgs");

	
	const s_id = req.params.s_id

	const conn = mysql.createConnection({
		host     : process.env.DB_HOST,
		user     : process.env.DB_USER,
		password : process.env.DB_PWD,
		database : process.env.DB_DATABASE,
	});

	conn.connect()

	const query =`SELECT * FROM tbl_sales_file WHERE s_id=${s_id}`;
	if(!s_id){
		return res.status(400).json({msg:'Invaild ID'})
	}


	conn.query(query, (err,results,fields)=>{
		console.log(results);
			//console.log(results[index]);
		if(err){
			return res.status(400).json({err:err.message, msg:'DB Error... check [err]'})
		}
		else {
			console.log(results);
			if (results.length <= 0) {
				return res.status(404).json({message:'데이터가 없습니다.'})
			}else {
				return res.status(200).json({data: results, msg: 'success'})
			}
					
		}
		
	})
		
	
	
})

// 옵션 받기
router.get('/opt/:s_id', (req, res, next) => {
	const s_id = req.params.s_id

	if(!s_id){
		return res.status(400).json({msg:'Invaild ID'})
	}
	
	const conn = mysql.createConnection({
		host     : process.env.DB_HOST,
		user     : process.env.DB_USER,
		password : process.env.DB_PWD,
		database : process.env.DB_DATABASE,
	});

	conn.connect()

	const query =`SELECT code.string AS string, code.icon_url AS icon_url, rtso.* FROM r_tbl_sales_options rtso, tbl_code code WHERE rtso.s_id=${s_id} AND rtso.code=code.string`;
	if(!s_id){
		return res.status(400).json({msg:'Invaild ID'})
	}

	conn.query(query, (err,results,fields)=>{
		//console.log(results);
			//console.log(results[index]);
			if(err){
				return res.status(400).json({err:err.message, msg:'DB Error... check [err]'})
			}
			else {
				if (results.length <= 0) {
					return res.status(404).json({message:'데이터가 없습니다.'})
				}else {
					return res.status(200).json({data: results, msg: 'success'})
				}
					
			}
		
		})
		
})

// 태그 받기
router.get('/tags/:s_id', (req, res, next) => {
	const s_id = req.params.s_id

	if(!s_id){
		return res.status(400).json({msg:'Invaild ID'})
	}

	const conn = mysql.createConnection({
		host     : process.env.DB_HOST,
		user     : process.env.DB_USER,
		password : process.env.DB_PWD,
		database : process.env.DB_DATABASE,
	});

	conn.connect()

	const query =`SELECT tags.st_title AS string, r_tags.st_id FROM r_tbl_sales_tags r_tags, tbl_sales_tags tags WHERE r_tags.s_id=${s_id} AND r_tags.st_id=tags.st_id;`;
	if(!s_id){
		return res.status(400).json({msg:'Invaild ID'})
	}

	conn.query(query, (err,results,fields)=>{
		//console.log(results);
			//console.log(results[index]);
			if(err){
				return res.status(400).json({err:err.message, msg:'DB Error... check [err]'})
			}
			else {
				if (results.length <= 0) {
					return res.status(404).json({message:'데이터가 없습니다.'})
				}else {
					return res.status(200).json({data: results, msg: 'success'})
				}
					
			}
		
		
		
	})
})

// 가능시간 받기
router.get('/avl_time/:s_id', (req, res, next) => {
	const s_id = req.params.s_id

	if(!s_id){
		return res.status(400).json({msg:'Invaild ID'})
	}
	

	const conn = mysql.createConnection({
		host     : process.env.DB_HOST,
		user     : process.env.DB_USER,
		password : process.env.DB_PWD,
		database : process.env.DB_DATABASE,
	});

	conn.connect()

	const query =`SELECT tags.st_title AS string, r_tags.st_id FROM r_tb._sales_tags r_tags, tbl_sales_tags tags WHERE r_tag.s_id=${s_id} AND r_tags.st_id=tags.st_id`;
	if(!s_id){
		return res.status(400).json({msg:'Invaild ID'})
	}

	conn.query(query, (err,results,fields)=>{
		//console.log(results);
			//console.log(results[index]);
			if(err){
				return res.status(400).json({err:err.message, msg:'DB Error... check [err]'})
			}
			else {
				if (results.length <= 0) {
					return res.status(404).json({message:'데이터가 없습니다.'})
				}else {
					return res.status(200).json({data: results, msg: 'success'})
				}
					
			}
		
		
		
	})


})
/*
// 편의시설 받기
router.get('/convi/:s_id', (req, res, next) => {
	const s_id = req.params.s_id

	if(!s_id){
		return res.status(400).json({msg:'Invaild ID'})
	}
	if(!s_id){
		return res.status(400).json({msg:'Invaild ID'})
	}
})

// 안전시설 받기
router.get('/security/:s_id', (req, res, next) => {
	const s_id = req.params.s_id

	if(!s_id){
		return res.status(400).json({msg:'Invaild ID'})
	}
	if(!s_id){
		return res.status(400).json({msg:'Invaild ID'})
	}
})

// 학군정보 받기
router.get('/school/:s_id', (req, res, next) => {
	const s_id = req.params.s_id

	if(!s_id){
		return res.status(400).json({msg:'Invaild ID'})
	}
	if(!s_id){
		return res.status(400).json({msg:'Invaild ID'})
	}
})
*/

// 좋아요 받기
router.get('/like/:s_id/:m_id', (req, res, next) => {
	const s_id = req.params.s_id
	const m_id = req.params.m_id

	if(!s_id){
		return res.status(400).json({msg:'Invaild ID'})
	}

	const conn = mysql.createConnection({
		host     : process.env.DB_HOST,
		user     : process.env.DB_USER,
		password : process.env.DB_PWD,
		database : process.env.DB_DATABASE,
	});

	conn.connect()
	const query =`SELECT COUNT(*) cnt FROM tbl_member_like_sale WHERE s_id=${s_id} AND m_id=${m_id} `;
	conn.query(query, (err,results,fields)=>{
		//console.log(results);
			//console.log(results[index]);
			if(err){
				return res.status(400).json({err:err.message, msg:'DB Error... check [err]'})
			}
			else {
				if (results.length <= 0) {
					return res.status(404).json({message:'데이터가 없습니다.'})
				}else {
					console.log(results);
					return res.status(200).json({data: results, msg: 'success'})
				}
					
			}
	})	
});

// 좋아요 클릭 
router.post('/like', (req, res, next) => {
	const s_id = req.body.s_id
	const m_id = req.body.m_id
	console.log(req.body);

	
	if(!s_id){
		return res.status(400).json({msg:'Invaild ID'})
	}

	const conn = mysql.createConnection({
		host     : process.env.DB_HOST,
		user     : process.env.DB_USER,
		password : process.env.DB_PWD,
		database : process.env.DB_DATABASE,
	});

	conn.connect()

	const query =`INSERT INTO tbl_member_like_sale SET m_id=${m_id}, s_id=${s_id}, mod_date=now() `;
		console.log(query);
	conn.query(query, (err,results,fields)=>{
		//console.log(results);
			//console.log(results[index]);
			if(err){
				return res.status(400).json({err:err.message, msg:'DB Error... check [err]'})
			}
			else {
				if (results.length <= 0) {
					return res.status(404).json({message:'데이터가 없습니다.'})
				}else {
					
					return res.status(200).json({data: results, msg: 'success'})
				}
					
			}
	})	
	
});

// 좋아요 취소 
router.delete('/like', (req, res, next) => {
	const s_id = req.body.s_id
	const m_id = req.body.m_id
	console.log("좋아요 삭제=============================================");
	console.log(req.body);

	
	if(!s_id){
		return res.status(400).json({msg:'Invaild ID'})
	}

	const conn = mysql.createConnection({
		host     : process.env.DB_HOST,
		user     : process.env.DB_USER,
		password : process.env.DB_PWD,
		database : process.env.DB_DATABASE,
	});

	conn.connect()

	const query =`DELETE FROM tbl_member_like_sale WHERE m_id=${m_id} AND s_id=${s_id} `;
	conn.query(query, (err,results,fields)=>{
		//console.log(results);
			//console.log(results[index]);
			if(err){
				return res.status(400).json({err:err.message, msg:'DB Error... check [err]'})
			}
			else {
				if (results.length <= 0) {

					return res.status(404).json({message:'데이터가 없습니다.'})
				}else {
					
					return res.status(200).json({data: results, msg: 'success'})
				}
					
			}
	})	
	
});







router.delete('/:s_id', (req, res, next) => {
	const s_id = req.params.s_id
	
	if(!s_id){
		return res.status(400).json({msg:'Invaild ID'})
	}

	const conn = mysql.createConnection({
		host     : process.env.DB_HOST,
		user     : process.env.DB_USER,
		password : process.env.DB_PWD,
		database : process.env.DB_DATABASE,
	});

	conn.connect()
	conn.query(`DELETE FROM tbl_sales WHERE s_id = ${s_id}`, (err,results,fields)=>{
		if(err){
			return res.status(400).json({err:err.message, msg:'DB Error... check [err]'})
		}
		if(results.affectedRows == 0){
			return res.status(200).json({msg: 'success, no rows deleted'})
		}else{
			return res.status(200).json({msg: 'success'})
		}
	})
	conn.end()

});

router.post('/', (req, res, next) => {

	const req_params = ['m_id', 's_reg_type']
	// const req_params = [ 'm_id', 's_reg_type', 's_structure_type', 's_price_type', 's_maintenance_cost', 's_area', 's_floor', 's_rooms', 's_bathrooms', 's_build_year', 's_parking', 's_approval_status', 's_delete_request_date', 's_approval_date', 'reg_date', 'mod_date', 'status']

	const least_params = [ 's_deposit', 's_monthly_rent', 's_trading_price', 's_maintenance_cost' ]

	const m_id = req.body.m_id

	if(!m_id){
		return res.status(400).json({msg:'missing required parameter(s)'})
	}

	// const query = `
	// 	INSERT tbl_sales
	// 	SET
	// 		m_id = 1,
	// 		reg_date = now(),
	// 		status = 1
	// `

	return res.status(200).json({msg:'success'})
});

module.exports = router;