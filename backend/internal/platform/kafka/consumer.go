package kafka

import (
	"time"

	"github.com/segmentio/kafka-go"
)

func NewConsumer(broker []string, topic string, groupID string) *kafka.Reader {

	reader := kafka.NewReader(kafka.ReaderConfig{
		Brokers:        broker,
		Topic:          topic,
		GroupID:        groupID,
		MinBytes:       10e3,
		MaxBytes:       10e6,
		MaxWait:        1 * time.Second,
		CommitInterval: 0,
		StartOffset:    kafka.LastOffset,
	})

	return reader

}
