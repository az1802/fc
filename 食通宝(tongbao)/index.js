
const fs = require("fs");
const path = require("path");

const { requestUrl,genImgs,genExcel,genFeieExcelAll,genWord,formatFileName,delDirSync,mkdirSync,addPropsGroupArr,genExcelAll,genSpecificationsWord, genShilaiExcelAll} = require("../utils/index")





// const exportMode = "keruyun"
// const exportMode = "feie"
const exportMode = "shilai"




let rquestMerchantInfo = require('./merchantInfo.json')
let { groups,goodses,cookings,attributes,shop} = rquestMerchantInfo
const outputDir = path.join(__dirname, "merchantInfos")


let cookingMap = {}, attributeMap = {};
(function handleProps() {
  cookings.forEach(item => {
    cookingMap[item.product] = item
  })
  attributes.forEach(item => {
    attributeMap[item.id] = item
  })
}())


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

  let skuMenuItems = goodItem.children;
  let skuObj = {
    name: "规格",
    values:[]
  }
  // 处理规格菜
  if (skuMenuItems&&skuMenuItems.length>1) {
    skuMenuItems && skuMenuItems.forEach(propItem => {
      skuObj.values.push({
        "value": propItem.unitTypeName,
        "price": propItem.price,
        "propName": "规格",
        "isMul": false
      })
    })
    if (skuObj.values.length) {
      res.push(skuObj)
    }
  }

  let cookings = goodItem.cookings;//普通属性
  let cookingObj = {
    name: "做法",
    values:[]
  }
  if(cookings && cookings.length > 0) {
    cookings.forEach(cookid => {
      let item = cookingMap[cookid]
      if (item) {
        cookingObj.values.push({
          "value": item.name.trim(),
          "price": item.price,
          "propName": "做法",
          "isMul": true
        })
       }
    })
    if (cookingObj.values.length) {
      res.push(cookingObj)
    }
  }


  let attributes =  goodItem.attributes;
  if (attributes && attributes.length > 0) {
    attributes.forEach(attributeId => {
      let attributesItem = attributeMap[attributeId];
      if (attributesItem) {
        res.push({
          name: attributesItem.name,
          values: attributesItem.value.map(item => {
            return {
              "value": item.trim(),
              "price": 0,
              "propName": attributesItem.name,
              "isMul": true
            }
          })
        })
      } 
    })
  }
  return res;
}

// 爬取的数据中进行信息提取
async function  handleRequestData() {
  try {
    // 商户信息
    let merchantInfo = {
      shopName: shop.name,
      shop_pic: shop.brandLogo,
      categories:[]
    }
    // 菜品目录
    let categories = []
    categories = groups.map(categoryItem => {
      let categoryData = {
        id:categoryItem.group,
        name: categoryItem.name,
        foods:[]
      };
      return categoryData
    })

    goodses.forEach(goodItem => {
      let { } = goodItem;
      let groupIndex = categories.findIndex(item => {
        return item.id == goodItem.group;
      })

      if (groupIndex!=-1) {
        let categoryItem = categories[groupIndex];

        categoryItem.foods.push({
          name: goodItem.name.trim()|| "",
          picUrl: `https://static.sanyipos.com/static/image/${goodItem.f_512_512.slice(0,2)}/${goodItem.f_512_512}` || "",
          price:goodItem.children[0].price || "",
          unit: goodItem.children[0].unitTypeName  || "份",
          categoryName: categoryItem.name,
          props: formatFoodProps(goodItem),
        })
      }
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
