package kafka

import (
	"log"
	"time"

	"github.com/segmentio/kafka-go"
)

func NewProducer(broker []string, topic string) *kafka.Writer {

	writer := &kafka.Writer{
		Addr:         kafka.TCP(broker...),
		Topic:        topic,
		Balancer:     &kafka.LeastBytes{},
		MaxAttempts:  5,
		RequiredAcks: kafka.RequireAll,
		BatchSize:    100,
		BatchTimeout: 10 * time.Millisecond,
		Async:        true,
		Completion: func(messages []kafka.Message, err error) {
			if err != nil {
				log.Printf("failed to write %d messages to kafka: %v", len(messages), err)
			}
		},
	}

	return writer
}
