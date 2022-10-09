<template>
    <div>
        <div class="box">
            <!-- 左侧数据列表 -->
            <DataConfig @changeNowImage="changeNowImage" @minioClient="minioClientSava" @allImageList="allImageList"
                ref="dataConfig"></DataConfig>
            <!-- 中间canvas操作内容 -->
            <div>
                <!-- 当前操作的图片 -->

                <!-- 操作按钮栏 -->
                <div style="margin-bottom:20px;white-space: nowrap;padding-top: 20px;">
                    <a-button type="primary" @click="addPoint(), drawType = 'point'" class="marginL20">添加点</a-button>
                    <a-button type="primary" @click="drawRectangular('rectangular')" class="marginL20">添加矩形</a-button>
                    <a-button type="primary" @click="drawRectangular('square')" class="marginL20">添加正方形</a-button>
                    <a-button type="primary" @click="chooseMark()" class="marginL20">选中标注</a-button>
                    <a-button type="primary" @click="saveDrawData" class="marginL20"
                        :disabled="(coordinates.point.length == 0 && coordinates.rectangular.length == 0)">保存</a-button>
                    <div>当前正在操作的图片： 图片地址：{{storageSelectNow.newBucket}}/{{nowOperateInfo.imageUpdateUrl}}</div>
                    <div style="width: 400px;">
                        <a-slider id="test" :default-value="imageSize" @change="scaleCanvas" />
                    </div>

                </div>
                <!-- canvas绘制栏 -->
                <div :width="canvasSize.w" :height="canvasSize.h" style="box-sizing: border-box;">
                    <canvas id="canvas" :width="canvasSize.w" :height="canvasSize.h" ref="canvas"></canvas>
                </div>

                <!-- 上一张  下一张 按钮 -->
                <div v-if="imgSourceType == 1 && nowListImgIndex !=null" style="margin-top: 20px;">
                    <!-- <a-button type="primary"
                        :disabled="(coordinates.point.length == 0 && coordinates.rectangular.length == 0) || !isDataSave"
                        @click="changeNowImage( serviceImageList[nowListImgIndex - 1], nowListImgIndex - 1, 1)" v-if="nowListImgIndex > 0 ">上一张</a-button> -->
                    <a-button type="primary"
                        :disabled="(coordinates.point.length == 0 && coordinates.rectangular.length == 0) || !isDataSave"
                        @click="changeNowImage(serviceImageList[nowListImgIndex + 1], nowListImgIndex + 1, 1)"
                        v-if="(serviceImageList.filter(item=> !item.disable)).length > 0">
                        下一张</a-button>
                </div>
                <!-- 当加载主机下挂载有未操作的图片的时候 -->
                <div v-if="imgSourceType == 1 && nowListImgIndex ==null" style="margin-top: 20px;">
                    <a-button type="primary"
                        :disabled="(coordinates.point.length == 0 && coordinates.rectangular.length == 0) || !isDataSave"
                        @click="changeNowImage(serviceImageList[0], 0, 1), nowListImgIndex = 0"
                        v-if="(serviceImageList.filter(item=> !item.disable)).length > 0">
                        下一张</a-button>
                </div>
            </div>
            <!-- 右侧操作数据 -->
            <div>
                <div v-if="coordinates.point.length > 0">
                    圆点:
                    <div v-for="(item, index) in coordinates.point" :key="index">
                        <span>圆点 {{ index + 1 }}:</span><span>x轴:{{ item.x }},y轴:{{ item.y }}</span>
                        <a-button size="small" @click="clearArcFun(index, 'point')">删除</a-button>
                    </div>
                </div>
                <div v-if="coordinates.rectangular.length > 0">
                    矩形:
                    <div v-for="(item, index) in coordinates.rectangular" :key="index">
                        <span>矩形 {{ index + 1 }}:</span>
                        <div>
                            <span>x轴1:{{ item.x1 }},y轴1:{{ item.y1 }}</span>
                            <span>x轴2:{{ item.x2 }},y轴2:{{ item.y2 }}</span>
                        </div>
                        <a-button size="small" @click="clearArcFun(index, 'rectangular')">删除</a-button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { get } from 'http'
import dataConfig from './dataConfig'
import DataConfig from './dataConfig.vue'
const imgLocal = require('./modify.jpg')

export default {
    components: { dataConfig, DataConfig },
    data() {
        return {
            msg: '管理列表',
            imgsrc: '',
            coordinates: {
                point: [],
                rectangular: []
            }, // 图片上绘制点和矩形得位置
            canvasSize: { w: 100, h: 100 },
            canvas: '', // canvas
            ctx: '',
            drawType: '', // 绘制的类型  point点， rectangular矩形， null 暂不绘制
            imageSize: 30, // 图片缩放大小
            nowListImgIndex: null, // 当前服务器列表展示图片的索引
            scaleNum: 1,
            isDataSave: false, // 标注图片数据是否保存

            imgSourceType: 1, // 当前图片列表展示的类型，1服务器列表；2历史数据列表
            serviceImageList: [],// 服务器图片列表
            historyImgList: [], // 操作历史图片
            nowImageIfo: {}, // 当前图片的信息
            storageSelectNow: {}, // 当前数据集
            minioClient: '', // minio服务端

            hostName: '', // 当前主机唯一标识
            nowOperateInfo: {}, // 当前操作信息

        }
    },
    mounted() {
        // 从缓存获取唯一标识，没有的话创建一个唯一标识
        let hostName = localStorage.getItem('hostName')
        if (!hostName) {
            let uuid = this.$uuid.v1()
            localStorage.setItem('hostName', uuid)
            hostName = uuid
        }
        this.hostName = hostName
    },
    methods: {
        /**
        * 数据操作方法开始
        */
        /**
         * minio客户端和 当前使用数据集
         * @param {*} minioClient Object minio连接以后的对象
         * @param {*} storageSelectNow Object  当前使用的数据集
         */
        minioClientSava(minioClient, storageSelectNow) {
            this.minioClient = minioClient
            this.storageSelectNow = storageSelectNow
        },

        /**
         * 图片列表改变
         * @param {*} list Array 图片列表
         * @param {*} type Number 1:服务器图片，2历史图片
         */
        async allImageList(list, type) {
            let _this = this
            if (type == 1) {
                this.serviceImageList = list
                console.log('图片列表', this.serviceImageList);
                // 先查询主机下是否有可编辑的图片,返回true标识没有待操作图片，可以自行选择操作
                let canNext = await this.getHostHasOperate()
                if (canNext && list.length > 0) { // 主机下没有任务的时候   加载第一张图片
                    _this.nowListImgIndex = 0
                    _this.changeNowImage(list[0], 0, 1)
                }
            } else if (type == 2) {
                this.historyImgList = list
            }
        },
        /**
         *  切换图片 
         * @param {*} nowImageIfo Object图片信息
         * @param {*} index Number  图片在数组中的索引
         * @param {*} type 展示图片源 1 list  2 history default:1
         */
        changeNowImage(nowImageIfo, index, type) {
            // 当前如果没有标注数据，并且有图片的情况 不允许切换图片
            if ((this.coordinates.point.length == 0 && this.coordinates.rectangular.length == 0) || !this.isDataSave) {
                this.$message.warning('请先标注图片并保存')
                return false
            }

            this.imgSourceType = type
            this.nowImageIfo = nowImageIfo


            // 回显的数据
            if (type == 2) {
                this.coordinates = JSON.parse(JSON.stringify(nowImageIfo.coordinates))
            } else if (type == 1) {
                //  图片是否可剪切到另一个位置
                this.nowListImgIndex = index
                this.getImageCanCut(nowImageIfo.name)
                this.coordinates = {
                    point: [],
                    rectangular: []
                }
                this.isDataSave = false
            }
        },
        /**
         * 剪切图片
         * @param {*} nowImageIfo Object  需要剪切的图片信息
         * @param {*} callback Function  剪切成功的回调
         */
        cutMinioImage(nowImageIfo, callback) {
            let _this = this
            console.log(nowImageIfo);
            let splitName = nowImageIfo.name.split('/')
            console.log('minio', nowImageIfo.file);
            // 上传minio到新的地址
            this.$utils.uploadMinIo(_this.minioClient, _this.storageSelectNow.newBucket, nowImageIfo.file, splitName[splitName.length - 1], _this.storageSelectNow.newPath, {
                handleAvatarSuccess(res) {
                    console.log('上传成功', res);
                    // 删除原始图片
                    _this.$utils.deleteMinioObject(_this.minioClient, _this.storageSelectNow.bucket, nowImageIfo.name, function (type, message) {
                        if (callback) {
                            callback(1)
                        }
                        if (type == 'err') {
                            console.log('删除失败', type, message);
                        } else if (type == 'success') {
                            console.log('图片剪切成功的回调', type, message);
                            // 让子组件更新列表
                            _this.$refs.dataConfig.listDataSave(_this.serviceImageList, 1)
                            // 更新操作状态
                            _this.upDateOperate(1)
                        }
                    })
                },
                $message(res) {
                    // _this.$message[res.type](res.message, 2)
                }
            })
        },
        /**
         * 第三步 更新操作状态
         * @param {*} status 更新操作的状态 图片状态 0-可剪 1-已剪 2-已操作
         */
        async upDateOperate(status, jsonName) {
            let _this = this
            let param = {
                hostName: this.hostName,
                id: this.nowOperateInfo.id,
                imageUpdateUrl: this.storageSelectNow.newPath + this.$utils.strIncludeStr(_this.nowImageIfo.name, '/'),
                status: status,
                storageId: this.storageSelectNow.id,
                storageName: this.storageSelectNow.name
            }
            if (status == 2) {
                let addObj = {
                    operateData: jsonName
                }
                Object.assign(param, addObj)
            }
            let res = await this.$axios('/api/operate/update', param, 'POST')
            if (res) {
                console.log('更新操作状态', res);
                if (res.code == 200) {
                    if (status == 1) {
                        let nowImageIfo = { url: '', name: '', file: '' }
                        let list = [res.data]
                        _this.$utils.getMInioImg(_this.minioClient, _this.storageSelectNow.newBucket, list, 'imageUpdateUrl', function (res) {
                            nowImageIfo.url = res[0].url
                            nowImageIfo.name = res[0].imageUrl
                            nowImageIfo.file = res[0].file
                            _this.loadImage(nowImageIfo.url)
                            _this.nowImageIfo = nowImageIfo
                        })
                        this.nowOperateInfo = res.data
                    } else if (status == 2) {
                        _this.isDataSave = true
                    }

                }
            }
        },
        /**
         * 查询当前主机是否有未操作的图片
         */
        async getHostHasOperate() {
            let _this = this
            let params = {
                hostName: this.hostName
            }
            let res = await this.$axios('/api/operate/query', params)
            let canNext = false
            if (res) {
                if (res.data) {
                    console.log('当前主机下有未操作的图片', res.data);
                    // 当前主机下有未操作的图片
                    if (res.data.status == 0 && res.data.imageUpdateUrl == null && res.data.imageUrl != null) {
                        // 获取当前图片，组装当前图片信息并剪切。（图片流，图片地址）
                        let nowImageIfo = { url: '', name: '', file: '' }
                        let list = [res.data]
                        _this.$utils.getMInioImg(_this.minioClient, _this.storageSelectNow.bucket, list, 'imageUrl', function (res) {
                            nowImageIfo.url = res[0].url
                            nowImageIfo.name = res[0].imageUrl
                            nowImageIfo.file = res[0].file
                            _this.nowImageIfo = nowImageIfo
                            _this.cutMinioImage(_this.nowImageIfo, function (res) {
                                _this.$refs.dataConfig.listMinioObject() // 剪切成功刷新minio列表
                            })
                            _this.loadImage(nowImageIfo.url)
                        })
                        _this.nowListImgIndex = null
                        this.nowOperateInfo = res.data
                    }
                    // 有已剪未操作的图片
                    if (res.data.status == 1) {
                        // 获取当前图片，组装当前图片信息并剪切。（图片流，图片地址）
                        let nowImageIfo = { url: '', name: '', file: '' }
                        let list = [res.data]
                        _this.$utils.getMInioImg(_this.minioClient, _this.storageSelectNow.newBucket, list, 'imageUpdateUrl', function (res) {
                            nowImageIfo.url = res[0].url
                            nowImageIfo.name = res[0].imageUrl
                            nowImageIfo.file = res[0].file
                            _this.loadImage(nowImageIfo.url)
                            _this.nowImageIfo = nowImageIfo
                        })
                        _this.nowListImgIndex = null
                        this.nowOperateInfo = res.data
                    } else if (res.data.status != 0) {
                        // 表示当前主机下有其他状态的图片，可以去操作其他图片
                        canNext = true
                    }
                } else {
                    canNext = true
                }
                return canNext
            }
        },

        /**
         * 第一步  
         * 传img  图片是否可剪切到另一个位置
         * 不传  查主机名是否含有可编辑的图片
         * @param {} img String // 图片名称
         */
        async getImageCanCut(img) {
            let _this = this
            let param = img ? {
                imageUrl: img,
                hostName: this.hostName
            } : {
                hostName: this.hostName
            }
            let res = await this.$axios('/api/operate/exists', param, 'GET')
            if (res) {
                console.log('请求是否可剪切图片到另一个位置', res);
                // 图片已被别人操作
                if (res.code == 200 && res.data == null) {
                    _this.$message.error('当前图片已被他人操作')
                    _this.serviceImageList[nowListImgIndex].disable = true
                    return false
                }
                // 图片时可剪状态并且是当前图片
                if (res.data.status == 0 && res.data.imageUrl == img) {
                    // 第二步 将需要编辑的图片，剪切到另一个地址
                    this.cutMinioImage(_this.nowImageIfo)
                    this.nowOperateInfo = res.data
                    _this.serviceImageList[nowListImgIndex].disable = true
                }
                // 当前主机下有未操作的图片
                if (res.data.status == 0 && res.data.imageUrl != img && res.data.imageUpdateUrl == null && res.data.imageUrl != null) {
                    // 获取当前图片，组装当前图片信息并剪切。（图片流，图片地址）
                    console.log('当前主机下有未操作的图片');
                    _this.$message.warning('当前有未操作的图片，请先操作之前的图片。')
                    let nowImageIfo = { url: '', name: '', file: '' }
                    let list = [res.data]
                    _this.$utils.getMInioImg(_this.minioClient, _this.storageSelectNow.bucket, list, 'imageUrl', function (res) {
                        nowImageIfo.url = res[0].url
                        nowImageIfo.name = res[0].imageUrl
                        nowImageIfo.file = res[0].file
                        _this.nowImageIfo = nowImageIfo
                        this.cutMinioImage(_this.nowImageIfo)
                        this.loadImage(nowImageIfo.url)
                    })
                    _this.nowListImgIndex = null

                    this.nowOperateInfo = res.data
                }
                // 有已剪未操作的图片
                if (res.data.status == 1) {
                    // 获取当前图片，组装当前图片信息并剪切。（图片流，图片地址）
                    _this.$message.warning('当前有未操作的图片，请先操作之前的图片。')
                    let nowImageIfo = { url: '', name: '', file: '' }
                    let list = [res.data]
                    _this.$utils.getMInioImg(_this.minioClient, _this.storageSelectNow.newBucket, list, 'imageUpdateUrl', function (res) {
                        nowImageIfo.url = res[0].url
                        nowImageIfo.name = res[0].imageUrl
                        nowImageIfo.file = res[0].file
                        _this.loadImage(nowImageIfo.url)
                        _this.nowImageIfo = nowImageIfo
                    })
                    _this.nowListImgIndex = null
                    this.nowOperateInfo = res.data
                }

                // 当前图片已被编辑 剪下一张
                if (res.data.status == 2) {
                    // this.nowOperateInfo = res.data
                }
            }
        },

        // 保存绘制的数据 上传minio
        saveDrawData() {
            let _this = this
            this.drawType = null
            let data = JSON.stringify(this.coordinates, undefined, 4);
            // 截取最后/后面的内容
            console.log(_this.nowImageIfo.name);
            let splitName = _this.$utils.strIncludeStr(_this.nowImageIfo.name, '/')
            // 后面5位是否包含图片名称，并且替换成json
            let jsonName = _this.$utils.strImageToOther(splitName, '.json')
            console.log('jsonName===', jsonName);
            var blob = new Blob([data], { type: "text/json" })
            // 上传minio
            this.$utils.uploadMinIo(_this.minioClient, _this.storageSelectNow.newBucket, blob, jsonName, _this.storageSelectNow.newPath, {
                handleAvatarSuccess(res) {
                    // json数据上传成功，更新操作状态
                    _this.upDateOperate(2, _this.storageSelectNow.newPath + jsonName)
                },
                $message(res) {
                    _this.$message[res.type](res.message, 2)
                }
            })
        },

        /**
         * canvas绘制方法
         */

        // 缩放图片
        scaleCanvas(value) {
            let _this = this
            let enVal = value - 30 // 默认滑动条在30
            // 默认步长 1/0.02
            if (enVal > 0) {
                _this.scaleNum = parseFloat((1 + (enVal * 0.02)).toFixed(2))
                _this.loadImage(_this.imgsrc)
            } else {
                _this.scaleNum = parseFloat((1 - (-enVal * 0.02)).toFixed(2))
                _this.loadImage(_this.imgsrc)
            }
            console.log('缩放比例', _this.scaleNum);
        },
        /**
         * canvas加载图片获取画布宽高
         * @param {*} url 图片地址
         */
        loadImage(url) {
            console.log('加载图片', url);
            let _this = this
            let img = new Image()
            img.src = _this.imgsrc = url
            img.onload = () => {
                // 画布大小
                _this.canvasSize = { w: img.width * _this.scaleNum, h: img.height * _this.scaleNum }
                const canvas = _this.$refs.canvas
                _this.canvas = canvas
                _this.ctx = canvas.getContext('2d') // 使用document找到的
                // 绘制图片
                _this.creatImage()
            }
        },

        // 在画布上绘制图片
        creatImage() {
            let _this = this
            let ctx = _this.ctx
            let img = new Image()
            img.src = _this.imgsrc
            img.onload = () => {
                ctx.beginPath()
                // 缩放比例
                ctx.scale(_this.scaleNum, _this.scaleNum)
                ctx.drawImage(img, 0, 0)
                ctx.save()
                // 设置绘制时的样式
                _this.reversCanvasDefaultStyle()
                // 如果有标注数据 回显标注
                if (_this.coordinates.point.length > 0 || _this.coordinates.rectangular.length) {
                    _this.reversDraw()
                }
            }
        },

        // 重置canvas绘制 边框、填充样式
        reversCanvasDefaultStyle() {
            let ctx = this.ctx
            ctx.fillStyle = "#ff0000";
            ctx.strokeStyle = "#ff0000"
            ctx.setLineDash([0, 0]);
            ctx.lineWidth = 2
        },

        /**
         * 删除点、矩形、正方形
         * @param {*} index Number 在数组中的索引
         * @param {*} type String 点：point 矩形：rectangular
         */
        clearArcFun(index, type) {
            let _this = this
            if (type == 'point') {
                _this.coordinates.point.splice(index, 1)
            }
            if (type == 'rectangular') {
                _this.coordinates.rectangular.splice(index, 1)
            }
            _this.creatImage()
        },

        // 重新绘制
        reversDraw() {
            if (this.coordinates.point.length > 0) {
                let arr = this.coordinates.point
                let ctx = this.ctx
                for (let i = 0; i < arr.length; i++) {
                    ctx.beginPath();
                    ctx.lineWidth = 2
                    ctx.arc(arr[i].x, arr[i].y, arr[i].sAngle, 0, 2 * Math.PI);
                    ctx.fill()
                    ctx.stroke();  //fill()执行填充色  stroke()执行线条
                }
            }
            if (this.coordinates.rectangular.length > 0) {
                let arr = this.coordinates.rectangular
                for (let i = 0; i < arr.length; i++) {
                    this.drawRectangularFn(arr[i])
                }
            }

        },

        // 判断点在不在正方形里面
        judgePointInRectangular() {
            let point = { x: 10, y: 10 }
            let rectangular = { x1: 10, y1: 20, x2: 20, y2: 40 }
            if (point.x >= rectangular.x1 && point.x <= rectangular.x2 && point.y >= rectangular.y1 && point.y >= rectangular.y2) {
                console.log('isinner', point);
            }
        },

        /**
         * 重新绘制矩形
         * @param {*} abj Object 矩形数据 {x1:,x2,y1:,y2:}
         */
        drawRectangularFn(abj) {
            let ctx = this.ctx
            ctx.strokeRect(abj.x1, abj.y1, abj.x2 - abj.x1, abj.y2 - abj.y1);
        },

        // 绘制的时候添加虚线，和8个点 以便于编辑
        drawDashedRectangular(x1, y1, x2, y2) {
            let ctx = this.ctx
            let _this = this;
            ctx.beginPath();
            let direction = this.drawDirection({ x1: x1, y1: y1, x2: x2, y2: y2 })
            let eightPoint = ''
            let point = {
                width: 10,
                height: 10,
                midwidth: 7, // 虚线框间隔标注
                midCha: 2, // 八个点距离标注的间隙
            }
            // 判断方位 绘制点
            if (direction == 1) {
                // 右下角
                ctx.moveTo(x1 - point.midwidth, y1 - point.midwidth);
                ctx.lineTo(x2 + point.midwidth, y1 - point.midwidth);
                ctx.lineTo(x2 + point.midwidth, y2 + point.midwidth);
                ctx.lineTo(x1 - point.midwidth, y2 + point.midwidth);
                ctx.lineTo(x1 - point.midwidth, y1 - point.midwidth);
                ctx.strokeStyle = "#654b34";
                ctx.setLineDash([3, 3]);
                ctx.lineWidth = 1
                ctx.stroke()
                ctx.save()
                ctx.closePath()
                ctx.setLineDash([0, 0]);
                ctx.fillStyle = "#21d86d"
                ctx.strokeRect(x1 - point.width - point.midCha, y1 - point.height - point.midCha, point.width, point.height);
                ctx.strokeRect(x2 + point.midCha, y1 - point.height - point.midCha, point.width, point.height);
                ctx.strokeRect(x2 + point.midCha, y2 + point.midCha, point.width, point.height);
                ctx.strokeRect(x1 - point.width - point.midCha, y2 + point.midCha, point.width, point.height);
                ctx.fillRect(x1 - point.width - point.midCha, y1 - point.height - point.midCha, point.width, point.height) // 左上角
                ctx.fillRect(x2 + point.midCha, y1 - point.height - point.midCha, point.width, point.height) // 右上角
                ctx.fillRect(x2 + point.midCha, y2 + point.midCha, point.width, point.height) // 右下角
                ctx.fillRect(x1 - point.width - point.midCha, y2 + point.midCha, point.width, point.height) // 左下角
                ctx.strokeRect(_this.$utils.numberToFixed((x1 - point.midCha + ((x2 + point.midCha - x1 - point.width) / 2))), y1 - point.height - point.midCha, point.width, point.height);
                ctx.fillRect(_this.$utils.numberToFixed((x1 - point.midCha + ((x2 + point.midCha - x1 - point.width) / 2))), y1 - point.height - point.midCha, point.width, point.height) // 上
                ctx.strokeRect(x2 + point.midCha, _this.$utils.numberToFixed((y1 - point.midwidth + ((y2 + point.midCha - y1 - point.height) / 2))), point.width, point.height);
                ctx.fillRect(x2 + point.midCha, _this.$utils.numberToFixed((y1 - point.midwidth + ((y2 + point.midCha - y1 - point.height) / 2))), point.width, point.height) // 右
                ctx.strokeRect(_this.$utils.numberToFixed((x1 - point.midCha + ((x2 + point.midCha - x1 - point.midwidth) / 2))), y2 + point.midCha, point.width, point.height);
                ctx.fillRect(_this.$utils.numberToFixed((x1 - point.midCha + ((x2 + point.midCha - x1 - point.midwidth) / 2))), y2 + point.midCha, point.width, point.height) // 下
                ctx.strokeRect(x1 - point.width - point.midCha, _this.$utils.numberToFixed((y1 - point.midwidth + ((y2 + point.midCha - y1 - point.midwidth) / 2))), point.width, point.height);
                ctx.fillRect(x1 - point.width - point.midCha, _this.$utils.numberToFixed((y1 - point.midwidth + ((y2 + point.midCha - y1 - point.midwidth) / 2))), point.width, point.height) // 左

                eightPoint = {
                    1: { x1: x1 - point.width - point.midCha, y1: y2 + point.midCha, x2: x1 - point.width - point.midCha + point.width, y2: y2 + point.midCha + point.height },// 左下角
                    2: { x1: x2 + point.midCha, y1: y2 + point.midCha, x2: x2 + point.midCha + point.width, y2: y2 + point.midCha + point.height },// 右下角
                    3: { x1: x2 + point.midCha, y1: y1 - point.height - point.midCha, x2: x2 + point.midCha + point.width, y2: y1 - point.height - point.midCha + point.height },//右上角
                    4: { x1: x1 - point.width - point.midCha, y1: y1 - point.height - point.midCha, x2: x1 - point.width - point.midCha + point.width, y2: y1 - point.height - point.midCha + point.height },// 左上角
                    5: {
                        x1: _this.$utils.numberToFixed((x1 - point.midCha + ((x2 + point.midCha - x1 - point.width) / 2))),
                        y1: y1 - point.height - point.midCha,
                        x2: _this.$utils.numberToFixed((x1 - point.midCha + ((x2 + point.midCha - x1 - point.width) / 2))) + point.width,
                        y2: y1 - point.height - point.midCha + point.width
                    },
                    6: {
                        x1: x2 + point.midCha,
                        y1: _this.$utils.numberToFixed((y1 - point.midwidth + ((y2 + point.midCha - y1 - point.height) / 2))),
                        x2: x2 + point.midCha + point.width,
                        y2: _this.$utils.numberToFixed((y1 - point.midwidth + ((y2 + point.midCha - y1 - point.height) / 2))) + point.width
                    },
                    7: {
                        x1: _this.$utils.numberToFixed((x1 - point.midCha + ((x2 + point.midCha - x1 - point.midwidth) / 2))),
                        y1: y2 + point.midCha,
                        x2: _this.$utils.numberToFixed((x1 - point.midCha + ((x2 + point.midCha - x1 - point.midwidth) / 2))) + point.width,
                        y2: y2 + point.midCha + point.width
                    },
                    8: {
                        x1: x1 - point.width - point.midCha,
                        y1: _this.$utils.numberToFixed((y1 - point.midwidth + ((y2 + point.midCha - y1 - point.midwidth) / 2))),
                        x2: x1 - point.width - point.midCha + point.width,
                        y2: _this.$utils.numberToFixed((y1 - point.midwidth + ((y2 + point.midCha - y1 - point.midwidth) / 2))) + point.width
                    }
                }
            } else if (direction == 2) {
                // 右上角
                ctx.moveTo(x1 - point.midwidth, y1 + point.midwidth);
                ctx.lineTo(x2 + point.midwidth, y1 + point.midwidth);
                ctx.lineTo(x2 + point.midwidth, y2 - point.midwidth);
                ctx.lineTo(x1 - point.midwidth, y2 - point.midwidth);
                ctx.lineTo(x1 - point.midwidth, y1 + point.midwidth);
                ctx.strokeStyle = "#654b34";
                ctx.setLineDash([3, 3]);
                ctx.lineWidth = 1
                ctx.stroke()
                ctx.save()
                ctx.closePath()
                ctx.setLineDash([0, 0]);
                ctx.fillStyle = "#21d86d"
                ctx.strokeRect(x1 - point.width - point.midCha, y1 + point.midCha, point.width, point.width);
                ctx.strokeRect(x2 + point.midCha, y1 + point.midCha, point.width, point.width);
                ctx.strokeRect(x2 + point.midCha, y2 - point.width - point.midCha, point.width, point.width);
                ctx.strokeRect(x1 - point.width - point.midCha, y2 - point.width - point.midCha, point.width, point.width);
                ctx.fillRect(x1 - point.width - point.midCha, y1 + point.midCha, point.width, point.width) // 左下角
                ctx.fillRect(x2 + point.midCha, y1 + point.midCha, point.width, point.width) // 右下角
                ctx.fillRect(x2 + point.midCha, y2 - point.width - point.midCha, point.width, point.width) // 右上角
                ctx.fillRect(x1 - point.width - point.midCha, y2 - point.width - point.midCha, point.width, point.width)// 左上角
                ctx.strokeRect(_this.$utils.numberToFixed((x1 - point.midCha + ((x2 + point.width - x1 - point.width) / 2))), y1 + point.midCha, point.width, point.width);
                ctx.fillRect(_this.$utils.numberToFixed((x1 - point.midCha + ((x2 + point.width - x1 - point.width) / 2))), y1 + point.midCha, point.width, point.width)
                ctx.strokeRect(x2 + point.midCha, _this.$utils.numberToFixed((y1 - point.midwidth + ((y2 + point.midCha - y1 + point.midCha) / 2))), point.width, point.width);
                ctx.fillRect(x2 + point.midCha, _this.$utils.numberToFixed((y1 - point.midwidth + ((y2 + point.midCha - y1 + point.midCha) / 2))), point.width, point.width)

                ctx.strokeRect(_this.$utils.numberToFixed((x1 - point.midCha + ((x2 + point.width - x1 - point.width) / 2))), y2 - point.width - point.midCha, point.width, point.width);
                ctx.fillRect(_this.$utils.numberToFixed((x1 - point.midCha + ((x2 + point.width - x1 - point.width) / 2))), y2 - point.width - point.midCha, point.width, point.width)
                ctx.strokeRect(x1 - point.width - point.midCha, _this.$utils.numberToFixed((y1 - point.midwidth + ((y2 + point.midCha - y1 + point.midCha) / 2))), point.width, point.width);
                ctx.fillRect(x1 - point.width - point.midCha, _this.$utils.numberToFixed((y1 - point.midwidth + ((y2 + point.midCha - y1 + point.midCha) / 2))), point.width, point.width)
                eightPoint = {
                    1: { x1: x1 - point.width - point.midCha, y1: y1 + point.midCha, x2: x1 - point.width - point.midCha + point.width, y2: y1 + point.midCha + 6 },// 左下角
                    2: { x1: x2 + point.midCha, y1: y1 + point.midCha, x2: x2 + point.midCha + point.width, y2: y1 + point.midCha + point.width },// 右下角
                    3: { x1: x2 + point.midCha, y1: y2 - point.width - point.midCha, x2: x2 + point.midCha + point.width, y2: y2 - point.width - point.midCha + point.width },//右上角
                    4: { x1: x1 - point.width - point.midCha, y1: y2 - point.width - point.midCha, x2: x1 - point.width - point.midCha + point.width, y2: y2 - point.width - point.midCha + point.width },// 左上角
                    5: { x1: _this.$utils.numberToFixed((x1 - point.midCha + ((x2 + point.width - x1 - point.width) / 2))), y1: y1 + point.midCha, x2: _this.$utils.numberToFixed((x1 - point.midCha + ((x2 + point.width - x1 - point.width) / 2))) + point.width, y2: y1 + point.midCha + point.width },// 正下方
                    6: {
                        x1: x2 + point.midCha,
                        y1: _this.$utils.numberToFixed((y1 - point.midwidth + ((y2 + point.midCha - y1 + point.midCha) / 2))),
                        x2: x2 + point.midCha + point.width,
                        y2: _this.$utils.numberToFixed((y1 - point.midwidth + ((y2 + point.midCha - y1 + point.midCha) / 2))) + point.width
                    },// 正右方
                    7: { x1: _this.$utils.numberToFixed((x1 - point.midCha + ((x2 + point.width - x1 - point.width) / 2))), y1: y2 - point.width - point.midCha, x2: _this.$utils.numberToFixed((x1 - point.midCha + ((x2 + point.width - x1 - point.width) / 2))) + point.width, y2: y2 - point.width - point.midCha + point.width },// 正上方
                    8: {
                        x1: x1 - point.width - point.midCha,
                        y1: _this.$utils.numberToFixed((y1 - point.midwidth + ((y2 + point.midCha - y1 + point.midCha) / 2))),
                        x2: x1 - point.width - point.midCha + point.width,
                        y2: _this.$utils.numberToFixed((y1 - point.midwidth + ((y2 + point.midCha - y1 + point.midCha) / 2))) + point.width
                    }
                }
            } else if (direction == 4) {
                // 左下角
                ctx.moveTo(x1 + point.midwidth, y1 - point.midwidth);
                ctx.lineTo(x2 - point.midwidth, y1 - point.midwidth);
                ctx.lineTo(x2 - point.midwidth, y2 + point.midwidth);
                ctx.lineTo(x1 + point.midwidth, y2 + point.midwidth);
                ctx.lineTo(x1 + point.midwidth, y1 - point.midwidth);
                ctx.strokeStyle = "#654b34";
                ctx.setLineDash([3, 3]);
                ctx.lineWidth = 1
                ctx.stroke()
                ctx.save()
                ctx.closePath()
                ctx.setLineDash([0, 0]);
                ctx.fillStyle = "#21d86d"
                ctx.strokeRect(x1 + point.midCha, y1 - point.width - point.midCha, point.width, point.width);
                ctx.strokeRect(x2 - point.width - point.midCha, y1 - point.width - point.midCha, point.width, point.width);
                ctx.strokeRect(x2 - point.width - point.midCha, y2 + point.midCha, point.width, point.width);
                ctx.strokeRect(x1 + point.midCha, y2 + point.midCha, point.width, point.width);
                ctx.fillRect(x1 + point.midCha, y1 - point.width - point.midCha, point.width, point.width) // 右上角
                ctx.fillRect(x2 - point.width - point.midCha, y1 - point.width - point.midCha, point.width, point.width) // 左上角
                ctx.fillRect(x2 - point.width - point.midCha, y2 + point.midCha, point.width, point.width) // 左下角
                ctx.fillRect(x1 + point.midCha, y2 + point.midCha, point.width, point.width) // 右下角
                ctx.strokeRect(_this.$utils.numberToFixed((x1 - point.midCha + ((x2 + point.midwidth - x1 - point.midwidth) / 2))), y1 - point.width - point.midCha, point.width, point.width);
                ctx.fillRect(_this.$utils.numberToFixed((x1 - point.midCha + ((x2 + point.midwidth - x1 - point.midwidth) / 2))), y1 - point.width - point.midCha, point.width, point.width)// 上
                ctx.strokeRect(x2 - point.width - point.midCha, _this.$utils.numberToFixed((y1 - point.midwidth + ((y2 + point.midCha - y1 + point.midCha) / 2))), point.width, point.width);
                ctx.fillRect(x2 - point.width - point.midCha, _this.$utils.numberToFixed((y1 - point.midwidth + ((y2 + point.midCha - y1 + point.midCha) / 2))), point.width, point.width) // 左
                ctx.strokeRect(_this.$utils.numberToFixed((x1 - point.midCha + ((x2 + point.midwidth - x1 - point.midwidth) / 2))), y2 + point.midCha, point.width, point.width);
                ctx.fillRect(_this.$utils.numberToFixed((x1 - point.midCha + ((x2 + point.midwidth - x1 - point.midwidth) / 2))), y2 + point.midCha, point.width, point.width) // 下
                ctx.strokeRect(x1 + point.midCha, _this.$utils.numberToFixed((y1 - point.midwidth + ((y2 + point.midCha - y1 + point.midCha) / 2))), point.width, point.width);
                ctx.fillRect(x1 + point.midCha, _this.$utils.numberToFixed((y1 - point.midwidth + ((y2 + point.midCha - y1 + point.midCha) / 2))), point.width, point.width) // 右
                eightPoint = {
                    1: { x1: x2 - point.width - point.midCha, y1: y2 + point.midCha, x2: x2 - point.width - point.midCha + point.width, y2: y2 + point.midCha + point.width },// 左下角
                    2: { x1: x1 + point.midCha, y1: y2 + point.midCha, x2: x1 + point.midCha + point.width, y2: y2 + point.midCha + point.width },//右下角
                    3: { x1: x1 + point.midCha, y1: y1 - point.width - point.midCha, x2: x1 + point.midCha + point.width, y2: y1 - point.width - point.midCha + point.width },// 右上角
                    4: { x1: x2 - point.width - point.midCha, y1: y1 - point.width - point.midCha, x2: x2 - point.width - point.midCha + point.width, y2: y1 - point.width - point.midCha + point.width },// 左上角
                    5: {
                        x1: _this.$utils.numberToFixed((x1 - point.midCha + ((x2 + point.midwidth - x1 - point.midwidth) / 2))),
                        y1: y2 + point.midCha,
                        x2: _this.$utils.numberToFixed((x1 - point.midCha + ((x2 + point.midwidth - x1 - point.midwidth) / 2))) + point.width,
                        y2: y2 + point.midCha + point.width
                    },// 下
                    6: {
                        x1: x1 + point.midCha,
                        y1:  _this.$utils.numberToFixed((y1 - point.midwidth + ((y2 + point.midCha - y1 + point.midCha) / 2))),
                        x2: x1 + point.midCha + point.width,
                        y2:  _this.$utils.numberToFixed((y1 - point.midwidth + ((y2 + point.midCha - y1 + point.midCha) / 2))) + point.width
                    },// 右
                    7: {
                        x1: _this.$utils.numberToFixed((x1 - point.midCha + ((x2 + point.midwidth - x1 - point.midwidth) / 2))),
                        y1: y1 - point.width - point.midCha,
                        x2: _this.$utils.numberToFixed((x1 - point.midCha + ((x2 + point.midwidth - x1 - point.midwidth) / 2))) + point.width,
                        y2: y1 - point.width - point.midCha + point.width
                    },// 上
                    8: {
                        x1: x2 - point.width - point.midCha,
                        y1: _this.$utils.numberToFixed((y1 - 5 + ((y2 + 2 - y1 - 8) / 2))),
                        x2: x1 + 2 + point.width,
                        y2:  _this.$utils.numberToFixed((y1 - point.midwidth + ((y2 + point.midCha - y1 + point.midCha) / 2))) + point.width
                    } //左
                }
            } else if (direction == 3) {
                // 左上角
                ctx.moveTo(x1 + point.midwidth, y1 + point.midwidth);
                ctx.lineTo(x2 - point.midwidth, y1 + point.midwidth);
                ctx.lineTo(x2 - point.midwidth, y2 - point.midwidth);
                ctx.lineTo(x1 + point.midwidth, y2 - point.midwidth);
                ctx.lineTo(x1 + point.midwidth, y1 + point.midwidth);
                ctx.strokeStyle = "#654b34";
                ctx.setLineDash([3, 3]);
                ctx.lineWidth = 1
                ctx.stroke()
                ctx.save()
                ctx.closePath()
                ctx.setLineDash([0, 0]);
                ctx.fillStyle = "#21d86d"
                ctx.strokeRect(x1 + point.midCha, y1 + point.midCha, point.width, point.width);
                ctx.strokeRect(x2 - point.width - point.midCha, y1 + point.midCha, point.width, point.width);
                ctx.strokeRect(x2 - point.width - point.midCha, y2 - point.width - point.midCha, point.width, point.width);
                ctx.strokeRect(x1 + point.midCha, y2 - point.width - point.midCha, point.width, point.width);
                ctx.fillRect(x1 + point.midCha, y1 + point.midCha, point.width, point.width)
                ctx.fillRect(x2 - point.width - point.midCha, y1 + point.midCha, point.width, point.width)
                ctx.fillRect(x2 - point.width - point.midCha, y2 - point.width - point.midCha, point.width, point.width)
                ctx.fillRect(x1 + point.midCha, y2 - point.width - point.midCha, point.width, point.width)
                ctx.strokeRect(_this.$utils.numberToFixed((x1 - point.midCha + ((x2 + point.midwidth - x1 - point.midwidth - point.midwidth) / 2))), y1 + point.midCha, point.width, point.width);
                ctx.fillRect(_this.$utils.numberToFixed((x1 - point.midCha + ((x2 + point.midwidth - x1 - point.midwidth - point.midwidth) / 2))), y1 + point.midCha, point.width, point.width) // 下
                ctx.strokeRect(x2 - point.width - point.midCha, _this.$utils.numberToFixed((y1 - point.midwidth + ((y2 + point.midCha - y1 + point.midCha) / 2))), point.width, point.width);
                ctx.fillRect(x2 - point.width - point.midCha, _this.$utils.numberToFixed((y1 - point.midwidth + ((y2 + point.midCha - y1 + point.midCha) / 2))), point.width, point.width) // 左
                ctx.strokeRect(_this.$utils.numberToFixed((x1 - point.midCha + ((x2 + point.midwidth - x1 - point.midwidth - point.midwidth) / 2))), y2 - point.width - point.midCha, point.width, point.width);
                ctx.fillRect(_this.$utils.numberToFixed((x1 - point.midCha + ((x2 + point.midwidth - x1 - point.midwidth - point.midwidth) / 2))), y2 - point.width - point.midCha, point.width, point.width) // 上
                ctx.strokeRect(x1 + point.midCha, _this.$utils.numberToFixed((y1 - point.midwidth + ((y2 + point.midCha - y1 + point.midCha) / 2))), point.width, point.width);
                ctx.fillRect(x1 + point.midCha, _this.$utils.numberToFixed((y1 - point.midwidth + ((y2 + point.midCha - y1 + point.midCha) / 2))), point.width, point.width) // 右
                eightPoint = {
                    1: { x1: x2 - 8, y1: y1 + 2, x2: x2 - 8 + point.width, y2: y1 + 2 + point.width },// 左下角
                    2: { x1: x1 + 2, y1: y1 + 2, x2: x1 + 2 + point.width, y2: y1 + 2 + point.width },// 右下角
                    3: { x1: x1 + 2, y1: y2 - 8, x2: x1 + 2 + point.width, y2: y2 - 8 + point.width },// 右上角
                    4: { x1: x2 - 8, y1: y2 - 8, x2: x2 - 8 + point.width, y2: y2 - 8 + point.width },//左上角
                    5: { x1:_this.$utils.numberToFixed((x1 - point.midCha + ((x2 + point.midwidth - x1 - point.midwidth - point.midwidth) / 2))), 
                        y1: y1 + point.midCha, 
                        x2: _this.$utils.numberToFixed((x1 - point.midCha + ((x2 + point.midwidth - x1 - point.midwidth - point.midwidth) / 2))) + point.width, 
                        y2: y1 + point.midCha + point.width 
                    },// 下
                    6: { x1: x1 + point.midCha, 
                        y1: _this.$utils.numberToFixed((y1 - point.midwidth + ((y2 + point.midCha - y1 + point.midCha) / 2))), 
                        x2: x1 + point.midCha + point.width, 
                        y2: _this.$utils.numberToFixed((y1 - point.midwidth + ((y2 + point.midCha - y1 + point.midCha) / 2))) + point.width 
                    },// 右
                    7: { x1: _this.$utils.numberToFixed((x1 - point.midCha + ((x2 + point.midwidth - x1 - point.midwidth - point.midwidth) / 2))), 
                        y1: y2 - point.width - point.midCha, 
                        x2: _this.$utils.numberToFixed((x1 - point.midCha + ((x2 + point.midwidth - x1 - point.midwidth - point.midwidth) / 2))) + point.width, 
                        y2: y2 - point.width - point.midCha + point.width 
                    },// 上
                    8: { x1: x2 - point.width - point.midCha, 
                        y1:  _this.$utils.numberToFixed((y1 - point.midwidth + ((y2 + point.midCha - y1 + point.midCha) / 2))), 
                        x2: x2 - point.width - point.midCha + point.width, 
                        y2:  _this.$utils.numberToFixed((y1 - point.midwidth + ((y2 + point.midCha - y1 + point.midCha) / 2))) + point.width 
                    } // 左
                }
            }
            this.reversCanvasDefaultStyle()
            return eightPoint
        },

        /**
         *  判断绘制矩形正方形的方向
         * @param {*} rectangular Object 矩形数据 {x1:,x2,y1:,y2:}
         * return 1：右下角  2：右上角  3：左上角  4：左下角
         */
        drawDirection(rectangular) {
            let direction = ''
            if (rectangular.x2 - rectangular.x1 > 0 && rectangular.y2 - rectangular.y1 > 0) {
                direction = 1
            }
            if (rectangular.x2 - rectangular.x1 > 0 && rectangular.y2 - rectangular.y1 < 0) {
                direction = 2
            }
            if (rectangular.x2 - rectangular.x1 < 0 && rectangular.y2 - rectangular.y1 < 0) {
                direction = 3
            }
            if (rectangular.x2 - rectangular.x1 < 0 && rectangular.y2 - rectangular.y1 > 0) {
                direction = 4
            }

            return direction
        },

        /**
         * 点是否在矩形内
         * @export  false true
         * @param {*} x Number 当前X
         * @param {*} y Number 当前Y
         * @param {*} rectangularObj Object 矩形数据 {x1:,x2,y1:,y2:}
         */
        isInPonint(x, y, rectangularObj) {
            // 1步：声明变量返回值，默认为false
            let isIn = false
            // 1步 调用绘制矩形时的方向
            let direction = this.drawDirection(rectangularObj)
            // 2：判断点是否在矩形内
            if (direction == 1) {
                if (x >= rectangularObj.x1 && x <= rectangularObj.x2 && y >= rectangularObj.y1 && y <= rectangularObj.y2) {
                    isIn = true
                }
            } else if (direction == 2) {
                if (x >= rectangularObj.x1 && x <= rectangularObj.x2 && y <= rectangularObj.y1 && y >= rectangularObj.y2) {
                    isIn = true
                }
            } else if (direction == 3) {
                if (x <= rectangularObj.x1 && x >= rectangularObj.x2 && y <= rectangularObj.y1 && y >= rectangularObj.y2) {
                    isIn = true
                }
            } else if (direction == 4) {
                if (x >= rectangularObj.x1 && x >= rectangularObj.x2 && y <= rectangularObj.y1 && y >= rectangularObj.y2) {
                    isIn = true
                }
            }

            return isIn
        },

        /**
         * 根据八个点的索引，更改鼠标的样式
         * @param {*} key Number 在数组中的索引
         * @param {*} _this 当前this
         */
        byIndexChangeMouse(key, _this) {
            console.log(key);
            if (key == 5) {
                _this.style.cursor = "n-resize"
            } else if (key == 7) {
                _this.style.cursor = "s-resize"
            } else if (key == 6) {
                _this.style.cursor = "e-resize"
            }  else if (key == 8) {
                _this.style.cursor = "w-resize"
            } else if (key == 2) {
                _this.style.cursor = "se-resize" // 右下角
            } else if (key == 4) {
                _this.style.cursor = "nw-resize" // 左上角
            } else if ( key == 1) {
                _this.style.cursor = "sw-resize" // 左下角
            }  else if (key == 3 ) {
                _this.style.cursor = "ne-resize" // 右上角
            }else {
                _this.style.cursor = "help"
            }
            console.log(_this.style.cursor);
        },

        // 绘制点
        addPoint() {
            let _this = this
            let ctx = _this.ctx;
            let canvas = _this.canvas;
            let flag = false
            canvas.onmousedown = function (e) {
                if (_this.drawType == 'point') {
                    flag = true;
                }
            };
            canvas.onmousemove = function (e) {
                this.style.cursor = "crosshair"
                if (!flag) return;
                console.log('结束', e);
            };
            canvas.onmouseup = function (e) {
                // 计算的是鼠标点击的坐标  因此需要减去容器本身的偏移量
                if (_this.drawType == 'point') {
                    let offsetX = _this.$utils.numberToFixed(e.offsetX / _this.scaleNum)
                    let offsetY = _this.$utils.numberToFixed(e.offsetY / _this.scaleNum)
                    ctx.beginPath();
                    ctx.arc(offsetX, offsetY, 5, 0, 2 * Math.PI);
                    ctx.fill()
                    ctx.stroke();  //fill()执行填充色  stroke()执行线条
                    ctx.closePath()
                    flag = false;
                    let position = { x: offsetX, y: offsetY, sAngle: 5, eAngle: 0, counterclockwise: 2 * Math.PI }
                    _this.coordinates.point.push(position)
                    console.log('得到的位置', _this.coordinates);
                }
            };
        },

        /**
         * 绘制据矩形、正方形
         * @param {*} type String 矩形:'rectangular' 正方形：'square'
         */
        drawRectangular(type) {
            this.drawType = 'rectangular'
            // 绘制矩形：1、添加四个点。 2、判断是否满足四个点。 3、 将四个点的坐标连成线
            let _this = this
            let flag = false
            let ctx = _this.ctx;
            let canvas = _this.canvas;
            let startPoint = {}
            canvas.onmousedown = function (e) {
                if (_this.drawType == 'rectangular') {
                    ctx.beginPath();
                    let offsetX = _this.$utils.numberToFixed(e.offsetX / _this.scaleNum),
                        offsetY = _this.$utils.numberToFixed(e.offsetY / _this.scaleNum)
                    // 点击开始绘制矩形
                    if (flag == false) {
                        startPoint = { x: offsetX, y: offsetY }
                        ctx.strokeRect(offsetX, offsetY, 10, 10);
                        _this.drawDashedRectangular(offsetX, offsetY, offsetX + 10, offsetY + 10)
                    } else {
                        // 绘制正方形
                        if (type == 'square') {
                            if (offsetX > startPoint.x && offsetY < startPoint.y) {
                                // 右上角
                                ctx.strokeRect(startPoint.x, startPoint.y, offsetX - startPoint.x, -(offsetX - startPoint.x));
                                _this.coordinates.rectangular.push({ x1: startPoint.x, y1: startPoint.y, x2: (startPoint.x + offsetX - startPoint.x), y2: (startPoint.y - (offsetX - startPoint.x)) })
                            } else if (offsetX < startPoint.x && offsetY > startPoint.y) {
                                // 左下角
                                ctx.strokeRect(startPoint.x, startPoint.y, -(startPoint.x - offsetX), startPoint.x - offsetX);
                                _this.coordinates.rectangular.push({ x1: startPoint.x, y1: startPoint.y, x2: -(startPoint.x - offsetX) + startPoint.x, y2: startPoint.y + startPoint.x - offsetX })
                            } else {
                                ctx.strokeRect(startPoint.x, startPoint.y, offsetX - startPoint.x, offsetX - startPoint.x);
                                // 右下角和左上角
                                _this.coordinates.rectangular.push({ x1: startPoint.x, y1: startPoint.y, x2: (startPoint.x + offsetX - startPoint.x), y2: (startPoint.y + offsetX - startPoint.x) })
                            }
                        } else {
                            // 绘制矩形
                            ctx.strokeRect(startPoint.x, startPoint.y, offsetX - startPoint.x, offsetY - startPoint.y);
                            _this.coordinates.rectangular.push({ x1: startPoint.x, y1: startPoint.y, x2: offsetX, y2: offsetY })
                        }
                        console.log(_this.coordinates.rectangular);
                        startPoint = {}
                        ctx.closePath();
                        _this.creatImage()
                    }
                    flag = !flag

                }
            };
            canvas.onmousemove = function (e) {
                this.style.cursor = "crosshair"
                if (!flag) {
                    return false
                }
                _this.creatImage()
                setTimeout(() => {
                    let offsetX = _this.$utils.numberToFixed(e.offsetX / _this.scaleNum),
                        offsetY = _this.$utils.numberToFixed(e.offsetY / _this.scaleNum)
                    if (type == 'square') {
                        // 正方形
                        if (offsetX > startPoint.x && offsetY < startPoint.y) {
                            // 右上角
                            ctx.strokeRect(startPoint.x, startPoint.y, offsetX - startPoint.x, -(offsetX - startPoint.x));
                            _this.drawDashedRectangular(startPoint.x, startPoint.y, startPoint.x - (startPoint.x - offsetX), startPoint.y - (offsetX - startPoint.x))
                        } else if (offsetX < startPoint.x && offsetY > startPoint.y) {
                            // 左下角
                            ctx.strokeRect(startPoint.x, startPoint.y, -(startPoint.x - offsetX), startPoint.x - offsetX);
                            _this.drawDashedRectangular(startPoint.x, startPoint.y, startPoint.x - (startPoint.x - offsetX), startPoint.y - (offsetX - startPoint.x))
                        } else {
                            // 右下角，左上角
                            ctx.strokeRect(startPoint.x, startPoint.y, offsetX - startPoint.x, offsetX - startPoint.x);
                            _this.drawDashedRectangular(startPoint.x, startPoint.y, offsetX, startPoint.y + offsetX - startPoint.x)
                        }

                    } else {
                        // 矩形
                        ctx.strokeRect(startPoint.x, startPoint.y, offsetX - startPoint.x, offsetY - startPoint.y);
                        _this.drawDashedRectangular(startPoint.x, startPoint.y, offsetX, offsetY)
                    }
                }, 5)
            };
            canvas.onmouseup = function (e) {
            };
        },

        /**
         * 鼠标移入选中标注
         * @param {*} eightPointArr 用于鼠标移动编辑标注后，传入新的八个编辑点
         */
        chooseMark(eightPointArr) {
            let _this = this
            let canvas = _this.canvas;
            let selectObj = '', selectIndex = '';
            let eightPoint = eightPointArr || ''
            let isAllowDrawLine = false;
            canvas.onmousedown = function (e) {
                let arr = _this.coordinates.rectangular
                let offsetX = _this.$utils.numberToFixed(e.offsetX / _this.scaleNum),
                    offsetY = _this.$utils.numberToFixed(e.offsetY / _this.scaleNum)
                if (selectObj) {
                    let arrObj = { x1: eightPoint[2].x2, y1: eightPoint[2].y2, x2: eightPoint[4].x1, y2: eightPoint[4].y1 }
                    // 2:判断是否在矩形框内移动，修改鼠标样式
                    let isInPonint = _this.isInPonint(offsetX, offsetY, arrObj)
                    if (!isInPonint) {
                        eightPoint = ''
                        selectObj = ''
                        _this.creatImage()
                    } else {
                        let startPointDiff = { xDiff: offsetX - selectObj.x1, yDiff: offsetY - selectObj.y1 }
                        let width = selectObj.x2 - selectObj.x1;
                        let height = selectObj.y2 - selectObj.y1;
                        isAllowDrawLine = true;
                        // 小技巧：onmousedown内部添加一个onmousemove事件，就能监听长按鼠标并移动事件啦（不要忘记在onmouseup事件中消除绘制路径功能，否则轨迹会随着鼠标移动不停增加）
                        canvas.onmousemove = (e) => {
                            console.log('按住移动',isAllowDrawLine, e);
                            if (!isAllowDrawLine) {
                                return false
                            }
                            if (_this.canvas.style.cursor == 'move') {
                                // 根据鼠标按下的坐标，和当前移动后坐标，计算x，y距离
                                console.log(offsetX, offsetY, startPointDiff, _this.coordinates.rectangular[selectIndex]);
                                _this.coordinates.rectangular[selectIndex].x1 = offsetX + startPointDiff.xDiff
                                _this.coordinates.rectangular[selectIndex].x2 = offsetX + startPointDiff.xDiff - width
                                _this.coordinates.rectangular[selectIndex].y1 = offsetY + startPointDiff.yDiff
                                _this.coordinates.rectangular[selectIndex].y2 = offsetY + startPointDiff.yDiff - height

                            } else if (_this.canvas.style.cursor == 'n-resize') {
                                // 上下移动
                                console.log('上下移动n');
                                _this.coordinates.rectangular[selectIndex].y1 = offsetY
                            } else if (_this.canvas.style.cursor == 's-resize') {
                                // 上下移动
                                console.log('上下移动s');
                                _this.coordinates.rectangular[selectIndex].y2 = offsetY
                            } else if (_this.canvas.style.cursor == 'se-resize') {
                                // 上下移动
                                console.log(' 右下角');
                            } else if (_this.canvas.style.cursor == 'nw-resize') {
                                // 上下移动
                                console.log(' 左上角');
                            } else if (_this.canvas.style.cursor == 'sw-resize') {
                                // 上下移动
                                console.log(' 左下角');
                            } else if (_this.canvas.style.cursor == 'ne-resize') {
                                // 上下移动
                                console.log(' 右上角');
                            }
                            console.log('=============');
                            _this.creatImage()
                            selectObj = _this.coordinates.rectangular[selectIndex]
                            setTimeout(() => {
                                eightPoint = _this.drawDashedRectangular(_this.coordinates.rectangular[selectIndex].x1, _this.coordinates.rectangular[selectIndex].y1, _this.coordinates.rectangular[selectIndex].x2, _this.coordinates.rectangular[selectIndex].y2)
                            }, 0)
                        }
                        canvas.onmouseup = (e) => {
                            console.log('鼠标抬起来2');
                            isAllowDrawLine = true
                            eightPoint = _this.drawDashedRectangular(_this.coordinates.rectangular[selectIndex].x1, _this.coordinates.rectangular[selectIndex].y1, _this.coordinates.rectangular[selectIndex].x2, _this.coordinates.rectangular[selectIndex].y2)
                            _this.chooseMark(eightPoint)
                        }

                    }
                    return false
                }
                for (let i = 0; i < arr.length; i++) {
                    // 1：获取矩形绘制的方向
                    let direction = _this.drawDirection(arr[i])
                    if (direction == 1) {
                        if (offsetX >= arr[i].x1 && offsetX <= arr[i].x2 && (Math.abs(offsetY - arr[i].y1) < 5 || Math.abs(offsetY - arr[i].y2) < 5)) {
                            // 传入矩形位置，绘制虚线框，并得到八个点的位置
                            eightPoint = _this.drawDashedRectangular(arr[i].x1, arr[i].y1, arr[i].x2, arr[i].y2)
                            selectObj = arr[i]
                            selectIndex = i
                        }
                        if (offsetY >= arr[i].y1 && offsetY <= arr[i].y2 && Math.abs(offsetX - arr[i].x1) < 5 || Math.abs(offsetX - arr[i].x2) < 5) {
                            selectObj = arr[i]
                            selectIndex = i
                            eightPoint = _this.drawDashedRectangular(arr[i].x1, arr[i].y1, arr[i].x2, arr[i].y2)
                        }
                    } else if (direction == 2) {
                        if (offsetX >= arr[i].x1 && offsetX <= arr[i].x2 && Math.abs(offsetY - arr[i].y1) < 5 || Math.abs(offsetY - arr[i].y2) < 5) {
                            // 传入矩形位置，绘制虚线框，并得到八个点的位置
                            eightPoint = _this.drawDashedRectangular(arr[i].x1, arr[i].y1, arr[i].x2, arr[i].y2)
                            selectObj = arr[i]
                            selectIndex = i
                        }
                        if (offsetY <= arr[i].y1 && offsetY >= arr[i].y2 && Math.abs(offsetX - arr[i].x1) < 5 || Math.abs(offsetX - arr[i].x2) < 5) {
                            selectObj = arr[i]
                            selectIndex = i
                            eightPoint = _this.drawDashedRectangular(arr[i].x1, arr[i].y1, arr[i].x2, arr[i].y2)
                        }
                    } else if (direction == 3) {
                        if (offsetX <= arr[i].x1 && offsetX >= arr[i].x2 && (Math.abs(offsetY - arr[i].y1) < 5 || Math.abs(offsetY - arr[i].y2) < 5)) {
                            // 传入矩形位置，绘制虚线框，并得到八个点的位置
                            eightPoint = _this.drawDashedRectangular(arr[i].x1, arr[i].y1, arr[i].x2, arr[i].y2)
                            selectObj = arr[i]
                            selectIndex = i
                        }
                        if (offsetY <= arr[i].y1 && offsetY >= arr[i].y2 && (Math.abs(offsetX - arr[i].x1) < 5 || Math.abs(offsetX - arr[i].x2) < 5)) {
                            selectObj = arr[i]
                            selectIndex = i
                            eightPoint = _this.drawDashedRectangular(arr[i].x1, arr[i].y1, arr[i].x2, arr[i].y2)
                        }
                    } else if (direction == 4) {
                        if (offsetX <= arr[i].x1 && offsetX >= arr[i].x2 && (Math.abs(offsetY - arr[i].y1) < 5 || Math.abs(offsetY - arr[i].y2) < 5)) {
                            // 传入矩形位置，绘制虚线框，并得到八个点的位置
                            eightPoint = _this.drawDashedRectangular(arr[i].x1, arr[i].y1, arr[i].x2, arr[i].y2)
                            selectObj = arr[i]
                            selectIndex = i
                        }
                        if (offsetY >= arr[i].y1 && offsetY <= arr[i].y2 && (Math.abs(offsetX - arr[i].x1) < 5 || Math.abs(offsetX - arr[i].x2) < 5)) {
                            selectObj = arr[i]
                            selectIndex = i
                            eightPoint = _this.drawDashedRectangular(arr[i].x1, arr[i].y1, arr[i].x2, arr[i].y2)
                        }
                    }
                }
            };
            canvas.onmousemove = function (e) {
                let offsetX = _this.$utils.numberToFixed(e.offsetX / _this.scaleNum),
                    offsetY = _this.$utils.numberToFixed(e.offsetY / _this.scaleNum)
                // 传入选中矩形，判断矩形绘制时的方向
                let direction = _this.drawDirection(selectObj)
                // 1：判断是否有虚线八个点
                if (eightPoint) {
                    let pointIndex = ''
                    let arrObj = { x1: eightPoint[2].x2, y1: eightPoint[2].y2, x2: eightPoint[4].x1, y2: eightPoint[4].y1 }
                    // 2:判断是否在矩形框内移动，修改鼠标样式
                    let isInPonint = _this.isInPonint(offsetX, offsetY, arrObj)
                    if (isInPonint) {
                        this.style.cursor = "move"
                    } else {
                        if (!pointIndex) {
                            this.style.cursor = "crosshair"
                        }
                    }
                    // 3：判断是否在八个点上更改鼠标样式
                    Object.keys(eightPoint).forEach(key => {
                        // 3.1:根据矩形绘制的位置判断鼠标的点
                        if (offsetX >= eightPoint[key].x1 && offsetX <= eightPoint[key].x2 && offsetY >= eightPoint[key].y1 && offsetY <= eightPoint[key].y2) {
                            // 当前鼠标出发的八个点中的索引
                            pointIndex = key
                            _this.byIndexChangeMouse(key, this)

                        }
                    });

                }
            };
            canvas.onmouseup = function (e) {
                console.log('鼠标抬起来1');
                isAllowDrawLine = false
            }
        }
    }
}
</script>

<style scoped lang="less">
.marginL20 {
    margin-left: 20px
}

.box {
    display: flex;

    .close {
        width: 0px;
        box-sizing: border-box;
        z-index: 99;
        overflow: hidden;
        transition: all 0.5s ease;
        display: none;
    }

    .imageList {
        border: 1px solid #000;
        margin-right: 20px;
        padding: 10px;
        width: auto;
        height: 100vh;
        box-sizing: border-box;
        background: #fff;
        position: relative;
        top: 0;
        left: 0;
    }
}
</style>