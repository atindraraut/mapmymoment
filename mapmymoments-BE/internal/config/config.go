package config

import (
	"flag"
	"log"
	"os"

	"github.com/ilyakaznacheev/cleanenv"
)

type HTTPServer struct {
	ADDR string `yaml:"address" env:"ADDR" env-default:"localhost:8080"`
}
type Config struct {
	Env           string `yaml:"env" env:"ENV" env-required:"true"` //these are called struct tags in golang
	Storagepath   string `yaml:"storage_path" env-required:"true"`
	HTTPServer    `yaml:"http_address" env-required:"true"`
	SECRET_KEY    string `yaml:"secret_key" env-required:"true"`
	MongoURI      string `yaml:"mongo_uri" env-required:"true"`
	MongoDatabase string `yaml:"mongo_db" env-required:"true"`
}

func MustLoadConfig() *Config {
	var configPath string

	configPath = os.Getenv("CONFIG_PATH")

	if configPath == "" {
		flags := flag.String("config", "", "path to the config file")
		flag.Parse()
		configPath = *flags

		if configPath == "" {
			{
				log.Fatal("config path is not set")
			}
		}

	}

	if _, err := os.Stat(configPath); os.IsNotExist(err) {
		log.Fatalf("config file does not exist: %s", configPath)
	}

	var cfg Config

	err := cleanenv.ReadConfig(configPath, &cfg)
	if err != nil {
		log.Fatalf("failed to read config file: %s", err.Error())
	}

	return &cfg
}
