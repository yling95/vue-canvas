// 将字节数组流转换为javascript中的流文件
function byteArryToBlob (byteArry) {
    var byteArray = new Uint8Array(byteArry);
    var blobData = window.URL.createObjectURL(new Blob([byteArray], { type:'application/octet-stream' }));
    return blobData
}
// 数字保留几位小数
function numberToFixed(val, num){
   let number =  num ? num :  2
   let endVal =  parseFloat((val).toFixed(number)) 
    return endVal
}
export default{
    byteArryToBlob,
    numberToFixed
}