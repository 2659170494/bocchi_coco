import {useState} from 'react';
import './ToolboxItem.css';

export interface IToolboxItemProps {
    nowClick: number,
    color: string,
    onClick: () => void,
    name: string,
    icon: string
}

function ToolboxItem(props: IToolboxItemProps) {
    const [hover, setHover] = useState(false);

    return (
        <div
            className={'toolbox-item'}
            style={{
                backgroundColor: (props.nowClick===2)
                    ? props.color
                    : (hover|| (props.nowClick===1))
                        ? props.color + '55'
                        : '',
            }}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            onClick={props.onClick}
        >
            <div className={'toolbox-item-icon'}>
                <img src={props.icon} alt={'toolbox-item-icon'} width={'24px'} height={'24px'}/>
            </div>
            <span
                style={{
                    color: props.nowClick ? '#ffffff' : '#61626b',
                }}
                className={'toolbox-item-text'}
            >
             {props.name}
            </span>
        </div>
    );
}

export default ToolboxItem;
