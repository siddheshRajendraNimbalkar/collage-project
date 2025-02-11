.PHONY: 

postgres:
	docker run --name collage-backend -p 5432:5432 -e POSTGRES_USER=root -e POSTGRES_PASSWORD=password -d postgres

createdb:
	docker exec -it collage-backend createdb --username=root --owner=root  collage-project-backend

dropdb:
	docker exec -it collage-backend dropdb collage-project-backend

migrateup:
	migrate -path db/migrations -database "postgresql://root:password@localhost:5432/collage-project-backend?sslmode=disable" -verbose up

migratedown:
	migrate -path db/migrations -database "postgresql://root:password@localhost:5432/collage-project-backend?sslmode=disable" -verbose down
	
sqlc:
	sqlc generate

generateProto:
	rm -rf proto/*.pb.go
	protoc --proto_path=proto --go_out=pb --go_opt=paths=source_relative \
        --go-grpc_out=pb --go-grpc_opt=paths=source_relative \
        --grpc-gateway_out=pb --grpc-gateway_opt=paths=source_relative \
        proto/*.proto


evans:
	evans --host localhost --port 8080 --reflection repl