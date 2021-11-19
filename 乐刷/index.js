
const fs = require("fs");
const path = require("path");

const { requestUrl,genImgs,genExcel,genFeieExcelAll,genWord,formatFileName,delDirSync,mkdirSync,addPropsGroupArr,genExcelAll,genSpecificationsWord, genShilaiExcelAll} = require("../utils/index")





// const exportMode = "keruyun"
const exportMode = "feie"
// const exportMode = "shilai"




let rquestMerchantInfo = require('./merchantInfo.json')
let allCategory= rquestMerchantInfo.data
const outputDir = path.join(__dirname, "merchantInfos")
let shop = {
  name: "阿哈迈牛肉面",
  shop_pic:""
}



let menuSetting = { //导出的菜品属性归为规格,备注,加料,做法
  specifications:['规格'],//规格
  practice: [
    "做法",
    "口味"
  ],//做法
  feeding:['加料'],//加料
  remarks: [],//备注
  propsGroupSort: [
    '规格',
    "做法",
    "口味",
    "加料"
  ],
  propsSort: {
    // "口味":["不辣","微辣","中辣","特辣","麻辣"]
  }
}

let propsGroupArr = [];

// 打印日志到test.json 文件夹
async function logInfo(info,fileName="test.json") { 
  fs.writeFileSync(`./${fileName}.json`,JSON.stringify(info,null,'\t'))
}

// 获取原始数据
async function getMerchantInfo() { 
  return  handleRequestData();
}


function formatFoodProps(goodItem) {

  let res = []

  return res;
}

// 爬取的数据中进行信息提取
async function  handleRequestData() {
  try {
    // 商户信息
    let merchantInfo = {
      shopName: shop.name,
      shop_pic: shop.shop_pic,
      categories:[]
    }
    // 菜品目录
    let categories = []
    categories = allCategory.map(categoryItem => {
      let categoryData = {
        id:categoryItem.goods_group_code,
        name: categoryItem.name,
        foods:[]
      };
      
      categoryData.foods = categoryItem.list.map(goodItem => {
        return {
          name: goodItem.goods_name.trim()|| "",
          picUrl: goodItem.img[0] || "",
          price:parseFloat(goodItem.price/100) || "",
          unit: "份",
          categoryName: categoryItem.name,
          props: formatFoodProps(goodItem),
        }
      })

      return categoryData
    })

    merchantInfo.categories = categories;

    return merchantInfo;
  } catch (err) { 
    console.log(err, `格式化转换菜品发生错误`)
  }
}

// 数据转换提取,写入相关文件
async function mkShopDir(shopDir) { 
  delDirSync(shopDir);
  mkdirSync(shopDir)
}

// 生成图片文件夹以及excel文件
async function genImgsAndExcel() { 
  let merchantInfo = await getMerchantInfo();
  
  let { shopName} = merchantInfo
  let shopDir = path.join(outputDir, formatFileName(shopName));
  // // 重建创建商铺目录
  await mkShopDir(shopDir)
  logInfo(merchantInfo,"res")
  logInfo(propsGroupArr,"propGroups")
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
