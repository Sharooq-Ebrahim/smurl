
FROM golang:1.24-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o server ./cmd/api


FROM alpine:3.19

WORKDIR /app

COPY --from=builder /app/server .

RUN adduser -D -g '' appuser
USER appuser

EXPOSE 8080

CMD ["./server"]
