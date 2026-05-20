#!/bin/sh
# POSIX sh：流水线常用 `sh deploy.sh`，须避免 bash 专有语法（[[、数组、pipefail 等）
#
# 流程概览：
#   1. 校验必填环境变量（IMAGE / DOCKER_USERNAME / DOCKER_PASSWORD）
#   2. 检查 Docker 与 Compose 插件
#   3. 同步部署目录 deploy/（在 ROOT 内更新；或独立 workdir 稀疏检出）
#   4. 校验 nginx 所需 TLS 证书
#   5. 登录容器镜像仓库
#   6. docker compose pull && up -d
#   7. 输出当前服务状态与镜像
#
# 必填环境变量：
#   IMAGE                — 完整镜像名（流水线注入，例如 registry/namespace/repo:tag）；compose 中 ${IMAGE} 占位
#   DOCKER_USERNAME      — 容器镜像仓库登录用户名
#   DOCKER_PASSWORD      — 容器镜像仓库登录密码
#
# 可选环境变量：
#   DEPLOY_WORKDIR       — 独立稀疏检出目录（绝对路径；当脚本被单独投放到服务器、不在仓库内时使用），
#                          默认 /opt/house-price-prediction-web（首次会 rm -rf 该目录后重新克隆）
#   BRANCH               — 同步分支；未设置时优先 origin 默认分支，否则回退到 main
#   GIT_REMOTE           — git 远端名，默认 origin
#   REPO_URL             — git 仓库地址，默认指向 codeup 仓库
#   COMPOSE_PROJECT_NAME — docker compose -p 项目名，默认 house-price-prediction-web
#   DEPLOY_TLS_AUTO_DEV  — 设为 1 时，若缺少 nginx 所需 pem/key，则在 deploy/certs/ 下自动生成自签名证书（仅内网/联调）

set -eu

# -----------------------------------------------------------------------------
# 参数与配置
# -----------------------------------------------------------------------------

if [ "$#" -gt 0 ]; then
  echo "[deploy] 错误: 本脚本不接受参数" >&2
  exit 1
fi

BRANCH="${BRANCH:-}"
GIT_REMOTE="${GIT_REMOTE:-origin}"
DEFAULT_REPO_URL='git@codeup.aliyun.com:6a04164bad0a337b92d9ef0c/house-price-prediction-web.git'
REPO_URL="${REPO_URL:-$DEFAULT_REPO_URL}"
COMPOSE_PROJECT="${COMPOSE_PROJECT_NAME:-house-price-prediction-web}"
REGISTRY_HOST='crpi-w9osq47ototoq3xh.cn-chengdu.personal.cr.aliyuncs.com'
DEFAULT_DEPLOY_WORKDIR='/opt/house-price-prediction-web'

# 仅当脚本位于 .../deploy/scripts/ 时，才把上两级目录认作仓库根；
# 若脚本被单独投放（例如流水线只把 deploy.sh 下发到 /root），ROOT 置空，强制走独立 workdir 模式，
# 避免 "$ROOT/.deploy-git-checkout" 退化成 "//.deploy-git-checkout" 之类的怪路径。
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
case "$SCRIPT_DIR" in
  */deploy/scripts)
    ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
    ;;
  *)
    ROOT=""
    ;;
esac

# COMPOSE_FILE / ENV_FILE 由 sync_code_deploy_only 在确认源目录后赋值，避免提前用错路径
COMPOSE_FILE=""
ENV_FILE=""

# -----------------------------------------------------------------------------
# 日志（统一前缀，阶段用分隔线便于在 CI 日志中扫描）
# -----------------------------------------------------------------------------

log() {
  printf '[deploy] %s\n' "$*"
}

die() {
  printf '[deploy] 错误: %s\n' "$*" >&2
  exit 1
}

# 大阶段标题：前后空行 + 横线，便于肉眼与 grep 定位
phase() {
  printf '\n'
  printf '%s\n' "========================================"
  printf '[deploy] >> %s\n' "$*"
  printf '%s\n' "========================================"
}

# 子步骤：缩进感，不画满宽横线
step() {
  printf '[deploy]   - %s\n' "$*"
}

# -----------------------------------------------------------------------------
# 必填环境变量校验（提前失败，避免后续步骤白做）
# -----------------------------------------------------------------------------

require_env() {
  [ -n "${IMAGE:-}" ] || \
    die "未设置 IMAGE，流水线应注入完整镜像名（例如 ${REGISTRY_HOST}/<namespace>/<repo>:<tag>）"
  [ -n "${DOCKER_USERNAME:-}" ] && [ -n "${DOCKER_PASSWORD:-}" ] || \
    die "请设置 DOCKER_USERNAME 与 DOCKER_PASSWORD（用于 docker login）"
}

print_banner() {
  printf '%s\n' "======================================================"
  printf '[deploy] 开始部署（Docker Compose）\n'
  printf '[deploy]   镜像        : %s\n' "$IMAGE"
  printf '[deploy]   Compose 项目: %s\n' "$COMPOSE_PROJECT"
  printf '[deploy]   分支        : %s\n' "${BRANCH:-<auto: origin/HEAD>}"
  if [ -n "$ROOT" ]; then
    printf '[deploy]   仓库根 ROOT : %s\n' "$ROOT"
  else
    printf '[deploy]   仓库根 ROOT : <none, 走独立 workdir 模式>\n'
    printf '[deploy]   Workdir     : %s\n' "${DEPLOY_WORKDIR:-$DEFAULT_DEPLOY_WORKDIR}"
  fi
  printf '%s\n' "======================================================"
}

# -----------------------------------------------------------------------------
# Docker
# -----------------------------------------------------------------------------

check_docker() {
  phase "检查 Docker 环境"
  step "确认 docker / compose 可用"
  command -v docker >/dev/null 2>&1 || die "未找到 docker"
  docker info >/dev/null 2>&1 || die "Docker 不可用（daemon 未启动或无权限）"
  docker compose version >/dev/null 2>&1 || die "需要 docker compose 插件（v2）"
  log "Docker 与 Compose 已就绪"
}

# -----------------------------------------------------------------------------
# Git：仅同步 deploy/
# -----------------------------------------------------------------------------

# 解析待同步分支：优先 $BRANCH；否则尝试 origin/HEAD；最后回退 main
resolve_branch() {
  work="$1"
  if [ -n "$BRANCH" ]; then
    printf '%s\n' "$BRANCH"
    return
  fi
  detected=""
  if [ -n "$work" ] && [ -d "$work/.git" ]; then
    detected="$(cd "$work" && \
      git symbolic-ref -q --short "refs/remotes/$GIT_REMOTE/HEAD" 2>/dev/null \
      | sed "s|^$GIT_REMOTE/||")"
  fi
  if [ -z "$detected" ]; then
    detected="main"
  fi
  printf '%s\n' "$detected"
}

# 克隆到独立工作目录，避免要求整个 ROOT 为空（git clone 要求目标目录不存在或为空）
git_clone_sparse_into() {
  work="$1"
  case "$work" in
  / | "") die "不安全的克隆路径: $work" ;;
  esac
  [ "$work" != "$ROOT" ] || die "不能克隆到 ROOT 本身，请使用子目录（默认 DEPLOY_WORKDIR）"
  # --branch 必须给具体名字，无法借助远端 HEAD 探测；BRANCH 未设置时回退 main
  clone_branch="${BRANCH:-main}"
  step "首次克隆（仅 deploy/, 分支=$clone_branch）→ $work"
  rm -rf "$work"
  if git clone -h 2>&1 | grep -q '[[:space:]]--filter[[:space:]]'; then
    git clone --branch "$clone_branch" --single-branch \
      --filter=blob:none --sparse "$REPO_URL" "$work"
  else
    git clone --branch "$clone_branch" --single-branch \
      --sparse "$REPO_URL" "$work"
  fi
  (
    cd "$work"
    git sparse-checkout init --cone
    git sparse-checkout set deploy
  )
  log "克隆与 sparse-checkout 完成"
}

# 独立 workdir 同步：以远端为准、reset --hard 对齐（不保留本地提交/改动）
git_update_workdir() {
  work="$1"
  sync_branch="$(resolve_branch "$work")"
  step "同步 $GIT_REMOTE/$sync_branch（reset --hard）→ $work"
  (
    cd "$work"
    git rev-parse --git-dir >/dev/null 2>&1 || die "不是有效的 git 仓库: $work"
    git remote set-url "$GIT_REMOTE" "$REPO_URL" 2>/dev/null \
      || git remote add "$GIT_REMOTE" "$REPO_URL"
    if ! git sparse-checkout list >/dev/null 2>&1; then
      git sparse-checkout init --cone
    fi
    git sparse-checkout set deploy
    git fetch "$GIT_REMOTE" --depth 1 "$sync_branch"
    if ! git checkout "$sync_branch" 2>/dev/null; then
      git checkout -B "$sync_branch" "$GIT_REMOTE/$sync_branch"
    fi
    git reset --hard "$GIT_REMOTE/$sync_branch"
  )
  log "已对齐远端 deploy/"
}

# ROOT 内同步：只更新 deploy/ 子树，避免破坏开发者本地其他改动
git_update_inplace_deploy_only() {
  work="$1"
  sync_branch="$(resolve_branch "$work")"
  step "仅更新 deploy/ 子树（$GIT_REMOTE/$sync_branch）→ $work"
  (
    cd "$work"
    git rev-parse --git-dir >/dev/null 2>&1 || die "不是有效的 git 仓库: $work"
    git fetch "$GIT_REMOTE" "$sync_branch"
    git checkout "$GIT_REMOTE/$sync_branch" -- deploy/
  )
  log "已更新 deploy/ 目录（未触碰其他文件）"
}

sync_code_deploy_only() {
  phase "同步部署目录 deploy/"

  # 模式 A：脚本所在 ROOT 是完整仓库（含 .git 与 deploy/）— 开发者本机或 CI 全量 checkout
  if [ -n "$ROOT" ] && [ -d "$ROOT/.git" ] && [ -f "$ROOT/deploy/docker-compose.yml" ]; then
    COMPOSE_FILE="$ROOT/deploy/docker-compose.yml"
    ENV_FILE="$ROOT/deploy/.env"
    step "检测到 ROOT 是仓库根，使用文件级 checkout（保留其他改动）"
    git_update_inplace_deploy_only "$ROOT"
    return
  fi

  # 模式 B：ROOT 非 git 仓库但已带 compose 制品（例如 CI 把 deploy/ 当制品下发）
  if [ -n "$ROOT" ] && [ -f "$ROOT/deploy/docker-compose.yml" ]; then
    COMPOSE_FILE="$ROOT/deploy/docker-compose.yml"
    ENV_FILE="$ROOT/deploy/.env"
    step "未检测到 .git，但已存在 $COMPOSE_FILE，跳过 git（使用当前目录制品）"
    return
  fi

  # 模式 C：独立 workdir — 脚本被单独投放，clone/同步到固定路径
  GIT_WORK="${DEPLOY_WORKDIR:-$DEFAULT_DEPLOY_WORKDIR}"
  # 必须绝对路径，且不能是根目录，避免误删 / 误克隆到危险位置
  case "$GIT_WORK" in
    /) die "DEPLOY_WORKDIR 不能是 /" ;;
    /*) : ;;
    *) die "DEPLOY_WORKDIR 必须是绝对路径（当前: '$GIT_WORK'）" ;;
  esac

  if [ -d "$GIT_WORK/.git" ]; then
    step "使用已有稀疏检出目录: $GIT_WORK"
    git_update_workdir "$GIT_WORK"
  else
    step "创建稀疏检出目录: $GIT_WORK"
    git_clone_sparse_into "$GIT_WORK"
  fi
  COMPOSE_FILE="$GIT_WORK/deploy/docker-compose.yml"
  ENV_FILE="$GIT_WORK/deploy/.env"
}

# -----------------------------------------------------------------------------
# Compose 包装：统一注入 -p / -f / --env-file
# -----------------------------------------------------------------------------

compose() {
  if [ -f "$ENV_FILE" ]; then
    docker compose -p "$COMPOSE_PROJECT" -f "$COMPOSE_FILE" --env-file "$ENV_FILE" "$@"
  else
    docker compose -p "$COMPOSE_PROJECT" -f "$COMPOSE_FILE" "$@"
  fi
}

# -----------------------------------------------------------------------------
# TLS：与 nginx/20-https.conf 中文件名一致（证书勿提交 git）
# -----------------------------------------------------------------------------

ensure_tls_certs() {
  deploy_dir="$(dirname "$COMPOSE_FILE")"
  cert_dir="$deploy_dir/certs"
  pem="$cert_dir/house-price-prediction.com.cn.pem"
  key="$cert_dir/house-price-prediction.com.cn.key"

  if [ -f "$pem" ] && [ -f "$key" ]; then
    step "TLS 证书已存在: $cert_dir"
    return
  fi

  if [ "${DEPLOY_TLS_AUTO_DEV:-}" = "1" ]; then
    step "生成联调用自签名 TLS 证书（DEPLOY_TLS_AUTO_DEV=1）"
    command -v openssl >/dev/null 2>&1 || die "已设置 DEPLOY_TLS_AUTO_DEV=1 但未找到 openssl"
    step "写入: $pem 与 $key"
    mkdir -p "$cert_dir"
    openssl req -x509 -newkey rsa:2048 -sha256 -days 825 -nodes \
      -keyout "$key" -out "$pem" \
      -subj "/CN=house-price-prediction.com.cn" \
      || die "openssl 生成证书失败（见上方 openssl 输出）"
    chmod 600 "$key" 2>/dev/null || true
    log "自签名证书已生成（浏览器可能提示不受信任，生产环境请换正式证书）"
    return
  fi

  die "缺少 TLS 证书，nginx 将无法启动: 需要 $pem 与 $key。请将正式证书放入该目录（勿提交 git），或在内网/联调环境设置 DEPLOY_TLS_AUTO_DEV=1 后重新执行本脚本。"
}

# -----------------------------------------------------------------------------
# 主流程
# -----------------------------------------------------------------------------

main() {
  require_env
  print_banner
  check_docker
  sync_code_deploy_only

  phase "校验 compose 配置"
  [ -f "$COMPOSE_FILE" ] || die "未找到 $COMPOSE_FILE"
  step "compose 文件: $COMPOSE_FILE"
  if [ -f "$ENV_FILE" ]; then
    step "环境文件: $ENV_FILE"
  else
    step "未找到 $ENV_FILE，compose 将不使用 --env-file"
  fi

  phase "检查 TLS 证书（nginx HTTPS）"
  ensure_tls_certs

  phase "查看当前 Compose 服务"
  compose ps 2>/dev/null || true

  phase "登录容器镜像仓库"
  step "registry: $REGISTRY_HOST"
  printf '%s' "$DOCKER_PASSWORD" | docker login \
    --username "$DOCKER_USERNAME" \
    --password-stdin "$REGISTRY_HOST"
  log "镜像仓库登录成功"

  phase "拉取并启动容器"
  # IMAGE 通过 compose 文件中 ${IMAGE} 占位读取，必须 export 给子进程
  export IMAGE
  step "docker compose pull"
  compose pull
  step "docker compose up -d --no-build --remove-orphans"
  compose up -d --no-build --remove-orphans

  phase "部署完成"
  step "compose 项目: $COMPOSE_PROJECT"
  step "compose 文件: $COMPOSE_FILE"
  compose ps
  printf '\n'
  step "当前各服务镜像:"
  compose images 2>/dev/null || log "未能获取服务镜像信息"

  printf '\n'
  printf '%s\n' "========================================"
  log "部署成功"
  printf '%s\n' "========================================"
}

main
