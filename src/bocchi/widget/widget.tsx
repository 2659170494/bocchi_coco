import bqIcon from '../../assets/bocchi_logo.jpg'
import {createPannelOptions, UserConfig} from "dooringx-lib";
import {InputMap} from "../porpsFormComponents/input.tsx";
import {logger} from "../logger.ts";
import Store from "dooringx-lib/dist/core/store";
import {IBlockType} from "dooringx-lib/dist/core/store/storetype";
import Blockly from "blockly";

export interface IWidgetMethod {
    key: string,
    label: string,
    valueType: string,
    params: IWidgetMethodParam[];
}

export interface IWidgetMethodParam {
    key: string,
    label: string,
    valueType: 'string' | 'code',
    defaultValue?: string
}

export interface IWidgetProp {
    key: string,
    label: string,
    valueType: 'string',
    defaultValue: string
}

export interface IWidgetRenderType {
    defaultWidth?: number,
    defaultHeight?: number,
}

export interface IWidgetType {
    author: string;
    color: string;
    icon: string;
    name: string;
    type: string;
    props: IWidgetProp[];
    methods: IWidgetMethod[];
    render?: IWidgetRenderType;
}

export interface IWidgetArgs {
    id: string,
}

class Widget {
    public id: string;
    public props: any;
    public __data: IBlockType | undefined;
    public __context: any | undefined;
    public __store: Store | undefined;
    public __config: UserConfig | undefined;

    constructor(widgetArgs: IWidgetArgs) {
        logger.info('Widget', 'constructor', widgetArgs)
        this.id = widgetArgs.id;
    }

    widgetType(): IWidgetType {
        return {
            author: 'BQE',
            color: '#722ED1',
            icon: bqIcon,
            name: '未命名控件',
            type: 'WIDGET_UNNAME',
            props: [],
            methods: [
                {
                    key: 'att',
                    label: '爆炸！',
                    valueType: '',
                    params: []
                }
            ],
            render: {
                defaultWidth: 200,
            }
        }
    }

    genMethodBlockly(widgetMethod: IWidgetMethod) {
        const widgetType = this.widgetType();
        let blocklyDef: any = {
            "type": "",
            "message0": "",
            "args0": [],
            "previousStatement": null,
            "nextStatement": null,
            "colour": widgetType.color,
            "tooltip": "",
            "helpUrl": "",
            "extensions": [`dynamic_dropdown_widgetID_${widgetType.type}_extension`]
        };
        let blocklyArgs: any = [
            {
                "type": "input_dummy",
                "name": "WIDGET_ID_DI",
            }
        ];
        const paramTypeMap = {
            // number: 'field_number',
            string: 'field_input',
            code: 'input_statement'
        }
        blocklyDef.type = `${widgetType.type}_METHOD_${widgetMethod.key}`;
        let argCnt = 1;
        blocklyDef.message0 = `调用 %1 执行 ${widgetMethod.label}`;
        argCnt++;
        for (let i = 0; i < widgetMethod.params.length; i++) {
            const methodParam = widgetMethod.params[i];
            blocklyDef.message0 = blocklyDef.message0.concat(` ${methodParam.label} %${argCnt.toString()}`);
            argCnt++;
            let nowArg: any = {
                "type": paramTypeMap[methodParam.valueType],
                "name": methodParam.key,
            };
            // if (methodParam.valueType === "number") {
            //     nowArg.value = Number(methodParam.defaultValue);
            // } else
            if (methodParam.valueType === "string") {
                nowArg.text = String(methodParam.defaultValue);
            } else if (methodParam.valueType === "code") {
                blocklyArgs.push({
                    "type": "input_dummy"
                });
                blocklyDef.message0 = blocklyDef.message0.concat(` %${argCnt.toString()}`);
                argCnt++;
            }
            blocklyArgs.push(nowArg);
        }
        blocklyDef.args0 = blocklyArgs;
        let blockGeneratorfunction = function (block: any, generator: any) {
            let props: any = {};
            for (let i = 0; i < widgetMethod.params.length; i++) {
                const nowBqwParam = widgetMethod.params[i];
                if (nowBqwParam.valueType === "code") {
                    props[nowBqwParam.key] = generator.statementToCode(block, nowBqwParam.key);
                } else {
                    props[nowBqwParam.key] = block.getFieldValue(nowBqwParam.key);
                }
            }
            props['WIDGET_ID'] = block.getFieldValue('WIDGET_ID');
            props['METHOD_KEY'] = widgetMethod.key;
            console.log(block);
            return `bp.cwm(${JSON.stringify(props)})`;
        };
        return [blocklyDef, blockGeneratorfunction];
    }

    genBlocklyDef() {
        const methods = this.widgetType().methods;
        let blocklyDef = [];
        let blocklyFnMap: any = {};
        for (let i = 0; i < methods.length; i++) {
            const [methodJson, methodFn] = this.genMethodBlockly(methods[i]);
            blocklyDef.push(methodJson);
            console.log(methodJson);
            blocklyFnMap[methodJson.type] = methodFn;
        }
        logger.info('Widget', 'BlocklyDef', blocklyDef);
        return [blocklyDef, blocklyFnMap];
    }

    genBlocklyFlyoutDef() {
        const methods = this.widgetType().methods;
        let blocklyFlyoutDef = [];
        for (let i = 0; i < methods.length; i++) {
            blocklyFlyoutDef.push(
                {
                    kind: 'block',
                    type: `${this.widgetType().type}_METHOD_${methods[i].key}`,
                }
            );
        }
        return blocklyFlyoutDef;
    }

    genDxPropsAndInitData() {
        let dxProps: any = [];
        let dxInitData: any = {};
        dxInitData.props = {};
        const widgetType = this.widgetType();
        const props = widgetType.props;
        props.push({
            key: '__name',
            label: '名称',
            valueType: 'string',
            defaultValue: widgetType.name
        })
        for (let i = 0; i < props.length; i++) {
            const prop = props[i];
            if (prop.valueType === "string") {
                dxProps.push(createPannelOptions<InputMap, 'input'>('input', {
                    receive: prop.key,
                    label: prop.label,
                }))
                dxInitData.props[prop.key] = prop.defaultValue
            }
        }
        dxInitData['width'] = widgetType?.render?.defaultWidth;
        dxInitData['height'] = widgetType?.render?.defaultWidth;
        logger.success('Widget', 'genDxPropsAndInitData', this.widgetType().type, dxProps, dxInitData);
        return [{
            props: dxProps,
        }, dxInitData];

    }

    parseProps(data: any) {
        this.props = data.props;
    }

    runRender(data: IBlockType, context: any, store: Store, config: UserConfig) {
        this.__data = data;
        this.__context = context;
        this.__store = store;
        this.__config = config;
        this.parseProps(data);
        return this.render();
    }

    render() {
        logger.info('Widget', 'render', this);
        return <span>Not Rewrite! (WidgetID:{this.id},props:{JSON.stringify(this.props)})</span>;
    }
}

export default Widget;