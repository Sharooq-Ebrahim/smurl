package subscription

import "errors"

var ErrPremiumRequired = errors.New("premium subscription required")

type Plan string

const (
	PlanFree    Plan = "free"
	PlanPremium Plan = "premium"
)

type Feature string

const (
	FeatureLinkExpiration         Feature = "link_expiration"
	FeaturePasswordProtectedLinks Feature = "password_protected_links"
	FeatureQRCode                 Feature = "qr_code"
	FeatureAdvancedAnalytics      Feature = "advanced_analytics"
	FeatureCustomAlias            Feature = "custom_alias"
)

var planFeatures = map[Plan]map[Feature]bool{
	PlanFree: {
		FeatureCustomAlias: true,
	},
	PlanPremium: {
		FeatureCustomAlias:            true,
		FeatureLinkExpiration:         true,
		FeaturePasswordProtectedLinks: true,
		FeatureQRCode:                 true,
		FeatureAdvancedAnalytics:      true,
	},
}

// CanAccess checks if a user's plan permits access to the specified feature.
func CanAccess(userPlan string, feature Feature) bool {
	plan := Plan(userPlan)
	features, exists := planFeatures[plan]
	if !exists {
		features = planFeatures[PlanFree]
	}
	return features[feature]
}

// GetRateLimit defines the rate limit threshold based on the user's plan.
func GetRateLimit(userPlan string) int {
	plan := Plan(userPlan)
	switch plan {
	case PlanPremium:
		return 100
	default:
		return 30
	}
}

func CanUseExpiration(userPlan string) bool {
	return CanAccess(userPlan, FeatureLinkExpiration)
}

func CanGenerateQRCode(userPlan string) bool {
	return CanAccess(userPlan, FeatureQRCode)
}

func CanViewAdvancedAnalytics(userPlan string) bool {
	return CanAccess(userPlan, FeatureAdvancedAnalytics)
}

func CanCreatePasswordProtectedLink(userPlan string) bool {
	return CanAccess(userPlan, FeaturePasswordProtectedLinks)
}
