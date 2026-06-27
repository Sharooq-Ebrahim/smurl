package kafka

import (
	"log"
	"smurl/internal/config"

	"github.com/segmentio/kafka-go"
)

func PingKafka(cfg *config.Config) error {

	conn, err := kafka.Dial("tcp", cfg.KAFKA_BROKERS[0])
	if err != nil {
		return err
	}
	defer conn.Close()

	log.Println("Kafka connected")
	return nil
}
