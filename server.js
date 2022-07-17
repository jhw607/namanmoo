const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mysql = require("mysql2/promise");
const path = require('path');
const nodeGeocoder = require('node-geocoder');
const app = express();
const PORT = process.env.PORT || 4000;

/* console.log depth에 필요 */
let util = require('util');
const { send } = require("process");
// const { off } = require("process");

/* 구글 map api */
const options = {
    provider: 'google',
    apiKey: 'AIzaSyAHZxHAkDSHoI-lJDCg5YfO7bLCFiRBpaU' // 요놈 넣어만 주면 될듯?
};
const geocoder = nodeGeocoder(options);


const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "qwer1234",
    database: "gig_time"
});
  

// const con = mysql.createConnection({
//     host: "localhost",
//     user: "root",
//     password: "qwer1234",
//     database: "gig_time",
// });

// con.connect(function(err) {
//     if (err) throw err;
//     console.log('Connected!');
// });

app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());
app.use(bodyParser.json());

app.get("/", (req, res) => {
    res.send({ hello: "Hello react" });
});

/********************************************************
 *                        login                         *
 *******************************************************/

/* 이미 가입된 email인지 체크 */
/* 
	data form: 
  {
    'email': 'dngp93@gmail.com'
  }
*/
// app.post('/check/member', (req, res) => {
//     /* 우선 owners db 확인 (더 적으니까) */
//     const sql = `SELECT * FROM owners WHERE email=?`;
//     con.query(sql, req.body['email'], function(err, result, field) {
//         if (result.length === 0) {
//             /* owners에 없으니 workers 확인 */
//             const sql2 = `SELECT * FROM workers WHERE email=?`;
//             con.query(sql2, req.body['email'], function(err, result2, field) {
//                 if (result2.length === 0) res.send('NONE');
//                 else res.send('worker');
//             })
//         } else res.send('owner');
//     })
// });

/********************************************************
 *                        worker                        *
 *******************************************************/

/* name, email 정보 전달 받아서 worker table에 insert 
  data form === 
  {
		'name': 'kantwang',
		'email': 'dngp93@gmail.com',
		'location': '서울시 관악구 성현동 블라블라',
		'range': 234
  } */
// app.post('/worker/signup', getPos, (req, res) => {
//     console.log(req.body);
//     const sql = "INSERT INTO workers SET ?";

//     con.query(sql, req.body, function(err, result, field) {
//         if (err) throw err;
//         console.log(result);

//         const sql2 = "SELECT worker_id FROM workers WHERE email=?";
//         con.query(sql2, req.body['email'], function(err, result2, field) {
//             if (err) throw err;
//             /* signup 결과로 worker_id send */
//             res.send(result2[0]['worker_id'].toString());
//         })
//     })
// })

/* worker의 email을 받아서 id를 return */
/*
  data form
  {
    'email': 'dngp93@gmail.com'
  }
*/
// app.post('/worker/id', (req, res) => {
//     const sql = "SELECT worker_id FROM workers WHERE email=?";

//     con.query(sql, req.body['email'], function(err, result, field) {
//         if (err) throw err;
//         res.send(result[0]['worker_id'].toString());
//     })
// })


/* 주소 정보 전달 받아서 worker table update
  data form === 
  {
    'email': 'dngp93@gmail.com', 
    'location': '서울시 관악구 성현동'
  } */


// app.post('/store/info', async (req, res, next) => {
// const con = await pool.getConnection(async conn => conn);

// /* 먼저, owners 테이블에서 owner_id 가져오기 */
// try {
//     const sql = "SELECT owner_id FROM owners WHERE email=?";
//     const [result] = await con.query(sql, req.body['email']);
//     req.body['owner_id'] = result[0]['owner_id'];
//     console.log(result[0])
//     next();
// }
// catch {
//     res.send('error');
// }
// })
/******************************************************************8*/
// getPos에서 lat, long 계산해서 req에 넣어줌
app.post('/worker/location/update', getPos, async (req, res, next) => {
    const con = await pool.getConnection(async conn => conn);
    try{        
        const sql = "UPDATE workers SET location=?, latitude=?, longitude=? WHERE email=?";
        const [result] = await con.query(sql, [req.body['location'], req.body['latitude'], req.body['longitude'], req.body['email']])
        console.log('end of post');
        next();
        // res.send('success');
    }
    catch{
        res.send('error - update workers');        
    }
})
app.use('/worker/location/update', async (req, res) => {
    const con = await pool.getConnection(async conn => conn);
    console.log('start use');
    let msg = "";
    // console.log('msg?');
    try{
        // console.log('try?');
        msg = "select worker_id";
        // console.log('msg?');
        const sql = `SELECT worker_id from workers where email='${req.body['email']}';`;
        const [result] = await con.query(sql);
        console.log('result:',result);

        msg = 'create store_list';
        const sql_store_list = `CREATE OR REPLACE VIEW ${result[0]['worker_id']}_store_list AS 
        select store_id as list_id, name, minimum_wage, get_distance(latitude, ${req.body['latitude']}, longitude-${req.body['longitude']}) AS distance
        from stores;`;
        const [result_store_list] = await con.query(sql_store_list);
        console.log(result_store_list);
        
        msg = 'create store_qualified';
        const sql_store_qualified = `create or replace view ${result[0]['worker_id']}_store_qualified as
        select a.store_id, a.name, a.description, a.logo, a.background, a.address, b.name owner_name, b.phone
        from stores a, owners b, ${result[0]['worker_id']}_store_list c
        where c.distance < 1000 and a.name = c.name and a.FK_stores_owners = b.owner_id 
        and a.store_id not in (select FK_qualifications_stores from qualifications where FK_qualifications_workers = ${result[0]['worker_id']}); `;
        const [result_store_qualified] = await con.query(sql_store_qualified);        
        console.log(result_store_qualified);
        
        msg = 'create store_unqualified';
        const sql_store_unqualified = `create or replace view ${result[0]['worker_id']}_store_unqualified as
        select a.store_id, a.name, a.description, a.logo, a.background, a.address, b.name owner_name, b.phone
        from stores a, owners b, ${result[0]['worker_id']}_store_list c
        where c.distance < 1000 and a.name = c.name and a.FK_stores_owners = b.owner_id 
        and a.store_id not in (select FK_qualifications_stores from qualifications where FK_qualifications_workers = ${result[0]['worker_id']}); `;
        const [result_store_unqualified] = await con.query(sql_store_unqualified);        
        console.log(result_store_unqualified);
        
        // msg = 'create order_list';
        // const sql_order_list = `create or replace view ${result[0]['worker_id']}_order_list as
        // select c.name, a.order_id, a.min_price, a.max_price, b.hourlyorders_id, b.work_date, b.start_time, b.dynamic_price, d.type
        // from orders a, hourly_orders b, ${result[0]['worker_id']}_store_list c, jobs d
        // where c.distance < 1000 and a.order_id = b.FK_hourlyorders_orders and a.FK_orders_jobs = d.job_id 
        // and a.FK_orders_stores = c.list_id in (select FK_qualifications_stores from qualifications where FK_qualifications_workers = ${result[0]['worker_id']}); `;
        // const [result_order_list] = await con.query(sql_order_list);
        // console.log(result_order_list);
        
        msg = 'create order_list';
        const sql_order_list = `create or replace view ${result[0]['worker_id']}_order_list as
        select c.name, a.order_id, a.min_price, a.max_price, 
        b.hourlyorders_id, b.work_date, b.start_time, b.dynamic_price, d.type
        from orders a 
        join hourly_orders b on a.order_id = b.FK_hourlyorders_orders
        join ${result[0]['worker_id']}_store_qualified c on a.FK_orders_stores = c.store_id
        join jobs d on a.FK_orders_jobs = d.job_id; `;
        const [result_order_list] = await con.query(sql_order_list);
        console.log(result_order_list);
        
        res.send('success');
    }
    catch{
        res.send(`error - ${msg}`);
        console.log('catch');
    }
});

/* 거리 정보 전달 받아서 worker table update
   data form === 
  {
    'worker_id': 1, 
    'range': 424
  } */
// app.post('/worker/range/update', (req, res) => {
//     const sql = "UPDATE workers SET range=? WHERE worker_id=?";
//     con.query(sql, req.body, function(err, result, field) {
//         if (err) throw err;
//         console.log(result);
//         res.send('success');
//     })
// })

// /* worker의 location 정보 send */
// app.post('/worker/location', (req, res) => {
//     const sql = "SELECT `location` FROM workers WHERE email=?";
//     con.query(sql, req.body['email'], function(err, result, field) {
//         if (err) throw err;
//         console.log(result);
//         res.send(result[0]['location']);
//     })
// });

// /* worker의 range 정보 send */
// app.post('/worker/range', (req, res) => {
//     const sql = "SELECT `range` FROM workers WHERE email=?";
//     con.query(sql, req.body['email'], function(err, result, field) {
//         if (err) throw err;
//         console.log(result);
//         res.send(result[0]['range'].toString()); // string 형태로만 통신 가능
//     })
// });

/* 알바 예약 페이지 */
/* 페이지 로딩 시 뿌려주는 데이터 */


/* 
{
  'worker_id': 2,
  'order_id': 2, 
  'work_date': '2022-08-20', 
//   'type': '설거지'
} */
app.post('/worker/reservation/list', async (req, res) => {
    const con = await pool.getConnection(async conn => conn);
    let msg = '';
    // let work_date = masage_date(req.body['work_date']);
    const worker_id = req.body['worker_id'];
    const order_id = req.body['order_id'];
    let work_date = req.body['work_date'];
    // console.log(req.body);

    try{
        // 1. store_id 찾아서        
        msg = 'select store_id';
        const sql = `SELECT FK_orders_stores FROM orders where order_id = ${order_id};`;
        const [result] = await con.query(sql);
        // console.log('result : ',result);
        
        // 2. qualified에서 store정보 가져오고
        msg = 'select qualified';
        const sql_qualified = `select * from ${worker_id}_store_qualified where store_id = ${result[0]['FK_orders_stores']};`;
        const [result_qualified] = await con.query(sql_qualified);
        // console.log('result_qualified : ', result_qualified);
        
        let store = {
            'name': result_qualified[0]['name'],
            'address': result_qualified[0]['address'],
            'description': result_qualified[0]['description'],
            'logo': result_qualified[0]['logo'],
            'background': result_qualified[0]['background'],
            'owner_name': result_qualified[0]['owner_name'],
            'owner_phone': result_qualified[0]['phone']
        };

        // console.log('store : ', store);

        // 3. order_list에서 order정보 가져오고
        msg = 'select order_list';
        const sql2 = `SELECT hourlyorders_id, dynamic_price, min_price, max_price, start_time, type FROM ${worker_id}_order_list
        WHERE order_id=${req.body['order_id']} AND work_date='${work_date}';`;
        const [orders] = await con.query(sql2);
        // console.log(orders);

        // let order = {
        //     'hourlyorders_id': result2[0]['hourlyorders_id'],
        //     'min_price': result2[0]['min_price'],
        //     'max_price': result2[0]['max_price'],
        //     'start_time': result2[0]['start_time'],
        //     'dynamic_price': result2[0]['dynamic_price'],
        //     'type': result2[0]['type']
        // }

        // console.log('order : ', orders);
        res.send({'store':store, 'order':orders});
    }
    catch{
        res.send(`error - ${msg}`);
    }
    
})

// /* ~~~Z 형식의 String date를 인자로 넣으면 2022-08-11 형식의 String 반환 */
// function masage_date(date_timestamp) {
//     let date = new Date(date_timestamp);
//     let year = date.getFullYear().toString();
//     let month = (date.getMonth() + 1).toString();
//     let day = date.getDate().toString();

//     if (month.length === 1)
//         month = '0' + month;

//     if (day.length === 1)
//         day = '0' + day;

//     return (year + '-' + month + '-' + day);
// }

// /* 알바 예약 페이지 */
// /* 예약하기 클릭 시 hourly_orders 테이블에 worker_id 기입, closing_time 기입 */
// /* 한 order의 hourly_orders가 전부 예약 되었다면, order의 status=1로 UPDATE */
// /* 
// {
//     'worker_id': 2, 
//     'hourlyorders_id': [5, 6, 7, 8, 9]
// } */
// app.post('/worker/reservation/save', (req, res) => {
//     // console.log(req.body);
//     const sql = "UPDATE hourly_orders SET FK_hourlyorders_workers=?, closing_time=? WHERE hourlyorders_id=?";
//     console.log(req.body['hourlyorder_id'].length - 1);
//     for (let i = 0; i < req.body['hourlyorder_id'].length; i++) {
//         let tmp = new Date().getTime();
//         let timestamp = new Date(tmp);
//         con.query(sql, [req.body['worker_id'], timestamp, req.body['hourlyorder_id'][i]], function(err, result, field) {
//             if (err) throw err;
//             /* 수정필요. 이렇게 매 번 확인할 필요 없다. 끝나고 한 번만 하는 방법은? */
//             check_all_hourlyorders_true(req.body['hourlyorder_id'][0]);
//         })
//     }
//     res.send('success');
// })


/* 알바 모집 정보 return (지정 거리 이내)
   data form === 
  {
    'worker_id': 1
  } */
app.post('/worker/show/hourly_orders', async(req, res) => {
    const con = await pool.getConnection(async conn => conn);
    let msg = '';
    const worker_id = req.body['worker_id'];
    try{
        msg = 'select range';
        const sql ='SELECT `range` FROM workers WHERE worker_id=?';
        const [result] = await con.query(sql, worker_id);
        // console.log('result: ',result);
        
        msg = 'select order_list';
        const sql_orders = `select * from ${worker_id}_order_list a join ${worker_id}_store_list b on a.name = b.name where b.distance < ${result[0]['range']};`;
        const [valid_hourly_orders] = await con.query(sql_orders);
        // console.log('valid: ', valid_hourly_orders);
        /* worker의 latitude, longitude 가져오기 */
        msg = 'masage data';
        let orders = await masage_data(valid_hourly_orders);
            
        // console.log('orders: ', orders);
        res.send(orders);
    }
    catch{
        res.send(`error - ${msg}`);
    }

});

// /* 최적의 알바 추천 */
// /* 
//   data form
//   {
//     'worker_id': 1,
//     'work_date': '2022-08-20',
//     'start_times': 
//       [
//         "2022-08-20 10:00:00", 
//         "2022-08-20 11:00:00",
//         "2022-08-20 12:00:00"
//       ]
//   }
// */
// app.post('/worker/suggestion', (req, res) => {
//     /* 
//       hourly_orders 테이블고 orders 테이블을 JOIN 한 후, 
//       work_date와 worker_id, start_time 그리고 worker가 권한을 가지고 있는 store로 필터하여 SELECT
//     */
//     const sql = `SELECT * FROM hourly_orders A 
//                 INNER JOIN orders B ON A.FK_hourlyorders_orders = B.order_id
//                 INNER JOIN stores C ON B.FK_orders_stores = C.store_id
//                 WHERE A.FK_hourlyorders_workers IS Null AND A.work_date=? AND A.start_time IN (?) 
//                 AND B.FK_orders_stores IN
//                 (SELECT store_id FROM stores WHERE store_id IN 
//                   (SELECT FK_qualifications_stores FROM qualifications 
//                     WHERE FK_qualifications_workers=?))`;
//     con.query(sql, [req.body['work_date'], req.body['start_times'], req.body['worker_id']], function(err, result, field) {
//         console.log(result);
//         suggestion(req.body['worker_id'], result, req.body['start_times']);
//     })
// })

// function suggestion(worker_id, hourly_orders, start_times) {
//     // console.log(worker_id);
//     const sql = "SELECT `range`, `latitude`, `longitude` FROM workers WHERE worker_id=?"
//     con.query(sql, worker_id, function(err, result, field) {
//         let range = result[0]['range'];
//         let latitude = result[0]['latitude'];
//         let longitude = result[0]['longitude'];
//         let n = start_times.length;
//     })
// }

// /********************************************************
//  *                        store                         *
//  *******************************************************/

/* 면접 가능한 매장 정보를 return (지정 거리 이내) 
  data form === 
  {
    'worker_id': 1
  } */
app.post('/store/list', async (req, res, next) => {
    const con = await pool.getConnection(async conn => conn);
    let msg = '';
    const worker_id = req.body['worker_id'];
    try{
        /* 해당 worker의 위도, 경도, 거리 설정 정보 가져오기 */
        msg = 'select range';
        const sql ='SELECT `range` FROM workers WHERE worker_id=?';
        const [result] = await con.query(sql, worker_id);
        // req.body['worker_range'] = result[0]['range'];
        console.log('result:',result);
        
        msg = 'select unqualified';
        const sql_unqualified =`select * from ${worker_id}_store_unqualified a join ${worker_id}_store_list b on a.store_id = b.list_id 
        where b.distance < ${result[0]['range']} ;`;
        const [result_unqualified] = await con.query(sql_unqualified);

        // res.send(result_unqualified);
        console.log('result_unqualified:',result_unqualified);      

        n = result_unqualified.length;
        console.log(n);
        let store = []
        for(i=0; i<n; i++){
            respon = {
                "store_id": result_unqualified[i]['store_id'],
                "name": result_unqualified[i]['name'],
                "address": result_unqualified[i]['address'],
                "description": result_unqualified[i]['description'],
                "logo": result_unqualified[i]['logo'],
                "minimum_wage": result_unqualified[i]['minimum_wage'],
                "distance": result_unqualified[i]['distance']
                // "owner_name": result_unqualified[i]['owner_name'],
                // "owner_phone": result_unqualified[i]['phone']
                // "background": result_unqualified[i]['background'],
            }
            store.push(respon);
            // console.log(i);
            // console.log(store[i]);
            // console.log(result_unqualified[i]);
        }
        console.log(store);
        res.send(store);
        // next();
    }
    catch{
        res.send(`error - ${msg}`);
    }
});


// /********************************************************
//  *                        owner                         *
//  *******************************************************/

// /* owner db에 사장님 회원정보 INSERT & store db에 가게정보 INSERT */
// /* data form: {
// 	'name': 'kantwang', 
// 	'email': 'dngp93@gmail.com',
// 	'store_name': '보리누리',
// 	'store_location': '인천 서구 심곡동',
// 	'latitude': 37.0124,
// 	'longitude': 170.4567,
// 	'store_jobs': ['서빙', '카운터', '주방', '청소'],
// 	'background': (양식에 맞게),
// 	'logo': (양식에 맞게),
// 	'description': "보리누리 많이 사랑해주세요",
// 	'minimum_wage': 10200,
// 	'phone': '01089570356'
// } */
// app.post('/owner/signup', (req, res) => {
//     /* owners db에 name, eamil, phone INSERT */
//     const sql = "INSERT INTO owners SET name=?, email=?, phone=?";
//     con.query(sql, [req.body['name'], req.body['email'], req.body['phone']], function(err, result, field) {
//         if (err) throw err;

//         /* owner_id SELECT */
//         const sql2 = "SELECT owner_id FROM owners WHERE email=?";
//         con.query(sql2, req.body['email'], function(err, result2, field) {
//             if (err) throw err;

//             /* stores db에 INSERT */
//             const sql3 = `INSERT INTO stores SET ?`;
//             let tmp = {
//                 'FK_stores_owners': result2['owner_id'],
//                 'name': req.body['store_name'],
//                 'address': req.body['store_location'],
//                 'latitude': req.body['latitude'],
//                 'longitude': req.body['longitude'],
//                 'description': req.body['description'],
//                 'minimum_wage': req.body['minimum_wage']
//             }
//             con.query(sql3, tmp, function(err, result3, field) {
//                 if (err) throw err;
//                 res.send('success');
//             })
//         })
//     })
// })

// /********************************************************
//  *                      function                        *
//  *******************************************************/

// /* worker가 설정한 반경 이내의 가게 정보를 return */
// function getStore(store_list, stores_info) {
//     const n = stores_info.length;
//     let answer = new Array();
//     let tmp = 0;

//     /* 이렇게 짜면 너무 너무 비효율적이다 */
//     /* db 구조를 바꿔야 하나? 아니면, 탐색 방식을 개선? */
//     for (let i = 0; i < n; i++) {
//         tmp = getDistance(dist);
//         if (tmp <= worker_info[0]['range']) {
//             stores_info[i]['distance'] = getDistance(dist);
//             answer.push(stores_info[i]);
//         }
//     }

//     return answer;
// }

/* 주변일감 페이지 */
/* front에 전달할 data 전처리 */
function masage_data(data) {
    let d;
    let len = data.length;
    let databox = [];
    let check = {};
    let count = 0;

    for (let i = 0; i < len; i++) {
        d = data[i];

        /* 가게 이름이 없으면 새로 만들기 */
        if (!check.hasOwnProperty(d['name'])) {
            databox.push({
                'name': d['name'],
                'minimum_wage': d['minimum_wage'],
                'distance': d['distance'],
                'key': [],
                'work_date_and_type_and_id': {}
            });
            check[d['name']] = count;
            count += 1;
        }

        /* work_date_and_type가 없으면 새로 만들기 */
        if (!databox[check[d['name']]]['work_date_and_type_and_id'].hasOwnProperty([d['work_date'], d['type'], d['order_id']])) {
            databox[check[d['name']]]['work_date_and_type_and_id'][
                [d['work_date'], d['type'], d['order_id']]
            ] = {
                'min_price': d['min_price'],
                'max_price': d['max_price'],
                'start_time_and_id': Array()
            };

            /* 이렇게라도 검색할 수 있게 key 목록을 주자.. */
            let date = new Date(d['work_date']);
            let n = date.getTimezoneOffset();
            // databox[check[d['name']]]['key'].push([(d['work_date'] + n).split('-')[0], d['type'], d['order_id']]);
            databox[check[d['name']]]['key'].push([d['work_date'], d['type'], d['order_id']]);
        }

        /* start_time이 없으면 새로 만들기 */
        if (!databox[check[d['name']]]['work_date_and_type_and_id'][
                [d['work_date'], d['type'], d['order_id']]
            ]['start_time_and_id'].hasOwnProperty([d['start_time'], d['hourlyorders_id']])) {
            databox[check[d['name']]]['work_date_and_type_and_id'][
                [d['work_date'], d['type'], d['order_id']]
            ]['start_time_and_id'].push([d['start_time'], d['hourlyorders_id']]);
        }
    }
    console.log(util.inspect(databox, { depth: 20 }));
    return databox;
}

// /* 두 개의 좌표 간 거리 구하기 */
// function getDistance(dist) {
//     if ((lat1 == lat2) && (lon1 == lon2)) return 0;

//     dist = Math.acos(dist);
//     dist = dist * 180 / Math.PI;
//     dist = dist * 60 * 1.1515 * 1.609344 * 1000;

//     if (dist < 100) dist = Math.round(dist / 10) * 10;
//     else dist = Math.round(dist / 100) * 100;

//     return dist;
// }

/* 두 좌표 간 거리 구하기 */
/* 미들웨어 사용 (맞나?) */
async function getPos(req, res, next) {
    console.log(req.body['location']);
    const regionLatLongResult = await geocoder.geocode(req.body['location']);
    // console.log(regionLatLongResult);
    const Lat = regionLatLongResult[0].latitude; //위도
    const Long = regionLatLongResult[0].longitude; //경도

    req.body['latitude'] = Lat;
    req.body['longitude'] = Long;
    console.log('end of getPos');
    next();
}

// /* order의 모든 hourlyorder가 예약 된 경우, order의 status=1로 변경 */
// function check_all_hourlyorders_true(hourlyorders_id) {
//     console.log('start check!');

//     /* 우선 hourlyorders_id에 딸린 FK_hourlyorders_orders를 찾아옴 */
//     const sql = `SELECT FK_hourlyorders_orders FROM hourly_orders WHERE hourlyorders_id=?`;
//     con.query(sql, hourlyorders_id, function(err, result, field) {
//         let order_id = result[0]['FK_hourlyorders_orders'];

//         /* 이제 order_id에 해당하는 hourly_order를 모두 SELECT (아직 예약되지 않은 것만) */
//         const sql2 = `SELECT * FROM hourly_orders WHERE FK_hourlyorders_orders=? AND closing_time IS Null`
//         con.query(sql2, order_id, function(err, result2, field) {
//             if (err) throw err;
//             console.log(result2);
//             /* 만약 SELECT 된 것이 없다면 (모두 예약된 상태라면) */
//             if (result2.length === 0) {
//                 /* orders table의 status=1로 업데이트 */
//                 const sql3 = `UPDATE orders SET status=1 WHERE order_id=?`;
//                 con.query(sql3, order_id, function(err, result3, field) {
//                     if (err) throw err;
//                     console.log('status is updated');
//                 })
//             }
//         });
//     })
// };

// --------------------------------------------------------------------------------
// 장혜원 나와바리
// --------------------------------------------------------------------------------
// 알바예약페이지
// order_id : 1
// worker_id, order_id
app.post('/reserve/load_store', async (req, res) => {
    const con = await pool.getConnection(async conn => conn);
    let msg = '';
    const worker_id = req.body['worker_id'];
    const order_id = req.body['order_id'];
    
    try{
        msg = 'select store_id';
        const sql = `SELECT FK_orders_stores FROM orders where order_id = ${order_id};`;
        const [result] = await con.query(sql);
        console.log('result : ',result);
        
        msg = 'select qualified';
        const sql_qualified = `select * from ${worker_id}_store_qualified where store_id = ${result[0]['FK_orders_stores']};`;
        const [result_qualified] = await con.query(sql_qualified);
        console.log('result_qualified : ', result_qualified);
        
        let store = {
            'name': result_qualified[0]['name'],
            'address': result_qualified[0]['address'],
            'description': result_qualified[0]['description'],
            'logo': result_qualified[0]['logo'],
            'background': result_qualified[0]['background'],
            'owner_name': result_qualified[0]['owner_name'],
            'owner_phone': result_qualified[0]['phone']
        };

        console.log('store : ', store);
        res.send(store);

    }
    catch{
        res.send(`error - ${msg}`);
    }
});


// // 면접신청 페이지 - 매장정보
calendar = { 1: 31, 2: 28, 3: 31, 4: 30, 5: 31, 6: 30, 7: 31, 8: 31, 9: 30, 10: 31, 11: 30, 12: 31 };
hours = { 10: 0, 11: 1, 13: 2, 14: 3, 15: 4, 16: 5, 17: 6, 19: 7, 20: 8, 21: 9 };
times = [];
for (a = 0; a <= 31; a += 1) {
    times.push([10, 11, 13, 14, 15, 16, 17, 19, 20, 21]);
}
// worker_id,  store_id, 
app.post('/apply/load', async (req, res, next) => {
    const con = await pool.getConnection(async conn => conn);
    let msg = '';
    const worker_id = req.body['worker_id'];
    const store_id = req.body['store_id'];
    console.log('000 : ', req.body);

    try{
        // 1. unqualified에서 store정보 가져오고
        msg = 'select unqualified';
        const sql = `select * from ${worker_id}_store_unqualified where store_id = ${store_id};`;
        const [result_unqualified] = await con.query(sql);
        console.log('r : ',result_unqualified);

        req.body['store'] = {
            'name': result_unqualified[0]['name'],
            'address': result_unqualified[0]['address'],
            'description': result_unqualified[0]['description'],
            'logo': result_unqualified[0]['logo'],
            'background': result_unqualified[0]['background'],
            'owner_name': result_unqualified[0]['owner_name'],
            'owner_phone': result_unqualified[0]['phone']
        };

        console.log('body : ', req.body);
        next();
        // res.send(store);
    }
    catch{
        res.send(`error - ${msg}`);
    }
});



// 'store_id' : 1, 'interview_month' : 3
app.use('/apply/load', async (req, res) => {
    const con = await pool.getConnection(async conn => conn);

    const store_id = req.body['store_id'];
    let month = req.body['interview_month'];
    let msg = '';
    let result = [];
    let interview = {};

    try{
        // 2. interview정보 가져오고
        msg = 'select interviews'
        const sql = `SELECT a.interview_date, b.time 
                        FROM interviews AS a, interview_times AS b
                        WHERE a.FK_interviews_interview_times = b.interview_time_id 
                        AND a.FK_interviews_stores = ${store_id}`;
        const [interview_info] = await con.query(sql) 
        n = interview_info.length;
    
        for (i = 0; i < n; i += 1) { // 면접이 잡힌 날짜들
            date = String(interview_info[i]['interview_date']);
            date = date.split('T')[0];
            time = interview_info[i]['time'];
            if (interview[date]) { // 면접일자별 시간 - 예약완료
                interview[date].push(time);
            } else {
                interview[date] = [time];
            }
        }
    
        // 3. 오늘 이후로 예약 안된 날짜,시간 추출(한 달 기준)
        let today = new Date();
        year = today.getFullYear();
        if (!month)
            month = today.getMonth() + 1;
        day = today.getDate();

        for (day; day <= calendar[month]; day += 1) {
            month_str = String(month);
            day_str = String(day);
            month_str = month_str.padStart(2, '0');
            day_str = day_str.padStart(2, '0');
            new_date = `${year}-${month_str}-${day_str}`;

            if (interview[new_date]) {
                for (hour of interview[new_date]) {
                    times[day].splice(hours[hour], 1);
                }
            }
            result.push({ 'date': new_date, 'time': times[day] });
        }
        // console.log(">>>>>>>>>>>>", result);
        // return result;
        console.log(req.body);
        res.send({'store':(req.body['store']), 'result':result});
 

    }
    catch{
        res.send(`error - ${msg}`);
    }

});

// // 'interview_date' : 2022-07-18    // (날짜), 
// // 'interview_time' : 10    // (시간), 
// // 'question' : "쥐 나오나요"   // (질문)
// // 'worker_id' : 1  // (알바생id), 
// // 'store_id' : 1   // (가게id), 

// app.post('/apply/submit', (req, res) => {
//     console.log(req.body);
//     interview_date = req.body['interview_date'];
//     interview_time = req.body['interview_time'];
//     worker_id = req.body['worker_id'];
//     store_id = req.body['store_id'];
//     question = req.body['question'];

//     let today = new Date();
//     year = today.getFullYear();
//     month = today.getMonth() + 1;
//     day = today.getDate();

//     month_str = String(month);
//     day_str = String(day);
//     month_str = month_str.padStart(2, '0');
//     day_str = day_str.padStart(2, '0');

//     new_date = `${year}-${month_str}-${day_str}`;

//     console.log('interview_time: ', interview_time);
//     tmp = hours[interview_time] + 1;
//     console.log('tmp: ', tmp);
//     const check_sql = `SELECT * FROM interviews WHERE FK_interviews_interview_times = ${tmp} 
//     AND interview_date = '${interview_date}' AND FK_interviews_workers = ${worker_id};`;
//     con.query(check_sql, function(err, check_result, field) {
//         if (err) throw err;
//         console.log(check_result[0]);
//         // let timeString = check_result[0]['request_date'].toLocaleString("en-US", {timeZone: "Asia/Seoul"});
//         // console.log(check_result[0]['request_date']);
//         if (check_result[0]) {
//             // console.log('yes');
//             // response = '안됨. 다른면접있음.';
//             res.send('안됨. 다른면접있음.');
//         } else {
//             // console.log('no');
//             const sql = `INSERT INTO interviews (FK_interviews_stores, FK_interviews_workers, 
//                 request_date, interview_date, FK_interviews_interview_times, question) 
//                 VALUES (${store_id}, ${worker_id}, '${new_date}', '${interview_date}', '${tmp}', '${question}');`;
//             con.query(sql, function(err, result, field) {
//                 if (err) throw err;
//                 console.log(result);
//                 if (result) {
//                     res.send('신청 완료!'); // 메세지만 ?   
//                     // res.redirect('/');             // 홈으로  ?     
//                 }
//             });
//         }
//     })

// });

// // 마이페이지 - 면접시간표
// // 'worker_id' : 1
// app.post('/mypage/interview', (req, res) => {
//     worker_id = req.body['worker_id'];
//     cards = [];
//     // console.log(worker_id);
//     const sql = `SELECT a.FK_interviews_stores, a.interview_date, a.FK_interviews_interview_times, 
//     a.reject_flag, a.result_flag, a.link, a.state, b.name, b.address, c.time
//     From interviews as a, stores as b, interview_times as c 
//     where a.FK_interviews_stores = b.store_id and a.FK_interviews_interview_times = c.interview_time_id 
//     and FK_interviews_workers = ${worker_id} order by state, interview_date, time;`;
//     con.query(sql, function(err, result, field) {
//         if (err) throw err;
//         n = result.length;
//         pre_state = 0;

//         const worker_sql = `SELECT name FROM workers WHERE worker_id = ${worker_id};`
//         con.query(worker_sql, function(err, result_worker, field) {
//             // console.log(result_worker);
//             worker_name = result_worker[0]['name'];
//             // console.log(worker_name);
//             for (let i = 0; i < n; i++) {

//                 store_id = result[i]['FK_interviews_stores'];

//                 const type_sql = `SELECT type FROM store_job_lists JOIN jobs 
//                 ON store_job_lists.FK_store_job_lists_jobs = jobs.job_id 
//                 WHERE store_job_lists.FK_store_job_lists_stores = ${store_id};`;
//                 con.query(type_sql, async function(err, result_type, field) {

//                     if (err) throw err;

//                     date = result[i]['interview_date'].toISOString();
//                     interview_date = date.split('T')[0];
//                     interview_time = result[i]['time'];
//                     reject_flag = result[i]['reject_flag'];
//                     result_flag = result[i]['result_flag'];
//                     link = result[i]['link'];
//                     state = result[i]['state'];

//                     store_name = result[i]['name'];
//                     store_address = result[i]['address'];
//                     store_type = result_type.map(result_type => result_type['type']);

//                     card = {
//                         'interview_date': interview_date,
//                         'interview_time': interview_time,
//                         'reject_flag': reject_flag,
//                         'result_flag': result_flag,
//                         'link': link,
//                         'state': state,

//                         'store_name': store_name,
//                         'store_address': store_address,
//                         'store_type': store_type
//                     };
//                     if (cards) {
//                         cards.push(card);
//                     } else {
//                         cards = [card];
//                     }
//                     if (i == n - 1) {
//                         // console.log('end');
//                         let response = {
//                                 'name': worker_name,
//                                 'result': cards
//                             }
//                             // console.log(response);
//                         res.send(response);
//                     }
//                 });
//             }
//         })

//     });
// });

















app.listen(PORT, () => {
    console.log(`Server On : http://localhost:${PORT}/`);
});