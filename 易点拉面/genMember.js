const fs = require("fs");
const path = require("path");
const { requestUrl,} = require("../utils/index")
let str = "";
let shopId = 1001475
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

genMemberTxt()