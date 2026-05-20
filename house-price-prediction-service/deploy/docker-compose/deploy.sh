#!/bin/sh

set -e

# 环境变量（可选）：
#   IMAGE              必填，流水线注入的完整镜像名
#   DEPLOY_WORKDIR     检出目录，默认 /opt/house-price-prediction-service
#   GIT_BRANCH         同步分支；未设置时优先 origin 默认分支，否则 main（更新时 reset --hard 对齐远端，不保留本地提交）
#   COMPOSE_PROJECT_NAME  docker compose -p 项目名，默认 house-price-prediction-service

# ==============================
# 基础配置
# ==============================
GIT_REPO="git@codeup.aliyun.com:6a04164bad0a337b92d9ef0c/predict-backend-service.git"
# 代码与 compose 所在目录（稀疏检出后仅含 deploy/ 等已配置路径）
REPO_ROOT="${DEPLOY_WORKDIR:-/opt/house-price-prediction-service}"
COMPOSE_FILE="${REPO_ROOT}/deploy/docker-compose/docker-compose.yml"
CONTAINER_NAME="house-price-prediction-service"
# 旧版容器名；若存在则先停止并删除（迁移自 predict-backend-service）
LEGACY_CONTAINER_NAME="predict-backend-service"
COMPOSE_PROJECT="${COMPOSE_PROJECT_NAME:-house-price-prediction-service}"

echo "======================================"
echo "开始部署（Compose）"
echo "镜像: ${IMAGE}"
echo "代码目录: ${REPO_ROOT}"
echo "Compose: ${COMPOSE_FILE}"
echo "======================================"

if [ -z "${IMAGE}" ]; then
  echo "错误：未设置 IMAGE（流水线应注入完整镜像名，例如 registry/namespace/repo:tag）"
  exit 1
fi

# ==============================
# 检查 Docker
# ==============================
if ! command -v docker >/dev/null 2>&1; then
  echo "错误：Docker 未安装"
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "错误：未安装 Docker Compose 插件（docker compose）"
  exit 1
fi

# ==============================
# 1. 拉取 deploy 相关代码（Git 稀疏检出）
# ==============================
echo ""
echo "1. 同步 deploy 配置（sparse checkout: deploy）..."

mkdir -p "${REPO_ROOT}"

if [ ! -d "${REPO_ROOT}/.git" ]; then
  if [ -n "$(ls -A "${REPO_ROOT}" 2>/dev/null)" ]; then
    echo "错误：${REPO_ROOT} 已存在且非空，无法首次 git clone。请清空该目录或设置 DEPLOY_WORKDIR 指向新路径。"
    exit 1
  fi
  echo "首次克隆仓库（仅检出 deploy 目录）..."
  git clone --depth 1 --filter=blob:none --sparse "${GIT_REPO}" "${REPO_ROOT}"
  (cd "${REPO_ROOT}" && git sparse-checkout set deploy)
else
  echo "更新已有仓库..."
  cd "${REPO_ROOT}"
  git remote set-url origin "${GIT_REPO}" 2>/dev/null || git remote add origin "${GIT_REPO}"
  if ! git sparse-checkout list >/dev/null 2>&1; then
    git sparse-checkout init --cone
  fi
  git sparse-checkout set deploy
  git fetch origin --depth 1
  SYNC_BRANCH="${GIT_BRANCH:-}"
  if [ -z "${SYNC_BRANCH}" ]; then
    SYNC_BRANCH="$(git symbolic-ref -q --short refs/remotes/origin/HEAD 2>/dev/null | sed 's|^origin/||')"
  fi
  if [ -z "${SYNC_BRANCH}" ]; then
    SYNC_BRANCH="main"
  fi
  git checkout "${SYNC_BRANCH}"
  # 部署目录以远端为准；丢弃本地多余提交（例如远端 force push 后与 ff-only pull 冲突）
  git reset --hard "origin/${SYNC_BRANCH}"
fi

if [ ! -f "${COMPOSE_FILE}" ]; then
  echo "错误：未找到 ${COMPOSE_FILE}，请确认稀疏检出包含 deploy 且路径正确"
  exit 1
fi

# ==============================
# 查看当前运行版本（Compose）
# ==============================
echo ""
echo "2. 检查当前 Compose 服务..."
docker compose -p "${COMPOSE_PROJECT}" -f "${COMPOSE_FILE}" ps 2>/dev/null || true

# ==============================
# 登录镜像仓库
# ==============================
echo ""
echo "3. 登录镜像仓库..."

if [ -z "${DOCKER_USERNAME}" ] || [ -z "${DOCKER_PASSWORD}" ]; then
  echo "错误：DOCKER_USERNAME 或 DOCKER_PASSWORD 未设置"
  exit 1
fi

echo "${DOCKER_PASSWORD}" | docker login \
  --username "${DOCKER_USERNAME}" \
  --password-stdin crpi-w9osq47ototoq3xh.cn-chengdu.personal.cr.aliyuncs.com

# ==============================
# 兼容旧版 docker run 单容器
# ==============================
if docker ps -a --format '{{.Names}}' | grep -w "${LEGACY_CONTAINER_NAME}" >/dev/null 2>&1; then
  echo ""
  echo "4. 清理旧版独立容器 ${LEGACY_CONTAINER_NAME}..."
  docker stop "${LEGACY_CONTAINER_NAME}" || true
  docker rm "${LEGACY_CONTAINER_NAME}" || true
fi

# ==============================
# 拉取镜像并启动（Compose）
# ==============================
echo ""
echo "5. 拉取镜像并启动 Compose 服务..."
export IMAGE

cd "${REPO_ROOT}"
docker compose -p "${COMPOSE_PROJECT}" -f "${COMPOSE_FILE}" pull
docker compose -p "${COMPOSE_PROJECT}" -f "${COMPOSE_FILE}" up -d --no-build --remove-orphans

# ==============================
# 输出结果
# ==============================
echo ""
echo "6. 部署完成，当前服务："
docker compose -p "${COMPOSE_PROJECT}" -f "${COMPOSE_FILE}" ps

echo ""
echo "7. 当前 ${CONTAINER_NAME} 镜像："
docker inspect --format='{{.Config.Image}}' "${CONTAINER_NAME}" 2>/dev/null || echo "（未找到名为 ${CONTAINER_NAME} 的容器，请检查 compose 中的 container_name）"

echo ""
echo "部署成功。"
