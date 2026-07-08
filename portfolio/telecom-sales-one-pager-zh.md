# Retention Agent Copilot 电信销售说明

## 买方痛点

Retention agent 在处理账单变贵、promotion 到期、HUP、bundle 变动时，经常需要手动打开多个系统，查看账单、discount、device financing、internet bundle、expiry date 和通话内容。

常见问题包括：

- Agent 报价时漏算 add-on、device payment、tax、roaming 或 one-time charge。
- Promotion expiry 和 bundle end date 被忽略。
- 漫游费或一次性费用被误认为长期月费。
- 新 agent 需要更长时间理解账户。
- Call note 不一致，后续 agent 很难接手。

## 产品承诺

Retention Agent Copilot 提供一个有来源依据的 billing + conversation workspace，帮助 agent 更快解释账单、识别 retention risk，并生成更清晰一致的 call note。

## 为什么电信公司会感兴趣

- 降低 average handle time，因为 agent 不需要花太久查账单。
- 提升 first-call resolution，因为账单变动原因更清楚。
- 减少错误 quote 导致的 escalation 和二次解释。
- 帮助新人 agent 更快上手。
- 通过 "verify before quote" 机制降低 compliance risk。
- 让 call summary 更结构化，方便 QA 和 supervisor review。

## 核心模块

- Bill Intelligence：解析 PDF 或系统账单数据，显示原价、当前税前月费、税后总额、discount、expiry date、add-on、device payment 和 contract end。
- Change Explanation：用简短语言解释账单为什么变化，例如 promotion expiry、HUP、roaming、one-time charge 或 bundle 变化。
- Agent Assist：根据 live transcript 提供建议回复、follow-up question、call stage 和安全提醒。
- Maestro Note Generator：生成可复制到 Maestro 的结构化 note，包含计划变化、价格变化和验证提醒。
- Audit Layer：显示 source page、missing field warning 和 "verify before quote" guardrail。

## 建议试点方案

可以先做一个 4 周 pilot：

- 第 1 周：导入样本账单，验证解析准确率。
- 第 2 周：让 agent 做 side-by-side workflow test。
- 第 3 周：衡量平均通话处理时间、报价准确率、note 质量和 agent 反馈。
- 第 4 周：优化 eligibility 逻辑，准备生产系统集成方案。

## 可衡量指标

- 每通 billing investigation 节省多少分钟。
- 有多少 call 能完整解释价格变化。
- 错误 quote / escalation 是否减少。
- Agent confidence score。
- Supervisor 对 call note 的 QA score。

## 销售定位

这个产品最好定位成 agent copilot，而不是 autonomous sales bot。最终 offer 和 eligibility 仍然由 agent 在官方系统里确认。这个定位更安全，也更容易被 telecom operations 和 compliance team 接受。

## 后续扩展路线

- Maestro / CRM connector。
- Offer eligibility API connector。
- Real-time call transcription。
- Supervisor QA dashboard。
- PII redaction 和隐私保护。
- 多品牌电信账单 parser。
- 根据 call type 和 agent tenure 做 A/B testing。

