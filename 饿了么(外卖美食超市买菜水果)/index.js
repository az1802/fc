
const fs = require("fs");
const path = require("path");

const { requestUrl,genImgs,genExcel,genFeieExcelAll,genWord,formatFileName,delDirSync,mkdirSync,addPropsGroupArr,genExcelAll,genSpecificationsWord, genShilaiExcelAll} = require("../utils/index")



const exportMode = "shilai"


let requestMenuData =  require("./merchantInfo.json");
requestMenuData = requestMenuData.data
let requestShopData = {
  shopName:"幸运冰厅"
}
const { isRegExp } = require("util");




const outputDir = path.join(__dirname, "merchantInfos")

let menuSetting = { //导出的菜品属性归为规格,备注,加料,做法
  specifications:['规格'],//规格
  practice: [
   
  ],//做法
  feeding:['加料'],//加料
  remarks: [],//备注
  propsGroupSort: [
    '规格',
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
  let merchantInfo = await handleRequestData(requestShopData, requestMenuData)
  return merchantInfo;
}


function formatFoodProps(foodItem) {
  let attrs = foodItem.attrs;//普通属性
  let res = []


  
  if(attrs && attrs.length > 0) {
    attrs.forEach(propItem => {
      let tempObj = {
        name: propItem.name,
        values:[]
      }
      if (menuSetting.practice.indexOf(propItem.name)==-1) {
        menuSetting.practice.push(propItem.name);
        menuSetting.propsGroupSort.push(propItem.name)
      }
      if(propItem.values && propItem.values.length > 0) {
        propItem.values.forEach(item => {
          tempObj.values.push({
            "value": item,
            "price":  0,
            "propName": tempObj.name,
            "isMul": true
          })
        })
        res.push(tempObj)
      }
    })
  }
  return res;
}

// 爬取的数据中进行信息提取
async function  handleRequestData(requestShopData,requestMenuData) {
  try {
    // 商户信息
    let merchantInfo = {
      shopName: requestShopData.shopName,
      shop_pic: "",
      categories:[]
    }
    // 菜品目录
    let categories = []
    categories = requestMenuData.map(categoryItem => {
      let categoryData = {
        name: "",
        foods:[]
      };
      categoryData.name = categoryItem.name;
      categoryData.foods =categoryItem.foods.reduce((res, foodItem) => {
        if (foodItem) {
          let picUrl = foodItem.image_path|| "";
          foodItem.name = foodItem.name.replace('/',"-")
          let foodData = {
            name: foodItem.name&&foodItem.name.trim() || "",
            picUrl: picUrl || "",
            price: foodItem.specfoods[0]&&foodItem.specfoods[0].price || "",
            unit: foodItem.unit || "份",
            categoryName: categoryData.name,
            props: [],
          };
          foodData.props = formatFoodProps(foodItem)
          res.push(foodData)
        }
        return res;
      }, [])
      return categoryData
    })
    merchantInfo.categories = categories
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
    await logInfo(merchantInfo, "merchantRes")
  
  let { shopName} = merchantInfo
  let shopDir = path.join(outputDir, formatFileName(shopName));
  // // 重建创建商铺目录
  await mkShopDir(shopDir)
  logInfo(propsGroupArr, "propGroups")
  console.log(menuSetting)
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
