const stream = require('stream')

// 将字节数组流转换为javascript中的流文件
function byteArryToBlob(byteArry) {
    var byteArray = new Uint8Array(byteArry);
    var blobData = window.URL.createObjectURL(new Blob([byteArray], { type: 'application/octet-stream' }));
    return {
        url: blobData,
        file: new Blob([byteArray])
    } 
}
// 数字保留几位小数
function numberToFixed(val, num) {
    let number = num ? num : 2
    let endVal = parseFloat((val).toFixed(number))
    return endVal
}

/**
 * 图片命名，转成其他格式
 * @param {*} name 
 * @param {*} type  '.json'
 * @returns reWriteName
 */
function strImageToOther(name, type) {
    console.log(name, type);
    let reWriteName = ''
    let str = name.substr(-5)
    if (str.includes('.jpg')) {
        reWriteName = name.substring(0,name.length-5) + str.replace('.jpg', type)
    } else if(str.includes('.jpeg')){
        reWriteName = name.substring(0,name.length-5) + str.replace('.jpeg', type)
    } else if(str.includes('.gif')){
        reWriteName = name.substring(0,name.length-5) + str.replace('.gif', type)
    }else if(str.includes('.png')){
        reWriteName = name.substring(0,name.length-5) + str.replace('.png', type)
    }else if(str.includes('.bmp')){
        reWriteName = name.substring(0,name.length-5) + str.replace('.bmp', type)
    }else if(str.includes('.pdf')){
        reWriteName = name.substring(0,name.length-5) + str.replace('.pdf', type)
    }
    return reWriteName
}

/**
 * 判断字符串是否包含 某个字符 
 * 包含 返回最后一个包含字符 后面的内容    不包含  返回原始
 * @param {*} name  需要截取的字符串
 * @param {*} str 包含的字符
 */
function strIncludeStr(name, str){
    let splitName= ''
    if (name.includes(str)) {
        let nameArr = name.split(str)
        splitName = nameArr[nameArr.length - 1]
    } else{
        splitName = name
    }
    return splitName
}

/**
 * mini 常用操作方法
 */
// 转成流
function toBlob(base64Data) {
    let byteString = base64Data
    if (base64Data.split(',')[0].indexOf('base64') >= 0) {
        byteString = window.atob(base64Data.split(',')[1]) // base64 解码
    } else {
        byteString = unescape(base64Data.split(',')[1])
    }
    // 获取文件类型
    let mimeString = base64Data.split(';')[0].split(":")[1] // mime类型
    let uintArr = new Uint8Array(byteString.length) // 创建视图

    for (let i = 0; i < byteString.length; i++) {
        uintArr[i] = byteString.charCodeAt(i)
    }
    // 生成blob
    const blob = new Blob([uintArr], {
        type: mimeString
    })
    // 使用 Blob 创建一个指向类型化数组的URL, URL.createObjectURL是new Blob文件的方法,可以生成一个普通的url,可以直接使用,比如用在img.src上
    return blob
}

/**
*
* @export 上传文件（stream流方法）
* @param {*} minioClient Object minio对象
* @param {*} backetName String 存储桶名字
* @param {*} fileObj Object 文件对象
* @param {*} fileName String 文件名称
* @param {*} path String 文件存储路径
* @param {*} vm Object 调用该方法的页面的this
* @return {*} null
*/
function uploadMinIo(minioClient, backetName, fileObj, fileName, path, vm) {
    let _this = this
    if (fileObj) {
        let file = fileObj;
        console.log("file", file);
        //判断是否选择了文件
        if (file == undefined) {
            //未选择
        } else {
            //选择
            // 获取文件类型及大小
            // 给文件名加上当前时间
            const mineType = file.type;
            const fileSize = file.size;
            //参数
            let metadata = {
                "content-type": mineType,
                "content-length": fileSize,
            };
            //判断储存桶是否存在
            minioClient.bucketExists(backetName, function (err) {
                console.log("判断储存桶是否存在");
                if (err) {
                    if (err.code == "NoSuchBucket")
                        return console.log("bucket does not exist.");
                    return console.log(err);
                }
                //准备上传
                let reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onloadend = function (e) {
                    //读取完成触发，无论成功或失败
                    const dataurl = e.target.result;
                    //base64转blob
                    const blob = toBlob(dataurl);
                    //blob转arrayBuffer
                    let reader2 = new FileReader();
                    reader2.readAsArrayBuffer(blob);
                    reader2.onload = function (ex) {
                        //定义流
                        let bufferStream = new stream.PassThrough();
                        //将buffer写入
                        bufferStream.end(Buffer.from(ex.target.result));
                        //上传
                        minioClient.putObject(
                            backetName,
                            `${path}${fileName}`,
                            bufferStream,
                            fileSize,
                            metadata,
                            function (err, etag) {
                                // console.log("dddddd");
                                if (err == null) { // 为空则代表上传成功
                                    // 调用传进来的this的的方法，然后通过该方法把成功事件发送出去
                                    vm.handleAvatarSuccess(vm.filedname);
                                    vm.fileName = fileName;
                                    vm.$message({
                                        message: "上传成功！",
                                        type: "success",
                                    });
                                }
                            }
                        );
                    };
                };
            });
        }
    } else {
        this.$message({
            message: "文件类型错误！",
            type: "error",
        });
    }
}

/**
  * 从minio下载图片,返回流
  * @param {*} minioClient Object minio对象
  * @param {*} bucket String 桶名称
  * @param {*} minioImgList Array 图片列表
  * @param {*} pathKey String 数组里面图片路径key
  * @param {*} callback Function 回调函数，
  */
function getMInioImg(minioClient, bucket, minioImgList, pathKey, callback) {
    for (let i = 0; i < minioImgList.length; i++) {
        minioClient.getObject(bucket, minioImgList[i][pathKey], function (err, dataStream) {
            if (err) {
                return console.log(err)
            }
            dataStream.on('data', function (chunk) {
                let blod = byteArryToBlob(chunk);
                minioImgList[i].file =blod.file 
                minioImgList[i].url = blod.url
            })
            dataStream.on('end', function () {
                callback(minioImgList)
            })
            dataStream.on('error', function (err) {
                console.log(err)
            })
        })

    }
}

/**
 * 获取minio Json文件
 * @param {*} minioClient Object minio对象
 * @param {*} bucket String 桶名称
 * @param {*} path 路径
 * @param {*} callback 回调函数
 */
function getMInioJsonFile(minioClient, bucket, path, callback) {
    minioClient.getObject(bucket, path, function (err, dataStream) {
        if (err) {
            return console.log(err)
        }
        dataStream.on('data', function (chunk) {
            var byteArray = new Uint8Array(chunk);
            console.log(new Blob([byteArray], { type: 'application/octet-stream' }));
            const reader = new FileReader();
            reader.readAsText(new Blob([byteArray], { type: 'application/octet-stream' }));
            reader.onload = e => {
                let res = JSON.parse(e.target.result)
                callback(res)
            };
        })
        dataStream.on('end', function () {
        })
        dataStream.on('error', function (err) {
            console.log(err)
        })
    })
}

/**
 * 删除minio对象
 * @param {*} minioClient Object minio对象
 * @param {*} bucket String 桶名称
 * @param {*} path 路径
 * @param {*} callback 回调函数
 */
function deleteMinioObject(minioClient, bucketName, objectName, callback){
    minioClient.removeObject(bucketName, objectName, function(err, dataStream){
        if (err) {
            callback('err', err)
          } else {
            callback('success')
          }
    })
}

export default {
    byteArryToBlob,
    numberToFixed,
    uploadMinIo,
    getMInioImg,
    getMInioJsonFile,
    deleteMinioObject,
    strImageToOther,
    strIncludeStr
}