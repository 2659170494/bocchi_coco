import {Col, Input, Row} from 'antd';
import {deepCopy, UserConfig} from "dooringx-lib";
import {IBlockType} from "dooringx-lib/dist/core/store/storetype";
import {CreateOptionsRes} from "dooringx-lib/dist/core/components/formTypes";
import {logger} from "../logger.ts";

export interface InputType {
    label: string;
    receive?: string;
}

export interface InputMap {
    input: InputType;
}

interface InputProps {
    data: CreateOptionsRes<InputMap, 'input'>;
    current: IBlockType;
    config: UserConfig;
}

function input(props: InputProps) {
    return (
        <Row style={{padding: '10px 10px'}}>
            <Col
                span={6}
                style={{userSelect: 'none', alignItems: 'center', display: 'flex'}}
            >
                {props.data.option.label}
            </Col>
            <Col
                span={18}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                }}
            >
                <Input
                    value={props.current.props[props.data.option.receive as string]}
                    onChange={(e) => {
                        const val = e.target.value;
                        logger.info('Input','onChange',val);
                        const cloneData = deepCopy(props.config.store.getData());
                        const newBlock = cloneData.block.map((v: IBlockType) => {
                            if (v.id === props.current.id) {
                                v.props[props.data.option.receive as string] = e.target.value;
                            }
                            return v;
                        });
                        props.config.store.setData({ ...cloneData, block: [...newBlock] });
                    }}
                />
            </Col>
        </Row>
    );
}

export default input;
