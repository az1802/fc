
const fs = require("fs");
const path = require("path");
const requestMenuJson = require("./merchantInfo.json");
let merchantMenuInfo = requestMenuJson.baseInfo;

let shopeInfo = merchantMenuInfo.restaurant
let foodList = merchantMenuInfo.foodList

const { requestUrl,genImgs,genExcel,genExcelAll,genFeieExcelAll,genWord,genSpecificationsWord,formatFileName,delDirSync,mkdirSync,addPropsGroupArr,genShilaiExcelAll} = require("../utils/index")


// const exportMode = "keruyun"
// const exportMode = "feie"
const exportMode = "shilai"

let menuSetting = { //到处的菜品属性归为规格,备注,加料,做法
  specifications:[	"规格"],//规格
  practice: [
    "固定菜",
    "可选分组1",
    "可选分组2",
    "可选分组3",
    "可选分组4",
    "可选分组5",
    "加料",
    "正常做",
    "规格",
    "口味"
  ],//做法
  feeding:["加料"],//加料
  remarks: [],//备注
  propsGroupSort: [
    "固定菜",
    "可选分组1",
    "可选分组2",
    "可选分组3",
    "可选分组4",
    "可选分组5",
    "加料",
    "正常做",
    "规格",
    "口味"
  ],
  propsSort: {
  }
}



const outputDir = path.join(__dirname, "merchantInfos")


// 打印日志到test.json 文件夹
async function logInfo(info,fileName="test") { 
  fs.writeFileSync("./"+fileName+".json",JSON.stringify(info,null,'\t'))
}

// 获取原始数据
async function getMerchantInfo() { 
  // let requestMenuData = await requestUrl(menuRequestUrl);
  let merchantInfo = await handleRequestData(merchantMenuInfo)
  return merchantInfo;
}

let propsGroupArr=[];

function formatFoodProps(foodItem) { 
  let propsGroups = foodItem.methodCategories || [];
  let combosList = foodItem.combosList || [];
  let norms = foodItem.norms || []; //规格
  let additionCategories = foodItem.additionCategories || [];//加料
  
  let propsRes = propsGroups.map(groupItem => { 
    let groupTemp = {}
    groupTemp.name = groupItem.categoryName;
    addPropsGroupArr(propsGroupArr, groupTemp.name)
    groupTemp.values = groupItem.methodList.map( methodItem=> { 
      return {
        value: methodItem.name,
        price: methodItem.markupPrice,
        propName:groupTemp.name,
        isMul:true
      }
    })
    return groupTemp
  })
  

  combosList && combosList.forEach((comboItem,index) => {
    let groupTemp = {}
    let basePrice = parseFloat(comboItem.price || 0)
    groupTemp.name = comboItem.groupName || (index==0 ? "固定菜":"可选分组"+index);
    addPropsGroupArr(propsGroupArr, groupTemp.name)
    groupTemp.values = comboItem.cdatList.map( cdatItem=> { 
      return {
        value: cdatItem.name,
        price: parseFloat(cdatItem.price),
        propName:groupTemp.name,
        isMul:false
      }
    })
    propsRes.push(groupTemp)
  })

  if (norms && norms.length > 0) {
    let groupTemp = {
      name: "规格",
      values:[]
    }
    addPropsGroupArr(propsGroupArr, groupTemp.name)
    groupTemp.values = norms.map( normItem=> { 
      return {
        value: normItem.name,
        price: parseFloat(normItem.price),
        propName:groupTemp.name,
        isMul:false
      }
    })
    propsRes.push(groupTemp)
  }

  if (additionCategories && additionCategories.length > 0) {
    additionCategories.sort((a, b) => (a.sort > b.sort ? 1 : -1))
    

    let groupTemp = {
      name: "加料",
      values:[]
    }
    addPropsGroupArr(propsGroupArr, groupTemp.name)
    additionCategories.forEach(additionCategoryItem => {
      let additionArr = additionCategoryItem.additions.map(additionItem => {
        return {
          value: additionItem.name,
          price: parseFloat(additionItem.priceUpValue),
          propName:groupTemp.name,
          isMul:true
        }
      })
      groupTemp.values.push(...additionArr)

    })
    propsRes.push(groupTemp)
  }

  return propsRes;
  
}
// 爬取的数据中进行信息提取
async function  handleRequestData(requestMenuData) {

  
  try {
    // 商户信息
    let merchantInfo = {
      shopName: shopeInfo.restaurantName,
      shop_pic: shopeInfo.restaurantUrl,
      categories:[]
    }

    // 菜品目录
    let categories = [], categoriesObjTemp = {}

    foodList.forEach(foodItem => { 
      let categoryId = foodItem.dishesType.dishesTypeId;
      if (categoriesObjTemp[categoryId]) {
        categoriesObjTemp[categoryId].push(JSON.parse(JSON.stringify(foodItem)))
      } else { 
        categoriesObjTemp[categoryId] = [JSON.parse(JSON.stringify(foodItem))]
      } 
    })





    categories = requestMenuData.foodCategories.map(categoryItem => { 
      let categoryData = {
        name: "",
        foods:[]
      };
      categoryData.name = categoryItem.dishesTypeName;
      let categoryId = categoryItem.dishesTypeId;
      // console.log(categoriesObj,categoriesObj[categoryId])
      // (categoriesObjTemp[categoryId]==undefined)&&console.log("categoryId---",categoriesObjTemp[categoryId],categoryId)
      categoryData.foods = categoriesObjTemp[categoryId]&&categoriesObjTemp[categoryId].reduce((res,goodItem) => { 
        if (goodItem&&!goodItem.hide) { 
          let foodData = {
            name:goodItem.dishesName || "",
            picUrl: goodItem.dishesIntroImage || "",
            price:goodItem.dishesPrice || "",
            unit: goodItem.dishesUnit || "份",
            categoryName: categoryItem.dishesTypeName,
            props:[],
          };
          foodData.picUrl = foodData.picUrl&&(foodData.picUrl.slice(0,foodData.picUrl.indexOf(".jpg")) + ".jpg")
          goodItem.categoryName = categoryItem.dishesTypeName;
          foodData.props = formatFoodProps(goodItem)
          res.push(foodData)
        }
        return res;
      },[]) || []
      return categoryData
    })

    merchantInfo.categories = categories
    // await logInfo(merchantInfo)
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
  
  // return;
  let { shopName} = merchantInfo
  let shopDir = path.join(outputDir, formatFileName(shopName));
  // // 重建创建商铺目录
  await mkShopDir(shopDir)



  // // mkShopDir(merchantInfo)
  if (exportMode == "keruyun") {
    genImgs(merchantInfo,outputDir);
    genExcel(merchantInfo, outputDir);
    genExcelAll(merchantInfo,outputDir,menuSetting)
  } else if(exportMode == 'feie') {
    // genWord(merchantInfo, outputDir)
    // genSpecificationsWord(merchantInfo, outputDir,menuSetting)
    genFeieExcelAll(merchantInfo, outputDir,menuSetting)
  }else if (exportMode == 'shilai') {
    genShilaiExcelAll(merchantInfo, outputDir, menuSetting,)
  }
}


genImgsAndExcel();
