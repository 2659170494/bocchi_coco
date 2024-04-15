import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import bocchiThemeToken from './assets/bocchi_theme_token.json'
import {ConfigProvider, ThemeConfig} from "antd";
import {logger} from "./bocchi/logger.ts";

const themeConfig: ThemeConfig = {cssVar: {key: 'app'}, ...bocchiThemeToken};
logger.info('main', 'themeConfig', {cssVar: true, ...bocchiThemeToken})

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <ConfigProvider theme={themeConfig}>
            <App/>
        </ConfigProvider>
    </React.StrictMode>,
)
