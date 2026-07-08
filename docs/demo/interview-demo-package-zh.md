# Retention Agent Copilot 面试 Demo 中文讲稿

## 90 秒介绍

Retention Agent Copilot 是一个给电信 retention call centre agent 使用的辅助工具。它可以读取 Rogers 类型的账单 PDF，提取客户服务、计划原价、折扣、手机供机、bundle 到期日、一次性费用、漫游费用等信息，然后把这些内容整理到一个简洁的工作界面里。

这个项目要解决的问题很直接：现在 agent 常常需要花 5 到 7 分钟打开不同系统、查账单、对比价格、确认 discount 和 device payment。这个过程慢，而且容易漏算费用。我的工具希望帮 agent 更快看懂“为什么账单变贵”，再决定下一步应该怎么跟客户解释或 retain。

这个产品不是自动卖 plan 的 bot。它是给真人 agent 使用的 Copilot：负责整理账单事实、提醒风险、根据通话内容给出话术建议，并在通话结束时生成可以复制到 Maestro 的 note。

## Demo 情境

可以用这个场景来演示：

> 客户打电话说账单突然变贵了，希望找便宜一点的方案。Agent 需要快速确认这次变贵是因为 promotion 到期、漫游/一次性费用、手机供机，还是 internet bundle 变化。

## 演示流程

1. 上传一份 Rogers 样本账单 PDF。
2. 先看顶部摘要卡：
   - Total due：本期总金额。
   - Estimated next bill：预计下一张账单。
   - Bill change explanation：为什么这张账单有变化。
   - Change flags：需要 agent 注意的风险点。
3. 看左边 bill breakdown 表格：
   - 服务类型和来源页码。
   - Plan tier / label。
   - Original plan price：计划原价。
   - Current monthly before tax：当前税前月费。
   - This bill total：这张账单这一条线实际收了多少。
   - Bill drivers：例如漫游、一次性费用、供机费。
   - Contract end：合约或供机结束时间。
4. 点击有 HUP / device financing 的号码。
5. 展示可收缩的手机供机详情：
   - 手机型号。
   - 每月供机费。
   - 供机税。
   - 当前供机余额。
   - Save & Return 金额和归还日期。
6. 在右边 Live Agent Assist 输入客户说的话，例如：
   - "My bill went up and I want something cheaper."
7. 展示右边 AI 辅助：
   - 当前通话阶段。
   - 建议回复。
   - follow-up question。
   - AI 理解到的重点。
   - Maestro note preview。
8. 点击 Generate Summary，说明这个 note 可以复制到 Maestro 里。

## 面试时可以这样讲

“这个项目来自我真实工作中的痛点。在 retention call 里面，agent 经常要打开多个系统、查几个月账单、对比 discount 和 device payment。真正麻烦的地方不只是慢，而是很容易算错。如果漏了供机费、漫游费、promotion expiry，客户会得到错误预期，下一个 agent 还要重新解释。”

“我把这个流程做成一个一屏式工具：左边是账单事实，右边是 transcript 和 AI assist。Agent 可以直接看到原价、当前税前月费、本期总额、discount、expiry date、contract end 和 bill driver，不需要在完整账单里上下翻。”

“为了安全，它不会自己承诺最终 offer。它只提醒 agent 哪些内容必须在官方系统里确认，然后再 quote。”

## 重点功能

- 上传 PDF 账单并本地分析。
- 提取 wireless 和 internet / bundle 服务。
- 显示 plan 原价和当前税前月费。
- 显示 discount 明细和 expiry date。
- 显示手机供机和 Save & Return 信息。
- 区分 regular monthly charge 和 one-time / roaming / device charge。
- 根据 live transcript 给 agent 话术建议。
- 根据 call flow 判断通话阶段。
- 生成可复制的 Maestro note。
- 有测试用例和验证矩阵。

## 技术说明

- Frontend：单页 HTML / JavaScript demo。
- Backend：本地 Python server，用于 PDF 分析和本地音频测试流程。
- Parser：Rogers bill parser，可以提取 wireless、bundle、discount、financing 和 bill driver。
- AI assist：目前是 deterministic logic，适合 demo 和安全验证，不会胡乱生成价格。
- Tests：包含 unit tests、parser tests、PDF analyzer tests 和 end-to-end checks。

## 安全说明

这个 demo 使用样本或脱敏数据。正式上线时，不能随便保存客户 PII，需要连接官方系统 API、做权限控制、记录 source evidence，并要求 agent 在正式报价前验证 eligibility。

