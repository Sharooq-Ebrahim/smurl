package analytics

import (
	"context"
	"encoding/json"
	"errors"
	"log"

	"github.com/segmentio/kafka-go"
)

type ClickEvent struct {
	URLID     int64  `json:"url_id"`
	IP        string `json:"ip"`
	UserAgent string `json:"user_agent"`
}

type ConsumerWorker struct {
	reader  *kafka.Reader
	service Service
}

func NewConsumerWorker(reader *kafka.Reader, service Service) *ConsumerWorker {
	return &ConsumerWorker{
		reader:  reader,
		service: service,
	}
}

func (w *ConsumerWorker) Start(ctx context.Context) {
	go func() {
		log.Println("Analytics consumer worker started")
		for {
			msg, err := w.reader.FetchMessage(ctx)
			if err != nil {
				if errors.Is(err, context.Canceled) {
					break
				}
				log.Printf("Failed to fetch message or consumer closed: %v", err)
				break
			}

			var clickEvent ClickEvent
			if err := json.Unmarshal(msg.Value, &clickEvent); err != nil {
				log.Printf("Failed to unmarshal analytics event: %v", err)
			} else {
				if err := w.service.TrackClick(ctx, clickEvent.URLID, clickEvent.IP, clickEvent.UserAgent); err != nil {
					log.Printf("Failed to track click in consumer: %v", err)
				}
			}

			if err := w.reader.CommitMessages(ctx, msg); err != nil {
				log.Printf("Failed to commit offset for message %s: %v", string(msg.Key), err)
			}
		}
	}()
}
