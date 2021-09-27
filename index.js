const request = require('request')


// 更新用户地址
// request.post({
//   url: "https://m.huanxiongdd.com/dd_wx_applet/sitdownrts/ajax_createOrUpdateSendAddr.action",
//   form: {
//     "contacter": "杨柳",
//     "sex":0,
//     "contact_tel":	13485741584,
//     "speci_address":	"上海市人大1",
//     "house_num":	2,
//     "longitude":	121.48023137547449,
//     "latitude":	31.236286932384633,
//     "modify_flag"	:0,
//     "customer_id"	:3053392,
//     "address":	"上海市黄浦区人民大道201号",
//   }
// }, (err, res, body) => {
//   console.log(body)
// })


// 获取储值记录
// request.post({
//   url: "https://m.huanxiongdd.com/dd_wx_applet/sitdownrts/ajax_getrecharge.action",
//   form: {
//    "shop_id":1001411
//   }
// }, (err, res, body) => {
//   console.log(body)
// })

//获取验证码


// request.post({
//   url: "https://m.huanxiongdd.com/dd_wx_applet/sitdownrts/ajax_getverify.action",
//   form: {
//     "mobile":"17722387173",
//     "shop_id":	"1001411",
//     "user_id": "3053390"
//   }
// }, (err, res, body) => {
//   console.log(body)

//   let code = body;
//   request.post({
//     url: "https://m.huanxiongdd.com/dd_wx_applet/sitdownrts/ajax_updateuser.action",
//     form: {
//       "shop_id": 1001411,
//       "userid":"3053390",
//       "mobile":"17722387173",
//       "verifycode": code,
//       "balance":0,
//       "lastname":"17722387173",
//       "is_mem":1
//     }
//   }, (err, res, body) => {
//     console.log(body)
//   })
  
// })

// 更新用户地址
request.post({
  url: "https://m.huanxiongdd.com/dd_wx_applet/sitdownrts/ajax_updateCards.action?shop_id=1001411&customer_id=3053390",
  form: {
    "shop_id": 1001411,
    "userid":"3053390",
    "balance":0.01,
  }
}, (err, res, body) => {
  console.log(body)
})
