# Machine Learning Module

## 目录结构

```text
machine-learning/
├── artifacts/        # 训练输出 (model.joblib, metrics.json, metadata.json)
├── data/             # 本地训练数据目录 (不提交真实数据)
├── data_io.py        # 训练数据读取与模型落盘
├── pipeline.py       # 预处理与 baseline 管道
├── predict.py        # 批量预测脚本
└── train.py          # 训练入口脚本
```

## 快速开始

```bash
python3 machine-learning/train.py \
  --data-path machine-learning/data/house_prices.csv \
  --target-column price \
  --artifacts-dir machine-learning/artifacts
```

可选参数：
- `--drop-columns`：逗号分隔，训练前剔除列
- `--test-size`：测试集比例，默认 `0.15`
- `--val-size`：验证集比例，默认 `0.15`
- `--log-transform-target`：对目标值使用 `log1p` 训练

## 批量预测

```bash
python3 machine-learning/predict.py \
  --model-path machine-learning/artifacts/model.joblib \
  --input-path "machine-learning/data/Test Data For Prediction.csv" \
  --output-path machine-learning/artifacts/predictions.csv
```

可选参数：
- `--metadata-path`：指定 metadata 文件，不传则默认读取模型目录下的 `metadata.json`
- `--drop-columns`：预测前剔除列（例如输入包含 `id` 但训练时没用）
- `--prediction-column`：输出预测列名，默认 `predicted_price`
