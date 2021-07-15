
const fs = require("fs");
const path = require("path");


const { requestUrl,genImgs,genExcel,formatFileName,delDirSync,mkdirSync} = require("../utils/index")




const shopId = 22400932 
const shopId = 22400932
// const menuRequestUrl = `https://m.dianping.com/orderdish/wxm/ajax/dishMenu?shopId=${shopId}`
// 不带token的请求地址 可用通过shopId 爬取所有商家的数据
const menuRequestUrl = `https://m.dianping.com/orderdish/wxm/ajax/dishMenu?shopId=${shopId}&shopuuid=&tableNum=3&orderId=&dishSource=0&thirdAppId=&thirdOpenId=&platform=ios&mimaversion=3.19.3&subAppId=wxf49e0ceaceaed8aa&openId=gbR-fHnj-qDtGAwpQPTK1VsMJ81XRxHGCSutkpCZnEE`
// const menuRequestUrl = `https://m.dianping.com/orderdish/wxm/ajax/dishMenu?shopId=${shopId}&shopuuid=&tableNum=3&orderId=&dishSource=0&thirdAppId=&thirdOpenId=&token=bc1b2fc0336d2f1521f4d38a23bc7ce2cd2f9c73c24abdc79b4d03bb933094dd28fdb005236d337a3e75dd1dc2a5e911042c408965e73fe6f89d216e2816f7b4&platform=ios&mimaversion=3.19.3&subAppId=wxf49e0ceaceaed8aa&openId=gbR-fHnj-qDtGAwpQPTK1VsMJ81XRxHGCSutkpCZnEE`


const outputDir = path.join(__dirname, "merchantInfos")


// 打印日志到test.json 文件夹
async function logInfo(info) { 
  fs.writeFileSync("./test.json",JSON.stringify(info,null,'\t'))
}

// 获取原始数据
async function getMerchantInfo() { 
  let requestData = await requestUrl(menuRequestUrl);
  let merchantInfo = await handleRequestData(requestData)
  return merchantInfo;
}

// 爬取的数据中进行信息提取
async function  handleRequestData(requestData) {
  await logInfo(requestData)
  try {
    let { menuExtraInfo, spuDetail, spuMenuCategories } = requestData.data;
    // 商户信息
    let merchantInfo = {
      shopName: menuExtraInfo.shopName,
      shop_pic: menuExtraInfo.shopPic,
      categories:[]
    }

    // 菜品目录
    let categories = []

    categories = spuMenuCategories.map(categoryItem => { 
      let categoryData = {
        name: "",
        foods:[]
      };
      categoryData.name = categoryItem.name;
      categoryData.foods = categoryItem.spuIdList.reduce((res,foodId) => { 
        let foodItem = spuDetail[foodId];
        if (foodItem) { 
          let foodData = {
            name:foodItem.spuName || "",
            picUrl: foodItem.picUrl || "",
            price:foodItem.originPrice || "",
            unit: foodItem.unit || "份",
            categoryName:categoryItem.name
          };
          res.push(foodData)
        }
        return res;
      },[])
      
      return categoryData
    })

    merchantInfo.categories = categories

    return merchantInfo;
  } catch (err) { 
    console.log(err, `格式化转换菜品发生错误${menuRequestUrl}`)
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
  // 重建创建商铺目录
  await mkShopDir(shopDir)
  // await logInfo(merchantInfo)

  // mkShopDir(merchantInfo)
  genImgs(merchantInfo,outputDir);
  genExcel(merchantInfo, outputDir);
}



genImgsAndExcel();
