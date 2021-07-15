
const fs = require("fs");
const path = require("path");


const { requestUrl,genImgs,genExcel,genExcelAll,genWord,genSpecificationsWord,formatFileName,delDirSync,mkdirSync,genFeieExcelAll,addPropsGroupArr} = require("../utils/index")



// const exportMode = "keruyun"
const exportMode = "feie"

let { data: requestShopData } = require("./shopData.json");
let requestMenuData = requestShopData.productCategorys;
requestShopData = requestShopData.shopInfo
const { isRegExp } = require("util");
const outputDir = path.join(__dirname, "merchantInfos")


// 飞蛾模式 menuSetting
let menuSetting = { //到处的菜品属性归为规格,备注,加料,做法
  specifications:["规格"],//规格
  practice: [
  
],//做法
  feeding:[],
  remarks: [],//备注
  propsGroupSort: [
  
    "加料",
    "规格"
  ],
  propsSort: {
    // "口味":["不辣","微辣","中辣","特辣","麻辣"]
  }
}

// 客如云模式 menuSetting
// let menuSetting = { //到处的菜品属性归为规格,备注,加料,做法
//   specifications:[],//规格
//   practice:[ '要求', '份量', '口味', '加料', '升级为超值套餐', '加' ],//做法
//   feeding:[],//加料
//   remarks: [],//备注
// }

let propsGroupArr = [];

// 打印日志到test.json 文件夹
async function logInfo(info,fileName="test.json") { 
  fs.writeFileSync(`./${fileName}.json`,JSON.stringify(info,null,'\t'))
}

// 获取原始数据
async function getMerchantInfo() { 
  let merchantInfo = await handleRequestData(requestShopData, requestMenuData)
  await logInfo(merchantInfo, "merchantRes")
  return merchantInfo;
}

// 处理菜品属性
function formatFoodProps(foodItem) { 
  
  let propsRes = [], skus = foodItem.skus;
  if (!skus) { return []}
  if (skus.length > 1) {
    let propTemp = {
      name: "规格",
      values: skus.map(skuItem => ({
        value: String(skuItem.spec),
        price: (parseFloat(skuItem.price)/100),
        propName: "规格",
        isMul:false
      }))
    }
    addPropsGroupArr(propsGroupArr,"规格")
    
    propsRes.push(propTemp);
  } else {
    let group = skus[0].group;
    group.forEach(groupItem => {
      let propTemp = {
        name: String(groupItem.groupName),
        values: groupItem.item.forEach(propItem => ({
          value: String(propItem.productName),
          price: (parseFloat(propItem.salePrice)/100),
          propName: String(groupItem.groupName),
          isMul:true
        })).filter(item => item.name)
      }
      addPropsGroupArr(propsGroupArr,propTemp.name)
      propsRes.push(propTemp);
    })
  }

  return propsRes;
}


// 爬取的数据中进行信息提取
async function  handleRequestData(requestShopData,requestMenuData) {
  try {
    // 商户信息
    let merchantInfo = {
      shopName: String(requestShopData.shopName),
      shop_pic: "",
      categories:[]
    }
    console.log( String(requestShopData.shopName))

    // 菜品目录
    let categories = []

    categories = requestMenuData.map(categoryItem => { 
      let categoryData = {
        name: String(categoryItem.categoryName),
        foods:[]
      };
      categoryData.foods = categoryItem.productList.reduce((res,foodItem) => { 
        if (foodItem) { 
          let foodData = {
            name:String((foodItem.productName || "")),
            picUrl: String(foodItem.thumbnailImageUrl || foodItem.descriptionImageUrls[0] || ""),
            price:(parseFloat(foodItem.sku[0].price)/100) || "",
            unit: foodItem.unit || "份",
            categoryName: categoryData.name,
            props:[],
          };

          foodData.name =foodData.name.trim().replace(/\//ig,"-")
          foodData.props = formatFoodProps(foodItem)
          res.push(foodData)
        }
        return res;
      },[])
      
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

  logInfo(propsGroupArr,"propsGroupArr")
  let { shopName} = merchantInfo
  let shopDir = path.join(outputDir, formatFileName(shopName));
  // // 重建创建商铺目录
  await mkShopDir(shopDir)

  // // mkShopDir(merchantInfo)
  if (exportMode == "keruyun") {
    genImgs(merchantInfo,outputDir);
    genExcel(merchantInfo, outputDir);
    genExcelAll(merchantInfo,outputDir,menuSetting)
  } else {
    // genWord(merchantInfo, outputDir)
    // genSpecificationsWord(merchantInfo, outputDir, menuSetting)
    genFeieExcelAll(merchantInfo, outputDir,menuSetting)
  }

}



genImgsAndExcel();
