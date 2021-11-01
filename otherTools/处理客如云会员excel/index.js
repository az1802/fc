const fs = require("fs");
const path = require("path");

let sname = "米迪迪乐", sum = 0;
let res = fs.readFileSync('test.csv', 'utf-8');
let arrTemp = res.toString().split('\r\n')
let str = "", phoneMap = {};

for (let i = 1; i < arrTemp.length; i++) {
  let infoArr = arrTemp[i].split(",");
  if (!phoneMap[infoArr[0]]) {
    phoneMap[infoArr[0]] = true;
    if (infoArr[11]!=0) {
      str += `${infoArr[0]},${infoArr[11]},0\n`;
      sum += parseFloat(infoArr[11] || 0);
    }
  }
}

console.log(sum)

fs.writeFileSync(path.resolve(__dirname,`${sname}-会员列表.txt`),str)