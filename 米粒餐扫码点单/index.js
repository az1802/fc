const fs = require('fs');
const path = require('path');
const axios = require('axios');
const token = 'v1tkp2bl0b0kc46br723m4jh0t91hbtfaf';
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
  name: '美蛙甲鱼馆',
};

let res = require('./merchantInfo.json');
let { dishList: menuList } = res.data;

let menuSetting = {
  //到处的菜品属性归为规格,备注,加料,做法
  specifications: [], //规格
  practice: ['打包', '种类', '做法', '打包'], //做法
  feeding: ['加料'], //加料
  remarks: [], //备注
  propsGroupSort: ['打包', '种类', '做法', '打包'],
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

function formatFoodProps(foodItem) {
  let propsRes = [];

  return propsRes;
}

async function getDishInfo(dishId) {
  let res = await axios.request({
    baseURL: 'https://zzgsaas.leshuazf.com',
    url: '/customer/dish/outer/getDish',
    headers: {
      token: token,
    },
    params: {
      id: dishId,
    },
  });
  return res;
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

    categories = menuList.map(categoryItem => {
      let categoryData = {
        name: '',
        foods: [],
      };
      categoryData.name = categoryItem.categoryName;
      categoryData.foods = categoryItem.cateDishList.reduce(
        async (res, foodItem) => {
          // let foodDetailInfo = await getDishInfo(foodItem.id);
          // console.log('foodDetailInfo: ', foodDetailInfo);

          if (foodItem) {
            let foodData = {
              name: foodItem.dishName.replace(/\//gi, '-') || '',
              picUrl: foodItem.imageUrl || '',
              price: (foodItem.price || 0) / 100,
              unit: foodItem.unitname || '份',
              categoryName: categoryData.name,
              props: [],
            };
            foodData.props = [];
            res.push(foodData);
          }
          return res;
        },
        []
      );

      return categoryData;
    });

    merchantInfo.categories = categories;
    return merchantInfo;
  } catch (err) {
    console.log(err, `格式化转换菜品发生错误${menuRequestUrl}`);
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
