FROM 8wxewmnzl14gzm6b6v-ghcr.xuanyuan.run/astral-sh/uv:0.11.11-python3.13-trixie
WORKDIR /ftm

ENV PYTHONUNBUFFERED=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy

RUN sed -i 's/deb.debian.org/mirrors.ustc.edu.cn/g' /etc/apt/sources.list.d/debian.sources \
    && sed -i 's|security.debian.org/debian-security|mirrors.ustc.edu.cn/debian-security|g' /etc/apt/sources.list.d/debian.sources

RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc python3-dev supervisor \
    && rm -rf /var/lib/apt/lists/*

# 仅复制元数据与锁文件，便于依赖层缓存；索引见 pyproject.toml 中 [[tool.uv.index]]
COPY pyproject.toml uv.lock ./

RUN uv sync --frozen --no-cache --no-default-groups --group server

ENV PATH="/ftm/.venv/bin:$PATH" \
    TZ="Asia/Shanghai"

COPY . .

RUN mkdir -p /var/log/fastapi_server \
    && mkdir -p /var/log/supervisor \
    && mkdir -p /etc/supervisor/conf.d \
    && mkdir -p /ftm/model-artifacts \
    && cp /ftm/deploy/supervisor.conf /etc/supervisor/supervisord.conf \
    && cp /ftm/deploy/fastapi_server.conf /etc/supervisor/conf.d/

EXPOSE 8001

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8001"]
