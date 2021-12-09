<!--
 * @Author: your name
 * @Date: 2021-03-18 17:01:06
 * @LastEditTime: 2021-11-15 18:10:34
 * @LastEditors: sunj
 * @Description: In User Settings Edit
 * @FilePath: /dish_crawler/美团扫码点餐(rms.meituan)/README.md
-->
获取到shopId 进行替换,直接浏览器访问
https://rms.meituan.com/diancan/web/menu?shopId=600344937//商户的网页版本


 //全部数据
https://rms.meituan.com/diancan/api/menuHead?mtShopId=600344937
数据在js文件中查找之后复制到tempData 去除外层包裹之后运行脚本即可


美团扫码的热销菜品目录只显示数据中的前十个菜品,多的不显示
