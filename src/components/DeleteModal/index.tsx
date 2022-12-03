import React,{forwardRef} from "react";
import { View, Image } from '@tarojs/components';
import './index.scss';
const DeleteModal:React.FC<{editQrcodeUrl:string,handleHideDeleteShow:(flag:boolean)=>void,handleDel:()=>void}>=forwardRef((props,ref)=>{
    const handleHideDeleteShow=()=>{
        props.handleHideDeleteShow(false)
    }
    const handleDel=()=>{
        props.handleDel()
    }
    return(
        <View className="index-dialog" >
        <View className="index-dialog-delete">
          <View className="index-dialog-delete-title">确定要删除二维码吗？</View>
          <Image src={props.editQrcodeUrl} className="index-dialog-delete-qrcode" />
          <View className="index-dialog-delete-btn">
            <View className="index-dialog-delete-btn-left" onClick={handleDel}>确认</View>
            <View className="index-dialog-delete-btn-right" onClick={handleHideDeleteShow}>取消</View>
          </View>
        </View>
      </View>
    )
})
export default DeleteModal;