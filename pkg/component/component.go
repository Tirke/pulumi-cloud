package component

import (
	"time"

	"github.com/pulumi/pulumi-fabric/pkg/resource"
	"github.com/pulumi/pulumi-fabric/pkg/tokens"
)

// Components is a map of URN to component
type Components map[resource.URN]*Component

// Component is a serializable vitrual node in a resource graph
type Component struct {
	Type       tokens.Type                `json:"type"`                // this components's full type token.
	Properties resource.PropertyMap       `json:"props,omitempty"`     // the properties of this component.
	Resources  map[string]*resource.State `json:"resources,omitempty"` // the resources owned by this component.
}

// LogEntry is a row in the logs for a running compute service
type LogEntry struct {
	ID        string
	Timestamp int64
	Message   string
}

// LogQuery represents the parameters to a log query operation.
// All fields are optional, leaving them off returns all logs.
type LogQuery struct {
	StartTime *time.Time
	EndTime   *time.Time
	Query     *string
}

// MetricName is a handle to a metric supported by a Pulumi Framework resources
type MetricName string

type MetricRequest struct {
	Name string
}

type MetricDataPoint struct {
	Timestamp   time.Time
	Unit        string
	Sum         float64
	SampleCount float64
	Average     float64
	Maximum     float64
	Minimum     float64
}

// OperationsProvider is the interface for making operational requests about the
// state of a Component (or Components)
type OperationsProvider interface {
	// GetLogs returns logs matching a query
	GetLogs(query *LogQuery) ([]LogEntry, error)
	// ListMetrics returns the list of supported metrics for the requested component type
	ListMetrics() []MetricName
	// GetMetricStatistics provides metrics data for a given metric request
	GetMetricStatistics(metric MetricRequest) ([]MetricDataPoint, error)
}
