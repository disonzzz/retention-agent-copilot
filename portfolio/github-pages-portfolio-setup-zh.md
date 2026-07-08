# GitHub Pages Portfolio 发布说明

## 推荐展示方式

这个项目建议拆成两层展示：

1. GitHub Pages 静态 demo：展示产品界面、样本账单效果和 Agent Assist workflow。
2. GitHub repo 源码：展示完整工程能力，包括 PDF parser、local server、audio test workflow、测试用例和验证矩阵。

## 为什么这样拆

GitHub Pages 适合发布 HTML、CSS、JavaScript 静态页面。它不能直接运行本地 Python server，所以公开网页版本适合展示产品效果，但不能完整运行 PDF 上传解析后端。

完整 PDF 上传分析应该在本地运行：

```bash
cd app
python scripts/server.py
```

然后打开：

```text
http://127.0.0.1:8765/
```

## 可以公开上传的内容

可以公开：

- `app/dist/` 静态 demo。
- `app/src/` 前端和 parser 代码。
- `portfolio/` 公开项目介绍和销售说明。
- 自动化测试文件。
- README。

不要公开：

- 真实客户账单 PDF。
- 未脱敏的 OCR / extracted text。
- 真实电话号码、account number、bill number、bank payment ID。
- 真实客户地址。
- 真实通话录音或 transcript。

## GitHub Pages 设置思路

推荐做法：

1. 把项目推到 GitHub。
2. 确认 `app/dist` 里的静态 demo 已经用 synthetic data 构建。
3. 在 GitHub repo 的 Settings -> Pages 中设置发布来源。
4. 如果使用 GitHub Actions，可以让 workflow build 后发布 `app/dist`。
5. README 中说明：
   - Online demo uses synthetic data.
   - PDF upload requires local server.
   - Real customer data must be redacted.

## 对外解释方式

为了隐私，在线 demo 的账号、电话号码、账单号都已经替换成 synthetic data。公开网页只展示产品 workflow；真实 PDF 解析能力保留在本地 server 和测试里展示。这样既能保护客户信息，也能让别人看到完整产品思路。

