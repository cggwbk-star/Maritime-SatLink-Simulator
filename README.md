# Maritime SatLink Simulator (杰泰海科 Sealink)

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19-61DAFB.svg?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6.svg?logo=typescript)
![Three.js](https://img.shields.io/badge/Three.js-3D-black.svg?logo=three.js)

**[English](#english) | [中文说明](#chinese)**

<a name="english"></a>
## 🇬🇧 English Description

**Maritime SatLink Simulator** is an interactive web-based simulation tool designed for maritime professionals to visualize and analyze GEO (Geostationary Orbit) satellite broadband connectivity on vessels.

This application calculates real-time look angles, visualizes line-of-sight (LOS) scenarios, and simulates signal blockages caused by shipboard structures (masts, cranes, funnels) based on the vessel's location and heading.

### 🚀 Features

1.  **Orbital Mechanics Engine**
    *   **Real-time Look Angle Calculation**: Instantly computes True Azimuth, Elevation, and Range to any GEO satellite based on ship GPS coordinates.
    *   **Interference Protection Logic**: Automatically flags "No Line of Sight" when elevation drops below 5° to simulate mandatory transmission cut-offs (preventing off-axis interference).

2.  **Interactive Visualization**
    *   **3D Globe (Three.js)**: Drag, zoom, and click on a 3D Earth model to position the ship. Visualizes the direct line of sight to the satellite.
    *   **Ship Radar (Polar Plot)**: A top-down relative view showing where the satellite sits relative to the ship's bow.

3.  **Blockage Simulation (Deck Editor)**
    *   **Dynamic Blind Spots**: Define physical obstructions on the ship (e.g., "Main Funnel" at 170°-190°).
    *   **Real-time Alerting**: The system calculates if the satellite vector passes through a defined blockage zone and alerts the user to change heading.
    *   **Customizable Deck**: Users can add, edit, or remove obstruction zones via the "Compass Deck Configuration" panel.

### 🛠️ Tech Stack

*   **Frontend**: React 19, TypeScript
*   **3D Graphics**: Three.js (via raw integration)
*   **Styling**: Tailwind CSS
*   **Math**: Custom orbital trigonometry utils

### 📦 Installation

```bash
git clone https://github.com/yourusername/maritime-satlink-simulator.git
cd maritime-satlink-simulator
npm install
npm start
```

### 🙏 Special Thanks

We extend our sincere gratitude to the technical support teams at **Intelsat** and **APSAT** for their invaluable guidance on orbital parameters and interference mitigation protocols.

---

<a name="chinese"></a>
## 🇨🇳 中文说明 (Chinese Description)

**Maritime SatLink Simulator (杰泰海科 Sealink)** 是一个专为海事专业人员设计的交互式 Web 工具，用于模拟和可视化船舶上的 GEO 卫星宽带连接。

该应用不仅能计算实时的对星角度，还能根据船舶的位置和航向，模拟船体结构（桅杆、起重机、烟囱）造成的信号遮挡。

### 🚀 核心功能

1.  **轨道力学引擎**
    *   实时计算真方位角 (Azimuth)、仰角 (Elevation) 和距离。
    *   **干扰保护逻辑**：当仰角低于 5° 时，系统会自动提示“无视距/停止发射”，以模拟防止对临近卫星产生干扰的合规要求。

2.  **交互式可视化**
    *   **3D 地球**：基于 Three.js，支持拖拽、缩放和点击定位，直观展示船星连线。
    *   **船舶雷达图**：俯视图展示卫星相对于船头的相对方位。

3.  **遮挡模拟 (甲板编辑器)**
    *   **动态盲区**：用户可以定义船上的物理遮挡物（例如：170°-190° 的主烟囱）。
    *   **实时报警**：如果卫星信号路径穿过定义的遮挡区域，系统会立即报警并建议改变航向。
    *   **自定义配置**：通过“罗经甲板配置”面板，用户可以自由添加或删除遮挡物。

### 🛠️ 技术栈

*   **前端框架**: React 19, TypeScript
*   **3D 引擎**: Three.js
*   **样式库**: Tailwind CSS
*   **核心算法**: 自研球面三角学计算库

### 📦 安装与运行

```bash
# 下载代码
git clone https://github.com/yourusername/maritime-satlink-simulator.git
cd maritime-satlink-simulator

# 安装依赖
npm install

# 启动本地服务
npm start
```

### 🙏 致谢 (Acknowledgements)

特别致敬并感谢 **Intelsat (国际通信卫星组织)** 和 **APSAT (亚太卫星)** 的技术支持团队。感谢他们在卫星轨道参数校准及抗干扰协议方面提供的专业指导和数据支持。

---

![License](https://img.shields.io/badge/license-MIT-blue.svg)
