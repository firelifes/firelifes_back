# 【fire生活家】记账页面 - 实现计划

## [x] Task 1: 页面布局与UI搭建
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 搭建记账页面的整体布局结构
  - 实现顶部选项卡（支出/收入/取消）
  - 实现分类图标展示区域
  - 实现金额显示区和数字键盘区域
- **Acceptance Criteria Addressed**: AC-1, AC-2, AC-3
- **Test Requirements**:
  - `programmatic` TR-1.1: 页面布局正确，各区域显示正常
  - `programmatic` TR-1.2: 选项卡切换功能正常
  - `human-judgement` TR-1.3: UI布局美观，符合鲨鱼记账风格

## [x] Task 2: 分类图标数据与选择功能
- **Priority**: P0
- **Depends On**: Task 1
- **Description**: 
  - 定义支出和收入的分类数据（图标、名称）
  - 实现分类图标点击选中功能
  - 实现选中状态高亮效果
- **Acceptance Criteria Addressed**: AC-2
- **Test Requirements**:
  - `programmatic` TR-2.1: 支出分类显示28个（餐饮、购物、日用、交通等）
  - `programmatic` TR-2.2: 收入分类显示合理类别
  - `programmatic` TR-2.3: 点击分类图标后高亮显示
- **Notes**: 支出分类参考截图包含：餐饮、购物、日用、交通、零食、运动、娱乐、通讯、服饰、住房、居家、孩子、长辈、社交、旅行、数码、汽车、医疗、书籍、学习、礼金、礼物、办公、维修、捐赠、彩票、亲友、快递等

## [x] Task 3: 数字键盘与金额输入
- **Priority**: P0
- **Depends On**: Task 1
- **Description**: 
  - 实现自定义数字键盘组件
  - 支持数字输入（0-9）
  - 支持小数点输入（最多两位）
  - 支持删除功能
  - 实现金额实时显示
- **Acceptance Criteria Addressed**: AC-3
- **Test Requirements**:
  - `programmatic` TR-3.1: 点击数字键正确输入金额
  - `programmatic` TR-3.2: 小数点最多输入两位
  - `programmatic` TR-3.3: 删除键能正确删除数字
  - `programmatic` TR-3.4: 金额显示格式正确（X.XX）
- **Notes**: 键盘布局：第一行7、8、9、日期，第二行4、5、6、+，第三行1、2、3、-，第四行.、0、⌫、完成

## [x] Task 4: 备注输入功能
- **Priority**: P1
- **Depends On**: Task 1
- **Description**: 
  - 实现备注输入框
  - 支持点击激活输入
  - 支持placeholder提示
- **Acceptance Criteria Addressed**: AC-4
- **Test Requirements**:
  - `programmatic` TR-4.1: 点击备注框可以激活输入
  - `programmatic` TR-4.2: 输入的备注内容正确保存
- **Notes**: 备注为可选字段

## [x] Task 5: 日期选择功能
- **Priority**: P1
- **Depends On**: Task 1
- **Description**: 
  - 实现日期选择按钮（显示"今天"）
  - 实现日期选择器弹窗
  - 支持年/月/日滚轮选择
  - 支持取消和确定操作
- **Acceptance Criteria Addressed**: AC-5
- **Test Requirements**:
  - `programmatic` TR-5.1: 点击日期按钮弹出日期选择器
  - `programmatic` TR-5.2: 日期滚轮滚动正常
  - `programmatic` TR-5.3: 选择日期后正确保存

## [x] Task 6: 完成记账与数据提交
- **Priority**: P0
- **Depends On**: Task 2, Task 3
- **Description**: 
  - 实现"完成"按钮点击事件
  - 验证金额不为空
  - 验证分类已选择
  - 提交记账数据到后端
  - 成功后返回上一级页面
- **Acceptance Criteria Addressed**: AC-6
- **Test Requirements**:
  - `programmatic` TR-6.1: 金额为空时完成按钮不可点击
  - `programmatic` TR-6.2: 分类未选择时完成按钮不可点击
  - `programmatic` TR-6.3: 数据提交成功后返回上一级
- **Notes**: 需要调用后端接口保存记账记录
