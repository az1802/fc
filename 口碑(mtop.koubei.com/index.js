
const fs = require("fs");
const path = require("path");


const { requestUrl,genImgs,genExcel,genExcelAll,genWord,genSpecificationsWord,formatFileName,delDirSync,mkdirSync,genShilaiExcelAll} = require("../utils/index")




// const exportMode = "keruyun"
// const exportMode = "feie"

const exportMode = "shilai"

let allMerchantInfo = require("./merchantInfo.json")
let requestShopData = {name:"闽台风味小吃",shop_pic:""}
let requestMenuData = allMerchantInfo.data.data.components[2].data.dishMenu.data.dishCates

const { isRegExp } = require("util");




const outputDir = path.join(__dirname, "merchantInfos")

let menuSetting = { //到处的菜品属性归为规格,备注,加料,做法
  specifications:[],//规格
  practice: [
    "默认",
    "规格默认",
    "口味",
    "请选择"
  ],//做法
  feeding:[],//加料
  remarks: [],//备注
  propsGroupSort: [
    "默认",
    "规格默认",
    "口味",
    "请选择"
   
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

function addPropsGroupArr(propsGroupArr,name) {
  if (propsGroupArr.indexOf(name) == -1) {
    propsGroupArr.push(name)
  } 
}

function formatFoodProps(foodItem) {
  
  let cookbookDishSku = foodItem.cookbookDishSkuList && foodItem.cookbookDishSkuList[0];

  let propsRes = [], practiceGroupsTemp = [], sideDishGroupsTemp = [];
  let { practiceGroups = [], sideDishGroups = [] } = cookbookDishSku || {}
  let {specGroupList = [] } = foodItem



  practiceGroups.forEach((practiceGroupItem,index) => {
    propsRes.push({
      name: practiceGroupItem.groupName,
      values: practiceGroupItem.specs && practiceGroupItem.specs.map(specItem => {
        return {
          value: specItem.name,
          price: parseFloat( specItem.addPrice || 0)/100,
          propName:practiceGroupItem.groupName,
          isMul:true
        }
      }) || []
    })
  })

  sideDishGroups.forEach((sideDishGroupItem,index) => {
    propsRes.push({
      name: sideDishGroupItem.groupName,
      values:sideDishGroupItem.sideDishes && sideDishGroupItem.sideDishes.map(sideDishItem => {
        return {
          value: sideDishItem.name,
          price: parseFloat( sideDishItem.addPrice || 0)/100,
          propName:sideDishGroupItem.groupName,
          isMul:true
        }
      }) || []
    })
  })

  specGroupList.forEach(sepcItem => {
    propsRes.push({
      name: sepcItem.groupName,
      values: sepcItem.specs && sepcItem.specs.map(item => {
        return {
          value: item.name,
          price: parseFloat( item.addPrice || 0)/100,
          propName:sepcItem.groupName,
          isMul:true
        }
      }) || []
    })
  })

  return propsRes;
}





// 爬取的数据中进行信息提取
async function  handleRequestData(requestShopData,requestMenuData) {
  
  try {
    // 商户信息
    let merchantInfo = {
      shopName: requestShopData.name,
      shop_pic: requestShopData.pic_url,
      categories:[]
    }

    // 菜品目录
    let categories = []
    categories = requestMenuData.map(categoryItem => { 
      let categoryData = {
        name: "",
        foods:[]
      };
      categoryData.name = categoryItem.decorateData.name;
      categoryData.foods = categoryItem.dishList.reduce((res, foodItem) => {
        if (foodItem) {
          let cookbookDishSku = foodItem.cookbookDishSkuList && foodItem.cookbookDishSkuList[0];
          let foodData = {
            name: foodItem.dishName.replace(/\//ig,"-") || "",
            picUrl: cookbookDishSku&&cookbookDishSku.skuImgUrl || cookbookDishSku&&cookbookDishSku.skuImageList&&cookbookDishSku.skuImageList.skuImageList[0] || "",
            price:parseFloat(foodItem.lowPrice)/100 || "",
            unit: foodItem.overPlusUnitName || "份",
            categoryName:  categoryData.name,
            props:[],
          };
          // console.log(`${foodData.name}---${foodData.picUrl}`)

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
  await logInfo(merchantInfo, "merchantRes")
  await logInfo(propsGroupArr, "propsGroupArr")

  let { shopName} = merchantInfo
  // console.log(merchantInfo)
  let shopDir = path.join(outputDir, formatFileName(shopName));
  // // 重建创建商铺目录
  await mkShopDir(shopDir)

  // // // mkShopDir(merchantInfo)
  if (exportMode == "keruyun") {
    genImgs(merchantInfo,outputDir);
    genExcel(merchantInfo, outputDir);
    genExcelAll(merchantInfo,outputDir,menuSetting)
  } else if (exportMode == 'shilai') {
    genShilaiExcelAll(merchantInfo, outputDir, menuSetting)
  }else {
    genWord(merchantInfo, outputDir)
    genSpecificationsWord(merchantInfo,outputDir,menuSetting)
  }

}



genImgsAndExcel();
