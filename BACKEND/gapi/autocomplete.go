package gapi

import (
	"context"

	"github.com/siddheshRajendraNimbalkar/collage-prject-backend/pb"
)

func (server *Server) AutocompleteSearch(ctx context.Context, req *pb.AutocompleteRequest) (*pb.AutocompleteResponse, error) {
	query := req.GetQuery()
	if len(query) < 1 {
		return &pb.AutocompleteResponse{Items: []*pb.ProductSuggestion{}}, nil
	}

	// Get products from database that match the query
	products, err := server.store.GetProductByName(ctx, query)
	if err != nil {
		// Return empty results if error
		return &pb.AutocompleteResponse{Items: []*pb.ProductSuggestion{}}, nil
	}

	// Convert to suggestions with images
	pbResults := make([]*pb.ProductSuggestion, 0, len(products))
	for _, product := range products {
		if len(pbResults) >= 8 { // Limit to 8 results
			break
		}
		pbResults = append(pbResults, &pb.ProductSuggestion{
			Id:       product.ID.String(),
			Name:     product.Name,
			ImageUrl: product.ProductUrl,
			Category: product.Category,
			Type:     product.Type,
		})
	}

	return &pb.AutocompleteResponse{Items: pbResults}, nil
}