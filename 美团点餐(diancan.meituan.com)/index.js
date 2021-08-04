
const fs = require("fs");
const path = require("path");


const { 
  requestUrl, 
  genImgs,
  genExcel,
  genExcelAll,
  genWord, 
  genSpecificationsWord, 
  formatFileName, 
  delDirSync, mkdirSync, genFeieExcelAll, genShilaiExcelAll} = require("../utils/index")


// const exportMode = "keruyun"
// const exportMode = "feie"
const exportMode = "shilai"


let requestMenuDataAll = require("./menuData.json");
let requestShopData = requestMenuDataAll.data.poi
let requestMenuData = requestMenuDataAll.data.poi.menus
const { isRegExp } = require("util");



const outputDir = path.join(__dirname, "merchantInfos")

let menuSetting = { //到处的菜品属性归为规格,备注,加料,做法
  specifications:[ "规格"],//规格
  practice: [
    "口味",
    "打包",
    "做法"
  ],//做法
  feeding:["加料",],//加料
  remarks: [],//备注
  propsGroupSort: [
    "口味",
    "加料",
    "规格",
    "打包",
    "做法"
  ],
 
  propsSort: {
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
  await logInfo(merchantInfo, "merchantRes")
  return merchantInfo;
}

function addPropsGroupArr(name) {
  if (propsGroupArr.indexOf(name) == -1) {
    propsGroupArr.push(name)
  } 
}

function formatFoodProps(foodItem) { 
  let { attrs, skus, parts } = foodItem;
  let propsRes = [];
  // 普通属性
  attrs && attrs.forEach(attrItem => {
    let propTemp = {
      name: attrItem.name,
      values:[]
    }
    addPropsGroupArr(propTemp.name)
    propTemp.values = attrItem.values && attrItem.values.map(item => {
      return {
        value: item,
        price: 0,
        propName: propTemp.name,
        isMul:true
      }
    })
    propsRes.push(propTemp)

  });

  // 加料
  if (parts && parts.length > 0) {
    let propTemp = {
      name: "加料",
      values:[]
    }
    addPropsGroupArr(propTemp.name)
    parts.forEach(partItem => {
      propTemp.values.push({
        value: partItem.name,
        price: parseFloat(partItem.price/100),
        propName: propTemp.name,
        isMul:true
      })
    })

    propsRes.push(propTemp)
  }

  // 规格
  if (skus && skus.length > 1) {
    let propTemp = {
      name: "规格",
      values:[]
    }
    addPropsGroupArr(propTemp.name)
    // console.log("规格菜---",foodItem.name)
    skus.forEach(skuItem => {
      propTemp.values.push({
        value: skuItem.name,
        price: parseFloat((skuItem.price-skus[0].price)/100),
        propName: propTemp.name,
        isMul:true
      })
    })

    propsRes.push(propTemp)
  }


 return propsRes

}
// 爬取的数据中进行信息提取
async function  handleRequestData(requestShopData,requestMenuData) {
  // await logInfo(requestMenuData)
  
  try {
    // 商户信息
    let merchantInfo = {
      shopName: requestShopData.name,//店铺名称
      shop_pic: requestShopData.pic_url,//没有门头图
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
      categoryData.foods = (categoryItem.items).reduce((res, foodItem) => {
        

        if (foodItem&&foodItem.status=="AVAILABLE") {
          
          let price = foodItem.price ? parseFloat(foodItem.price/100): (foodItem.skus[0]&&foodItem.skus[0].price ? parseFloat(foodItem.skus[0].price/100) : 0 )
          
          
          let foodData = {
            name:foodItem.name.trim() || "",
            picUrl: foodItem.imageUrl || "",
            price:price,
            unit: foodItem.unit || "份",
            categoryName: categoryData.name,
            props:[],
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
  let { shopName} = merchantInfo
  let shopDir = path.join(outputDir, formatFileName(shopName));
  // // 重建创建商铺目录
  await mkShopDir(shopDir)
  // 输出所有属性组名称
  logInfo(propsGroupArr,"./propGroups.txt")
  // // mkShopDir(merchantInfo)
  if (exportMode == "keruyun") {
    genImgs(merchantInfo,outputDir);
    genExcel(merchantInfo, outputDir);
    genExcelAll(merchantInfo,outputDir,menuSetting)
  } else if (exportMode == 'shilai') {
    genShilaiExcelAll(merchantInfo, outputDir, menuSetting)
  } else {
    genFeieExcelAll(merchantInfo, outputDir, menuSetting)
  }

}



genImgsAndExcel();
