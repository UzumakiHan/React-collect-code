import React, { useState, useEffect } from 'react'
import { View, Image, Text } from '@tarojs/components'
import EditModal from '@/components/EditModal'
import DeleteModal from '@/components/DeleteModal'

import Taro,{useDidShow} from '@tarojs/taro'
import editIcon from '../../assets/index/edit.png'
import addIcon from '../../assets/index/add.png'
import service from "@/common/service";
import { handleNavInfo, toast } from "@/common/util";
import constant from "@/common/constant";
import type { IAccess, ICodePic, IUploadRes, INodeAjax, IUpdateRes } from '@/types/index'

import './index.scss'
const Index: React.FC = () => {
  //获取导航栏高度
  const [placeHolderHeight, setPlaceHolderHeight] = useState(0);
  //状态栏高度
  const [barTop, setBarTop] = useState(0);
  //列表
  const [collectList, setCollectList] = useState<Array<ICodePic>>([]);
  //修改modal
  const [dialogShow, setDialogShow] = useState(false);
  //删除modal
  const [deleteShow, setDeleteShow] = useState(false)
  //删除的图片链接
  const [editQrcodeUrl, setEditQrcodeUrl] = useState('');
  //删除的id
  const [editId, setEditId] = useState('')
  //删除的图片文件路径
  const [editFilePath, setEditFilePath] = useState('')
  //当前的图片名称
  const [collectName, setCollectName] = useState('')
  //当前index
  const [editIndex, setEditIndex] = useState(0)
  useDidShow(async () => {
    handleNavHeight()
    const result = await service.handleGetCommonAjax(constant.APP_ACCESS_TOKEN) as IAccess
    if (result) {
      Taro.setStorageSync(constant.STORE_ACCESS_KEY, result)
    }
  })
  useEffect(() => {
    const userHash = Taro.getStorageSync(constant.STORE_USER_HASH) || ''
    if (!userHash) {
      return
    }
    getCollectList();
  }, [])
  //获取导航信息
  const handleNavHeight = () => {
    const navInfo = handleNavInfo();
    setBarTop(navInfo.statusBarHeight)
    setPlaceHolderHeight(navInfo.barHeight)
  }
  //预览图片
  const handlePreview = (fileUrl) => {
    Taro.previewImage({
      urls: [fileUrl], // 当前显示图片的http链接
    })
  }
  //获取列表
  const getCollectList = async () => {
    const account = Taro.getStorageSync(constant.STORE_USER_HASH) || ''
    const res = await service.getCollectList(account);
    setCollectList(res)
  }
  //新增用户
  const handleAddUser = async (openId, userInfo) => {
    const { nickName, city, country, province, gender, avatarUrl } = userInfo
    const rowData = {
      rows: [
        {
          openid: openId,
          username: nickName,
          city,
          country,
          province,
          gender: gender === 0 ? '男' : '女',
          avatarUrl
        }
      ],
      table_name: `${constant.USER_TABLE_NAME}`

    }
    await service.handleAddRowData(rowData)

  }
  //登录判断
  const handleIsLogin = () => {
    return new Promise((resolve, reject) => {
      Taro.getUserProfile({
        desc: '帮助您成为我们的注册用户',
        success: res => {
          const userInfo = res.userInfo
          Taro.getUserInfo({
            //成功后会返回
            success: () => {
              //获取openId（需要code来换取）这是用户的唯一标识符
              // 获取code值
              Taro.login({
                //成功放回
                success: async (res) => {
                  const code = res.code
                  const editRes = await service.hanldeGetOpenid(code);
                  if (editRes.code === constant.SUCCESS_CODE) {
                    const openId = editRes.data.openId
                    Taro.setStorageSync(constant.STORE_USER_HASH, editRes.data.openId)
                    Taro.getStorage({
                      key: constant.STORE_USER_HASH,
                      success: async function () {
                        const userSql = `select * from ${constant.USER_TABLE_NAME} where openid = '${openId}' `
                        const findUserRes = await service.handleQueryData(userSql)
                        if (findUserRes.results.length === 0) {
                          //新用户插入
                          handleAddUser(openId, userInfo)
  
                        }
  
                      }
                    })
  
                    resolve(openId)
                  }
                }
              })
            }
          })
        },
        fail: () => {
          reject('获取用户信息失败');
        }
      })
    })
  }
  //上传图片
  const handleUploadImg = async () => {
    const userHash = Taro.getStorageSync(constant.STORE_USER_HASH) || ''

    if (!userHash) {
      await handleIsLogin()
    }
    Taro.chooseImage({
      count: 1,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: async function (res) {
        const uploadRes = await service.handleUploadFile(res.tempFilePaths[0]) as IUploadRes
        if (uploadRes.addRes) {
          const collectInfo = uploadRes.collectInfo
          collectInfo[0].codeurl = res.tempFilePaths[0]
          toast('success', '添加成功')
          setTimeout(() => {
            const addCollect = collectList.concat(collectInfo)
            setCollectList(addCollect)
          }, 200)

        } else {
          toast('error', '失败')

        }
      },
      fail() {

        toast('error', 'fail')

      }
    })

  }
  //编辑点击
  const handleEdit = (event, collect,index) => {
    event.stopPropagation()
    setDialogShow(true);
    setEditQrcodeUrl(collect.codeurl)
    setEditId(collect._id)
    setEditFilePath(collect.filePath)
    setCollectName(collect.collectname)
    setEditIndex(index)
  }
  //删除
  const handleDel = async () => {
    Taro.showLoading({
      title: '加载中',
      mask: true
    })
    const deletePathRes = await service.handleDeleteFile(editFilePath) as INodeAjax
    if (deletePathRes.code === constant.SUCCESS_CODE) {
      const delRes = await service.handleDelRowData(constant.CODE_PIC_TABLE_NAME, editId);
      if (delRes) {
        Taro.hideLoading({
          success() {
            toast('success', '删除成功')
            setDeleteShow(false)
            const filterList = collectList
            filterList.splice(editIndex,1)
            setCollectList(filterList)

          }
        })
      } else {
        toast('error', '删除失败')
        setDeleteShow(false)
      }


    }else{
      toast('error', '删除失败')
        setDeleteShow(false)
    }
  }
  //修改名称
  const handleConfirm = async (editcollectName) => {
    if (editcollectName === '') {
      toast('error', '不能为空')
      return
    }
    Taro.showLoading({
      title: '修改中',
      mask: true
    })
    const updateInfo = {
      row: {
        collectname: collectName,
      },
      table_name: `${constant.CODE_PIC_TABLE_NAME}`,
      row_id: editId
    }
    try {
      const updateRes = await service.handleUpdateRowData(updateInfo) as IUpdateRes
      if (updateRes && updateRes.success === true) {
        const filterList = collectList
        filterList[editIndex].collectname = collectName;
        setCollectList(filterList)
        Taro.hideLoading({
          success() {
            toast('success', '修改成功')
          }
        })

      } else {
        toast('error', '删除失败')

      }
      setDialogShow(false)
    } catch (error) {

    }


  }
  //隐藏编辑modal
  const handleCancel = (flag: boolean) => {
    setDialogShow(flag)
  }
  //失去焦点时的值
  const handleInputFocus = (collectName) => {
    setCollectName(collectName)
  }
  //隐藏弹窗
  const handleShowDelete = (dialogShow, deleteShow) => {
    setDialogShow(dialogShow);
    setDeleteShow(deleteShow)
  }
  //隐藏删除modal
  const handleHideDeleteShow = (flag) => {
    setDeleteShow(flag)
  }
  return (
    <View className='index'>
      <View className="index-nav" style={{ height: placeHolderHeight, paddingTop: barTop }}>
        二维码相册
      </View>
      <View className='index-wrap' style={{ top: placeHolderHeight + 10 }}>
        <View className="index-wrap-tip" >点击二维码查看大图，长按大图，即可识别</View>
        {
          collectList.length === 0 ? <View className="index-wrap-empty"></View> :
            <View className='index-wrap-list'>
              {
                collectList.map((collect: ICodePic,index:number) => {
                  return (
                    <View className='index-wrap-list-item' onClick={() => { handlePreview(collect.codeurl) }}>
                      <View className='index-wrap-list-item-info'>
                        <Image
                          style='width: 62px;height: 62px;'
                          src={collect.codeurl}
                        />
                        <View className='index-wrap-list-item-info-desc'>{collect.collectname}</View>
                      </View>
                      <View className='index-wrap-list-item-control'>
                        <Image
                          src={editIcon}
                        />
                        <Text onClick={(e) => { handleEdit(e, collect,index) }}>编辑</Text>
                      </View>
                    </View>
                  )
                })
              }
            </View>
        }
      </View>
      <View className="index-panel">
        {
          collectList.length === 0 ? <View className="index-panel-desc" ></View> : null
        }
        <Image src={addIcon} style="width:92px;height:68px" onClick={handleUploadImg} />
      </View>
      {/* 修改modal */}
      {dialogShow && <EditModal
        collectName={collectName}
        handleCancel={handleCancel}
        handleInputFocus={handleInputFocus}
        handleConfirm={handleConfirm}
        handleShowDelete={handleShowDelete}
      />}
      {/* 删除二维码弹层 */}
      {deleteShow && <DeleteModal
        editQrcodeUrl={editQrcodeUrl}
        handleHideDeleteShow={handleHideDeleteShow}
        handleDel={handleDel}
      />
      }
    </View>
  )
}
export default Index;