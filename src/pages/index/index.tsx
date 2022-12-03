import React, { useState, useEffect } from 'react'
import { View, Image, Text } from '@tarojs/components'
import EditModal from '@/components/EditModal'
import DeleteModal from '@/components/DeleteModal'

import Taro from '@tarojs/taro'
import editIcon from '../../assets/index/edit.png'
import addIcon from '../../assets/index/add.png'
import service from "@/utils/service";
import { handleNavInfo, getLoginInfo, toast } from "@/utils";
import config from "@/config";
import constant from "@/constant";
import { Icollect } from '@/typings'
import './index.scss'
const Index: React.FC = () => {
  //获取导航栏高度
  const [placeHolderHeight, setPlaceHolderHeight] = useState(0);
  //状态栏高度
  const [barTop, setBarTop] = useState(0);
  //列表
  const [collectList, setCollectList] = useState([]);
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
  useEffect(() => {
    handleNavHeight();
    const userHash = Taro.getStorageSync('userHash') || ''
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
    const account = Taro.getStorageSync('userHash') || ''
    const res = await service.getCollectList(account);
    if (res.success_code === constant.SUCCESS_CODE) {
      setCollectList(res.collectList)
    } else {
      toast('error', res.message)
    }
  }
  //登录判断
  const handleIsLogin = async () => {
    const userInfo = await getLoginInfo();
    Taro.getUserInfo({
      //成功后会返回
      success: (res) => {
        //获取openId（需要code来换取）这是用户的唯一标识符
        // 获取code值
        Taro.login({
          //成功放回
          success: async (res) => {
            const code = res.code
            const editRes = await service.saveUser(code, userInfo);
            if (editRes.success_code === constant.SUCCESS_CODE) {
              Taro.setStorageSync('userHash', editRes.data.openid)
              Taro.getStorage({
                key: 'userHash',
                success: function (res) {
                  getCollectList()
                }
              })
            }
          }
        })
      }
    })
  }
  //上传图片
  const handleUploadImg = async () => {
    const userHash = Taro.getStorageSync('userHash') || ''
    if (!userHash) {
      await handleIsLogin()
    }
    Taro.chooseImage({
      count: 1,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: function (res) {
        Taro.showLoading({
          title: '添加中....',
          mask: true
        })
        const account = Taro.getStorageSync('userHash') || ''
        Taro.uploadFile({
          url: `${config.BASE_URL}${config.BASE_API.uploadCode}`,
          filePath: res.tempFilePaths[0],
          name: 'filecontent',
          formData: {
            'type': '照片',
            'account': account
          },
          success: function (res) {
            if (res.statusCode === constant.SUCCESS_CODE) {
              Taro.hideLoading({
                success() {
                  toast('success', '添加成功')
                  getCollectList()
                }
              })
            }
          },
          fail() {
            toast('error', '接口连接不通哦~~~')
          }
        })
      }
    })

  }
  //编辑点击
  const handleEdit = (event, collect) => {
    event.stopPropagation()
    setDialogShow(true);
    setEditQrcodeUrl(collect.fileUrl)
    setEditId(collect._id)
    setEditFilePath(collect.filePath)
    setCollectName(collect.collectName)
  }
  //删除
  const handleDel = async () => {
    Taro.showLoading({
      title: '加载中',
      mask: true
    })
    const delRes = await service.delCode(editId, editFilePath);
    if (delRes.success_code === constant.SUCCESS_CODE) {
      Taro.hideLoading({
        success() {
          toast('success', delRes.message)
          setDeleteShow(false)
          getCollectList()
        }
      })
    } else {
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
    const editRes = await service.editCode(editId, editcollectName);
    if (editRes.success_code === constant.SUCCESS_CODE) {
      Taro.hideLoading({
        success() {
          toast('success', '修改成功')
        }
      })
    } else {
      toast('error', '删除失败')
    }
    setDialogShow(false)
    getCollectList()

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
                collectList.map((collect: Icollect) => {
                  return (
                    <View className='index-wrap-list-item' onClick={() => { handlePreview(collect.fileUrl) }}>
                      <View className='index-wrap-list-item-info'>
                        <Image
                          style='width: 62px;height: 62px;'
                          src={collect.fileUrl}
                        />
                        <View className='index-wrap-list-item-info-desc'>{collect.collectName}</View>
                      </View>
                      <View className='index-wrap-list-item-control'>
                        <Image
                          src={editIcon}
                        />
                        <Text onClick={(e) => { handleEdit(e, collect) }}>编辑</Text>
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