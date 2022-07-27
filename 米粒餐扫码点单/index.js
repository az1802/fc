const fs = require('fs');
const path = require('path');
const axios = require('axios');
const token = '3qsoodg5aelq745nnlu9mpnrsqa1he1fab';
const propGroupArr = new Set()
const {
  requestUrl,
  genImgs,
  genExcel,
  genExcelAll,
  genWord,
  genSpecificationsWord,
  formatFileName,
  delDirSync,
  mkdirSync,
  genFeieExcelAll,
  genShilaiExcelAll,
} = require('../utils/index');

const shopId = 20211;
// const exportMode = "keruyun"
const exportMode = 'feie';
// const exportMode = "shilai"

const outputDir = path.join(__dirname, 'merchantInfos');
let shopInfo = {
  name: '湖南美食',
};

let res = require('./merchantInfo.json');
let { dishList: menuList } = res.data;

let menuSetting = {
  //到处的菜品属性归为规格,备注,加料,做法
  specifications: [], //规格
  practice: [ '规格', '粉', '口味', '面' ], //做法
  feeding: ['加料'], //加料
  remarks: [], //备注
  propsGroupSort: [ '规格', '粉', '口味', '面' ],
  propsSort: {},
};

let propsGroupArr = [];

// 打印日志到test.json 文件夹
async function logInfo(info, fileName = 'test.json') {
  fs.writeFileSync(`./${fileName}.json`, JSON.stringify(info, null, '\t'));
}

// 获取原始数据
async function getMerchantInfo() {
  return handleRequestData();
}

function formatFoodProps(foodDetail,foodItem) {
  let {sizeList,flavorList,dishSideList} = foodDetail;
  let propsRes = [];
  if(sizeList.length){
    propGroupArr.add("规格")
    propsRes.push({
      name: "规格",
      values:sizeList.map(item=> {
        return {
          "value": item.sizeName,
          "price": item.price - foodItem.price,
          "propName": "规格",
          "isMul": false
        }
      })
    })
  }

  if(flavorList.length){
    flavorList.forEach(groupItem=>{
      propGroupArr.add( groupItem.flavorName,)
      propsRes.push({
        name: groupItem.flavorName,
        values:groupItem.detailList.map(item=> {
          return {
            "value": item.detailName,
            "price": 0,
            "propName": groupItem.flavorName,
            "isMul": false
          }
        })
      })
    })

  }
  if(dishSideList.length){
    // TODO
  }
  return propsRes;
}
var cnt = 1;
async function getDishInfo(dishId) {
  let res = await axios.request({
    url: 'https://zzgsaas.leshuazf.com/customer/dish/outer/getDish',
    method:"post",
    headers: {
      token: token,
    },
    data: {
      id: dishId,
    },
  }).catch(err=>{
    cnt==1&&console.log('err: ', err);

  });
  return res&&res.data&&res.data.data || false;
}
// 爬取的数据中进行信息提取
async function handleRequestData() {
  try {
    // 商户信息
    let merchantInfo = {
      shopName: shopInfo.name,
      shop_pic: '',
      categories: [],
    };

    // 菜品目录
    let categories = [];
    console.log('menuList: ', menuList);

    categories = await Promise.all(menuList.map(async categoryItem => {
      let categoryData = {
        name: '',
        foods: [],
      };
      categoryData.name = categoryItem.categoryName;
      categoryData.foods = await Promise.all(categoryItem.cateDishList.map(
        async ( foodItem) => {
          let foodDetailInfo = await getDishInfo(foodItem.id);
          if (foodItem) {
            let foodData = {
              name: foodItem.dishName.replace(/\//gi, '-') || '',
              picUrl: foodItem.imageUrl || '',
              price: (foodItem.price || 0) / 100,
              unit: foodItem.unitname || '份',
              categoryName: categoryData.name,
              props: [],
            };
            foodData.props = foodDetailInfo ? formatFoodProps(foodDetailInfo,foodItem) : [];
            return foodData;
          }
          return {}

        }
      ))

      return categoryData;
    }))

    merchantInfo.categories = categories;
    return merchantInfo;
  } catch (err) {
    console.log(err, `格式化转换菜品发生错误`);
  }
}

// 数据转换提取,写入相关文件

async function mkShopDir(shopDir) {
  delDirSync(shopDir);
  mkdirSync(shopDir);
}

// 生成图片文件夹以及excel文件
async function genImgsAndExcel() {
  let merchantInfo = await getMerchantInfo();
  console.log(
    '%cmerchantInfo: ',
    'color: MidnightBlue; background: Aquamarine; font-size: 20px;',
    merchantInfo
  );
  let { shopName } = merchantInfo;
  console.log(
    '%cshopName: ',
    'color: MidnightBlue; background: Aquamarine; font-size: 20px;',
    shopName
  );
  console.log([...propGroupArr])
  let shopDir = path.join(outputDir, formatFileName(shopName));
  // // 重建创建商铺目录
  await mkShopDir(shopDir);

  // // // mkShopDir(merchantInfo)
  if (exportMode == 'keruyun') {
    genImgs(merchantInfo, outputDir);
    genExcel(merchantInfo, outputDir);
    genExcelAll(merchantInfo, outputDir, menuSetting);
  } else if (exportMode == 'shilai') {
    genShilaiExcelAll(merchantInfo, outputDir, menuSetting, false);
  } else {
    // genWord(merchantInfo, outputDir)
    // genSpecificationsWord(merchantInfo, outputDir, menuSetting)
    genFeieExcelAll(merchantInfo, outputDir, menuSetting);
  }
}

genImgsAndExcel();
