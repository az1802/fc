
const fs = require("fs");
const path = require("path");

const { requestUrl,genImgs,genExcel,genFeieExcelAll,genWord,formatFileName,delDirSync,mkdirSync,addPropsGroupArr,genExcelAll,genSpecificationsWord, genShilaiExcelAll} = require("../utils/index")





// const exportMode = "keruyun"
// const exportMode = "feie"
const exportMode = "shilai"




let rquestMerchantInfo = require('./menuData.json')
let { categoryList,foodList} = rquestMerchantInfo.data
const outputDir = path.join(__dirname, "merchantInfos")


// let cookingMap = {}, attributeMap = {};
// (function handleProps() {
//   cookings.forEach(item => {
//     cookingMap[item.product] = item
//   })
//   attributes.forEach(item => {
//     attributeMap[item.id] = item
//   })
// }())


let menuSetting = { //导出的菜品属性归为规格,备注,加料,做法
  specifications:['规格'],//规格
  practice: [
    "温度要求",
    "口味要求",
    "加料购买",
    "免费加料"
  ],//做法
  feeding:['加料'],//加料
  remarks: [],//备注
  propsGroupSort: [
    '规格',
    "温度要求",
    "口味要求",
    "加料购买",
    "免费加料"
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

  let skuMenuItems = goodItem.specList;
  let skuObj = {
    name: "规格",
    values:[]
  }
  // 处理规格菜
  if (skuMenuItems&&skuMenuItems.length>1) {
    skuMenuItems && skuMenuItems.forEach(propItem => {
      skuObj.values.push({
        "value": propItem.name,
        "price": propItem.price,
        "propName": "规格",
        "isMul": false
      })
    })
    if (skuObj.values.length) {
      res.push(skuObj)
    }
  }

  let makeCategoryList = goodItem.makeCategoryList;//普通属性
  
  makeCategoryList.forEach(attrGroup => {
    addPropsGroupArr(propsGroupArr,attrGroup.name)
    res.push({
      name: attrGroup.name,
      values: attrGroup.makeList.map(makeItem => {
        return {
          "value": makeItem.name,
          "price": makeItem.addPrice,
          "propName":attrGroup.name,
          "isMul": false
        }
      })
    })
  })

  return res;
}

// 爬取的数据中进行信息提取
async function  handleRequestData() {
  try {
    // 商户信息
    let merchantInfo = {
      shopName: "大维饮品",
      shop_pic: "",
      categories:[]
    }
    // 菜品目录
    let categories = []
    categories = categoryList.map(categoryItem => {
      let categoryData = {
        id:categoryItem.id,
        name: categoryItem.name,
        foods:[]
      };
      return categoryData
    })

    foodList.forEach(goodItem => {
      let { } = goodItem;
      let groupIndex = categories.findIndex(item => {
        return item.id == goodItem.categoryId;
      })

      if (groupIndex!=-1) {
        let categoryItem = categories[groupIndex];

        categoryItem.foods.push({
          name: goodItem.name.trim()|| "",
          picUrl: goodItem.imageList[0] || "",
          price:goodItem.specList[0].price || "",
          unit: goodItem.unitName  || "份",
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
