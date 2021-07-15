const request = require('request')
const fs = require('fs')
const path = require('path')
const handleEdianDetail = require("./handleEdianDetail");
const { dirname } = require('path');
const { getFiles, getFileJson, genExcel, getDetail } = require("./utils/index")
const imgDir = path.join(__dirname, "uploadImages");
const edianMerchantInfo = `https://m.huanxiongdd.com/dd_wx_applet/sitdownrts/ajax_getProductDetail.action?shop_id=${shopId}`
// const edianMerchantInfo = `https://m.huanxiongdd.com/dd_wx_applet/sitdownrts/getShopInfo?shop_id=${shopId}`   //e点拉面
// const edianMerchantInfo = `https://m.diandianwaimai.com/dd_wx_applet/sitdownrts/getShopInfo?shop_id=${shopId}` //浣熊
const shopIdMax = 41466; //最大店铺数量


async function handle(shopId) { 
  let res = await getDetail(edianMerchantInfo);
  let detail = res.detail;
  if (detail && detail.shopname) { 
    let shopname = detail.shopname.replace(/\//ig, "-")
    //生成图片文件夹
    handleEdianDetail(detail,path.join(imgDir,shopId+"-"+shopname))
  }
}

/**
 * @description: 
 * @param {*} shopIds
 * @return {*}
 */
async function handleMore(shopIds) { 
  for (let i = 1; i < shopIdMax;i++) { 
    await handle(i)
  }
}




// handleMore();
handle(1000912)
