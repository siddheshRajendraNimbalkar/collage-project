package util

import "github.com/spf13/viper"

type Config struct {
	DBDriver              string `mapstructure:"DBDRIVE"`
	DBSource              string `mapstructure:"DBSOURCE"`
	Addr                  string `mapstructure:"ADDR"`
	SecretKey             string `mapstructure:"SECRET_KEY"`
	REFRESHTOKENEXPIRESIN string `mapstructure:"REFRESH_TOKEN_EXPIRES_IN"`
	ACCESSTOKENEXPIRESIN  string `mapstructure:"ACCESS_TOKEN_EXPIRES_IN"`
	APIADDR               string `mapstructure:"APIADDR"`
}

func LoadConfig(path string) (config Config, err error) {
	viper.AddConfigPath(path)
	viper.SetConfigName("app")
	viper.SetConfigType("env")

	viper.AutomaticEnv()

	err = viper.ReadInConfig()

	if err != nil {
		return
	}

	err = viper.Unmarshal(&config)
	return
}
