import {logger} from "./logger.ts";
import React, {useState} from "react";
import {
    BocchiDefaultHeaderFnProps,
    BocchiDefaultHeaderStateProps,
    IHeaderFnProps,
    IHeaderStateProps
} from "./header/header.ts";
import {SubMenuType} from "antd/es/menu/hooks/useItems";
import Blockly, {WorkspaceSvg} from 'blockly'
import * as locale from 'blockly/msg/zh-hans';
import {ComponentItemFactory, deepCopy, UserConfig} from "dooringx-lib";
import {dooringxDefaultConfig} from "./dooringxDefaultConfig.tsx";
import Widget from "./widget/widget.tsx";
import {javascriptGenerator} from 'blockly/javascript';
// @ts-ignore
import * as Babel from '@babel/standalone'

export interface IEditorState {
    dooringxMode: 'edit' | 'preview',
    toolbox: IToolboxState;
    flyoutMode: 'dx' | 'blockly' | 'none'
}

export interface IToolboxItemState {
    key: string,
    color: string,
    name: string,
    icon: string
}

export interface IToolboxCategoryState {
    label: string;
    key: string;
    items: IToolboxItemState[];
}

export interface IToolboxState {
    nowFocus: string;
    items: IToolboxCategoryState[];
}

class Editor {
    public state: IEditorState;
    public stateFreshCallback: (_state: IEditorState) => void;
    public headerFn: IHeaderFnProps;
    public workspace: WorkspaceSvg | undefined;
    public dxConfig: UserConfig;
    public headerState: IHeaderStateProps;
    public widgetTypes: any;
    public widgets: any;

    constructor() {
        logger.info('Editor', 'constructorCall', arguments);
        logger.success('Editor', 'Welcome', '欢迎使用Bocchi Editor！如果您是开发者，可以加入我们！一起来让BE变得更好！QQ:929524501');
        //初始化 state 状态区域

        this.state = <IEditorState>{};
        this.stateFreshCallback = (_state) => {
            logger.info('Editor', 'stateFreshCallback_test', _state)
        };
        this.headerState = BocchiDefaultHeaderStateProps;
        this.state.dooringxMode = 'edit';
        this.headerFn = BocchiDefaultHeaderFnProps;
        this.headerState.menuItems?.filter(v => {
                if (v?.key === 'file') {
                    (v as SubMenuType).children.push({
                        key: 'import_widget',
                        label: '导入组件',
                    })
                }
            }
        )
        this.widgets = {};
        this.headerFn.menuFn = (key) => this.menuFnHandler(key);
        this.state.toolbox = <IToolboxState>{};
        this.state.toolbox.nowFocus = 'screen';
        this.state.toolbox.items = [];
        this.state.flyoutMode = 'none';
        this.dxConfig = new UserConfig(dooringxDefaultConfig);
        this.dxConfig.i18n = false;
        this.dxConfig.containerOverFlow = false;
        logger.info('Editor', 'cFinish', this);
        this.widgetTypes = {};

        this.newToolboxCategory('feature', '功能');
        this.newToolboxCategory('ui', '界面');
        this.newToolboxItem('ui', {
            key: 'screen',
            name: '屏幕',
            icon: '',
            color: '#ff00ff'
        })
        // @ts-ignore
        this.dxConfig['__lastPreviewAreaBlocksLength'] = 0;
        this.dxConfig.getStore().subscribe(() => {
            // 处理新增的块
            let blocks = this.dxConfig.getStore().getData().block;
            if (
                // @ts-ignore
                blocks.length > this.dxConfig['__lastPreviewAreaBlocksLength']
            ) {
                let newBlock = blocks[blocks.length - 1];

                if (this.widgetTypes[newBlock.id.split('-')[0]]) {
                    this.widgets[newBlock.id] = new this.widgetTypes[newBlock.id.split('-')[0]]({id: newBlock.id});
                }
                this.newToolboxItem('ui', {
                    key: newBlock.id,
                    name: this.widgets[newBlock.id].widgetType().name,
                    icon: this.widgets[newBlock.id].widgetType().icon,
                    color: this.widgets[newBlock.id].widgetType().color
                })

                //END
                const data = deepCopy(this.dxConfig.getStore().getData());
                data.block.pop();
                if (newBlock) data.block.push(newBlock);
                // @ts-ignore
                this.dxConfig['__lastPreviewAreaBlocksLength'] = data.block.length;
                this.dxConfig.getStore().setData(data);
            }

            // 处理被聚焦的块

            let focus = 'screen';
            for (let i = 0; i < blocks.length; i++) {
                if (blocks[i].focus) {
                    focus = blocks[i].id;
                    break;
                }
            }
            if (this.state.toolbox.nowFocus !== focus) {
                this.state.toolbox.nowFocus = focus;
                this.freshState();
            }

            // 处理toolbox块名称的变化
            for (let i = 0; i < blocks.length; i++) {
                this.state.toolbox.items.map((e) => {
                    e.items.map((item) => {
                        if (item.key === blocks[i].id && item.name !== blocks[i].props.__name) {
                            item.name = blocks[i].props.__name;
                            let [blocklyJsonDef] = this.widgets[blocks[i].id].genBlocklyDef();
                            blocklyJsonDef.map((e: any) => {
                                const l = this?.workspace?.getBlocksByType(e.type)?.length;
                                if (l) {
                                    for (let i = 0; i < l; i++) {
                                        // @ts-ignore
                                        if (this.workspace.getBlocksByType(e.type)[i].getField("WIDGET_ID").getValue() === blocks[i].id) {
                                            // @ts-ignore
                                            this.workspace.getBlocksByType(e.type)[i].getField("WIDGET_ID").selectedOption[0] = blocks[i].props.__name;                                            // @ts-ignore
                                            // @ts-ignore
                                            this.workspace.getBlocksByType(e.type)[i].getField("WIDGET_ID").forceRerender();
                                            // @ts-ignore
                                            this.workspace.getBlocksByType(e.type)[i].render();
                                        }
                                    }
                                }
                            })
                        }
                    })
                })
            }
            this.freshState();
        });

    }

    menuFnHandler(key: string) {
        logger.info('Editor', 'menuFn', key, this);
        if (key === 'import_widget') {
            const TESTWidgetString = `
            class MyWidget extends BocchiWidget{
                constructor(arg) {
                    super(arg);
                    logger.info('WWWWW','WWWWWWWWW',this);
                }
                render(){
                    return <span>nice!{this.id}</span>;
                }
            }
            bocchi.exportWidgets=[MyWidget];
            `
            this.importWidgetFromCode(TESTWidgetString);
        }
    }

    importWidgetFromCode(code: string) {
        let widgetFn = new Function('BocchiWidget', 'logger', "React",
            `
                let bocchi={};
                bocchi.exportWidgets = [];
                `
            + Babel.transform(code, {presets: ["env", "react"]}).code +
            `
                ;return bocchi;
                `
        );
        let widgets: any = widgetFn.call(null, Widget, logger, React);
        for (let i = 0; i < widgets['exportWidgets'].length; i++) {
            this.importWidget(widgets['exportWidgets'][i]);
        }
    }

    importWidget(widget: any) {
        logger.info('Editor', 'importWidget', widget);
        const storeBackup = deepCopy(this.dxConfig.store.getData());
        const widgetType = widget.prototype.widgetType();
        this.dxConfig.addCoRegistMap({
            type: 'builtin',
            component: widgetType.type,
            img: 'icon',
            imgCustom: React.createElement("img", {src: widgetType.icon, style: {width: '60px', height: '60px'}}),
            displayName: widgetType.name,
        });
        const [widgetProps, widgetInitData] = widget.prototype.genDxPropsAndInitData();
        this.widgetTypes[widgetType.type] = widget;
        const comp = new ComponentItemFactory(
            widgetType.type,
            widgetType.name,
            widgetProps,
            widgetInitData,
            (data, context, store, config) => {
                logger.info('Widget', 'render', 'HookedRender', data.id);
                return this.widgets[data.id].runRender(data, context, store, config);
            },
            true
        );
        logger.info('Widget', 'renderGen', comp);
        this.dxConfig.registComponent(comp);
        this.dxConfig.store.setData(deepCopy(storeBackup));
        let [blocklyJsonDef, blocklyFnMap] = widget.prototype.genBlocklyDef();
        Blockly.defineBlocksWithJsonArray(blocklyJsonDef);
        for (let i in blocklyFnMap) {
            javascriptGenerator.forBlock[i] = blocklyFnMap[i];
        }
        let __this = this;
        Blockly.Extensions.register(`dynamic_dropdown_widgetID_${widgetType.type}_extension`,
            function () {
                // @ts-ignore
                this.getInput('WIDGET_ID_DI')
                    .appendField(new Blockly.FieldDropdown(
                        // @ts-ignore
                        function () {
                            console.log(this, __this);
                            let options = [];
                            for (let i in __this.widgets) {
                                options.push([__this.widgets[i].props.__name, i]);
                            }
                            console.log(options);
                            return options;
                        }), 'WIDGET_ID');
            });
    }

    freshState() {
        logger.info('Editor', 'freshState_call', this.state)
        this.stateFreshCallback(structuredClone(this.state));
    }

    workspaceInject(ref: Element) {
        if (this.workspace) return;
        Blockly.setLocale(locale);
        this.workspace = Blockly.inject(ref, {
            toolbox: {
                kind: 'categoryToolbox',
                contents: [],
            },
            media: '/media',
            trashcan: false,
            zoom: {
                controls: true,
                wheel: true,
                startScale: 0.8,
                maxScale: 1.4,
                minScale: 0.5,
            },
            move: {
                scrollbars: true,
                drag: true,
                wheel: true,
            },
            grid: {
                spacing: 20,
                length: 3,
                colour: '#ccc',
                snap: true,
            },
            theme: 'zelos',
            renderer: 'zelos',
        });
        const hideOld = this.workspace?.getToolbox()?.getFlyout()?.hide;
        // @ts-ignore
        this.workspace.getToolbox().getFlyout().hide = () => {
            this.state.flyoutMode = 'none';
            this.freshState();
            if (hideOld) {
                hideOld.call(this.workspace?.getToolbox()?.getFlyout());
            }
        }
    }

    newToolboxItem(categoryKey: string, item: IToolboxItemState) {
        this.state.toolbox.items.map((e) => {
            if (e.key === categoryKey) {
                e.items.push(item);
            }
        })
        this.freshState();
    }

    newToolboxCategory(key: string, categoryName: string) {
        this.state.toolbox.items.push({
            label: categoryName,
            items: [],
            key: key
        });
        this.freshState();
    }

    toolboxClick(key: string) {
        if (this.state.flyoutMode === 'none') {
            this.setFocus(key);
            this.state.flyoutMode = 'dx';
        } else if (this.state.toolbox.nowFocus === key && this.state.flyoutMode === 'dx') {
            this.workspace?.getToolbox()?.getFlyout()?.show(this.getBlocklyFlyoutDef(key));
            this.state.flyoutMode = 'blockly';
        } else if (this.state.toolbox.nowFocus === key && this.state.flyoutMode === 'blockly') {
            this.workspace?.getToolbox()?.getFlyout()?.hide();
            this.state.flyoutMode = 'none';
        } else if (this.state.toolbox.nowFocus !== key && this.state.flyoutMode === 'dx') {
            this.setFocus(key);
        } else if (this.state.toolbox.nowFocus !== key && this.state.flyoutMode === 'blockly') {
            this.setFocus(key);
            this.workspace?.getToolbox()?.getFlyout()?.hide();
            this.workspace?.getToolbox()?.getFlyout()?.show(this.getBlocklyFlyoutDef(key));
            this.state.flyoutMode = 'blockly';
        }
        this.freshState();
    }

    getBlocklyFlyoutDef(key: string) {
        console.log(this.widgets[key].genBlocklyFlyoutDef());
        return this.widgets[key].genBlocklyFlyoutDef();
    }

    setFocus(key: string) {
        if (key === '') this.state.toolbox.nowFocus = '';
        else this.state.toolbox.nowFocus = key;
        let blocks = this.dxConfig.getStore().getData().block;
        for (let i = 0; i < blocks.length; i++) {
            if (blocks[i].focus) {
                blocks[i].focus = false;
            }
            if (blocks[i].id === key) {
                blocks[i].focus = true;
            }
            const data = this.dxConfig.getStore().getData();
            data.block = blocks;
            this.dxConfig.getStore().setData(deepCopy(data));
        }
    }
}

function useEditorState(editor: Editor) {
    const [state, setState] = useState(editor.state);
    editor.stateFreshCallback = (_state) => {
        setState(_state);
    }
    return [state];
}

export {Editor, useEditorState};