<template>
    <div>
        <div class="dataConfig">
            <!-- 左侧列表 -->
            <div :class="leftShow == 1 ? 'show': 'close'" class="leftPan">
                <!-- 数据集管理 -->
                <div class="storaeBox">
                    <div class="title">数据集管理</div>
                    <div class="addBtn">
                        <div style="margin-right: 20px;">当前数据集：{{storageSelectNow.name}}</div>
                        <a-button type="primary" @click="showStorageForm = true">添加</a-button>
                    </div>
                    <a-table :data-source="storageList" :columns="storageColumns" :pagination="storagePagination"
                        size="small" @change="storageListChange">
                        <template #bodyCell="{ column, text, record, index }">
                            <template v-if="column.dataIndex === 'operation'">
                                <a class="mrR5" @click="operationStorage(record, 'detail')">详情</a>
                                <a class="mrR5" @click="operationStorage(record, 'edit')">编辑</a>
                                <a-popconfirm class="mrR5" title="确认删除？" ok-text="确定" cancel-text="取消"
                                    @confirm="operationStorage(record, 'delete')">
                                    <a href="#">删除</a>
                                </a-popconfirm>
                                <a @click="changeNowstorage(record, index)">设为当前数据集</a>
                            </template>
                        </template>
                    </a-table>
                </div>
                <div class="midLine"></div>
                <!-- 图片列表 -->
                <div class="imgListBox">
                    <div class="title">图片列表</div>
                    <div class="addBtn">
                        <a-radio-group v-model:value="listType" button-style="solid" size="small"
                            style="margin-bottom:10px;" @change="listTypeChange">
                            <a-radio-button :value="1">数据集图片</a-radio-button>
                            <a-radio-button :value="2">已操作图片</a-radio-button>
                        </a-radio-group>
                    </div>

                    <a-table :data-source="minioImgList" :columns="columns" :pagination="pagination"
                        v-if="listType == 1" size="small">
                        <template #bodyCell="{ column, text, record, index }">
                            <template v-if="column.dataIndex === 'url'">
                                <img :src="text" style="width:30px" />
                            </template>
                            <template v-if="column.dataIndex === 'operation'">
                                <a @click="useThisImage(record, index, 1)" :disabled="column.disable">选择</a>
                            </template>
                        </template>
                    </a-table>
                    <a-table :data-source="historyList" :columns="historyColums" :pagination="historyPagination"
                        v-if="listType == 2" size="small">
                        <template #bodyCell="{ column, text, record }">
                            <template v-if="column.dataIndex === 'url'">
                                <img :src="text" style="width:30px" />
                            </template>
                            <template v-if="column.dataIndex === 'operation'">
                                <a class="mrR5" @click="useThisImage(record, index, 2)">选择</a>
                                <a-popconfirm title="确认删除？" ok-text="确定" cancel-text="取消"
                                    @confirm="operateHistory(record, 'delete')">
                                    <a href="#">删除</a>
                                </a-popconfirm>
                            </template>
                        </template>
                    </a-table>
                </div>
            </div>
            <!-- 打开列表按钮 -->
            <div class="rightMenu">
                <a-button @click="leftShow == 0 ? leftShow = 1 : leftShow = 0 ">
                    数据集管理
                    <menu-fold-outlined v-if="leftShow == 1" />
                    <menu-unfold-outlined v-else />
                </a-button>
            </div>
        </div>
        <!-- 数据集表单 -->
        <a-modal v-model:visible="showStorageForm" :title="dataFormTitle" @ok="saveStorageForm" ok-text="确认"
            cancel-text="取消">
            <div>
                <a-form :model="storageForm" name="storageForm" :label-col="{ span: 8 }" :wrapper-col="{ span: 16 }"
                    autocomplete="off" ref="storageForm">
                    <a-form-item label="数据集名称" name="name" :rules="[{ required: true, message: '请输入数据集名称' }]">
                        <a-input v-model:value="storageForm.name" :maxlength="20" />
                    </a-form-item>
                    <a-form-item label="服务器" name="serverType" :rules="[{ required: true, message: '请输入服务器' }]">
                        <a-select ref="select" v-model:value="storageForm.serverType">
                            <a-select-option v-for="(item,index) in serverList" :key="item.key"
                                :value=" Number(item.key) ">
                                {{item.value}}</a-select-option>
                        </a-select>
                    </a-form-item>
                    <a-form-item label="存储服务器ip" name="endpoint" :rules="[{ required: true, message: '请输入存储服务器ip' }]">
                        <a-input v-model:value="storageForm.endpoint" placeholder="请输入存储服务器ip (例:192.168.15.135)" />
                    </a-form-item>
                    <a-form-item label="端口" name="port" :rules="[{ required: true, message: '请输入端口' }]">
                        <a-input v-model:value="storageForm.port" type="number" :maxlength="50"
                            placeholder="请输入端口 (例:8000)" />
                    </a-form-item>
                    <a-form-item label="服务器登录口令" name="accessKey" :rules="[{ required: true, message: '请输入服务器登录口令' }]">
                        <a-input v-model:value="storageForm.accessKey" :maxlength="50" placeholder="服务器登录口令" />
                    </a-form-item>

                    <a-form-item label="存储服务器登录秘钥" name="secretKey"
                        :rules="[{ required: true, message: '请输入存储服务器登录秘钥' }]">
                        <a-input v-model:value="storageForm.secretKey" :maxlength="20" placeholder="存储服务器登录秘钥" />
                    </a-form-item>
                    <a-form-item label="图片存储桶" name="bucket" :rules="[{ required: true, message: '请输入图片存储桶' }]">
                        <a-input v-model:value="storageForm.bucket" :maxlength="20" placeholder="存储桶 (例:test-hhh)" />
                    </a-form-item>
                    <a-form-item label="图片存储目录" name="path" :rules="[{ required: false, message: '请输入图片存储目录' }]">
                        <a-input v-model:value="storageForm.path" :maxlength="50" placeholder="存储桶 (例:test-hhh)" />
                    </a-form-item>
                    <a-form-item label="标注存储桶" name="newBucket" :rules="[{ required: true, message: '请输入标注存储桶' }]">
                        <a-input v-model:value="storageForm.newBucket" :maxlength="50" placeholder="存储桶 (例:test-hhh)" />
                    </a-form-item>
                    <a-form-item label="标注存储目录" name="newPath" :rules="[{ required: false, message: '请输标注存储目录' }]">
                        <a-input v-model:value="storageForm.newPath" :maxlength="50" placeholder="存储桶 (例:test-hhh)" />
                    </a-form-item>

                    <!-- <a-form-item :wrapper-col="{ offset: 8, span: 16 }">
                        <a-button type="primary" html-type="submit">Submit</a-button>
                    </a-form-item> -->
                </a-form>
            </div>
        </a-modal>
    </div>
</template>
<script>
export default {
    data() {
        return {
            dataFormTitle: '添加储存服务器',
            showStorageForm: false,
            storageSelectNow: {}, // 当前选择的数据集
            storageSelectNowId: 1, // 储存对象工具
            storageForm: {}, // 数据集表单

            // 左侧图片列表数据
            leftShow: 1, // 展示左侧内容 1 数据管理集   2图片列表
            listType: 1,
            columns: [
                {
                    title: '图片',
                    dataIndex: 'url',
                    key: 'url',
                },
                {
                    title: '图片名称',
                    dataIndex: 'name',
                    key: 'name',
                },
                {
                    title: '操作',
                    dataIndex: 'operation',
                }
            ], // 图片表格
            historyColums: [
                {
                    title: '图片',
                    dataIndex: 'url',
                    key: 'url',
                },
                {
                    title: '原始图片地址',
                    dataIndex: 'imageUrl',
                    key: 'imageUrl',
                },
                {
                    title: '新图片存储地址',
                    dataIndex: 'imageUpdateUrl',
                    key: 'imageUpdateUrl',
                },
                {
                    title: '新数据存储地址',
                    dataIndex: 'operateData',
                    key: 'operateData',
                },
                {
                    title: '操作',
                    dataIndex: 'operation',
                }
            ],
            storageColumns: [
                {
                    title: '数据集名称',
                    dataIndex: 'name',
                    key: 'name',
                }, {
                    title: '存储服务器ip',
                    dataIndex: 'endpoint',
                    key: 'endpoint',
                }, {
                    title: '端口',
                    dataIndex: 'port',
                    key: 'port',
                }, {
                    title: '图片存储桶',
                    dataIndex: 'bucket',
                    key: 'bucket',
                }, {
                    title: '标注存储桶',
                    dataIndex: 'newBucket',
                    key: 'newBucket',
                }, {
                    title: '操作',
                    dataIndex: 'operation',
                }
            ], // 数据集表格
            pagination: {
                defaultPageSize: 5,
                hideOnSinglePage: true,
                showSizeChanger: true,
                pageSizeOptions: ['5', '10', '20', '50'],
            },
            // 历史数据分页
            historyPagination: {
                defaultPageSize: 5,
                showSizeChanger: true,
                total: 0,
                pageSizeOptions: ['5', '10', '20', '50'],
            },
            // 数据集分页
            storagePagination: {
                defaultPageSize: 5,
                showSizeChanger: true,
                total: 0,
                pageSizeOptions: ['5', '10', '20', '50'],
            },// 数据集表格分页
            storageParam: { pageSize: 5, pageNum: 1 }, // 数据集列表分页参数
            historyParam: { pageSize: 5, pageNum: 1 }, // 历史列表分页查询

            minioImgList: [], // 服务器图片列表
            historyList: [], // 已操作数据列表

            minioClient: '',

            // 数据集
            serverList: [], // 服务器列表
            storageList: [], // 储存对象工具列表
        }
    },
    mounted() {
        this.getserviceList()
        this.getserviceInfoList()
    },
    methods: {
        // 获取服务器列表（用于表单选择服务器，例如：minio）
        async getserviceList() {
            let params = { type: 'server' }
            let res = await this.$axios('/api/dict/type', params)
            if (res && res.data) {
                this.serverList = res.data
            }
        },

        // 查询数据集列表
        async getserviceInfoList() {
            let params = {
                pageSize: this.storageParam.pageSize,
                pageNum: this.storageParam.pageNum
            }
            let res = await this.$axios('/api/storage/list', params)
            if (res && res.data.records) {
                this.storageList = res.data.records
                this.storageSelectNow = res.data.records[0]
                this.storageSelectNowId = res.data.records[0].id
                this.storagePagination.total = res.data.total
                this.innitDataBase()
            }
        },

        /**
         * 修改当前选择的数据集
         * @param {*} record Object 数据
         * @param {*} index Number 索引
         */
        changeNowstorage(record, index) {
            this.storageSelectNow = record
            this.minioImgList = []
            this.historyList = []
            this.innitDataBase()
        },

        // 初始化数据库，重新拉取数据
        innitDataBase() {
            let _this = this
            // 初始化连接minio
            var Minio = this.$Minio
            var minioClient = new Minio.Client({
                endPoint: _this.storageSelectNow.endpoint,
                port: _this.storageSelectNow.port,
                useSSL: false,
                accessKey: _this.storageSelectNow.accessKey,
                secretKey: _this.storageSelectNow.secretKey
            });
            this.minioClient = minioClient
            // 通知父组件改变 minioClient  和当前数据集  对象
            this.$emit('minioClient', minioClient, _this.storageSelectNow)
            this.listMinioObject()
        },
        // 列出minio上  当前数据集中 所有对象。
        listMinioObject() {
            let _this = this
            let minioClient = this.minioClient
            let imageList = []
            var stream = minioClient.listObjects(_this.storageSelectNow.bucket, _this.storageSelectNow.path, false)
            stream.on('data', function (obj) {
                imageList.push(obj);
            })
            stream.on('end', function (end) {
                console.log('minio返回end', imageList);
                let endList = [] // 过滤文件，只需要包含图片
                for (let i = 0; i < imageList.length; i++) {
                    if (imageList[i].name.includes('.jpg') || imageList[i].name.includes('.jpeg') || imageList[i].name.includes('.gif') || imageList[i].name.includes('.png') || imageList[i].name.includes('.bmp') || imageList[i].name.includes('.pdf')) {
                        endList.push(imageList[i])
                    }
                }
                _this.minioImgList = endList
                // 当服务器桶路径下没有文件的时候
                if (_this.minioImgList.length == 0) {
                    _this.listDataSave([],1) // 更新列表数据
                    return
                }
                let isCallBack = false // 防止获取图片回调两次
                _this.$utils.getMInioImg(_this.minioClient, _this.storageSelectNow.bucket, _this.minioImgList, 'name', function call(res) {
                    if (isCallBack) {
                        return false
                    }
                    isCallBack = true
                    console.log('minio返回', res);
                    _this.listDataSave(res,1) // 更新列表数据
                })
            })
            stream.on('error', function (err) { console.log('err==', err) })
        },

        /**
         * 将图片设置改变成当前使用数据
         * @param {*} record 
         * @param {*} index 
         * @param {*} type 图片类型 1服务器图片  2历史操作图片 
         */
        useThisImage(record, index, type) {
            this.$emit('changeNowImage', record, index, type)
        },

        /**
         * 标注历史列表  操作
         * @param {*} record 操作数据
         * @param {*} type delete  删除
         */
        async operateHistory(record, type) {
            if (type == 'delete') {
                let params = {
                    id: record.id
                }
                let res = await this.$axios('/api/operate/delete?id=' + record.id, params, 'DELETE')
                if (res && res.code == 200) {
                    this.$message.success('删除成功', 1)
                    this.getImgOperationHistory()
                }
            }
        },

        // 数据集表格改变时触发
        storageListChange(pagination, filters, sorter) {
            console.log(pagination, filters, sorter);
            this.storageParam = {
                pageSize: pagination.pageSize,
                pageNum: pagination.current,
            }
            this.getserviceInfoList()
        },

        // 历史列表表格改变
        historyListChange(pagination, filters, sorter) {
            console.log(pagination, filters, sorter);
            this.historyParam = {
                pageSize: pagination.pageSize,
                pageNum: pagination.current,
            }
            this.getImgOperationHistory()
        },

        // 保存数据集表单
        async saveStorageForm() {
            this.$refs.storageForm.validate().then(async (res) => {
                // 编辑  
                if (this.storageForm.id) {
                    delete this.storageForm.updateTime
                    delete this.storageForm.createTime
                    let res = await this.$axios('/api/storage/update', this.storageForm, 'POST')
                    if (res && res.code == 200) {
                        this.showStorageForm = false
                        this.storageForm = {}
                        this.$message.success(res.message, 2)
                        this.getserviceInfoList()
                    }
                } else {
                    // 新增
                    let res = await this.$axios('/api/storage/save', this.storageForm, 'POST')
                    if (res && res.code == 200) {
                        this.showStorageForm = false
                        this.storageForm = {}
                        this.$message.success(res.message, 2)
                        this.getserviceInfoList()
                    }
                }
            }).catch((er) => {
                console.log('er', er);
            })

        },

        /**
         * 数据集 数据操作 
         * @param {*} record 数据信息
         * @param {*} type 详情：detail 编辑：edit 删除：delete
         */
        async operationStorage(record, type) {
            console.log(record, type);
            if (type == 'edit') {
                this.storageForm = JSON.parse(JSON.stringify(record))
                this.showStorageForm = true
            } else if (type == 'delete') {
                let res = await this.$axios('/api/storage/delete?id=' + record.id, {}, 'DELETE')
                if (res && res.code == 200) {
                    this.$message.success(res.message, 2)
                    this.getserviceInfoList()
                }
            }
        },

        // 图片列表类型切换
        listTypeChange(e) {
            console.log(e);
            let value = e.target.value
            if (value == 2) {
                this.getImgOperationHistory()
            }
        },
        /**
         * 更新列表数据,同时将列表数据传给父组件
         * @param {*} list 列表数据
         * @param {*} type 列表类型 1 服务器图片列表  2历史标注列表
         */
        listDataSave(list, type){
            if (type == 2) {
                this.historyList = list
            } else if(type == 1) {
                this.minioImgList = list
            }
            this.$emit('allImageList', list, type)
        },

        // 获取图片标注列表
        async getImgOperationHistory() {
            let _this = this
            let res = await this.$axios('/api/operate/list', { pageSize: this.historyParam.pageSize, pageNum: this.historyParam.pageNum, storageId: this.storageSelectNow.id })
            if (res) {
                if (res.data && res.data.records && res.data.records.length > 0) {
                    let list = res.data.records
                    for (let i = 0; i < list.length; i++) {
                        list[i].name = list[i].imageUrl
                        list[i].url = '' // 需要删除
                        // 获取minio 标注的Json文件
                        // this.$utils.getMInioJsonFile(_this.minioClient, _this.storageSelectNow.bucket, list[i].imageUpdateUrl + '.json', function call(res) {
                        //     list[i].coordinates = res
                        // })
                    }
                    _this.listDataSave(list,2) // 更新列表数据
                    // 分页数据total更新
                    _this.historyPagination.total = res.data.total
                } else {
                    _this.listDataSave([],2) // 更新列表数据
                }
            }
        },
    }
}
</script>
<style lang="less" scoped>
.dataConfig {
    display: flex;

    .mrR5 {
        margin-right: 5px;
    }

    .close {
        width: 0px;
        box-sizing: border-box;
        z-index: 99;
        overflow: hidden;
        transition: all 0.5s ease;
        display: none;
    }

    .show {
        width: auto;
        box-sizing: border-box;
        z-index: 99;
        overflow: hidden;
        transition: all 0.5s ease;
        display: block;
    }

    .leftPan {
        border: 1px solid #000;
        margin-right: 20px;
        height: 100vh;
        box-sizing: border-box;
        background: #fff;
        position: relative;
        top: 0;
        left: 0;
        min-width: 300px;
        overflow: auto;

        .storaeBox {
            padding: 10px;
        }

        .imgListBox {
            padding: 10px;
        }

        .title {
            text-align: center;
            font-size: 16px;
            margin-bottom: 10px;
            font-weight: bold;
            margin-top: 10px;
        }

        .midLine {
            width: 100%;
            height: 1px;
            border-top: 1px solid #000;
            margin-top: 20px;
            margin-bottom: 10px;
        }

        .addBtn {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 10px;
            line-height: 32px;
        }
    }

    .rightMenu {
        padding: 20px;
        white-space: nowrap;
    }
}
</style>