import React, { useRef, forwardRef } from "react";
import { View, Input } from '@tarojs/components'

import './index.scss';

const EditModal: React.FC<{ 
    collectName: string, 
    handleCancel: (flag: boolean) => void, 
    handleInputFocus: (collectName: string) => void, 
    handleConfirm: (editcollectName: string) => void ,
    handleShowDelete:(dialogShow: boolean,deleteShow:boolean)=>void
}> = forwardRef((props, ref) => {
    const inputRef: any = useRef();
    const handleCancel = () => {
        props.handleCancel(false)
    }
    const handleInputFocus = (e) => {
        props.handleInputFocus(e.detail.value)
    }
    const handleConfirm = () => {
        const inuptValue = inputRef.current.props.value
        props.handleConfirm(inuptValue);
    }
    const handleShowDelete=()=>{
        props.handleShowDelete(false,true)
    }
    return (
        <View className='index-dialog'>
            <View className="index-dialog-wrap">
                <View className="index-dialog-wrap-title">编辑二维码</View>
                <View className="index-dialog-wrap-content">
                    <View className="index-dialog-wrap-content-head">请输入二维码名称：</View>

                    <View className="index-dialog-wrap-content-input">
                        <Input type='text' ref={inputRef} placeholder='将会获取焦点' value={props.collectName} onBlur={(e) => { handleInputFocus(e) }} className='index-dialog-wrap-content-input-content' />

                    </View>

                </View>
                <View className="index-dialog-wrap-btn">
                    <View className="index-dialog-wrap-btn-left" onClick={handleConfirm}> 提交</View>
                    <View className="index-dialog-wrap-btn-right" onClick={handleCancel}>取消</View>
                </View>
                <View className="index-dialog-wrap-line"></View>
                <View className="index-dialog-wrap-delete" onClick={handleShowDelete}>删除二维码</View>

            </View>
        </View>
    )
})
export default EditModal;