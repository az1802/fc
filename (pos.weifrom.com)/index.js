
const fs = require("fs");
const path = require("path");


const { requestUrl,genImgs,genExcel,genExcelAll,genWord,genSpecificationsWord,formatFileName,delDirSync,mkdirSync,genFeieExcelAll} = require("../utils/index")


// const exportMode = "keruyun"
const exportMode = "feie"



let requestMenuDataAll = require("./merchantData.json");
let requestShopData = requestMenuDataAll.topInfo.shopInfo
let requestMenuData = requestMenuDataAll.list
const { isRegExp } = require("util");



const outputDir = path.join(__dirname, "merchantInfos")

let menuSetting = { //到处的菜品属性归为规格,备注,加料,做法
  specifications:[ "规格"],//规格
  practice: [
    "主食",
    "小盅汤",
    "饮品",
    "小吃",
    "手工面",
    "小石锅汤",
    "小食",
    "炸鸡",
    "啤酒",
    "拌饭酱",
    "赠送",
    "加料",
    "加料 ",
    "口味",
    "规格",
    "份量"
  ],//做法
  feeding:[],//加料
  remarks: [],//备注
  propsGroupSort: [
    "主食",
    "小盅汤",
    "饮品",
    "小吃",
    "手工面",
    "小石锅汤",
    "小食",
    "炸鸡",
    "啤酒",
    "拌饭酱",
    "赠送",
    "加料",
    "加料 ",
    "口味",
    "规格",
    "份量"
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
  let { spec_group , sku } = foodItem;
  let attrs = spec_group || []
  let skus = sku || []
  let propsRes = [];
  // 普通属性
  attrs && attrs.forEach(attrItem => {
    let propTemp = {
      name: attrItem.specName,
      values:[]
    }
    addPropsGroupArr(propTemp.name)
    propTemp.values = attrItem.chooseList && attrItem.chooseList.map(item => {
      return {
        value: item.chooseName,
        price: 0,
        propName: propTemp.name,
        isMul:true
      }
    })
    propsRes.push(propTemp)

  });

  // 规格
  // if (skus && skus.length > 1) {
  //   let propTemp = {
  //     name: "规格",
  //     values:[]
  //   }
  //   addPropsGroupArr(propTemp.name)
  //   // console.log("规格菜---",foodItem.name)
  //   skus.forEach(skuItem => {
  //     propTemp.values.push({
  //       value: skuItem.name,
  //       price: parseFloat((skuItem.price-skus[0].price)/100),
  //       propName: propTemp.name,
  //       isMul:true
  //     })
  //   })

  //   propsRes.push(propTemp)
  // }


 return propsRes

}
// 爬取的数据中进行信息提取
async function  handleRequestData(requestShopData,requestMenuData) {
  // await logInfo(requestMenuData)
  
  try {
    // 商户信息
    let merchantInfo = {
      shopName: requestShopData.shop_name,//店铺名称
      shop_pic: requestShopData.logo_url,//没有门头图
      categories:[]
    }

    // 菜品目录
    let categories = []
   

    categories = requestMenuData.map(categoryItem => { 
      let categoryData = {
        name: "",
        foods:[]
      };
      categoryData.name = categoryItem.category_name;
      categoryData.foods = (categoryItem.product).reduce((res, foodItem) => {
          let price = parseFloat(foodItem.price)
          let foodData = {
            name:foodItem.product_name.trim() || "",
            picUrl: foodItem.image_url || "",
            price:price,
            unit: foodItem.unit || "份",
            categoryName: categoryData.name,
            props:[],
          };
          foodData.props = formatFoodProps(foodItem)
          res.push(foodData)
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
  } else {
    genFeieExcelAll(merchantInfo, outputDir, menuSetting)
  }

}



genImgsAndExcel();
