const fs = require("fs");
const path = require("path");

const {
  mkShopDir,
  genExportData,
  logInfo,
} = require("../utils/index")


let { data: {
  dishList=[]
} } = require("./menuData.json");

console.log(dishList)

// const exportMode = "keruyun"
const exportMode = "feie"
// const exportMode = "shilai"

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


async function handleMenuData() {
  let merchantInfo = {
    shopName: "黎记广州牛杂固戌店",
    shop_pic: "",
    categories: []
  };


  merchantInfo.categories = dishList.map(categoryItem => {
    return {
      name: categoryItem.categoryName,
      foods: categoryItem.cateDishList.map(foodItem => {
        return {
          name: (foodItem.dishName || ""),
          picUrl: foodItem.imageUrl || "",
          price: (parseFloat(foodItem.price) / 100) || "",
          unit: "份",
          categoryName: categoryItem.categoryName,
          props: [],
        }
      })
    }
  })


  return merchantInfo;
}

// 获取原始数据
async function getMerchantInfo() {
  let merchantInfo = await handleMenuData()
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