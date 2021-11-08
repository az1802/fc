const fs = require("fs");
const path = require("path");

const {
  mkShopDir,
  genExportData,
  logInfo,
} = require("../utils/index")
let { result } = require("./menuData.json");
let categoryData = [...result.tcClassList,...result.itemClassList]
const { dirname } = require("path");


function formatFoodProps(foodDetail) {
  if (foodDetail.itemUnitList) {
    let skuTemp = {
      name: "规格",
      values: foodDetail.itemUnitList.map(item => {
        return {
          value: item.unName,
          price: (parseFloat(item.unPrice)),
          propName: "规格",
          isMul: true,
        }
      })
    }
    return [skuTemp]
  }
  
  return []
}

function handleMenuData() {
  
  let merchantInfo = {
    shopName: "粉公子东城万达店",
    shop_pic: "",
    categories: []
  };

  merchantInfo.categories = categoryData.map(categoryItem => {
    let categoryData = {
      name: categoryItem.tcClassName || categoryItem.itemClassName,
      foods: (categoryItem.tcItemList || categoryItem.itemList).map(foodDetail => {
        return {
          name: (foodDetail.tcName  || foodDetail.itemName || ""),
          picUrl: foodDetail.taFileName || foodDetail.smallTaFileName || "",
          price: (parseFloat(foodDetail.stdPrice)) || "",
          unit: foodDetail.unitname || "份",
          categoryName: categoryItem.tcClassName || categoryItem.itemClassName,
          props: formatFoodProps(foodDetail),
        }
      })
    };
    return categoryData
  })





  return merchantInfo
}



// const exportMode = "keruyun"
// const exportMode = "feie"
const exportMode = "shilai"

//导出属性的配置
let menuSetting = { 
  specifications: ["规格"], //规格
  practice: [ ], //做法
  feeding: [],
  remarks: [], //备注
  propsGroupSort: [ //属性组排序
    "规格"
  ],
  propsSort: {//属性组内属性的排序
    // "口味":["不辣","微辣","中辣","特辣","麻辣"]
  }
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