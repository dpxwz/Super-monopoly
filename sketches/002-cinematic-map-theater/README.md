## Variant: Cinematic Map Theater

### Design stance
地图优先的沉浸式桌游视角。左/右信息像 HUD 浮层，中心事件 log 更像战报。

### Key choices
- Layout: 左上存活玩家 / 现金，左下聊天室，中间 12×12 地图，中心区域承载事件 log，右侧顶部交易按钮，下方独立地产框，再下方独立合同框。
- Typography: 深色简约，低字重、紧字距，重要金额使用等宽数字便于扫读。
- Color: 黑灰表面 + 单一强调色；避免把棋盘做得太花，玩家色只用于头像和股份提示。
- Interaction: “交易”按钮打开 overlay；双击玩家头像或玩家行打开该玩家地产 / 合同 overlay；顶部可切换本地 / 联机预览右栏逻辑。

### Trade-offs
- Strong at: 让地图保持主视觉，同时把交易表单从首页移走。
- Weak at: 这里只是静态 HTML 草图，未接入真实 game state，也未处理所有移动端细节。

### Best for
- 用来决定整体信息架构与视觉密度，然后再迁移到现有 index.html / src/ui.js / src/styles.css。
