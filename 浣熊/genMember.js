/*
 * @Author: sunjie
 * @Date: 2021-11-30 18:58:33
 * @LastEditors: sunj
 * @LastEditTime: 2022-01-28 16:25:39
 * @FilePath: /dish_crawler/浣熊/genMember.js
 */


const fs = require("fs");
const path = require("path");
const { requestUrl, genExcel } = require("../utils/index");
const xlsx = require('node-xlsx');
let str = "";
let shopId = 1000383
// let mode = "shilai"sunj
let mode = "feie"
const memberUrl = `https://op.diandianwaimai.com/dd_op/mem_account/gets?shop_id=${shopId}&current_page=1&page_size=9999`
const shopRequestUrl = `https://m.diandianwaimai.com/dd_wx_applet/sitdownrts/getShopInfo?shop_id=${shopId}`

console.log(memberUrl)
async function genMemberTxt() {
  let shopInfo = await requestUrl(shopRequestUrl);
  let { sname } = shopInfo;
  let res = await requestUrl(memberUrl);
  let { accounts } = res;
  accounts.forEach(item => {
    if (item.balance != 0) {
      str += `${item.mobile},${item.balance},0\n`

    }
  })

  fs.writeFileSync(path.resolve(__dirname, `${sname}-会员列表.txt`), str)
}

// 生成表格
async function getShilaiMemberExcel() {
  let shopInfo = await requestUrl(shopRequestUrl);
  let { sname } = shopInfo;

  let title = ["姓名", "手机号", "储值余额(元)"];
  let res = await requestUrl(memberUrl);
  let { accounts } = res, excelData = [];

  accounts.forEach(item => {
    if (item.balance != 0) {
      str += `${item.mobile},${item.balance},0\n`
      excelData.push([item.mobile, item.mobile, item.balance])
    }
  })

  let buffer = xlsx.build([
    {
      name: 'sheet1',
      data: [title].concat(excelData)
    }
  ]);
  fs.writeFileSync(path.join(__dirname, `${sname}-时来模式会员导入.xlsx`), buffer, { 'flag': 'w' });


}
async function genShilaiMemberTxt() {
  let shopInfo = await requestUrl(shopRequestUrl);
  let { sname } = shopInfo;
  let res = await requestUrl(memberUrl);
  let { accounts } = res;
  accounts.forEach(item => {
    if (item.balance != 0) {
      str += `${item.mobile},${item.mobile},${item.balance},0\n`

    }
  })

  fs.writeFileSync(path.resolve(__dirname, `${sname}-会员列表.txt`), str)
}

if (mode == 'shilai') {
  getShilaiMemberExcel()
} else {
  genMemberTxt()
}