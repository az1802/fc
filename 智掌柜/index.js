const fs = require("fs");
const path = require("path");


const { requestUrl,genImgs,genExcel,genFeieExcelAll,genWord,formatFileName,delDirSync,mkdirSync,addPropsGroupArr,genExcelAll,genSpecificationsWord, genShilaiExcelAll} = require("../utils/index")


let { data: {
  dishList=[]
} } = require("./menuData.json");
const outputDir = path.join(__dirname, "merchantInfos")
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

let propsGroupArr = [];
async function handleMenuData() {
  let merchantInfo = {
    shopName: "南昌拌粉深圳桥南店",
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
  return merchantInfo;
}

// 打印日志到test.json 文件夹
async function logInfo(info,fileName="test.json") { 
  fs.writeFileSync(`./${fileName}.json`,JSON.stringify(info,null,'\t'))
}

async function mkShopDir(shopDir) { 
  delDirSync(shopDir);
  mkdirSync(shopDir)
}

async function genImgsAndExcel() { 
  let merchantInfo = await getMerchantInfo();
  await logInfo(merchantInfo,"merchantRes")
  let { shopName} = merchantInfo
  let shopDir = path.join(outputDir, formatFileName(shopName));
  // // 重建创建商铺目录
  await mkShopDir(shopDir)

  logInfo(propsGroupArr,"allPropGroups")
  // // mkShopDir(merchantInfo)
  if (exportMode == "keruyun") {
    genImgs(merchantInfo,outputDir);
    genExcel(merchantInfo, outputDir);
    genExcelAll(merchantInfo,outputDir,menuSetting)
  } else if (exportMode == 'shilai') {
    genShilaiExcelAll(merchantInfo, outputDir, menuSetting)
  } else if (exportMode == 'feie') {
    genFeieExcelAll(merchantInfo, outputDir, menuSetting)
  }else {
    genFeieExcelAll(merchantInfo, outputDir,menuSetting)
  }
}



genImgsAndExcel();