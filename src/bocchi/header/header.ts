import {logger} from "../logger.ts";
import bocchi_logo from '../../assets/bocchi_logo.jpg'
import {MenuProps} from "antd";
import {menuItems} from "./menu.tsx";


export interface IHeaderStateProps {
    menuItems: MenuProps['items'],
    appLogoUrl: string,
    workName:string,
    appName:string,
    appVersion:string
}

export interface IHeaderFnProps {
    runFn: () => void,
    saveFn: () => void,
    workNameChangeFn: (_name: string) => void,
    menuFn:(_key:string)=>void
}

export const BocchiDefaultHeaderFnProps: IHeaderFnProps = {
    workNameChangeFn: (_name) => {
        logger.info('Header', 'workNameChangeFn', _name)
    },
    runFn: () => {
        logger.info('Header', 'runFn')
    },
    saveFn: () => {
        logger.info('Header', 'saveFn')
    },
    menuFn:(_key) => {
        logger.info('Header', 'menuFn',_key)
    },
}
export const BocchiDefaultHeaderStateProps: IHeaderStateProps = {
    appLogoUrl: bocchi_logo,
    menuItems: menuItems,
    workName:'默认作品名',
    appName:'Boochi',
    appVersion:'0000'
}