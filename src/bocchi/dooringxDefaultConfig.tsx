// import {PlayCircleOutlined} from '@ant-design/icons';
import * as propsFormComponents from './porpsFormComponents';
import * as builtinWidgetType from './builtinWidgetType';
import {InitConfig} from "dooringx-lib";

export const dooringxDefaultConfig:Partial<InitConfig> = {
    leftAllRegistMap: [
        // {
        //     type: 'builtin',
        //     component: 'BUILTIN_BUTTON',
        //     img: 'icon-anniu',
        //     imgCustom: <PlayCircleOutlined/>,
        //     displayName: '按钮',
        // },
    ],
    leftRenderListCategory: [
        {
            type: 'builtin',
            displayName: '内置组件',
            icon:<div style={{display:'none'}}/>
        },
    ],
    initComponentCache: {
        BUILTIN_BUTTON: {component: builtinWidgetType.button},
    },
    rightRenderListCategory: [
        {
            type: 'props',
            icon: '常规',
        },
    ],
    initFunctionMap: {},
    initCommandModule: [],
    initFormComponents: {
        input: propsFormComponents.input,
    },
};

