const fs = require("fs");
const path = require("path");

const {
  mkShopDir,
  genExportData,
  logInfo,
} = require("../utils/index")

const  { handleMenuData } = require('./handleMenuData.js')

let { data: requestShopData} = require("./shopData.json");
let { data: requestMenuData } = require("./menuData.json");
const { dirname } = require("path");

// const exportMode = "keruyun"
// const exportMode = "feie"
const exportMode = "shilai"

//导出属性的配置
let menuSetting = { 
  specifications: [], //规格
  practice: [ ], //做法
  feeding: [],
  remarks: [], //备注
  propsGroupSort: [ //属性组排序
  ],
  propsSort: {//属性组内属性的排序
    // "口味":["不辣","微辣","中辣","特辣","麻辣"]
  }
}

// 获取原始数据
async function getMerchantInfo() {
  let merchantInfo = await handleMenuData(requestShopData, requestMenuData,menuSetting)
  await logInfo(merchantInfo,__dirname,"merchantRes")
  return merchantInfo;
}

// 生成图片文件夹以及excel文件
async function genImgsAndExcel() {
  let merchantInfo = await getMerchantInfo();
  let outputDir = await mkShopDir(__dirname,merchantInfo.shopName)

  genExportData({
    merchantInfo,
    menuSetting,
    outputDir,
    exportMode
  })
}

genImgsAndExcel();