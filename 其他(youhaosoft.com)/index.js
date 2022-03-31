
const fs = require("fs");
const path = require("path");


const { requestUrl,genImgs,genExcel,genExcelAll,genWord,genSpecificationsWord,formatFileName,delDirSync,mkdirSync,genShilaiExcelAll,genFeieExcelAll} = require("../utils/index")




// const exportMode = "keruyun"
const exportMode = "feie"
// const exportMode = "shilai"

let allMerchantInfo = require("./merchantInfo.json");
let allImgs = require('./imgs.json')

let {dishinfos,dishtypes,dishspecs,dishmarks} = allMerchantInfo;
let requestShopData = {
  name:"润科华府",
  picUrl:""
}




const outputDir = path.join(__dirname, "merchantInfos")

let menuSetting = { //到处的菜品属性归为规格,备注,加料,做法
  specifications:[ ],//规格
  practice: [
   '加料'
  ],//做法
  feeding:[],//加料
  remarks: [],//备注
  propsGroupSort: [
    '加料'
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
  let merchantInfo = await handleRequestData()
  return merchantInfo;
}

function addPropsGroupArr(propsGroupArr,name) {
  if (propsGroupArr.indexOf(name) == -1) {
    propsGroupArr.push(name)
  } 
}

function formatFoodProps(foodItem) {
  if(!foodItem){return []};
  let {markdetails} = foodItem;
  let propsRes = [];

  let addSpecs = {
    name:"加料",
    values:[]
  }
  markdetails.forEach(item=>{
    addSpecs.values.push({
      value: item.markname,
      price: parseFloat( item.addprice || 0),
      propName:"加料",
      isMul:true
    })
   
  })


  propsRes.push(addSpecs)
 

  return propsRes;
}





// 爬取的数据中进行信息提取
async function  handleRequestData() {


  
  try {
    // 商户信息
    let merchantInfo = {
      shopName: requestShopData.name,
      shop_pic: requestShopData.picUrl,
      categories:[]
    }
    let allFoods = [],categoryMap = {},imgMap = {},dishInfoMap = {},categoryInfoMap={},dishmarksMap = {};

  
    allImgs.forEach(item=>{
      imgMap[item.dishno] =`http://res.youhaosoft.com/${item.dishurl}`
    })
    dishspecs.forEach(item=>{
      dishInfoMap[item.dishno] = item
    })
    dishtypes.forEach(item=>{
      categoryInfoMap[item.typeno] = item
    })
    dishmarks.forEach(item=>{
      dishmarksMap[item.dishno] = item
    })

    dishinfos.forEach(item=>{
      if(!categoryMap[item.typeno]){
        categoryMap[item.typeno]={
          name:categoryInfoMap[item.typeno].typename,
          foods:[],
          sortno:categoryInfoMap[item.typeno].sortno,

        }
      }

      categoryMap[item.typeno].foods.push({
        name: item.dishname.replace(/\//ig,"-") || "",
        picUrl: imgMap[item.dishno] || '',
        price:parseFloat( dishInfoMap[item.dishno].price) || "",
        unit: dishInfoMap[item.dishno].specname|| "份",
        categoryName:  categoryInfoMap[item.typeno].typename,
        props:formatFoodProps(dishmarksMap[item.dishno]) || [],
      })
    })


    let categoryVals = Object.values(categoryMap);

    categoryVals = categoryVals.sort((a,b)=>{
      return b.sortno > a.sortno ? -1 : 1;
    })

    merchantInfo.categories = categoryVals
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
    genImgs(merchantInfo, outputDir);
    genExcel(merchantInfo, outputDir);
    genExcelAll(merchantInfo, outputDir, menuSetting)
  } else if (exportMode == 'shilai') {
    genShilaiExcelAll(merchantInfo, outputDir, menuSetting)
  } else if (exportMode == 'feie') {
    genFeieExcelAll(merchantInfo, outputDir, menuSetting)
  }else{  
    genWord(merchantInfo, outputDir)
    genSpecificationsWord(merchantInfo,outputDir,menuSetting)
  }

}



genImgsAndExcel();
