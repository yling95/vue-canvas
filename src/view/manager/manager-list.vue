<template>
    <div>

        <!-- <img :src="imgsrc" /> -->
        <div class="box">
            <div>
                <div style="margin-bottom:20px">
                    <a-button type="primary" @click="addPoint(1), drawType = 'point'">添加点</a-button>
                    <a-button type="primary" @click="drawRectangular" style="margin-left: 20px;">添加矩形</a-button>
                    <a-button type="primary" @click="drawRectangular('square')" style="margin-left: 20px;">添加正方形</a-button>
                    <a-button type="primary" @click="chooseMark">选中标注</a-button>
                    <a-button type="primary" @click="drawType = null" style="margin-left: 20px;">结束绘制</a-button>
                    <div style="width: 400px;">
                        <a-slider id="test" :default-value="imageSize" @change="scaleCanvas" />
                    </div>
                </div>

                <div :width="canvasSize.w" :height="canvasSize.h" style="box-sizing: border-box;">
                    <canvas id="canvas" :width="canvasSize.w" :height="canvasSize.h" ref="canvas"></canvas>
                </div>
                <a-button type="primary" @click="changeImage(nowIndex -= 1)" style="margin-top: 20px;"
                    v-if="nowIndex > 0">上一张</a-button>
                <a-button type="primary" @click="changeImage(nowIndex += 1)" style="margin-top: 20px;"
                    v-if="nowIndex < minioImgList.length - 1">下一张</a-button>
            </div>


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
                    <!-- <div v-for="(item, index) in coordinates.rectangular">
                        <span>矩形 {{ index + 1 }}:</span>
                        <div v-for="(items, indexs) in item">
                            <span>x轴:{{ items.x }},y轴:{{ items.y }}</span>
                        </div>
                        <a-button size="small" @click="clearArcFun(index, 'rectangular')">删除</a-button>
                    </div> -->
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
import { OptGroup } from 'ant-design-vue/lib/vc-select'

var localUrl = require('./modify.jpg')
export default {
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
            minioImgList: [],
            imageSize: 30, // 图片缩放大小
            nowIndex: 0,
            scaleNum: 1
        }
    },
    mounted() {
        let _this = this
        // 列出存储桶中所有对象。
        // var stream = this.$minioClient.listObjects('face', 'benchmark/1800/115106790/', false)
        // stream.on('data', function (obj) {
        //     _this.minioImgList.push(obj);
        // })
        // stream.on('end', function (end) {
        //     _this.getMInioImg()
        //     console.log('end', _this.minioImgList.length);
        // })
        // stream.on('error', function (err) { console.log('err==', err) })
        _this.loadImage(localUrl);
    },
    methods: {
        // 缩放图片
        scaleCanvas(value) {
            let _this = this
            // this.keyDown()
            let enVal = value - 30
            if (enVal > 0) {
                _this.scaleNum = parseFloat((1 + (enVal * 0.02)).toFixed(2))
                console.log(_this.scaleNum);
                _this.loadImage(_this.imgsrc)
            } else {
                _this.scaleNum = parseFloat((1 - (-enVal * 0.02)).toFixed(2))
                console.log(_this.scaleNum);
                _this.loadImage(_this.imgsrc)
            }
        },
        // 监听键盘
        keyDown() {
            var lastkeyCode = -1;
            document.onkeydown = (e) => {
                //事件对象兼容
                let _this = this
                let e1 = e || event || window.event || arguments.callee.caller.arguments[0]
                let time = null;//time用来控制事件的触发
                //左
                if (e1 && e1.key == "Alt" && e1.keyCode == lastkeyCode) {
                    window.addEventListener('mousewheel', function mouseScoll(e) {

                    });
                    // 按下Alt按键
                }
                lastkeyCode = e1.keyCode
                if (e1 && e1.key == "Delete" && e1.keyCode == 46) {
                    // Delete
                }
            }
        },
        // 从minio下载所有图片
        getMInioImg() {
            let _this = this
            let minioImgList = _this.minioImgList
            for (let i = 0; i < minioImgList.length; i++) {
                _this.$minioClient.getObject('face', minioImgList[i].name, function (err, dataStream) {
                    if (err) {
                        return console.log(err)
                    }
                    dataStream.on('data', function (chunk) {
                        let blodUrl = _this.$utils.byteArryToBlob(chunk);
                        minioImgList[i].blodUrl = blodUrl
                        if (i == 0) {
                            _this.loadImage(blodUrl);
                            _this.nowIndex = 0
                        }
                    })
                    dataStream.on('end', function () {
                    })
                    dataStream.on('error', function (err) {
                        console.log(err)
                    })
                })

            }
        },
        // 切换图片
        changeImage(index) {
            let _this = this
            this.loadImage(_this.minioImgList[index].blodUrl)
        },
        // 加载图片以后根据图片宽高创建canvas画布
        loadImage(url) {
            let _this = this
            _this.imgsrc = url
            let img = new Image()
            img.src = _this.imgsrc
            img.onload = () => {
                _this.canvasSize = { w: img.width * _this.scaleNum, h: img.height * _this.scaleNum }
                const canvas = _this.$refs.canvas
                _this.canvas = canvas
                let ctx = canvas.getContext('2d') // 使用document找到的
                _this.ctx = ctx // 使用document找到的
                _this.creatImage(1)
            }
        },
        // 在画布上绘制图片
        creatImage(canScal) {
            let _this = this
            let ctx = _this.ctx
            let img = new Image()
            img.src = _this.imgsrc
            img.onload = () => {
                ctx.beginPath()
                if (canScal == 1) {
                    ctx.scale(_this.scaleNum, _this.scaleNum)
                }
                ctx.drawImage(img, 0, 0)
                ctx.save()
                ctx.fillStyle = "#ff0000";
                ctx.strokeStyle = "#ff0000"
                ctx.lineWidth = 2
                if (_this.coordinates.point.length > 0 || _this.coordinates.rectangular.length) {
                    _this.reversDraw()
                }
            }
        },
        reversCanvasDefaultStyle() {
            let ctx = this.ctx
            ctx.fillStyle = "#ff0000";
            ctx.strokeStyle = "#ff0000"
            ctx.setLineDash([0, 0]);
            ctx.lineWidth = 2
        },
        // 添加点
        addPoint(type) {
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
                console.log('鼠标起来', e, _this.drawType, _this.canvasSize);
                console.log(ctx.getLineDash());
                // 计算的是鼠标点击的坐标  因此需要减去容器本身的偏移量
                if (_this.drawType == 'point') {
                    ctx.beginPath();
                    ctx.arc(_this.$utils.numberToFixed(e.offsetX / _this.scaleNum), _this.$utils.numberToFixed(e.offsetY / _this.scaleNum), 5, 0, 2 * Math.PI);
                    ctx.fill()
                    ctx.stroke();  //fill()执行填充色  stroke()执行线条
                    ctx.closePath()
                    flag = false;
                    let position = { x: _this.$utils.numberToFixed(e.offsetX / _this.scaleNum), y: _this.$utils.numberToFixed(e.offsetY / _this.scaleNum), sAngle: 5, eAngle: 0, counterclockwise: 2 * Math.PI }
                    _this.coordinates.point.push(position)
                    console.log('得到的位置', _this.coordinates);
                }
            };
        },
        // 删除点、矩形、正方形
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
        // 重新绘制矩形
        drawRectangularFn(abj) {
            let ctx = this.ctx
            ctx.strokeRect(abj.x1, abj.y1, abj.x2 - abj.x1, abj.y2 - abj.y1);
        },
        // 绘制的时候添加虚线，和8个点 以便于编辑
        drawDashedRectangular(x1, y1, x2, y2) {
            let ctx = this.ctx
            let _this = this;
            ctx.beginPath();
            let direction = this.drawDirection({x1:x1,y1:y1,x2:x2,y2:y2})
            let eightPoint=''
             // 判断方位 绘制点
             if (direction == 1) {
                // 右下角
                ctx.moveTo(x1-5,y1- 5);
                ctx.lineTo(x2+5,y1- 5);
                ctx.lineTo(x2+5, y2 +5);
                ctx.lineTo(x1-5, y2 +5);
                ctx.lineTo(x1-5,y1- 5);
                ctx.strokeStyle = "#654b34";
                ctx.setLineDash([3, 3]);
                ctx.lineWidth = 1
                ctx.stroke()
                ctx.save()
                ctx.closePath()
                ctx.setLineDash([0, 0]);
                ctx.fillStyle="#21d86d"                                                                     
                ctx.strokeRect(x1-8,y1- 8, 6, 6);
                ctx.strokeRect(x2+2,y1-8, 6, 6);
                ctx.strokeRect(x2+2, y2 +2, 6, 6);
                ctx.strokeRect(x1-8, y2 +2, 6, 6);
                ctx.strokeRect(_this.$utils.numberToFixed((x1-2 + ((x2+2 - x1-5)/2))),y1-8, 6, 6);
                ctx.fillRect(_this.$utils.numberToFixed((x1-2 + ((x2+2 - x1-5)/2))),y1-8, 6, 6)
                ctx.strokeRect(x2+2, _this.$utils.numberToFixed((y1-5 + ((y2 +2 - y1-8)/2))), 6, 6);
                ctx.fillRect(x2+2, _this.$utils.numberToFixed((y1-5 + ((y2 +2 - y1-8)/2))), 6, 6)
                ctx.strokeRect(_this.$utils.numberToFixed((x1-2 + ((x2+2 - x1-5)/2))),y2 +2, 6, 6);
                ctx.fillRect(_this.$utils.numberToFixed((x1-2 + ((x2+2 - x1-5)/2))),y2 +2, 6, 6)
                ctx.strokeRect(x1-8, _this.$utils.numberToFixed((y1-5 + ((y2 +2 - y1-8)/2))), 6, 6);
                ctx.fillRect(x1-8, _this.$utils.numberToFixed((y1-5 + ((y2 +2 - y1-8)/2))), 6, 6)
                ctx.fillRect(x1-8,y1- 8, 6, 6)
                ctx.fillRect(x2+2,y1-8, 6, 6)
                ctx.fillRect(x2+2, y2 +2, 6, 6)
                ctx.fillRect(x1-8, y2 +2, 6, 6)
                eightPoint = {
                    1:{x1: x2+2,y1: y1-8, x2: x2+2+6, y2: y1-8+6},// 左下角
                    2:{x1: x1-8,y1: y1- 8, x2: x1-8+6, y2: y1-8+6},// 右下角
                    3:{x1: x1-8,y1: y2+2, x2: x1-8+6, y2: y2+2+6},//右上角
                    4:{x1: x2+2,y1: y2+2, x2: x2+2+6, y2: y2+2+6},// 左上角
                    5:{x1:_this.$utils.numberToFixed((x1-2 + ((x2+2 - x1-5)/2))),y1:y1-8,x2:_this.$utils.numberToFixed((x1-2 + ((x2+2 - x1-5)/2)))+6,y2:y1-8+6 },// 正下方
                    6:{x1:x2+2,y1:_this.$utils.numberToFixed((y1-5 + ((y2 +2 - y1-8)/2))),x2:x2+2+6,y2:_this.$utils.numberToFixed((y1-5 + ((y2 +2 - y1-8)/2)))+6 },// 正右方
                    7:{x1:_this.$utils.numberToFixed((x1-2 + ((x2+2 - x1-5)/2))), y1:y2+2, x2:_this.$utils.numberToFixed((x1-2 + ((x2+2 - x1-5)/2)))+6,y2:y2+2+6},// 正上方
                    8:{x1: x1-8, y1: _this.$utils.numberToFixed((y1-5 + ((y2 +2 - y1-8)/2))), x2: x1-8+6, y2: _this.$utils.numberToFixed((y1-5 + ((y2 +2 - y1-8)/2)))+6}
                }
            }else if (direction == 2) {
                // 右上角
                ctx.moveTo(x1-5, y1+5);
                ctx.lineTo(x2+5, y1+5);
                ctx.lineTo(x2+5, y2-5);
                ctx.lineTo(x1-5, y2-5);
                ctx.lineTo(x1-5, y1+5);
                ctx.strokeStyle = "#654b34";
                ctx.setLineDash([3, 3]);
                ctx.lineWidth = 1
                ctx.stroke()
                ctx.save()
                ctx.closePath()
                ctx.setLineDash([0, 0]);
                ctx.fillStyle="#21d86d"                                                                     
                ctx.strokeRect(x1-8, y1+2, 6, 6);
                ctx.strokeRect(x2+2, y1+2, 6, 6);
                ctx.strokeRect(x2+2, y2-8, 6, 6);
                ctx.strokeRect(x1-8, y2-8, 6, 6);
                ctx.fillRect(x1-8, y1+2, 6, 6)
                ctx.fillRect(x2+2, y1+2, 6, 6)
                ctx.fillRect(x2+2, y2-8, 6, 6)
                ctx.fillRect(x1-8, y2-8, 6, 6)
                ctx.strokeRect(_this.$utils.numberToFixed((x1-2 + ((x2+5 - x1-5)/2))),y1+2, 6, 6);
                ctx.fillRect(_this.$utils.numberToFixed((x1-2 + ((x2+5 - x1-5)/2))),y1+2, 6, 6)
                ctx.strokeRect(x2+2, _this.$utils.numberToFixed((y1-5 + ((y2 +2 - y1-8)/2))), 6, 6);
                ctx.fillRect(x2+2, _this.$utils.numberToFixed((y1-5 + ((y2 +2 - y1-8)/2))), 6, 6)
                ctx.strokeRect(_this.$utils.numberToFixed((x1-2 + ((x2+5 - x1-5)/2))),y2-8, 6, 6);
                ctx.fillRect(_this.$utils.numberToFixed((x1-2 + ((x2+5 - x1-5)/2))),y2-8, 6, 6)
                ctx.strokeRect(x1-8, _this.$utils.numberToFixed((y1-5 + ((y2 +2 - y1-8)/2))), 6, 6);
                ctx.fillRect(x1-8, _this.$utils.numberToFixed((y1-5 + ((y2 +2 - y1-8)/2))), 6, 6)
                eightPoint = {
                    1:{x1: x1-8,y1: y1+2, x2: x1-8+6, y2: y1+2+6},// 左下角
                    2:{x1: x2+2,y1: y1+2, x2: x2+2+6, y2: y1+2+6},// 右下角
                    3:{x1: x2+2,y1: y2-8, x2: x2+2+6, y2: y2-8+6},//右上角
                    4:{x1: x1-8,y1: y2-8, x2: x1-8+6, y2: y2-8+6},// 左上角
                    5:{x1:_this.$utils.numberToFixed((x1-2 + ((x2+5 - x1-5)/2))),y1:y1+2,x2:_this.$utils.numberToFixed((x1-2 + ((x2+5 - x1-5)/2))) +6,y2:y1+2+6 },// 正下方
                    6:{x1:x2+2,y1:_this.$utils.numberToFixed((y1-5 + ((y2 +2 - y1-8)/2))),x2:x2+2+6,y2:_this.$utils.numberToFixed((y1-5 + ((y2 +2 - y1-8)/2)))+6 },// 正右方
                    7:{x1:_this.$utils.numberToFixed((x1-2 + ((x2+5 - x1-5)/2))), y1:y2-8 , x2:_this.$utils.numberToFixed((x1-2 + ((x2+5 - x1-5)/2)))+6,y2:y2-8+6},// 正上方
                    8:{x1: x1-8, y1: _this.$utils.numberToFixed((y1-5 + ((y2 +2 - y1-8)/2))), x2: x1-8+6, y2: _this.$utils.numberToFixed((y1-5 + ((y2 +2 - y1-8)/2)))+6}
                }
            } else if (direction == 4) {
                // 左下角
                ctx.moveTo(x1+5, y1-5);
                ctx.lineTo(x2-5, y1-5);
                ctx.lineTo(x2-5, y2+5);
                ctx.lineTo(x1+5, y2+5);
                ctx.lineTo(x1+5, y1-5);
                ctx.strokeStyle = "#654b34";
                ctx.setLineDash([3, 3]);
                ctx.lineWidth = 1
                ctx.stroke()
                ctx.save()
                ctx.closePath()
                ctx.setLineDash([0, 0]);
                ctx.fillStyle="#21d86d"                                                                     
                ctx.strokeRect(x1+2, y1-8, 6, 6);
                ctx.strokeRect(x2-8, y1-8, 6, 6);
                ctx.strokeRect(x2-8, y2+2, 6, 6);
                ctx.strokeRect(x1+2, y2+2, 6, 6);
                ctx.fillRect(x1+2, y1-8, 6, 6) 
                ctx.fillRect(x2-8, y1-8, 6, 6)
                ctx.fillRect(x2-8, y2+2, 6, 6)   
                ctx.fillRect(x1+2, y2+2, 6, 6)
                ctx.strokeRect(_this.$utils.numberToFixed((x1-2 + ((x2+5 - x1-5)/2))),y1-8, 6, 6);
                ctx.fillRect(_this.$utils.numberToFixed((x1-2 + ((x2+5 - x1-5)/2))),y1-8, 6, 6)
                ctx.strokeRect(x2-8, _this.$utils.numberToFixed((y1-5 + ((y2 +2 - y1-8)/2))), 6, 6);
                ctx.fillRect(x2-8, _this.$utils.numberToFixed((y1-5 + ((y2 +2 - y1-8)/2))), 6, 6)
                ctx.strokeRect(_this.$utils.numberToFixed((x1-2 + ((x2+5 - x1-5)/2))),y2+2, 6, 6);
                ctx.fillRect(_this.$utils.numberToFixed((x1-2 + ((x2+5 - x1-5)/2))),y2+2, 6, 6)
                ctx.strokeRect(x1+2, _this.$utils.numberToFixed((y1-5 + ((y2 +2 - y1-8)/2))), 6, 6);
                ctx.fillRect(x1+2, _this.$utils.numberToFixed((y1-5 + ((y2 +2 - y1-8)/2))), 6, 6)
                eightPoint = {
                    1:{x1: x2-8,y1: y2+2, x2: x2-8+6, y2: y2+2+6},// 左下角
                    2:{x1: x1+2,y1: y2+2, x2: x1+2+6, y2: y2+2+6},//右下角
                    3:{x1: x1+2,y1: y1-8, x2: x1+2+6, y2: y1-8+6},// 右上角
                    4:{x1: x2-8,y1: y1-8, x2: x2-8+6, y2: y1-8+6},// 左上角
                    5:{x1:_this.$utils.numberToFixed((x1-2 + ((x2+5 - x1-5)/2))),y1:y1-8,x2:_this.$utils.numberToFixed((x1-2 + ((x2+5 - x1-5)/2)))+6,y2:y1+2+6 },// 正下方
                    6:{x1:x2-8,y1:_this.$utils.numberToFixed((y1-5 + ((y2 +2 - y1-8)/2))),x2:x2-8+6,y2:_this.$utils.numberToFixed((y1-5 + ((y2 +2 - y1-8)/2)))+6 },// 正右方
                    7:{x1:_this.$utils.numberToFixed((x1-2 + ((x2+5 - x1-5)/2))), y1:y2+2, x2:_this.$utils.numberToFixed((x1-2 + ((x2+5 - x1-5)/2)))+6,y2:y2+2+6},// 正上方
                    8:{x1: x1+2, y1: _this.$utils.numberToFixed((y1-5 + ((y2 +2 - y1-8)/2))), x2: x1+2+6, y2: _this.$utils.numberToFixed((y1-5 + ((y2 +2 - y1-8)/2)))+6}
                }
            } else  if (direction == 3){
                // 左上角
                console.log('左上角');
                ctx.moveTo(x1+5, y1+5);
                ctx.lineTo(x2-5, y1+5);
                ctx.lineTo(x2-5, y2-5);
                ctx.lineTo(x1+5, y2-5);
                ctx.lineTo(x1+5, y1+5);
                ctx.strokeStyle = "#654b34";
                ctx.setLineDash([3, 3]);
                ctx.lineWidth = 1
                ctx.stroke()
                ctx.save()
                ctx.closePath()
                ctx.setLineDash([0, 0]);
                ctx.fillStyle="#21d86d"                                                                     
                ctx.strokeRect(x1+2, y1+2, 6, 6);
                ctx.strokeRect(x2-8, y1+2, 6, 6);
                ctx.strokeRect(x2-8, y2-8, 6, 6);
                ctx.strokeRect(x1+2, y2-8, 6, 6);
                ctx.fillRect(x1+2, y1+2, 6, 6)
                ctx.fillRect(x2-8, y1+2, 6, 6)
                ctx.fillRect(x2-8, y2-8, 6, 6)
                ctx.fillRect(x1+2, y2-8, 6, 6)
                ctx.strokeRect(_this.$utils.numberToFixed((x1-2 + ((x2+5 - x1-5)/2))),y1+2, 6, 6);
                ctx.fillRect(_this.$utils.numberToFixed((x1-2 + ((x2+5 - x1-5)/2))),y1+2, 6, 6)
                ctx.strokeRect(x2-8, _this.$utils.numberToFixed((y1-5 + ((y2 +2 - y1-8)/2))), 6, 6);
                ctx.fillRect(x2-8, _this.$utils.numberToFixed((y1-5 + ((y2 +2 - y1-8)/2))), 6, 6)
                ctx.strokeRect(_this.$utils.numberToFixed((x1-2 + ((x2+5 - x1-5)/2))),y2-8, 6, 6);
                ctx.fillRect(_this.$utils.numberToFixed((x1-2 + ((x2+5 - x1-5)/2))),y2-8, 6, 6)
                ctx.strokeRect(x1+2, _this.$utils.numberToFixed((y1-5 + ((y2 +2 - y1-8)/2))), 6, 6);
                ctx.fillRect(x1+2, _this.$utils.numberToFixed((y1-5 + ((y2 +2 - y1-8)/2))), 6, 6)
                eightPoint = {
                    1:{x1: x2-8,y1: y1+2, x2: x2-8+6, y2: y1+2+6},// 左下角
                    2:{x1: x1+2,y1: y1+2, x2: x1+2+6, y2: y1+2+6},// 右下角
                    3:{x1: x1+2,y1: y2-8, x2: x1+2+6, y2: y2-8+6},// 右上角
                    4:{x1: x2-8,y1: y2-8, x2: x2-8+6, y2: y2-8+6},//左上角
                    5:{x1:_this.$utils.numberToFixed((x1-2 + ((x2+5 - x1-5)/2))),y1:y1+2,x2:_this.$utils.numberToFixed((x1-2 + ((x2+5 - x1-5)/2)))+6,y2:y1+2+6 },// 正下方
                    6:{x1:x2-8,y1:_this.$utils.numberToFixed((y1-5 + ((y2 +2 - y1-8)/2))),x2:x2-8+6,y2:_this.$utils.numberToFixed((y1-5 + ((y2 +2 - y1-8)/2)))+6 },// 正右方
                    7:{x1:_this.$utils.numberToFixed((x1-2 + ((x2+5 - x1-5)/2))), y1:y2-8, x2:_this.$utils.numberToFixed((x1-2 + ((x2+5 - x1-5)/2)))+6,y2:y2-8+6},// 正上方
                    8:{x1: x1+2, y1:  _this.$utils.numberToFixed((y1-5 + ((y2 +2 - y1-8)/2))), x2: x1+2+6, y2: _this.$utils.numberToFixed((y1-5 + ((y2 +2 - y1-8)/2)))+6}
                }
            }
            this.reversCanvasDefaultStyle()
            return eightPoint
        },
        // 绘制据矩形、正方形
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
                        startPoint = { x:offsetX, y: offsetY }
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
                            _this.drawDashedRectangular(startPoint.x, startPoint.y, startPoint.x-(startPoint.x - offsetX),startPoint.y -(offsetX - startPoint.x))
                        } else if (offsetX < startPoint.x && offsetY > startPoint.y) {
                            // 左下角
                            ctx.strokeRect(startPoint.x, startPoint.y, -(startPoint.x - offsetX), startPoint.x - offsetX);
                            _this.drawDashedRectangular(startPoint.x, startPoint.y, startPoint.x-(startPoint.x - offsetX), startPoint.y - (offsetX - startPoint.x))
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
                // if (_this.drawType == 'rectangular') {
                //     ctx.arc(e.offsetX, e.offsetY, 5, 0, 2 * Math.PI);
                //     ctx.fill()
                //     ctx.stroke();  //fill()执行填充色  stroke()执行线条
                //     ctx.save()
                //     flag = false;
                //     draw.push({ x: e.offsetX, y: e.offsetY, sAngle: 5, eAngle: 0, counterclockwise: 2 * Math.PI })
                //     console.log('得到的位置', draw);
                //     if (draw.length == 4) {
                //         _this.drawRectangularFn(draw)
                //         _this.coordinates.rectangular.push(draw)
                //         _this.creatImage()
                //         draw = []
                //     }
                // }

            };
        },
        /*
         判断绘制矩形正方形的方向
         参数:object{x1,y1,x2,y2}
         返回：1：右下角  2：右上角  3：左上角  4：左下角
        */ 
        drawDirection(rectangular) {
            let direction = ''
            if (rectangular.x2-rectangular.x1 > 0 && rectangular.y2 - rectangular.y1 > 0) {
                direction = 1
            }
            if (rectangular.x2-rectangular.x1 > 0 && rectangular.y2 - rectangular.y1 < 0) {
                direction = 2
            }
            if (rectangular.x2-rectangular.x1 < 0 && rectangular.y2 - rectangular.y1 < 0) {
                direction = 3
            }
            if (rectangular.x2-rectangular.x1 < 0 && rectangular.y2 - rectangular.y1 > 0) {
                direction = 4
            }
            
            return direction
        },
        // 判断点是否在矩形内 (return false true)
        isInPonint(x,y,rectangularObj) {
            // 1步：声明变量返回值，默认为false
            let isIn = false 
            // 1步 调用绘制矩形时的方向
            let direction = this.drawDirection(rectangularObj)
            // 2：判断点是否在矩形内
            if (direction == 1) {
                if (x >= rectangularObj.x1 && x <= rectangularObj.x2 && y >= rectangularObj.y1 &&  y <= rectangularObj.y2) {
                    console.log('在矩形内1');
                    // this.style.cursor = "move"
                    isIn = true
                }
            } else if (direction == 2) {
                if (x >= rectangularObj.x1 && x <= rectangularObj.x2 && y <= rectangularObj.y1 &&  y >= rectangularObj.y2) {
                    console.log('在矩形内2');
                    // this.style.cursor = "move"
                    isIn = true
                }
            } else if(direction == 3){
                if (x <= rectangularObj.x1 && x >= rectangularObj.x2 && y <= rectangularObj.y1 &&  y >= rectangularObj.y2) {
                    console.log('在矩形内3');
                    // this.style.cursor = "move"
                    isIn = true
                }
            } else if(direction == 4){
                if (x >= rectangularObj.x1 && x >= rectangularObj.x2 && y <= rectangularObj.y1 &&  y >= rectangularObj.y2) {
                    console.log('在矩形内4');
                    // this.style.cursor = "move"
                    isIn = true
                }
            }

            return isIn
        },
        // 根据八个点的索引，更改鼠标的样式
        byIndexChangeMouse(key,_this) {
            if (key == 7 || key == 5) {
                _this.style.cursor = "n-resize"
                document.onmousedown=(target)=>{
                    console.log('鼠标按钮',target);
                }
            } else if (key == 8 || key == 6) {
                _this.style.cursor = "w-resize"
            } else if (key == 4 || key == 2) {
                _this.style.cursor = "nw-resize"
            } else if (key == 3 || key == 1) {
                _this.style.cursor = "ne-resize"
            } else {
                _this.style.cursor = "help"
            }
        },
        // 鼠标移入选中标注
        chooseMark(){
            console.log('去画布选中标注');
            let _this = this
            let canvas = _this.canvas;
            let selectObj = '',selectIndex='';
            let eightPoint = ''
            let isAllowDrawLine = false;
            canvas.onmousedown = function (e) {
                let arr = _this.coordinates.rectangular
                if (selectObj) {
                    let arrObj = {x1:eightPoint[2].x2,y1:eightPoint[2].y2, x2:eightPoint[4].x1,y2:eightPoint[4].y1} 
                    // 2:判断是否在矩形框内移动，修改鼠标样式
                    let isInPonint = _this.isInPonint(e.offsetX,e.offsetY, arrObj)
                    if (!isInPonint) {
                        eightPoint = ''
                        selectObj = ''
                        _this.creatImage()
                    } else{
                        let startPointDiff = {xDiff:e.offsetX-selectObj.x1, yDiff:e.offsetY-selectObj.y1}
                        let width = selectObj.x2 - selectObj.x1;
                        let height =  selectObj.y2 - selectObj.y1;
                        isAllowDrawLine = true;
                        // 小技巧：onmousedown内部添加一个onmousemove事件，就能监听长按鼠标并移动事件啦（不要忘记在onmouseup事件中消除绘制路径功能，否则轨迹会随着鼠标移动不停增加）
                        canvas.onmousemove = (e)=>{
                            if(isAllowDrawLine){
                                // 根据鼠标按下的坐标，和当前移动后坐标，计算x，y距离
                                
                                console.log(e.offsetX, e.offsetY, startPointDiff, _this.coordinates.rectangular[selectIndex]);
                                _this.coordinates.rectangular[selectIndex].x1 = e.offsetX + startPointDiff.xDiff
                                _this.coordinates.rectangular[selectIndex].x2 = e.offsetX + startPointDiff.xDiff - width
                                _this.coordinates.rectangular[selectIndex].y1 = e.offsetY + startPointDiff.yDiff
                                _this.coordinates.rectangular[selectIndex].y2 = e.offsetY + startPointDiff.yDiff - height
                                _this.creatImage()
                                selectObj =  _this.coordinates.rectangular[selectIndex]
                                setTimeout(() => {
                                    eightPoint = _this.drawDashedRectangular(_this.coordinates.rectangular[selectIndex].x1, _this.coordinates.rectangular[selectIndex].y1, _this.coordinates.rectangular[selectIndex].x2, _this.coordinates.rectangular[selectIndex].y2)
                                },0)
                                
                            }
                        }                                                                                       
                    }
                    return false
                }
                for (let i = 0; i < arr.length; i++) {
                    // 1：获取矩形绘制的方向
                    let direction = _this.drawDirection(arr[i])
                    if (direction == 1) {
                        if (e.offsetX >=  arr[i].x1 && e.offsetX <=  arr[i].x2 && (Math.abs(e.offsetY - arr[i].y1) < 5 || Math.abs(e.offsetY - arr[i].y2) < 5)) {
                            // 传入矩形位置，绘制虚线框，并得到八个点的位置
                            eightPoint = _this.drawDashedRectangular(arr[i].x1, arr[i].y1, arr[i].x2, arr[i].y2)
                            selectObj = arr[i]
                            selectIndex = i
                        }
                        if (e.offsetY >=  arr[i].y1 && e.offsetY <=  arr[i].y2 && Math.abs(e.offsetX - arr[i].x1) < 5 || Math.abs(e.offsetX - arr[i].x2) < 5) {
                            selectObj = arr[i]
                            selectIndex = i
                            eightPoint = _this.drawDashedRectangular(arr[i].x1, arr[i].y1, arr[i].x2, arr[i].y2)
                        }
                    }else if (direction == 2) {
                        if (e.offsetX >=  arr[i].x1 && e.offsetX <=  arr[i].x2 && Math.abs(e.offsetY - arr[i].y1) < 5 || Math.abs(e.offsetY - arr[i].y2) < 5) {
                            // 传入矩形位置，绘制虚线框，并得到八个点的位置
                            eightPoint = _this.drawDashedRectangular(arr[i].x1, arr[i].y1, arr[i].x2, arr[i].y2)
                            selectObj = arr[i]
                            selectIndex = i
                        }
                        if (e.offsetY <=  arr[i].y1 && e.offsetY >=  arr[i].y2 && Math.abs(e.offsetX - arr[i].x1) < 5 || Math.abs(e.offsetX - arr[i].x2) < 5) {
                            selectObj = arr[i]
                            selectIndex = i
                            eightPoint = _this.drawDashedRectangular(arr[i].x1, arr[i].y1, arr[i].x2, arr[i].y2)
                        }
                    }else if (direction == 3) {
                        if (e.offsetX <=  arr[i].x1 && e.offsetX >=  arr[i].x2 && (Math.abs(e.offsetY - arr[i].y1) < 5 || Math.abs(e.offsetY - arr[i].y2) < 5)) {
                            // 传入矩形位置，绘制虚线框，并得到八个点的位置
                            eightPoint = _this.drawDashedRectangular(arr[i].x1, arr[i].y1, arr[i].x2, arr[i].y2)
                            selectObj = arr[i]
                            selectIndex = i
                        }
                        if (e.offsetY <=  arr[i].y1 && e.offsetY >=  arr[i].y2 && (Math.abs(e.offsetX - arr[i].x1) < 5 || Math.abs(e.offsetX - arr[i].x2) < 5)) {
                            selectObj = arr[i]
                            selectIndex = i
                            eightPoint = _this.drawDashedRectangular(arr[i].x1, arr[i].y1, arr[i].x2, arr[i].y2)
                        }
                    }else if (direction == 4) {
                        if (e.offsetX <=  arr[i].x1 && e.offsetX >=  arr[i].x2 && (Math.abs(e.offsetY - arr[i].y1) < 5 || Math.abs(e.offsetY - arr[i].y2) < 5)) {
                            // 传入矩形位置，绘制虚线框，并得到八个点的位置
                            eightPoint = _this.drawDashedRectangular(arr[i].x1, arr[i].y1, arr[i].x2, arr[i].y2)
                            selectObj = arr[i]
                            selectIndex = i
                        }
                        if (e.offsetY >=  arr[i].y1 && e.offsetY <=  arr[i].y2 && (Math.abs(e.offsetX - arr[i].x1) < 5 || Math.abs(e.offsetX - arr[i].x2) < 5)) {
                            selectObj = arr[i]
                            selectIndex = i
                            eightPoint = _this.drawDashedRectangular(arr[i].x1, arr[i].y1, arr[i].x2, arr[i].y2)
                        }
                    }
                }
            };
            canvas.onmousemove = function (e) {
                let offsetX = e.offsetX,offsetY = e.offsetY;
                // 传入选中矩形，判断矩形绘制时的方向
                let direction = _this.drawDirection(selectObj) 
                // 1：判断是否有虚线八个点
                if (eightPoint) {
                    let pointIndex = ''
                    let arrObj = {x1:eightPoint[2].x2,y1:eightPoint[2].y2, x2:eightPoint[4].x1,y2:eightPoint[4].y1} 
                    // 2:判断是否在矩形框内移动，修改鼠标样式
                    let isInPonint = _this.isInPonint(offsetX,offsetY, arrObj)
                    if (isInPonint) {
                        this.style.cursor = "move"
                        this.onmousedown
                    }else{
                        if (!pointIndex) {
                            this.style.cursor = "crosshair"
                        }
                    }    
                    // 3：判断是否在八个点上更改鼠标样式
                    Object.keys(eightPoint).forEach(key => {
                        // 3.1:根据矩形绘制的位置判断鼠标的点
                        console.log('绘制的方向', direction);
                        if (offsetX >= eightPoint[key].x1 && offsetX <= eightPoint[key].x2 && offsetY >= eightPoint[key].y1 && offsetY <= eightPoint[key].y2) {
                            // 当前鼠标出发的八个点中的索引
                            pointIndex = key
                            _this.byIndexChangeMouse(key,this)

                        }  
                    });                                        
                    
                }
            };
            canvas.onmouseup = function (e) {
                isAllowDrawLine = false
            } 
        }
    }
}
</script>

<style scoped lang="less">
.box {
    display: flex;
    justify-content: space-between;
    padding: 20px;
}
</style>