import { ComponentItemFactory, createPannelOptions } from 'dooringx-lib';
import { Button } from 'antd';
import {InputMap} from "../porpsFormComponents/input.tsx";

const BuiltinButton = new ComponentItemFactory(
  'BUILTIN_BUTTON',
  '按钮',
  {
    props: [
      createPannelOptions<InputMap,'input'>('input', {
        receive: 'text',
        label: '文字',
      }),
    ],
  },
  {
    props: {
      text: 'yehuozhili', // input配置项组件接收的初始值
    },
  },
  (data, context, store, config) => {
    console.log(data, context, store, config);
    console.log(config.getComponentRegister().getComp(data.name));
    return <Button>{data.props.text}</Button>;
  },
  true
);
export default BuiltinButton;
