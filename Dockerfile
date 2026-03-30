# Imagem para AWS Lambda (container): base oficial + deps via pip (sem `uv run` em runtime).
# Compose local: use Dockerfile.dev (ver docker-compose.yml).
FROM public.ecr.aws/lambda/python:3.12

RUN pip install --no-cache-dir uv

COPY pyproject.toml uv.lock ./
RUN uv export --frozen --no-dev --no-editable -o requirements.txt && \
    pip install --no-cache-dir -r requirements.txt

COPY app/ ./app/
COPY lambda_handler.py .

CMD ["lambda_handler.handler"]
