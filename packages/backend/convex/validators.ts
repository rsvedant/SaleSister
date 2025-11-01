import { v } from "convex/values";

/**
 * Convex validators for arguments and data validation
 * These validators provide type-safe argument validation for queries, mutations, and actions
 */

// HubSpot Contact validator
export const hubspotContactValidator = v.object({
	properties: v.object({
		email: v.optional(v.string()),
		firstname: v.optional(v.string()),
		lastname: v.optional(v.string()),
		phone: v.optional(v.string()),
		company: v.optional(v.string()),
		jobtitle: v.optional(v.string()),
	}),
});

// HubSpot Deal validator
export const hubspotDealValidator = v.object({
	properties: v.object({
		dealname: v.string(),
		amount: v.optional(v.string()), // HubSpot expects string for numbers
		closedate: v.optional(v.string()), // ISO 8601 date string
		dealstage: v.optional(v.string()),
		pipeline: v.optional(v.string()),
	}),
});

// HubSpot Engagement (Call/Meeting) validator
export const hubspotEngagementValidator = v.object({
	properties: v.object({
		hs_timestamp: v.string(), // ISO 8601 timestamp
		hs_engagement_type: v.union(
			v.literal("CALL"),
			v.literal("MEETING"),
			v.literal("EMAIL"),
			v.literal("NOTE")
		),
		hs_call_title: v.optional(v.string()),
		hs_call_body: v.optional(v.string()),
		hs_call_duration: v.optional(v.number()),
		hs_call_status: v.optional(v.string()),
		hs_call_recording_url: v.optional(v.string()),
	}),
});

// HubSpot Task validator
export const hubspotTaskValidator = v.object({
	properties: v.object({
		hs_task_subject: v.string(),
		hs_task_body: v.optional(v.string()),
		hs_task_status: v.union(
			v.literal("NOT_STARTED"),
			v.literal("IN_PROGRESS"),
			v.literal("COMPLETED"),
			v.literal("WAITING")
		),
		hs_task_priority: v.optional(
			v.union(v.literal("LOW"), v.literal("MEDIUM"), v.literal("HIGH"))
		),
		hs_timestamp: v.string(), // Due date in ISO 8601
	}),
});

// Call data validator
export const callDataValidator = v.object({
	title: v.string(),
	transcription: v.optional(v.string()),
	participants: v.optional(v.string()), // JSON string of participant array
	duration: v.optional(v.number()),
	recordingUrl: v.optional(v.string()),
	metadata: v.optional(v.string()), // JSON string of metadata object
});

// Actionable data validator
export const actionableDataValidator = v.object({
	callId: v.id("calls"),
	type: v.union(v.literal("task"), v.literal("follow_up"), v.literal("deal")),
	title: v.string(),
	description: v.optional(v.string()),
	priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
	dueDate: v.optional(v.number()),
	status: v.union(
		v.literal("pending"),
		v.literal("in_progress"),
		v.literal("completed"),
		v.literal("cancelled")
	),
});

// Call insights validator
export const callInsightsValidator = v.object({
	callId: v.id("calls"),
	sentiment: v.optional(
		v.union(v.literal("positive"), v.literal("neutral"), v.literal("negative"))
	),
	talkRatio: v.optional(v.number()),
	keyMoments: v.optional(v.string()), // JSON string of key moments array
	topics: v.optional(v.string()), // JSON string of topics array
	dealLikelihood: v.optional(v.number()),
	summary: v.optional(v.string()),
});

// User settings validator
export const userSettingsValidator = v.object({
	systemPrompt: v.optional(v.string()),
	salesScript: v.optional(v.string()),
	companyDocs: v.optional(v.string()),
	hubspotApiKey: v.optional(v.string()),
	hubspotEnabled: v.boolean(),
});

// Partial user settings validator (for updates)
export const partialUserSettingsValidator = v.object({
	systemPrompt: v.optional(v.string()),
	salesScript: v.optional(v.string()),
	companyDocs: v.optional(v.string()),
	hubspotApiKey: v.optional(v.string()),
	hubspotEnabled: v.optional(v.boolean()),
});
