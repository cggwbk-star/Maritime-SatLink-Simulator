# Maritime SatLink Simulator (杰泰海科 Sealink)

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19-61DAFB.svg?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6.svg?logo=typescript)
![Three.js](https://img.shields.io/badge/Three.js-3D-black.svg?logo=three.js)

An interactive web-based simulation tool designed for maritime professionals to visualize and analyze GEO (Geostationary Orbit) satellite broadband connectivity on vessels.

This application calculates real-time look angles, visualizes line-of-sight (LOS) scenarios, and simulates signal blockages caused by shipboard structures (masts, cranes, funnels) based on the vessel's location and heading.

[**访问中文版说明 / View Chinese Readme**](#中文说明)

---

## 🚀 Features

### 1. Orbital Mechanics Engine
- **Real-time Look Angle Calculation**: Instantly computes True Azimuth, Elevation, and Range to any GEO satellite based on ship GPS coordinates.
- **Interference Protection Logic**: Automatically flags "No Line of Sight" when elevation drops below 5° to simulate mandatory transmission cut-offs (preventing off-axis interference).

### 2. Interactive Visualization
- **3D Globe (Three.js)**: Drag, zoom, and click on a 3D Earth model to position the ship. Visualizes the direct line of sight to the satellite.
- **Ship Radar (Polar Plot)**: A top-down relative view showing where the satellite sits relative to the ship's bow.

### 3. Blockage Simulation (Deck Editor)
- **Dynamic Blind Spots**: Define physical obstructions on the ship (e.g., "Main Funnel" at 170°-190°).
- **Real-time Alerting**: The system calculates if the satellite vector passes through a defined blockage zone and alerts the user to change heading.
- **Customizable Deck**: Users can add, edit, or remove obstruction zones via the "Compass Deck Configuration" panel.

### 4. Professional & Offline-Ready
- **Zero-Dependency Calculation**: All math is performed client-side. The app works entirely offline (internet connection not required after loading).
- **Bilingual UI**: One-click toggle between **English** and **Chinese (中文)**.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript
- **3D Graphics**: Three.js (via raw integration)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Math**: Custom orbital trigonometry utils

---

## 📦 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/maritime-satlink-simulator.git
   cd maritime-satlink-simulator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm start
   ```
   Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

---

## 📐 Scientific Basis

The simulator uses spherical trigonometry to derive look angles:

1.  **Elevation ($\theta$)**: Calculated using the Law of Cosines on the spherical triangle between the Ship, the Sub-Satellite Point, and the North Pole.
2.  **Azimuth ($\alpha$)**: Derived to determine the compass direction.
3.  **Relative Azimuth**: Calculated as `(True Azimuth - Ship Heading) % 360` to map the satellite onto the ship's local reference frame.

*Note: The Earth is modeled as a sphere ($R = 6371km$) for this simulation, which is sufficient for antenna look-angle estimation.*

---

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

---

<a name="中文说明"></a>
# 中文说明 (Chinese Readme)

**Maritime SatLink Simulator** 是一个专为海事专业人员设计的交互式 Web 工具，用于模拟和可视化船舶上的 GEO 卫星宽带连接。

该应用不仅能计算实时的对星角度，还能根据船舶的位置和航向，模拟船体结构（桅杆、起重机、烟囱）造成的信号遮挡。

## 核心功能

1.  **轨道力学引擎**：
    *   实时计算真方位角 (Azimuth)、仰角 (Elevation) 和距离。
    *   **干扰保护逻辑**：当仰角低于 5° 时，系统会自动提示“无视距/停止发射”，以模拟防止对临近卫星产生干扰的合规要求。

2.  **交互式可视化**：
    *   **3D 地球**：基于 Three.js，支持拖拽、缩放和点击定位，直观展示船星连线。
    *   **船舶雷达图**：俯视图展示卫星相对于船头的相对方位。

3.  **遮挡模拟 (甲板编辑器)**：
    *   **动态盲区**：用户可以定义船上的物理遮挡物（例如：170°-190° 的主烟囱）。
    *   **实时报警**：如果卫星信号路径穿过定义的遮挡区域，系统会立即报警并建议改变航向。

4.  **离线可用**：
    *   所有计算均在前端完成，无需后端 API 支持，适合在网络不稳定的海上环境使用。
    *   支持中英文一键切换。

## 启动项目

```bash
# 安装依赖
npm install

# 启动本地服务
npm start
```
