const fs = require("fs");
const path = require("path");
const { requestUrl, genExcel } = require("../utils/index");
const xlsx = require('node-xlsx');
let str = "";
let shopId = 1001561
let mode = "shilai"
const memberUrl = `https://op.huanxiongdd.com/dd_op/mem_account/gets?shop_id=${shopId}&current_page=1&page_size=9999&whitelistId=${shopId}`
const shopRequestUrl = `https://m.huanxiongdd.com/dd_wx_applet/sitdownrts/getShopInfo?shop_id=${shopId}`


async function genMemberTxt() {
  let shopInfo = await requestUrl(shopRequestUrl);
  let { sname } = shopInfo;
  let res = await requestUrl(memberUrl);
  let { accounts } = res;
  accounts.forEach(item => {
    if (item.balance!=0) {
    str+=`${item.mobile},${item.balance},0\n`
      
    }
  })
  
  fs.writeFileSync(path.resolve(__dirname,`${sname}-会员列表.txt`),str)
}

// 生成表格
async function getShilaiMemberExcel() { 
  let shopInfo = await requestUrl(shopRequestUrl);
  let { sname } = shopInfo;

  let title = ["姓名", "手机号", "储值余额(元)"];
  let res = await requestUrl(memberUrl);
  let { accounts } = res,excelData=[];

  accounts.forEach(item => {
    if (item.balance!=0) {
    str+=`${item.mobile},${item.balance},0\n`
    excelData.push([item.mobile,item.mobile,item.balance])
    }
  })

  let buffer = xlsx.build([
    {
        name:'sheet1',
        data:[title].concat(excelData)
    }
  ]);
  fs.writeFileSync(path.join(__dirname,`${sname}-时来模式会员导入.xlsx`),buffer,{'flag':'w'});


}
async function genShilaiMemberTxt() {
  let shopInfo = await requestUrl(shopRequestUrl);
  let { sname } = shopInfo;
  let res = await requestUrl(memberUrl);
  let { accounts } = res;
  accounts.forEach(item => {
    if (item.balance!=0) {
    str+=`${item.mobile},${item.mobile},${item.balance},0\n`
      
    }
  })
  
  fs.writeFileSync(path.resolve(__dirname,`${sname}-会员列表.txt`),str)
}

if (mode == 'shilai') {
  getShilaiMemberExcel()
} else {
  genMemberTxt()
}