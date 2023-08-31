import Taro from "@tarojs/taro";
import dayjs from 'dayjs';

//小程序状态栏高度、导航栏高度
export const handleNavInfo = ()=>{
     //状态栏的高度，单位px
     const statusBarHeight: any = Taro.getSystemInfoSync().statusBarHeight;
     // 获取胶囊按钮位置信息
     const menuButtonInfo = Taro.getMenuButtonBoundingClientRect();
     // 获取导航栏高度
     const barHeight = menuButtonInfo.height + (menuButtonInfo.top - statusBarHeight) * 2 + statusBarHeight;
     return{
        statusBarHeight,
        barHeight
     }
}
//获取登录用户信息
export const getLoginInfo = ()=>{
    return new Promise((resolve,reject)=>{
        Taro.getUserProfile({
            desc:'帮助您成为我们的注册用户',
            success:res=>{
                const userInfo = res.userInfo
                resolve(userInfo)
            },
            fail:()=>{
                reject('获取用户信息失败');
            }
        })
    })
}
export const handleFormatTime = (time, formatType = 'YYYY-MM-DD') => {
    return dayjs(time).format(formatType)
}
export const toast=(type,message)=>{
    return  Taro.showToast({
        title: message,
        icon: type,
        duration: 2000
      })

}