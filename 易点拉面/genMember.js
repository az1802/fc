/*
 * @Author: sunjie
 * @Date: 2021-11-17 13:57:43
 * @LastEditors: sunj
 * @LastEditTime: 2022-02-18 15:50:43
 * @FilePath: /dish_crawler/易点拉面/genMember.js
 */
const fs = require("fs");
const path = require("path");
const { requestUrl, genExcel } = require("../utils/index");
const xlsx = require('node-xlsx');
let str = "";
let shopId = 1000725
// let mode = "shilai"
let mode = "feie"
const memberUrl = `https://op.huanxiongdd.com/dd_op/mem_account/gets?shop_id=${shopId}&current_page=1&page_size=9999&whitelistId=${shopId}`
const shopRequestUrl = `https://m.huanxiongdd.com/dd_wx_applet/sitdownrts/getShopInfo?shop_id=${shopId}`

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