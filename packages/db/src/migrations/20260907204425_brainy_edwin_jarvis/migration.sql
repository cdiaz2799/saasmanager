CREATE TYPE "account_status" AS ENUM('invited', 'active', 'suspended', 'deprovisioned', 'unknown');--> statement-breakpoint
CREATE TYPE "account_type" AS ENUM('human', 'service', 'shared', 'unknown');--> statement-breakpoint
CREATE TYPE "active_status" AS ENUM('active', 'retired');--> statement-breakpoint
CREATE TYPE "application_lifecycle" AS ENUM('proposed', 'active', 'retiring', 'retired');--> statement-breakpoint
CREATE TYPE "assignment_state" AS ENUM('assigned', 'revoked', 'unknown');--> statement-breakpoint
CREATE TYPE "auto_renew" AS ENUM('yes', 'no', 'unknown');--> statement-breakpoint
CREATE TYPE "batch_status" AS ENUM('queued', 'validating', 'reconciling', 'succeeded', 'partial', 'failed');--> statement-breakpoint
CREATE TYPE "billing_cadence" AS ENUM('monthly', 'quarterly', 'annual', 'one_time', 'custom', 'none');--> statement-breakpoint
CREATE TYPE "capacity_type" AS ENUM('fixed', 'unlimited', 'unknown');--> statement-breakpoint
CREATE TYPE "connection_health" AS ENUM('healthy', 'degraded', 'error', 'never_synced');--> statement-breakpoint
CREATE TYPE "connection_status" AS ENUM('enabled', 'disabled');--> statement-breakpoint
CREATE TYPE "consumption_basis" AS ENUM('account', 'principal', 'instance', 'usage');--> statement-breakpoint
CREATE TYPE "contract_status" AS ENUM('draft', 'executed', 'terminated', 'expired');--> statement-breakpoint
CREATE TYPE "coverage" AS ENUM('complete', 'partial', 'unknown');--> statement-breakpoint
CREATE TYPE "criticality" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "data_classification" AS ENUM('public', 'internal', 'confidential', 'restricted');--> statement-breakpoint
CREATE TYPE "delivery_status" AS ENUM('pending', 'delivered', 'exhausted');--> statement-breakpoint
CREATE TYPE "entitlement_type" AS ENUM('seat', 'usage', 'feature');--> statement-breakpoint
CREATE TYPE "entity_kind" AS ENUM('vendor', 'product', 'application', 'instance', 'person', 'group', 'service_principal', 'account', 'contract', 'subscription', 'entitlement', 'technical_asset');--> statement-breakpoint
CREATE TYPE "event_type" AS ENUM('entity.created', 'entity.updated', 'entity.retired');--> statement-breakpoint
CREATE TYPE "field_authority" AS ENUM('manual', 'source', 'override', 'derived');--> statement-breakpoint
CREATE TYPE "freshness" AS ENUM('fresh', 'stale', 'unknown');--> statement-breakpoint
CREATE TYPE "group_type" AS ENUM('team', 'department', 'cost_center', 'legal_entity', 'access_group');--> statement-breakpoint
CREATE TYPE "ingestion_item_status" AS ENUM('pending', 'applied', 'duplicate', 'conflict', 'rejected');--> statement-breakpoint
CREATE TYPE "instance_environment" AS ENUM('production', 'sandbox', 'development', 'test', 'unknown');--> statement-breakpoint
CREATE TYPE "instance_status" AS ENUM('active', 'inactive', 'unknown');--> statement-breakpoint
CREATE TYPE "management_status" AS ENUM('discovered', 'managed', 'ignored');--> statement-breakpoint
CREATE TYPE "membership_role" AS ENUM('member', 'manager');--> statement-breakpoint
CREATE TYPE "metering_period" AS ENUM('none', 'day', 'month', 'year', 'contract_term');--> statement-breakpoint
CREATE TYPE "metric_aggregation" AS ENUM('sum', 'max', 'latest', 'distinct_subjects');--> statement-breakpoint
CREATE TYPE "metric_signal" AS ENUM('product_activity', 'authentication', 'billing_meter');--> statement-breakpoint
CREATE TYPE "metric_status" AS ENUM('active', 'deprecated');--> statement-breakpoint
CREATE TYPE "observation_operation" AS ENUM('upsert', 'delete');--> statement-breakpoint
CREATE TYPE "override_status" AS ENUM('active', 'revoked');--> statement-breakpoint
CREATE TYPE "ownership_role" AS ENUM('business', 'technical', 'procurement', 'security', 'billing');--> statement-breakpoint
CREATE TYPE "person_status" AS ENUM('active', 'leave', 'departed', 'unknown');--> statement-breakpoint
CREATE TYPE "person_type" AS ENUM('employee', 'contractor', 'external');--> statement-breakpoint
CREATE TYPE "pricing_model" AS ENUM('seat', 'flat', 'metered', 'hybrid', 'free');--> statement-breakpoint
CREATE TYPE "reconciliation_status" AS ENUM('canonical', 'duplicate', 'unresolved');--> statement-breakpoint
CREATE TYPE "relation_type" AS ENUM('depends_on', 'uses', 'provides_api', 'consumes_api', 'part_of');--> statement-breakpoint
CREATE TYPE "resolution_status" AS ENUM('applied', 'unresolved', 'conflict', 'superseded');--> statement-breakpoint
CREATE TYPE "sanction_status" AS ENUM('unreviewed', 'approved', 'restricted', 'blocked');--> statement-breakpoint
CREATE TYPE "scope_type" AS ENUM('all_covered_applications', 'instances');--> statement-breakpoint
CREATE TYPE "source_link_status" AS ENUM('linked', 'ignored');--> statement-breakpoint
CREATE TYPE "spend_basis" AS ENUM('invoiced', 'paid');--> statement-breakpoint
CREATE TYPE "spend_type" AS ENUM('invoice_line', 'payment_line', 'expense_line', 'credit_line', 'refund_line');--> statement-breakpoint
CREATE TYPE "subscription_status" AS ENUM('trial', 'active', 'canceled', 'expired');--> statement-breakpoint
CREATE TYPE "sync_mode" AS ENUM('incremental', 'full');--> statement-breakpoint
CREATE TYPE "sync_status" AS ENUM('queued', 'running', 'succeeded', 'partial', 'failed');--> statement-breakpoint
CREATE TYPE "technical_asset_type" AS ENUM('domain', 'system', 'component', 'api', 'resource');--> statement-breakpoint
CREATE TYPE "technical_lifecycle" AS ENUM('experimental', 'production', 'deprecated', 'retired');--> statement-breakpoint
CREATE TYPE "webhook_status" AS ENUM('active', 'paused', 'retired');--> statement-breakpoint
CREATE TABLE "audit_events" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"revision" integer DEFAULT 1 NOT NULL,
	"tenant_id" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"action" text NOT NULL,
	"actor_id" text NOT NULL,
	"after_revision" integer,
	"before_revision" integer,
	"changed_paths" text[] DEFAULT '{}'::text[] NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT clock_timestamp() NOT NULL,
	"reason" text,
	"request_id" text NOT NULL,
	"resource_id" uuid NOT NULL,
	"resource_type" text NOT NULL,
	CONSTRAINT "audit_events_tenant_id_id" UNIQUE("tenant_id","id"),
	CONSTRAINT "audit_events_revision_positive" CHECK ("revision" >= 1),
	CONSTRAINT "audit_events_before_revision_positive" CHECK ("before_revision" >= 1),
	CONSTRAINT "audit_events_after_revision_positive" CHECK ("after_revision" >= 1)
);
--> statement-breakpoint
ALTER TABLE "audit_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "idempotency_keys" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"revision" integer DEFAULT 1 NOT NULL,
	"tenant_id" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"client_id" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"key" text NOT NULL,
	"method" text NOT NULL,
	"path" text NOT NULL,
	"request_sha256" text NOT NULL,
	"response_body" jsonb,
	"response_headers" jsonb,
	"response_status" integer,
	CONSTRAINT "idempotency_keys_tenant_id_id" UNIQUE("tenant_id","id"),
	CONSTRAINT "idempotency_keys_request_uq" UNIQUE("tenant_id","client_id","method","path","key"),
	CONSTRAINT "idempotency_keys_revision_positive" CHECK ("revision" >= 1),
	CONSTRAINT "idempotency_keys_expiration" CHECK ("expires_at" > "created_at"),
	CONSTRAINT "idempotency_keys_response_status" CHECK ("response_status" between 100 and 599),
	CONSTRAINT "idempotency_keys_sha256" CHECK ("request_sha256" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "idempotency_keys_response_headers_json" CHECK (jsonb_typeof("response_headers") = 'object')
);
--> statement-breakpoint
ALTER TABLE "idempotency_keys" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "outbox_events" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"revision" integer DEFAULT 1 NOT NULL,
	"tenant_id" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"changed_paths" text[] DEFAULT '{}'::text[] NOT NULL,
	"entity_id" uuid NOT NULL,
	"entity_revision" integer NOT NULL,
	"event_sequence" bigint NOT NULL,
	"event_type" "event_type" NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT clock_timestamp() NOT NULL,
	CONSTRAINT "outbox_events_tenant_id_id" UNIQUE("tenant_id","id"),
	CONSTRAINT "outbox_events_sequence_uq" UNIQUE("tenant_id","event_sequence"),
	CONSTRAINT "outbox_events_entity_event_uq" UNIQUE("tenant_id","entity_id","entity_revision","event_type"),
	CONSTRAINT "outbox_events_revision_positive" CHECK ("revision" >= 1),
	CONSTRAINT "outbox_events_positive_sequence" CHECK ("event_sequence" > 0),
	CONSTRAINT "outbox_events_positive_entity_revision" CHECK ("entity_revision" >= 1)
);
--> statement-breakpoint
ALTER TABLE "outbox_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "resource_revisions" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"revision" integer DEFAULT 1 NOT NULL,
	"tenant_id" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"effective_at" timestamp with time zone NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT clock_timestamp() NOT NULL,
	"representation" jsonb NOT NULL,
	"resource_id" uuid NOT NULL,
	"resource_revision" integer NOT NULL,
	"resource_type" text NOT NULL,
	CONSTRAINT "resource_revisions_tenant_id_id" UNIQUE("tenant_id","id"),
	CONSTRAINT "resource_revisions_version_uq" UNIQUE("tenant_id","resource_type","resource_id","resource_revision"),
	CONSTRAINT "resource_revisions_revision_positive" CHECK ("revision" >= 1),
	CONSTRAINT "resource_revisions_positive_resource_revision" CHECK ("resource_revision" >= 1),
	CONSTRAINT "resource_revisions_representation_json" CHECK (jsonb_typeof("representation") = 'object')
);
--> statement-breakpoint
ALTER TABLE "resource_revisions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "tenant_event_counters" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"revision" integer DEFAULT 1 NOT NULL,
	"tenant_id" uuid NOT NULL CONSTRAINT "tenant_event_counters_tenant_uq" UNIQUE,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_sequence" bigint DEFAULT 0 NOT NULL,
	CONSTRAINT "tenant_event_counters_tenant_id_id" UNIQUE("tenant_id","id"),
	CONSTRAINT "tenant_event_counters_revision_positive" CHECK ("revision" >= 1),
	CONSTRAINT "tenant_event_counters_nonnegative_sequence" CHECK ("last_sequence" >= 0)
);
--> statement-breakpoint
ALTER TABLE "tenant_event_counters" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "webhook_deliveries" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"revision" integer DEFAULT 1 NOT NULL,
	"tenant_id" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"delivered_at" timestamp with time zone,
	"event_id" uuid NOT NULL,
	"last_attempt_at" timestamp with time zone,
	"last_error_code" text,
	"last_http_status" integer,
	"next_attempt_at" timestamp with time zone DEFAULT clock_timestamp() NOT NULL,
	"status" "delivery_status" DEFAULT 'pending'::"delivery_status" NOT NULL,
	"subscription_id" uuid NOT NULL,
	CONSTRAINT "webhook_deliveries_tenant_id_id" UNIQUE("tenant_id","id"),
	CONSTRAINT "webhook_deliveries_delivery_uq" UNIQUE("tenant_id","subscription_id","event_id"),
	CONSTRAINT "webhook_deliveries_revision_positive" CHECK ("revision" >= 1),
	CONSTRAINT "webhook_deliveries_attempt_count_nonnegative" CHECK ("attempt_count" >= 0),
	CONSTRAINT "webhook_deliveries_http_status" CHECK ("last_http_status" between 100 and 599),
	CONSTRAINT "webhook_deliveries_delivered_at" CHECK (("status" = 'delivered') = ("delivered_at" is not null))
);
--> statement-breakpoint
ALTER TABLE "webhook_deliveries" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "webhook_subscriptions" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"revision" integer DEFAULT 1 NOT NULL,
	"tenant_id" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"delivery_principal_id" text NOT NULL,
	"event_types" "event_type"[] NOT NULL,
	"name" text NOT NULL,
	"secret_fingerprint" text NOT NULL,
	"signing_secret_ref" text NOT NULL,
	"status" "webhook_status" DEFAULT 'active'::"webhook_status" NOT NULL,
	"url" text NOT NULL,
	CONSTRAINT "webhook_subscriptions_tenant_id_id" UNIQUE("tenant_id","id"),
	CONSTRAINT "webhook_subscriptions_revision_positive" CHECK ("revision" >= 1),
	CONSTRAINT "webhook_subscriptions_https" CHECK ("url" ~ '^https://'),
	CONSTRAINT "webhook_subscriptions_event_types" CHECK (cardinality("event_types") > 0 and array_position("event_types", null) is null)
);
--> statement-breakpoint
ALTER TABLE "webhook_subscriptions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "account" (
	"access_token" text,
	"access_token_expires_at" timestamp,
	"account_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"id" text PRIMARY KEY,
	"id_token" text,
	"password" text,
	"provider_id" text NOT NULL,
	"refresh_token" text,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"updated_at" timestamp NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitation" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"email" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"id" text PRIMARY KEY,
	"inviter_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"role" text,
	"status" text DEFAULT 'pending' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member" (
	"created_at" timestamp NOT NULL,
	"id" text PRIMARY KEY,
	"organization_id" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization" (
	"created_at" timestamp NOT NULL,
	"id" text PRIMARY KEY,
	"logo" text,
	"metadata" text,
	"name" text NOT NULL,
	"slug" text NOT NULL UNIQUE
);
--> statement-breakpoint
CREATE TABLE "session" (
	"active_organization_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"id" text PRIMARY KEY,
	"ip_address" text,
	"token" text NOT NULL UNIQUE,
	"updated_at" timestamp NOT NULL,
	"user_agent" text,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"email" text NOT NULL UNIQUE,
	"email_verified" boolean DEFAULT false NOT NULL,
	"id" text PRIMARY KEY,
	"image" text,
	"name" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"id" text PRIMARY KEY,
	"identifier" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"revision" integer DEFAULT 1 NOT NULL,
	"tenant_id" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"account_type" "account_type" DEFAULT 'unknown'::"account_type" NOT NULL,
	"email" text,
	"instance_id" uuid NOT NULL,
	"kind" "entity_kind" DEFAULT 'account'::"entity_kind" NOT NULL,
	"last_observed_at" timestamp with time zone NOT NULL,
	"principal_id" uuid,
	"principal_kind" "entity_kind",
	"provider_account_key" text NOT NULL,
	"provider_roles" text[] DEFAULT '{}'::text[] NOT NULL,
	"status" "account_status" DEFAULT 'unknown'::"account_status" NOT NULL,
	"username" text,
	CONSTRAINT "accounts_tenant_id_id" UNIQUE("tenant_id","id"),
	CONSTRAINT "accounts_provider_identity_uq" UNIQUE("tenant_id","instance_id","provider_account_key"),
	CONSTRAINT "accounts_id_instance_uq" UNIQUE("tenant_id","id","instance_id"),
	CONSTRAINT "accounts_revision_positive" CHECK ("revision" >= 1),
	CONSTRAINT "accounts_kind" CHECK ("kind" = 'account'),
	CONSTRAINT "accounts_principal_pair" CHECK (("principal_id" is null and "principal_kind" is null) or ("principal_id" is not null and "principal_kind" is not null and "principal_kind" in ('person','service_principal'))),
	CONSTRAINT "accounts_principal_type" CHECK (("account_type" not in ('shared','unknown') or "principal_id" is null) and ("account_type" <> 'human' or "principal_kind" is null or "principal_kind" = 'person') and ("account_type" <> 'service' or "principal_kind" is null or "principal_kind" = 'service_principal'))
);
--> statement-breakpoint
ALTER TABLE "accounts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "applications" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"revision" integer DEFAULT 1 NOT NULL,
	"tenant_id" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"annotations" jsonb DEFAULT '{}' NOT NULL,
	"criticality" "criticality" NOT NULL,
	"data_classification" "data_classification" NOT NULL,
	"description" text,
	"extensions" jsonb DEFAULT '{}' NOT NULL,
	"kind" "entity_kind" DEFAULT 'application'::"entity_kind" NOT NULL,
	"labels" jsonb DEFAULT '{}' NOT NULL,
	"lifecycle" "application_lifecycle" DEFAULT 'proposed'::"application_lifecycle" NOT NULL,
	"management_status" "management_status" DEFAULT 'discovered'::"management_status" NOT NULL,
	"name" text NOT NULL,
	"product_id" uuid,
	"sanction_status" "sanction_status" DEFAULT 'unreviewed'::"sanction_status" NOT NULL,
	CONSTRAINT "applications_tenant_id_id" UNIQUE("tenant_id","id"),
	CONSTRAINT "applications_id_product_uq" UNIQUE("tenant_id","id","product_id"),
	CONSTRAINT "applications_revision_positive" CHECK ("revision" >= 1),
	CONSTRAINT "applications_kind" CHECK ("kind" = 'application'),
	CONSTRAINT "applications_labels_json" CHECK (jsonb_typeof("labels") = 'object'),
	CONSTRAINT "applications_annotations_json" CHECK (jsonb_typeof("annotations") = 'object'),
	CONSTRAINT "applications_extensions_json" CHECK (jsonb_typeof("extensions") = 'object')
);
--> statement-breakpoint
ALTER TABLE "applications" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "entity_registry" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"revision" integer DEFAULT 1 NOT NULL,
	"tenant_id" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"kind" "entity_kind" NOT NULL,
	CONSTRAINT "entity_registry_tenant_id_id" UNIQUE("tenant_id","id"),
	CONSTRAINT "entity_registry_tenant_id_kind" UNIQUE("tenant_id","id","kind"),
	CONSTRAINT "entity_registry_revision_positive" CHECK ("revision" >= 1)
);
--> statement-breakpoint
ALTER TABLE "entity_registry" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "groups" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"revision" integer DEFAULT 1 NOT NULL,
	"tenant_id" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"annotations" jsonb DEFAULT '{}' NOT NULL,
	"description" text,
	"extensions" jsonb DEFAULT '{}' NOT NULL,
	"group_type" "group_type" NOT NULL,
	"kind" "entity_kind" DEFAULT 'group'::"entity_kind" NOT NULL,
	"labels" jsonb DEFAULT '{}' NOT NULL,
	"name" text NOT NULL,
	"status" "active_status" DEFAULT 'active'::"active_status" NOT NULL,
	CONSTRAINT "groups_tenant_id_id" UNIQUE("tenant_id","id"),
	CONSTRAINT "groups_id_type_uq" UNIQUE("tenant_id","id","group_type"),
	CONSTRAINT "groups_revision_positive" CHECK ("revision" >= 1),
	CONSTRAINT "groups_kind" CHECK ("kind" = 'group'),
	CONSTRAINT "groups_labels_json" CHECK (jsonb_typeof("labels") = 'object'),
	CONSTRAINT "groups_annotations_json" CHECK (jsonb_typeof("annotations") = 'object'),
	CONSTRAINT "groups_extensions_json" CHECK (jsonb_typeof("extensions") = 'object')
);
--> statement-breakpoint
ALTER TABLE "groups" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "instances" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"revision" integer DEFAULT 1 NOT NULL,
	"tenant_id" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"annotations" jsonb DEFAULT '{}' NOT NULL,
	"application_id" uuid NOT NULL,
	"auth_modes" text[] DEFAULT '{}'::text[] NOT NULL,
	"description" text,
	"environment" "instance_environment" DEFAULT 'unknown'::"instance_environment" NOT NULL,
	"extensions" jsonb DEFAULT '{}' NOT NULL,
	"kind" "entity_kind" DEFAULT 'instance'::"entity_kind" NOT NULL,
	"labels" jsonb DEFAULT '{}' NOT NULL,
	"last_observed_at" timestamp with time zone,
	"name" text NOT NULL,
	"product_id" uuid,
	"provider_tenant_key" text,
	"region" text,
	"status" "instance_status" DEFAULT 'unknown'::"instance_status" NOT NULL,
	"url" text,
	CONSTRAINT "instances_tenant_id_id" UNIQUE("tenant_id","id"),
	CONSTRAINT "instances_revision_positive" CHECK ("revision" >= 1),
	CONSTRAINT "instances_kind" CHECK ("kind" = 'instance'),
	CONSTRAINT "instances_labels_json" CHECK (jsonb_typeof("labels") = 'object'),
	CONSTRAINT "instances_annotations_json" CHECK (jsonb_typeof("annotations") = 'object'),
	CONSTRAINT "instances_extensions_json" CHECK (jsonb_typeof("extensions") = 'object')
);
--> statement-breakpoint
ALTER TABLE "instances" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "memberships" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"revision" integer DEFAULT 1 NOT NULL,
	"tenant_id" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"group_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"member_kind" "entity_kind" NOT NULL,
	"role" "membership_role" DEFAULT 'member'::"membership_role" NOT NULL,
	"valid_from" timestamp with time zone NOT NULL,
	"valid_to" timestamp with time zone,
	CONSTRAINT "memberships_tenant_id_id" UNIQUE("tenant_id","id"),
	CONSTRAINT "memberships_revision_positive" CHECK ("revision" >= 1),
	CONSTRAINT "memberships_valid_from_before_valid_to" CHECK ("valid_to" is null or "valid_to" > "valid_from"),
	CONSTRAINT "memberships_member_kind" CHECK ("member_kind" in ('person','group','service_principal')),
	CONSTRAINT "memberships_not_self" CHECK ("group_id" <> "member_id")
);
--> statement-breakpoint
ALTER TABLE "memberships" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "ownerships" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"revision" integer DEFAULT 1 NOT NULL,
	"tenant_id" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"entity_id" uuid NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"owner_id" uuid NOT NULL,
	"owner_kind" "entity_kind" NOT NULL,
	"role" "ownership_role" NOT NULL,
	"valid_from" timestamp with time zone NOT NULL,
	"valid_to" timestamp with time zone,
	CONSTRAINT "ownerships_tenant_id_id" UNIQUE("tenant_id","id"),
	CONSTRAINT "ownerships_revision_positive" CHECK ("revision" >= 1),
	CONSTRAINT "ownerships_valid_from_before_valid_to" CHECK ("valid_to" is null or "valid_to" > "valid_from"),
	CONSTRAINT "ownerships_owner_kind" CHECK ("owner_kind" in ('person','group'))
);
--> statement-breakpoint
ALTER TABLE "ownerships" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "people" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"revision" integer DEFAULT 1 NOT NULL,
	"tenant_id" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"annotations" jsonb DEFAULT '{}' NOT NULL,
	"description" text,
	"display_name" text NOT NULL,
	"extensions" jsonb DEFAULT '{}' NOT NULL,
	"kind" "entity_kind" DEFAULT 'person'::"entity_kind" NOT NULL,
	"labels" jsonb DEFAULT '{}' NOT NULL,
	"manager_person_id" uuid,
	"person_type" "person_type" NOT NULL,
	"primary_email" text,
	"status" "person_status" DEFAULT 'unknown'::"person_status" NOT NULL,
	CONSTRAINT "people_tenant_id_id" UNIQUE("tenant_id","id"),
	CONSTRAINT "people_revision_positive" CHECK ("revision" >= 1),
	CONSTRAINT "people_kind" CHECK ("kind" = 'person'),
	CONSTRAINT "people_not_own_manager" CHECK ("manager_person_id" is null or "manager_person_id" <> "id"),
	CONSTRAINT "people_labels_json" CHECK (jsonb_typeof("labels") = 'object'),
	CONSTRAINT "people_annotations_json" CHECK (jsonb_typeof("annotations") = 'object'),
	CONSTRAINT "people_extensions_json" CHECK (jsonb_typeof("extensions") = 'object')
);
--> statement-breakpoint
ALTER TABLE "people" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "products" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"revision" integer DEFAULT 1 NOT NULL,
	"tenant_id" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"annotations" jsonb DEFAULT '{}' NOT NULL,
	"category" text,
	"description" text,
	"extensions" jsonb DEFAULT '{}' NOT NULL,
	"kind" "entity_kind" DEFAULT 'product'::"entity_kind" NOT NULL,
	"labels" jsonb DEFAULT '{}' NOT NULL,
	"name" text NOT NULL,
	"parent_product_id" uuid,
	"slug" text NOT NULL,
	"vendor_id" uuid NOT NULL,
	CONSTRAINT "products_tenant_id_id" UNIQUE("tenant_id","id"),
	CONSTRAINT "products_vendor_slug_uq" UNIQUE("tenant_id","vendor_id","slug"),
	CONSTRAINT "products_revision_positive" CHECK ("revision" >= 1),
	CONSTRAINT "products_kind" CHECK ("kind" = 'product'),
	CONSTRAINT "products_not_own_parent" CHECK ("parent_product_id" is null or "parent_product_id" <> "id"),
	CONSTRAINT "products_labels_json" CHECK (jsonb_typeof("labels") = 'object'),
	CONSTRAINT "products_annotations_json" CHECK (jsonb_typeof("annotations") = 'object'),
	CONSTRAINT "products_extensions_json" CHECK (jsonb_typeof("extensions") = 'object')
);
--> statement-breakpoint
ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "service_principals" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"revision" integer DEFAULT 1 NOT NULL,
	"tenant_id" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"annotations" jsonb DEFAULT '{}' NOT NULL,
	"description" text,
	"extensions" jsonb DEFAULT '{}' NOT NULL,
	"kind" "entity_kind" DEFAULT 'service_principal'::"entity_kind" NOT NULL,
	"labels" jsonb DEFAULT '{}' NOT NULL,
	"name" text NOT NULL,
	"purpose" text NOT NULL,
	"status" "active_status" DEFAULT 'active'::"active_status" NOT NULL,
	CONSTRAINT "service_principals_tenant_id_id" UNIQUE("tenant_id","id"),
	CONSTRAINT "service_principals_revision_positive" CHECK ("revision" >= 1),
	CONSTRAINT "service_principals_kind" CHECK ("kind" = 'service_principal'),
	CONSTRAINT "service_principals_labels_json" CHECK (jsonb_typeof("labels") = 'object'),
	CONSTRAINT "service_principals_annotations_json" CHECK (jsonb_typeof("annotations") = 'object'),
	CONSTRAINT "service_principals_extensions_json" CHECK (jsonb_typeof("extensions") = 'object')
);
--> statement-breakpoint
ALTER TABLE "service_principals" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vendors" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"revision" integer DEFAULT 1 NOT NULL,
	"tenant_id" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"annotations" jsonb DEFAULT '{}' NOT NULL,
	"description" text,
	"domains" text[] DEFAULT '{}'::text[] NOT NULL,
	"extensions" jsonb DEFAULT '{}' NOT NULL,
	"kind" "entity_kind" DEFAULT 'vendor'::"entity_kind" NOT NULL,
	"labels" jsonb DEFAULT '{}' NOT NULL,
	"name" text NOT NULL,
	"website" text,
	CONSTRAINT "vendors_tenant_id_id" UNIQUE("tenant_id","id"),
	CONSTRAINT "vendors_revision_positive" CHECK ("revision" >= 1),
	CONSTRAINT "vendors_kind" CHECK ("kind" = 'vendor'),
	CONSTRAINT "vendors_labels_json" CHECK (jsonb_typeof("labels") = 'object'),
	CONSTRAINT "vendors_annotations_json" CHECK (jsonb_typeof("annotations") = 'object'),
	CONSTRAINT "vendors_extensions_json" CHECK (jsonb_typeof("extensions") = 'object')
);
--> statement-breakpoint
ALTER TABLE "vendors" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "contracts" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"revision" integer DEFAULT 1 NOT NULL,
	"tenant_id" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"agreement_number" text,
	"annotations" jsonb DEFAULT '{}' NOT NULL,
	"auto_renew" "auto_renew" DEFAULT 'unknown'::"auto_renew" NOT NULL,
	"buyer_group_type" "group_type" DEFAULT 'legal_entity'::"group_type" NOT NULL,
	"buying_entity_group_id" uuid NOT NULL,
	"committed_amount" numeric(30,9),
	"contract_timezone" text NOT NULL,
	"currency" text,
	"description" text,
	"document_refs" text[] DEFAULT '{}'::text[] NOT NULL,
	"end_date" date,
	"extensions" jsonb DEFAULT '{}' NOT NULL,
	"kind" "entity_kind" DEFAULT 'contract'::"entity_kind" NOT NULL,
	"labels" jsonb DEFAULT '{}' NOT NULL,
	"name" text NOT NULL,
	"notice_deadline" timestamp with time zone,
	"parent_contract_id" uuid,
	"renewal_date" date,
	"renews_contract_id" uuid,
	"start_date" date NOT NULL,
	"status" "contract_status" DEFAULT 'draft'::"contract_status" NOT NULL,
	"supersedes_contract_id" uuid,
	"supplier_vendor_id" uuid NOT NULL,
	CONSTRAINT "contracts_tenant_id_id" UNIQUE("tenant_id","id"),
	CONSTRAINT "contracts_revision_positive" CHECK ("revision" >= 1),
	CONSTRAINT "contracts_kind" CHECK ("kind" = 'contract'),
	CONSTRAINT "contracts_start_date_before_end_date" CHECK ("end_date" is null or "end_date" > "start_date"),
	CONSTRAINT "contracts_committed_amount_pair" CHECK (("committed_amount" is null and "currency" is null) or ("committed_amount" is not null and "currency" is not null and "currency" ~ '^[A-Z]{3}$')),
	CONSTRAINT "contracts_committed_amount_finite" CHECK ("committed_amount" not in ('NaN'::numeric, 'Infinity'::numeric, '-Infinity'::numeric)),
	CONSTRAINT "contracts_committed_amount_nonnegative" CHECK ("committed_amount" >= 0),
	CONSTRAINT "contracts_buyer_type" CHECK ("buyer_group_type" = 'legal_entity'),
	CONSTRAINT "contracts_not_self_chain" CHECK ("id" is distinct from "parent_contract_id" and "id" is distinct from "supersedes_contract_id" and "id" is distinct from "renews_contract_id"),
	CONSTRAINT "contracts_labels_json" CHECK (jsonb_typeof("labels") = 'object'),
	CONSTRAINT "contracts_annotations_json" CHECK (jsonb_typeof("annotations") = 'object'),
	CONSTRAINT "contracts_extensions_json" CHECK (jsonb_typeof("extensions") = 'object')
);
--> statement-breakpoint
ALTER TABLE "contracts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "entitlement_instances" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"revision" integer DEFAULT 1 NOT NULL,
	"tenant_id" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"entitlement_id" uuid NOT NULL,
	"instance_id" uuid NOT NULL,
	CONSTRAINT "entitlement_instances_tenant_id_id" UNIQUE("tenant_id","id"),
	CONSTRAINT "entitlement_instances_pair_uq" UNIQUE("tenant_id","entitlement_id","instance_id"),
	CONSTRAINT "entitlement_instances_revision_positive" CHECK ("revision" >= 1)
);
--> statement-breakpoint
ALTER TABLE "entitlement_instances" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "entitlements" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"revision" integer DEFAULT 1 NOT NULL,
	"tenant_id" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"capacity_type" "capacity_type" NOT NULL,
	"consumption_basis" "consumption_basis" NOT NULL,
	"entitlement_type" "entitlement_type" NOT NULL,
	"kind" "entity_kind" DEFAULT 'entitlement'::"entity_kind" NOT NULL,
	"metering_period" "metering_period" NOT NULL,
	"name" text NOT NULL,
	"quantity" numeric(30,9),
	"scope_type" "scope_type" NOT NULL,
	"sku" text,
	"subscription_id" uuid NOT NULL,
	"unit" text NOT NULL,
	"valid_from" timestamp with time zone NOT NULL,
	"valid_to" timestamp with time zone,
	CONSTRAINT "entitlements_tenant_id_id" UNIQUE("tenant_id","id"),
	CONSTRAINT "entitlements_revision_positive" CHECK ("revision" >= 1),
	CONSTRAINT "entitlements_kind" CHECK ("kind" = 'entitlement'),
	CONSTRAINT "entitlements_valid_from_before_valid_to" CHECK ("valid_to" is null or "valid_to" > "valid_from"),
	CONSTRAINT "entitlements_quantity_finite" CHECK ("quantity" not in ('NaN'::numeric, 'Infinity'::numeric, '-Infinity'::numeric)),
	CONSTRAINT "entitlements_capacity" CHECK (("capacity_type" = 'fixed' and "quantity" is not null and "quantity" >= 0) or ("capacity_type" in ('unlimited','unknown') and "quantity" is null)),
	CONSTRAINT "entitlements_whole_seats" CHECK ("entitlement_type" <> 'seat' or "quantity" is null or "quantity" = trunc("quantity"))
);
--> statement-breakpoint
ALTER TABLE "entitlements" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "license_assignments" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"revision" integer DEFAULT 1 NOT NULL,
	"tenant_id" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"account_id" uuid NOT NULL,
	"assignment_key" text NOT NULL,
	"assignment_state" "assignment_state" NOT NULL,
	"entitlement_id" uuid,
	"last_observed_at" timestamp with time zone NOT NULL,
	"provider_sku" text,
	"quantity" numeric(30,9) DEFAULT '1' NOT NULL,
	"valid_from" timestamp with time zone NOT NULL,
	"valid_to" timestamp with time zone,
	CONSTRAINT "license_assignments_tenant_id_id" UNIQUE("tenant_id","id"),
	CONSTRAINT "license_assignments_revision_positive" CHECK ("revision" >= 1),
	CONSTRAINT "license_assignments_valid_from_before_valid_to" CHECK ("valid_to" is null or "valid_to" > "valid_from"),
	CONSTRAINT "license_assignments_quantity_finite" CHECK ("quantity" not in ('NaN'::numeric, 'Infinity'::numeric, '-Infinity'::numeric)),
	CONSTRAINT "license_assignments_quantity_nonnegative" CHECK ("quantity" >= 0)
);
--> statement-breakpoint
ALTER TABLE "license_assignments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "metric_definitions" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"revision" integer DEFAULT 1 NOT NULL,
	"tenant_id" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"aggregation" "metric_aggregation" NOT NULL,
	"definition" text NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"signal_type" "metric_signal" NOT NULL,
	"status" "metric_status" DEFAULT 'active'::"metric_status" NOT NULL,
	"unit" text NOT NULL,
	"version" integer NOT NULL,
	CONSTRAINT "metric_definitions_tenant_id_id" UNIQUE("tenant_id","id"),
	CONSTRAINT "metric_definitions_key_version_uq" UNIQUE("tenant_id","key","version"),
	CONSTRAINT "metric_definitions_revision_positive" CHECK ("revision" >= 1),
	CONSTRAINT "metric_definitions_positive_version" CHECK ("version" >= 1)
);
--> statement-breakpoint
ALTER TABLE "metric_definitions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "spend_allocations" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"revision" integer DEFAULT 1 NOT NULL,
	"tenant_id" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"amount" numeric(30,9) NOT NULL,
	"application_id" uuid NOT NULL,
	"cost_center_group_id" uuid,
	"cost_center_type" "group_type" DEFAULT 'cost_center'::"group_type" NOT NULL,
	"currency" text NOT NULL,
	"spend_record_id" uuid NOT NULL,
	CONSTRAINT "spend_allocations_tenant_id_id" UNIQUE("tenant_id","id"),
	CONSTRAINT "spend_allocations_revision_positive" CHECK ("revision" >= 1),
	CONSTRAINT "spend_allocations_amount_finite" CHECK ("amount" not in ('NaN'::numeric, 'Infinity'::numeric, '-Infinity'::numeric)),
	CONSTRAINT "spend_allocations_cost_center_type" CHECK ("cost_center_type" = 'cost_center')
);
--> statement-breakpoint
ALTER TABLE "spend_allocations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "spend_records" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"revision" integer DEFAULT 1 NOT NULL,
	"tenant_id" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"accounting_date" date NOT NULL,
	"amount" numeric(30,9) NOT NULL,
	"basis" "spend_basis" NOT NULL,
	"canonical_record_id" uuid,
	"connection_id" uuid NOT NULL,
	"currency" text NOT NULL,
	"economic_event_key" text,
	"reconciliation_status" "reconciliation_status" DEFAULT 'unresolved'::"reconciliation_status" NOT NULL,
	"record_type" "spend_type" NOT NULL,
	"service_end_date" date,
	"service_start_date" date,
	"source_document_key" text NOT NULL,
	"source_line_key" text NOT NULL,
	"subscription_id" uuid,
	"supplier_vendor_id" uuid,
	CONSTRAINT "spend_records_tenant_id_id" UNIQUE("tenant_id","id"),
	CONSTRAINT "spend_records_source_line_uq" UNIQUE("tenant_id","connection_id","source_document_key","source_line_key","basis"),
	CONSTRAINT "spend_records_id_basis_currency_uq" UNIQUE("tenant_id","id","basis","currency"),
	CONSTRAINT "spend_records_id_currency_uq" UNIQUE("tenant_id","id","currency"),
	CONSTRAINT "spend_records_revision_positive" CHECK ("revision" >= 1),
	CONSTRAINT "spend_records_amount_finite" CHECK ("amount" not in ('NaN'::numeric, 'Infinity'::numeric, '-Infinity'::numeric)),
	CONSTRAINT "spend_records_currency" CHECK ("currency" ~ '^[A-Z]{3}$'),
	CONSTRAINT "spend_records_service_interval" CHECK (("service_start_date" is null and "service_end_date" is null) or ("service_start_date" is not null and "service_end_date" is not null and "service_end_date" > "service_start_date")),
	CONSTRAINT "spend_records_basis_type" CHECK (("record_type" in ('invoice_line','credit_line') and "basis" = 'invoiced') or ("record_type" in ('payment_line','refund_line') and "basis" = 'paid') or "record_type" = 'expense_line'),
	CONSTRAINT "spend_records_sign" CHECK (("record_type" in ('credit_line','refund_line') and "amount" < 0) or ("record_type" not in ('credit_line','refund_line') and "amount" >= 0)),
	CONSTRAINT "spend_records_duplicate_pointer" CHECK (("reconciliation_status" = 'duplicate' and "canonical_record_id" is not null and "canonical_record_id" <> "id") or ("reconciliation_status" <> 'duplicate' and "canonical_record_id" is null))
);
--> statement-breakpoint
ALTER TABLE "spend_records" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "subscription_applications" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"revision" integer DEFAULT 1 NOT NULL,
	"tenant_id" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"application_id" uuid NOT NULL,
	"subscription_id" uuid NOT NULL,
	CONSTRAINT "subscription_applications_tenant_id_id" UNIQUE("tenant_id","id"),
	CONSTRAINT "subscription_applications_pair_uq" UNIQUE("tenant_id","subscription_id","application_id"),
	CONSTRAINT "subscription_applications_revision_positive" CHECK ("revision" >= 1)
);
--> statement-breakpoint
ALTER TABLE "subscription_applications" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"revision" integer DEFAULT 1 NOT NULL,
	"tenant_id" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"annotations" jsonb DEFAULT '{}' NOT NULL,
	"billing_cadence" "billing_cadence" NOT NULL,
	"commitment_amount" numeric(30,9),
	"commitment_end_date" date,
	"commitment_start_date" date,
	"contract_id" uuid,
	"currency" text,
	"description" text,
	"end_date" date,
	"extensions" jsonb DEFAULT '{}' NOT NULL,
	"kind" "entity_kind" DEFAULT 'subscription'::"entity_kind" NOT NULL,
	"labels" jsonb DEFAULT '{}' NOT NULL,
	"name" text NOT NULL,
	"pricing_model" "pricing_model" NOT NULL,
	"renews_subscription_id" uuid,
	"sku" text,
	"start_date" date NOT NULL,
	"status" "subscription_status" NOT NULL,
	"supersedes_subscription_id" uuid,
	CONSTRAINT "subscriptions_tenant_id_id" UNIQUE("tenant_id","id"),
	CONSTRAINT "subscriptions_revision_positive" CHECK ("revision" >= 1),
	CONSTRAINT "subscriptions_kind" CHECK ("kind" = 'subscription'),
	CONSTRAINT "subscriptions_start_date_before_end_date" CHECK ("end_date" is null or "end_date" > "start_date"),
	CONSTRAINT "subscriptions_commitment_amount_pair" CHECK (("commitment_amount" is null and "currency" is null) or ("commitment_amount" is not null and "currency" is not null and "currency" ~ '^[A-Z]{3}$')),
	CONSTRAINT "subscriptions_commitment_amount_finite" CHECK ("commitment_amount" not in ('NaN'::numeric, 'Infinity'::numeric, '-Infinity'::numeric)),
	CONSTRAINT "subscriptions_commitment_amount_nonnegative" CHECK ("commitment_amount" >= 0),
	CONSTRAINT "subscriptions_commitment_period" CHECK (("commitment_amount" is null and "commitment_start_date" is null and "commitment_end_date" is null) or ("commitment_amount" is not null and "commitment_start_date" is not null and "commitment_end_date" is not null and "commitment_end_date" > "commitment_start_date")),
	CONSTRAINT "subscriptions_not_self_chain" CHECK ("id" is distinct from "supersedes_subscription_id" and "id" is distinct from "renews_subscription_id"),
	CONSTRAINT "subscriptions_labels_json" CHECK (jsonb_typeof("labels") = 'object'),
	CONSTRAINT "subscriptions_annotations_json" CHECK (jsonb_typeof("annotations") = 'object'),
	CONSTRAINT "subscriptions_extensions_json" CHECK (jsonb_typeof("extensions") = 'object')
);
--> statement-breakpoint
ALTER TABLE "subscriptions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "usage_records" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"revision" integer DEFAULT 1 NOT NULL,
	"tenant_id" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"account_id" uuid,
	"canonical_record_id" uuid,
	"coverage" "coverage" NOT NULL,
	"instance_id" uuid NOT NULL,
	"metric_definition_id" uuid NOT NULL,
	"observed_at" timestamp with time zone NOT NULL,
	"reconciliation_status" "reconciliation_status" DEFAULT 'unresolved'::"reconciliation_status" NOT NULL,
	"value" numeric(30,9) NOT NULL,
	"window_end" timestamp with time zone NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	CONSTRAINT "usage_records_tenant_id_id" UNIQUE("tenant_id","id"),
	CONSTRAINT "usage_records_revision_positive" CHECK ("revision" >= 1),
	CONSTRAINT "usage_records_window_start_before_window_end" CHECK ("window_end" > "window_start"),
	CONSTRAINT "usage_records_value_finite" CHECK ("value" not in ('NaN'::numeric, 'Infinity'::numeric, '-Infinity'::numeric)),
	CONSTRAINT "usage_records_value_nonnegative" CHECK ("value" >= 0),
	CONSTRAINT "usage_records_duplicate_pointer" CHECK (("reconciliation_status" = 'duplicate' and "canonical_record_id" is not null and "canonical_record_id" <> "id") or ("reconciliation_status" <> 'duplicate' and "canonical_record_id" is null))
);
--> statement-breakpoint
ALTER TABLE "usage_records" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "account_observations" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"revision" integer DEFAULT 1 NOT NULL,
	"tenant_id" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"account_id" uuid NOT NULL,
	"observation_id" uuid NOT NULL,
	CONSTRAINT "account_observations_tenant_id_id" UNIQUE("tenant_id","id"),
	CONSTRAINT "account_observations_pair_uq" UNIQUE("tenant_id","account_id","observation_id"),
	CONSTRAINT "account_observations_revision_positive" CHECK ("revision" >= 1)
);
--> statement-breakpoint
ALTER TABLE "account_observations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "assignment_observations" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"revision" integer DEFAULT 1 NOT NULL,
	"tenant_id" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"assignment_id" uuid NOT NULL,
	"observation_id" uuid NOT NULL,
	CONSTRAINT "assignment_observations_tenant_id_id" UNIQUE("tenant_id","id"),
	CONSTRAINT "assignment_observations_pair_uq" UNIQUE("tenant_id","assignment_id","observation_id"),
	CONSTRAINT "assignment_observations_revision_positive" CHECK ("revision" >= 1)
);
--> statement-breakpoint
ALTER TABLE "assignment_observations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "field_overrides" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"revision" integer DEFAULT 1 NOT NULL,
	"tenant_id" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"actor_id" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"expires_at" timestamp with time zone,
	"field_path" text NOT NULL,
	"reason" text NOT NULL,
	"status" "override_status" DEFAULT 'active'::"override_status" NOT NULL,
	"value" jsonb NOT NULL,
	CONSTRAINT "field_overrides_tenant_id_id" UNIQUE("tenant_id","id"),
	CONSTRAINT "field_overrides_id_entity_field_uq" UNIQUE("tenant_id","id","entity_id","field_path"),
	CONSTRAINT "field_overrides_revision_positive" CHECK ("revision" >= 1),
	CONSTRAINT "field_overrides_whole_field" CHECK ("field_path" ~ '^/[^/]+$'),
	CONSTRAINT "field_overrides_reason" CHECK (length(trim("reason")) > 0)
);
--> statement-breakpoint
ALTER TABLE "field_overrides" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "field_provenance" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"revision" integer DEFAULT 1 NOT NULL,
	"tenant_id" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"authority" "field_authority" NOT NULL,
	"connection_id" uuid,
	"effective_at" timestamp with time zone NOT NULL,
	"entity_id" uuid NOT NULL,
	"field_path" text NOT NULL,
	"freshness" "freshness" NOT NULL,
	"override_id" uuid,
	"recorded_at" timestamp with time zone DEFAULT clock_timestamp() NOT NULL,
	"rule_version" text NOT NULL,
	"winning_observation_id" uuid,
	CONSTRAINT "field_provenance_tenant_id_id" UNIQUE("tenant_id","id"),
	CONSTRAINT "field_provenance_field_uq" UNIQUE("tenant_id","entity_id","field_path"),
	CONSTRAINT "field_provenance_revision_positive" CHECK ("revision" >= 1),
	CONSTRAINT "field_provenance_observation_connection" CHECK ("winning_observation_id" is null or "connection_id" is not null),
	CONSTRAINT "field_provenance_source_required" CHECK ("authority" <> 'source' or ("connection_id" is not null and "winning_observation_id" is not null)),
	CONSTRAINT "field_provenance_override_required" CHECK (("authority" = 'override' and "override_id" is not null) or ("authority" <> 'override' and "override_id" is null))
);
--> statement-breakpoint
ALTER TABLE "field_provenance" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "ingestion_batches" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"revision" integer DEFAULT 1 NOT NULL,
	"tenant_id" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"accepted_count" integer DEFAULT 0 NOT NULL,
	"connection_id" uuid NOT NULL,
	"finished_at" timestamp with time zone,
	"received_count" integer NOT NULL,
	"rejected_count" integer DEFAULT 0 NOT NULL,
	"status" "batch_status" DEFAULT 'queued'::"batch_status" NOT NULL,
	CONSTRAINT "ingestion_batches_tenant_id_id" UNIQUE("tenant_id","id"),
	CONSTRAINT "ingestion_batches_revision_positive" CHECK ("revision" >= 1),
	CONSTRAINT "ingestion_batches_batch_size" CHECK ("received_count" between 1 and 500),
	CONSTRAINT "ingestion_batches_accepted_count_nonnegative" CHECK ("accepted_count" >= 0),
	CONSTRAINT "ingestion_batches_rejected_count_nonnegative" CHECK ("rejected_count" >= 0),
	CONSTRAINT "ingestion_batches_counts" CHECK ("accepted_count" + "rejected_count" <= "received_count"),
	CONSTRAINT "ingestion_batches_terminal_counts" CHECK ("status" not in ('succeeded','partial','failed') or ("accepted_count" + "rejected_count" = "received_count" and "finished_at" is not null))
);
--> statement-breakpoint
ALTER TABLE "ingestion_batches" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "ingestion_items" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"revision" integer DEFAULT 1 NOT NULL,
	"tenant_id" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"batch_id" uuid NOT NULL,
	"client_record_id" text NOT NULL,
	"error" jsonb,
	"input_index" integer NOT NULL,
	"observation_id" uuid,
	"resolved_resources" jsonb DEFAULT '[]' NOT NULL,
	"status" "ingestion_item_status" DEFAULT 'pending'::"ingestion_item_status" NOT NULL,
	CONSTRAINT "ingestion_items_tenant_id_id" UNIQUE("tenant_id","id"),
	CONSTRAINT "ingestion_items_input_uq" UNIQUE("tenant_id","batch_id","input_index"),
	CONSTRAINT "ingestion_items_client_key_uq" UNIQUE("tenant_id","batch_id","client_record_id"),
	CONSTRAINT "ingestion_items_revision_positive" CHECK ("revision" >= 1),
	CONSTRAINT "ingestion_items_index_range" CHECK ("input_index" between 0 and 499),
	CONSTRAINT "ingestion_items_resolved_resources_json" CHECK (jsonb_typeof("resolved_resources") = 'array'),
	CONSTRAINT "ingestion_items_error_json" CHECK (jsonb_typeof("error") = 'object')
);
--> statement-breakpoint
ALTER TABLE "ingestion_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "observation_resolutions" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"revision" integer DEFAULT 1 NOT NULL,
	"tenant_id" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"canonical_entity_id" uuid,
	"details" jsonb DEFAULT '{}' NOT NULL,
	"observation_id" uuid NOT NULL,
	"resolution_version" integer NOT NULL,
	"resolved_resources" jsonb DEFAULT '[]' NOT NULL,
	"rule_version" text NOT NULL,
	"status" "resolution_status" NOT NULL,
	CONSTRAINT "observation_resolutions_tenant_id_id" UNIQUE("tenant_id","id"),
	CONSTRAINT "observation_resolutions_observation_version_uq" UNIQUE("tenant_id","observation_id","resolution_version"),
	CONSTRAINT "observation_resolutions_revision_positive" CHECK ("revision" >= 1),
	CONSTRAINT "observation_resolutions_positive_version" CHECK ("resolution_version" >= 1),
	CONSTRAINT "observation_resolutions_resolved_resources_json" CHECK (jsonb_typeof("resolved_resources") = 'array'),
	CONSTRAINT "observation_resolutions_details_json" CHECK (jsonb_typeof("details") = 'object')
);
--> statement-breakpoint
ALTER TABLE "observation_resolutions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "observations" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"revision" integer DEFAULT 1 NOT NULL,
	"tenant_id" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"connection_id" uuid NOT NULL,
	"effective_at" timestamp with time zone NOT NULL,
	"external_id" text NOT NULL,
	"observed_at" timestamp with time zone NOT NULL,
	"operation" "observation_operation" NOT NULL,
	"payload_ref" text NOT NULL,
	"payload_sha256" text NOT NULL,
	"received_at" timestamp with time zone DEFAULT clock_timestamp() NOT NULL,
	"source_object_type" text NOT NULL,
	"source_schema_version" text NOT NULL,
	"source_sequence" numeric(39,0),
	"source_version" text NOT NULL,
	CONSTRAINT "observations_tenant_id_id" UNIQUE("tenant_id","id"),
	CONSTRAINT "observations_id_connection_uq" UNIQUE("tenant_id","id","connection_id"),
	CONSTRAINT "observations_source_version_uq" UNIQUE("tenant_id","connection_id","source_object_type","external_id","source_version"),
	CONSTRAINT "observations_revision_positive" CHECK ("revision" >= 1),
	CONSTRAINT "observations_sha256" CHECK ("payload_sha256" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "observations_source_sequence_finite" CHECK ("source_sequence" not in ('NaN'::numeric, 'Infinity'::numeric, '-Infinity'::numeric)),
	CONSTRAINT "observations_source_sequence_nonnegative" CHECK ("source_sequence" >= 0)
);
--> statement-breakpoint
ALTER TABLE "observations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "provenance_conflicts" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"revision" integer DEFAULT 1 NOT NULL,
	"tenant_id" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"field_provenance_id" uuid NOT NULL,
	"observation_id" uuid NOT NULL,
	CONSTRAINT "provenance_conflicts_tenant_id_id" UNIQUE("tenant_id","id"),
	CONSTRAINT "provenance_conflicts_pair_uq" UNIQUE("tenant_id","field_provenance_id","observation_id"),
	CONSTRAINT "provenance_conflicts_revision_positive" CHECK ("revision" >= 1)
);
--> statement-breakpoint
ALTER TABLE "provenance_conflicts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "spend_observations" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"revision" integer DEFAULT 1 NOT NULL,
	"tenant_id" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"observation_id" uuid NOT NULL,
	"spend_record_id" uuid NOT NULL,
	CONSTRAINT "spend_observations_tenant_id_id" UNIQUE("tenant_id","id"),
	CONSTRAINT "spend_observations_pair_uq" UNIQUE("tenant_id","spend_record_id","observation_id"),
	CONSTRAINT "spend_observations_revision_positive" CHECK ("revision" >= 1)
);
--> statement-breakpoint
ALTER TABLE "spend_observations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "sync_runs" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"revision" integer DEFAULT 1 NOT NULL,
	"tenant_id" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"checkpoint" jsonb,
	"collections" text[] NOT NULL,
	"connection_id" uuid NOT NULL,
	"error" jsonb,
	"error_count" integer DEFAULT 0 NOT NULL,
	"finished_at" timestamp with time zone,
	"mode" "sync_mode" NOT NULL,
	"processed_count" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp with time zone,
	"status" "sync_status" DEFAULT 'queued'::"sync_status" NOT NULL,
	CONSTRAINT "sync_runs_tenant_id_id" UNIQUE("tenant_id","id"),
	CONSTRAINT "sync_runs_revision_positive" CHECK ("revision" >= 1),
	CONSTRAINT "sync_runs_processed_count_nonnegative" CHECK ("processed_count" >= 0),
	CONSTRAINT "sync_runs_error_count_nonnegative" CHECK ("error_count" >= 0),
	CONSTRAINT "sync_runs_terminal_finished_at" CHECK ("status" not in ('succeeded','partial','failed') or "finished_at" is not null),
	CONSTRAINT "sync_runs_time_order" CHECK ("finished_at" >= "started_at"),
	CONSTRAINT "sync_runs_checkpoint_json" CHECK (jsonb_typeof("checkpoint") = 'object'),
	CONSTRAINT "sync_runs_error_json" CHECK (jsonb_typeof("error") = 'object')
);
--> statement-breakpoint
ALTER TABLE "sync_runs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "usage_observations" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"revision" integer DEFAULT 1 NOT NULL,
	"tenant_id" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"observation_id" uuid NOT NULL,
	"usage_record_id" uuid NOT NULL,
	CONSTRAINT "usage_observations_tenant_id_id" UNIQUE("tenant_id","id"),
	CONSTRAINT "usage_observations_pair_uq" UNIQUE("tenant_id","usage_record_id","observation_id"),
	CONSTRAINT "usage_observations_revision_positive" CHECK ("revision" >= 1)
);
--> statement-breakpoint
ALTER TABLE "usage_observations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "connections" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"revision" integer DEFAULT 1 NOT NULL,
	"tenant_id" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"capabilities" text[] DEFAULT '{}'::text[] NOT NULL,
	"health" "connection_health" DEFAULT 'never_synced'::"connection_health" NOT NULL,
	"last_successful_sync_at" timestamp with time zone,
	"name" text NOT NULL,
	"provider" text NOT NULL,
	"secret_ref" text NOT NULL,
	"source_namespace" text NOT NULL,
	"status" "connection_status" DEFAULT 'disabled'::"connection_status" NOT NULL,
	CONSTRAINT "connections_tenant_id_id" UNIQUE("tenant_id","id"),
	CONSTRAINT "connections_source_uq" UNIQUE("tenant_id","provider","source_namespace"),
	CONSTRAINT "connections_revision_positive" CHECK ("revision" >= 1)
);
--> statement-breakpoint
ALTER TABLE "connections" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "external_object_links" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"revision" integer DEFAULT 1 NOT NULL,
	"tenant_id" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"canonical_entity_id" uuid,
	"canonical_entity_kind" "entity_kind",
	"connection_id" uuid NOT NULL,
	"external_id" text NOT NULL,
	"reason" text NOT NULL,
	"source_object_type" text NOT NULL,
	"status" "source_link_status" NOT NULL,
	CONSTRAINT "external_object_links_tenant_id_id" UNIQUE("tenant_id","id"),
	CONSTRAINT "external_object_links_source_object_uq" UNIQUE("tenant_id","connection_id","source_object_type","external_id"),
	CONSTRAINT "external_object_links_revision_positive" CHECK ("revision" >= 1),
	CONSTRAINT "external_object_links_target" CHECK (("status" = 'linked' and "canonical_entity_id" is not null and "canonical_entity_kind" is not null) or ("status" = 'ignored' and "canonical_entity_id" is null and "canonical_entity_kind" is null))
);
--> statement-breakpoint
ALTER TABLE "external_object_links" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "organization_tenant" (
	"organization_id" text PRIMARY KEY,
	"tenant_id" uuid NOT NULL UNIQUE
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"default_currency" text DEFAULT 'USD' NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"retention_config" jsonb DEFAULT '{}' NOT NULL,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	CONSTRAINT "tenants_currency" CHECK ("default_currency" ~ '^[A-Z]{3}$'),
	CONSTRAINT "tenants_retention_config_json" CHECK (jsonb_typeof("retention_config") = 'object')
);
--> statement-breakpoint
ALTER TABLE "tenants" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "relationships" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"revision" integer DEFAULT 1 NOT NULL,
	"tenant_id" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"description" text,
	"relation_type" "relation_type" NOT NULL,
	"source_entity_id" uuid NOT NULL,
	"target_entity_id" uuid NOT NULL,
	"valid_from" timestamp with time zone NOT NULL,
	"valid_to" timestamp with time zone,
	CONSTRAINT "relationships_tenant_id_id" UNIQUE("tenant_id","id"),
	CONSTRAINT "relationships_revision_positive" CHECK ("revision" >= 1),
	CONSTRAINT "relationships_valid_from_before_valid_to" CHECK ("valid_to" is null or "valid_to" > "valid_from"),
	CONSTRAINT "relationships_not_self" CHECK ("source_entity_id" <> "target_entity_id")
);
--> statement-breakpoint
ALTER TABLE "relationships" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "technical_assets" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"revision" integer DEFAULT 1 NOT NULL,
	"tenant_id" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"annotations" jsonb DEFAULT '{}' NOT NULL,
	"api_definition_url" text,
	"asset_type" "technical_asset_type" NOT NULL,
	"backstage_ref" text,
	"description" text,
	"extensions" jsonb DEFAULT '{}' NOT NULL,
	"kind" "entity_kind" DEFAULT 'technical_asset'::"entity_kind" NOT NULL,
	"labels" jsonb DEFAULT '{}' NOT NULL,
	"lifecycle" "technical_lifecycle" NOT NULL,
	"name" text NOT NULL,
	"namespace" text DEFAULT 'default' NOT NULL,
	"subtype" text,
	"title" text NOT NULL,
	CONSTRAINT "technical_assets_tenant_id_id" UNIQUE("tenant_id","id"),
	CONSTRAINT "technical_assets_catalog_name_uq" UNIQUE("tenant_id","asset_type","namespace","name"),
	CONSTRAINT "technical_assets_revision_positive" CHECK ("revision" >= 1),
	CONSTRAINT "technical_assets_kind" CHECK ("kind" = 'technical_asset'),
	CONSTRAINT "technical_assets_namespace_lower" CHECK ("namespace" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
	CONSTRAINT "technical_assets_name_lower" CHECK ("name" ~ '^[a-z0-9]+([-_.][a-z0-9]+)*$'),
	CONSTRAINT "technical_assets_api_definition" CHECK ("api_definition_url" is null or "asset_type" = 'api'),
	CONSTRAINT "technical_assets_labels_json" CHECK (jsonb_typeof("labels") = 'object'),
	CONSTRAINT "technical_assets_annotations_json" CHECK (jsonb_typeof("annotations") = 'object'),
	CONSTRAINT "technical_assets_extensions_json" CHECK (jsonb_typeof("extensions") = 'object')
);
--> statement-breakpoint
ALTER TABLE "technical_assets" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "audit_events_created_idx" ON "audit_events" ("tenant_id","created_at","id");--> statement-breakpoint
CREATE INDEX "audit_events_updated_idx" ON "audit_events" ("tenant_id","updated_at","id");--> statement-breakpoint
CREATE INDEX "audit_events_resource_idx" ON "audit_events" ("tenant_id","resource_id","occurred_at");--> statement-breakpoint
CREATE INDEX "idempotency_keys_created_idx" ON "idempotency_keys" ("tenant_id","created_at","id");--> statement-breakpoint
CREATE INDEX "idempotency_keys_updated_idx" ON "idempotency_keys" ("tenant_id","updated_at","id");--> statement-breakpoint
CREATE INDEX "idempotency_keys_expiry_idx" ON "idempotency_keys" ("tenant_id","expires_at");--> statement-breakpoint
CREATE INDEX "outbox_events_created_idx" ON "outbox_events" ("tenant_id","created_at","id");--> statement-breakpoint
CREATE INDEX "outbox_events_updated_idx" ON "outbox_events" ("tenant_id","updated_at","id");--> statement-breakpoint
CREATE INDEX "resource_revisions_created_idx" ON "resource_revisions" ("tenant_id","created_at","id");--> statement-breakpoint
CREATE INDEX "resource_revisions_updated_idx" ON "resource_revisions" ("tenant_id","updated_at","id");--> statement-breakpoint
CREATE INDEX "resource_revisions_history_idx" ON "resource_revisions" ("tenant_id","resource_type","resource_id","recorded_at");--> statement-breakpoint
CREATE INDEX "tenant_event_counters_created_idx" ON "tenant_event_counters" ("tenant_id","created_at","id");--> statement-breakpoint
CREATE INDEX "tenant_event_counters_updated_idx" ON "tenant_event_counters" ("tenant_id","updated_at","id");--> statement-breakpoint
CREATE INDEX "webhook_deliveries_created_idx" ON "webhook_deliveries" ("tenant_id","created_at","id");--> statement-breakpoint
CREATE INDEX "webhook_deliveries_updated_idx" ON "webhook_deliveries" ("tenant_id","updated_at","id");--> statement-breakpoint
CREATE INDEX "webhook_deliveries_event_idx" ON "webhook_deliveries" ("tenant_id","event_id");--> statement-breakpoint
CREATE INDEX "webhook_deliveries_ready_idx" ON "webhook_deliveries" ("tenant_id","status","next_attempt_at");--> statement-breakpoint
CREATE INDEX "webhook_subscriptions_created_idx" ON "webhook_subscriptions" ("tenant_id","created_at","id");--> statement-breakpoint
CREATE INDEX "webhook_subscriptions_updated_idx" ON "webhook_subscriptions" ("tenant_id","updated_at","id");--> statement-breakpoint
CREATE UNIQUE INDEX "account_provider_accountId_uidx" ON "account" ("provider_id","account_id");--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" ("user_id");--> statement-breakpoint
CREATE INDEX "invitation_org_idx" ON "invitation" ("organization_id");--> statement-breakpoint
CREATE INDEX "invitation_email_idx" ON "invitation" ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "member_organization_user_uidx" ON "member" ("organization_id","user_id");--> statement-breakpoint
CREATE INDEX "member_user_idx" ON "member" ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" ("identifier");--> statement-breakpoint
CREATE INDEX "accounts_created_idx" ON "accounts" ("tenant_id","created_at","id");--> statement-breakpoint
CREATE INDEX "accounts_updated_idx" ON "accounts" ("tenant_id","updated_at","id");--> statement-breakpoint
CREATE INDEX "accounts_principal_idx" ON "accounts" ("tenant_id","principal_id","principal_kind");--> statement-breakpoint
CREATE INDEX "applications_created_idx" ON "applications" ("tenant_id","created_at","id");--> statement-breakpoint
CREATE INDEX "applications_updated_idx" ON "applications" ("tenant_id","updated_at","id");--> statement-breakpoint
CREATE INDEX "applications_product_idx" ON "applications" ("tenant_id","product_id");--> statement-breakpoint
CREATE INDEX "applications_status_idx" ON "applications" ("tenant_id","management_status","lifecycle");--> statement-breakpoint
CREATE INDEX "entity_registry_created_idx" ON "entity_registry" ("tenant_id","created_at","id");--> statement-breakpoint
CREATE INDEX "entity_registry_updated_idx" ON "entity_registry" ("tenant_id","updated_at","id");--> statement-breakpoint
CREATE INDEX "entity_registry_kind_idx" ON "entity_registry" ("tenant_id","kind","id");--> statement-breakpoint
CREATE INDEX "groups_created_idx" ON "groups" ("tenant_id","created_at","id");--> statement-breakpoint
CREATE INDEX "groups_updated_idx" ON "groups" ("tenant_id","updated_at","id");--> statement-breakpoint
CREATE INDEX "instances_created_idx" ON "instances" ("tenant_id","created_at","id");--> statement-breakpoint
CREATE INDEX "instances_updated_idx" ON "instances" ("tenant_id","updated_at","id");--> statement-breakpoint
CREATE INDEX "instances_product_idx" ON "instances" ("tenant_id","product_id");--> statement-breakpoint
CREATE INDEX "instances_application_product_idx" ON "instances" ("tenant_id","application_id","product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "instances_provider_identity_uq" ON "instances" ("tenant_id","product_id","provider_tenant_key") WHERE "product_id" is not null and "provider_tenant_key" is not null;--> statement-breakpoint
CREATE INDEX "memberships_created_idx" ON "memberships" ("tenant_id","created_at","id");--> statement-breakpoint
CREATE INDEX "memberships_updated_idx" ON "memberships" ("tenant_id","updated_at","id");--> statement-breakpoint
CREATE INDEX "memberships_group_idx" ON "memberships" ("tenant_id","group_id");--> statement-breakpoint
CREATE INDEX "memberships_member_idx" ON "memberships" ("tenant_id","member_id","member_kind");--> statement-breakpoint
CREATE INDEX "ownerships_created_idx" ON "ownerships" ("tenant_id","created_at","id");--> statement-breakpoint
CREATE INDEX "ownerships_updated_idx" ON "ownerships" ("tenant_id","updated_at","id");--> statement-breakpoint
CREATE INDEX "ownerships_entity_idx" ON "ownerships" ("tenant_id","entity_id");--> statement-breakpoint
CREATE INDEX "ownerships_owner_idx" ON "ownerships" ("tenant_id","owner_id","owner_kind");--> statement-breakpoint
CREATE INDEX "ownerships_owner_role_idx" ON "ownerships" ("tenant_id","owner_id","role");--> statement-breakpoint
CREATE INDEX "people_created_idx" ON "people" ("tenant_id","created_at","id");--> statement-breakpoint
CREATE INDEX "people_updated_idx" ON "people" ("tenant_id","updated_at","id");--> statement-breakpoint
CREATE INDEX "people_manager_idx" ON "people" ("tenant_id","manager_person_id");--> statement-breakpoint
CREATE INDEX "people_email_lookup_idx" ON "people" ("tenant_id","primary_email");--> statement-breakpoint
CREATE INDEX "products_created_idx" ON "products" ("tenant_id","created_at","id");--> statement-breakpoint
CREATE INDEX "products_updated_idx" ON "products" ("tenant_id","updated_at","id");--> statement-breakpoint
CREATE INDEX "products_parent_idx" ON "products" ("tenant_id","parent_product_id");--> statement-breakpoint
CREATE INDEX "service_principals_created_idx" ON "service_principals" ("tenant_id","created_at","id");--> statement-breakpoint
CREATE INDEX "service_principals_updated_idx" ON "service_principals" ("tenant_id","updated_at","id");--> statement-breakpoint
CREATE INDEX "vendors_created_idx" ON "vendors" ("tenant_id","created_at","id");--> statement-breakpoint
CREATE INDEX "vendors_updated_idx" ON "vendors" ("tenant_id","updated_at","id");--> statement-breakpoint
CREATE INDEX "contracts_created_idx" ON "contracts" ("tenant_id","created_at","id");--> statement-breakpoint
CREATE INDEX "contracts_updated_idx" ON "contracts" ("tenant_id","updated_at","id");--> statement-breakpoint
CREATE INDEX "contracts_supplier_idx" ON "contracts" ("tenant_id","supplier_vendor_id");--> statement-breakpoint
CREATE INDEX "contracts_buyer_idx" ON "contracts" ("tenant_id","buying_entity_group_id","buyer_group_type");--> statement-breakpoint
CREATE INDEX "contracts_parent_idx" ON "contracts" ("tenant_id","parent_contract_id");--> statement-breakpoint
CREATE INDEX "contracts_supersedes_idx" ON "contracts" ("tenant_id","supersedes_contract_id");--> statement-breakpoint
CREATE INDEX "contracts_renews_idx" ON "contracts" ("tenant_id","renews_contract_id");--> statement-breakpoint
CREATE INDEX "contracts_renewal_idx" ON "contracts" ("tenant_id","renewal_date");--> statement-breakpoint
CREATE INDEX "contracts_notice_idx" ON "contracts" ("tenant_id","notice_deadline");--> statement-breakpoint
CREATE INDEX "entitlement_instances_created_idx" ON "entitlement_instances" ("tenant_id","created_at","id");--> statement-breakpoint
CREATE INDEX "entitlement_instances_updated_idx" ON "entitlement_instances" ("tenant_id","updated_at","id");--> statement-breakpoint
CREATE INDEX "entitlement_instances_instance_idx" ON "entitlement_instances" ("tenant_id","instance_id");--> statement-breakpoint
CREATE INDEX "entitlements_created_idx" ON "entitlements" ("tenant_id","created_at","id");--> statement-breakpoint
CREATE INDEX "entitlements_updated_idx" ON "entitlements" ("tenant_id","updated_at","id");--> statement-breakpoint
CREATE INDEX "entitlements_subscription_idx" ON "entitlements" ("tenant_id","subscription_id");--> statement-breakpoint
CREATE INDEX "license_assignments_created_idx" ON "license_assignments" ("tenant_id","created_at","id");--> statement-breakpoint
CREATE INDEX "license_assignments_updated_idx" ON "license_assignments" ("tenant_id","updated_at","id");--> statement-breakpoint
CREATE INDEX "license_assignments_account_idx" ON "license_assignments" ("tenant_id","account_id");--> statement-breakpoint
CREATE INDEX "license_assignments_entitlement_idx" ON "license_assignments" ("tenant_id","entitlement_id");--> statement-breakpoint
CREATE INDEX "metric_definitions_created_idx" ON "metric_definitions" ("tenant_id","created_at","id");--> statement-breakpoint
CREATE INDEX "metric_definitions_updated_idx" ON "metric_definitions" ("tenant_id","updated_at","id");--> statement-breakpoint
CREATE INDEX "spend_allocations_created_idx" ON "spend_allocations" ("tenant_id","created_at","id");--> statement-breakpoint
CREATE INDEX "spend_allocations_updated_idx" ON "spend_allocations" ("tenant_id","updated_at","id");--> statement-breakpoint
CREATE INDEX "spend_allocations_spend_record_idx" ON "spend_allocations" ("tenant_id","spend_record_id","currency");--> statement-breakpoint
CREATE INDEX "spend_allocations_application_idx" ON "spend_allocations" ("tenant_id","application_id");--> statement-breakpoint
CREATE INDEX "spend_allocations_cost_center_idx" ON "spend_allocations" ("tenant_id","cost_center_group_id","cost_center_type");--> statement-breakpoint
CREATE INDEX "spend_records_created_idx" ON "spend_records" ("tenant_id","created_at","id");--> statement-breakpoint
CREATE INDEX "spend_records_updated_idx" ON "spend_records" ("tenant_id","updated_at","id");--> statement-breakpoint
CREATE INDEX "spend_records_supplier_idx" ON "spend_records" ("tenant_id","supplier_vendor_id");--> statement-breakpoint
CREATE INDEX "spend_records_subscription_idx" ON "spend_records" ("tenant_id","subscription_id");--> statement-breakpoint
CREATE INDEX "spend_records_canonical_record_idx" ON "spend_records" ("tenant_id","canonical_record_id","basis","currency");--> statement-breakpoint
CREATE INDEX "spend_records_report_idx" ON "spend_records" ("tenant_id","basis","currency","accounting_date","reconciliation_status");--> statement-breakpoint
CREATE UNIQUE INDEX "spend_records_canonical_event_uq" ON "spend_records" ("tenant_id","basis","currency","economic_event_key") WHERE "reconciliation_status" = 'canonical' and "economic_event_key" is not null;--> statement-breakpoint
CREATE INDEX "subscription_applications_created_idx" ON "subscription_applications" ("tenant_id","created_at","id");--> statement-breakpoint
CREATE INDEX "subscription_applications_updated_idx" ON "subscription_applications" ("tenant_id","updated_at","id");--> statement-breakpoint
CREATE INDEX "subscription_applications_application_idx" ON "subscription_applications" ("tenant_id","application_id");--> statement-breakpoint
CREATE INDEX "subscriptions_created_idx" ON "subscriptions" ("tenant_id","created_at","id");--> statement-breakpoint
CREATE INDEX "subscriptions_updated_idx" ON "subscriptions" ("tenant_id","updated_at","id");--> statement-breakpoint
CREATE INDEX "subscriptions_contract_idx" ON "subscriptions" ("tenant_id","contract_id");--> statement-breakpoint
CREATE INDEX "subscriptions_supersedes_idx" ON "subscriptions" ("tenant_id","supersedes_subscription_id");--> statement-breakpoint
CREATE INDEX "subscriptions_renews_idx" ON "subscriptions" ("tenant_id","renews_subscription_id");--> statement-breakpoint
CREATE INDEX "usage_records_created_idx" ON "usage_records" ("tenant_id","created_at","id");--> statement-breakpoint
CREATE INDEX "usage_records_updated_idx" ON "usage_records" ("tenant_id","updated_at","id");--> statement-breakpoint
CREATE INDEX "usage_records_account_idx" ON "usage_records" ("tenant_id","account_id","instance_id");--> statement-breakpoint
CREATE INDEX "usage_records_metric_idx" ON "usage_records" ("tenant_id","metric_definition_id");--> statement-breakpoint
CREATE INDEX "usage_records_canonical_record_idx" ON "usage_records" ("tenant_id","canonical_record_id");--> statement-breakpoint
CREATE INDEX "usage_records_measurement_idx" ON "usage_records" ("tenant_id","instance_id","metric_definition_id","window_start");--> statement-breakpoint
CREATE INDEX "account_observations_created_idx" ON "account_observations" ("tenant_id","created_at","id");--> statement-breakpoint
CREATE INDEX "account_observations_updated_idx" ON "account_observations" ("tenant_id","updated_at","id");--> statement-breakpoint
CREATE INDEX "account_observations_observation_idx" ON "account_observations" ("tenant_id","observation_id");--> statement-breakpoint
CREATE INDEX "assignment_observations_created_idx" ON "assignment_observations" ("tenant_id","created_at","id");--> statement-breakpoint
CREATE INDEX "assignment_observations_updated_idx" ON "assignment_observations" ("tenant_id","updated_at","id");--> statement-breakpoint
CREATE INDEX "assignment_observations_observation_idx" ON "assignment_observations" ("tenant_id","observation_id");--> statement-breakpoint
CREATE INDEX "field_overrides_created_idx" ON "field_overrides" ("tenant_id","created_at","id");--> statement-breakpoint
CREATE INDEX "field_overrides_updated_idx" ON "field_overrides" ("tenant_id","updated_at","id");--> statement-breakpoint
CREATE INDEX "field_overrides_entity_idx" ON "field_overrides" ("tenant_id","entity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "field_overrides_active_field_uq" ON "field_overrides" ("tenant_id","entity_id","field_path") WHERE "status" = 'active';--> statement-breakpoint
CREATE INDEX "field_provenance_created_idx" ON "field_provenance" ("tenant_id","created_at","id");--> statement-breakpoint
CREATE INDEX "field_provenance_updated_idx" ON "field_provenance" ("tenant_id","updated_at","id");--> statement-breakpoint
CREATE INDEX "field_provenance_connection_idx" ON "field_provenance" ("tenant_id","connection_id");--> statement-breakpoint
CREATE INDEX "field_provenance_winning_observation_idx" ON "field_provenance" ("tenant_id","winning_observation_id","connection_id");--> statement-breakpoint
CREATE INDEX "field_provenance_override_idx" ON "field_provenance" ("tenant_id","override_id","entity_id","field_path");--> statement-breakpoint
CREATE INDEX "ingestion_batches_created_idx" ON "ingestion_batches" ("tenant_id","created_at","id");--> statement-breakpoint
CREATE INDEX "ingestion_batches_updated_idx" ON "ingestion_batches" ("tenant_id","updated_at","id");--> statement-breakpoint
CREATE INDEX "ingestion_batches_connection_idx" ON "ingestion_batches" ("tenant_id","connection_id");--> statement-breakpoint
CREATE INDEX "ingestion_items_created_idx" ON "ingestion_items" ("tenant_id","created_at","id");--> statement-breakpoint
CREATE INDEX "ingestion_items_updated_idx" ON "ingestion_items" ("tenant_id","updated_at","id");--> statement-breakpoint
CREATE INDEX "ingestion_items_observation_idx" ON "ingestion_items" ("tenant_id","observation_id");--> statement-breakpoint
CREATE INDEX "observation_resolutions_created_idx" ON "observation_resolutions" ("tenant_id","created_at","id");--> statement-breakpoint
CREATE INDEX "observation_resolutions_updated_idx" ON "observation_resolutions" ("tenant_id","updated_at","id");--> statement-breakpoint
CREATE INDEX "observation_resolutions_canonical_entity_idx" ON "observation_resolutions" ("tenant_id","canonical_entity_id");--> statement-breakpoint
CREATE INDEX "observations_created_idx" ON "observations" ("tenant_id","created_at","id");--> statement-breakpoint
CREATE INDEX "observations_updated_idx" ON "observations" ("tenant_id","updated_at","id");--> statement-breakpoint
CREATE INDEX "provenance_conflicts_created_idx" ON "provenance_conflicts" ("tenant_id","created_at","id");--> statement-breakpoint
CREATE INDEX "provenance_conflicts_updated_idx" ON "provenance_conflicts" ("tenant_id","updated_at","id");--> statement-breakpoint
CREATE INDEX "provenance_conflicts_observation_idx" ON "provenance_conflicts" ("tenant_id","observation_id");--> statement-breakpoint
CREATE INDEX "spend_observations_created_idx" ON "spend_observations" ("tenant_id","created_at","id");--> statement-breakpoint
CREATE INDEX "spend_observations_updated_idx" ON "spend_observations" ("tenant_id","updated_at","id");--> statement-breakpoint
CREATE INDEX "spend_observations_observation_idx" ON "spend_observations" ("tenant_id","observation_id");--> statement-breakpoint
CREATE INDEX "sync_runs_created_idx" ON "sync_runs" ("tenant_id","created_at","id");--> statement-breakpoint
CREATE INDEX "sync_runs_updated_idx" ON "sync_runs" ("tenant_id","updated_at","id");--> statement-breakpoint
CREATE INDEX "sync_runs_connection_idx" ON "sync_runs" ("tenant_id","connection_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sync_runs_active_connection_uq" ON "sync_runs" ("tenant_id","connection_id") WHERE "status" in ('queued','running');--> statement-breakpoint
CREATE INDEX "usage_observations_created_idx" ON "usage_observations" ("tenant_id","created_at","id");--> statement-breakpoint
CREATE INDEX "usage_observations_updated_idx" ON "usage_observations" ("tenant_id","updated_at","id");--> statement-breakpoint
CREATE INDEX "usage_observations_observation_idx" ON "usage_observations" ("tenant_id","observation_id");--> statement-breakpoint
CREATE INDEX "connections_created_idx" ON "connections" ("tenant_id","created_at","id");--> statement-breakpoint
CREATE INDEX "connections_updated_idx" ON "connections" ("tenant_id","updated_at","id");--> statement-breakpoint
CREATE INDEX "external_object_links_created_idx" ON "external_object_links" ("tenant_id","created_at","id");--> statement-breakpoint
CREATE INDEX "external_object_links_updated_idx" ON "external_object_links" ("tenant_id","updated_at","id");--> statement-breakpoint
CREATE INDEX "external_object_links_canonical_entity_idx" ON "external_object_links" ("tenant_id","canonical_entity_id","canonical_entity_kind");--> statement-breakpoint
CREATE INDEX "relationships_created_idx" ON "relationships" ("tenant_id","created_at","id");--> statement-breakpoint
CREATE INDEX "relationships_updated_idx" ON "relationships" ("tenant_id","updated_at","id");--> statement-breakpoint
CREATE INDEX "relationships_incoming_idx" ON "relationships" ("tenant_id","target_entity_id","relation_type");--> statement-breakpoint
CREATE INDEX "relationships_outgoing_idx" ON "relationships" ("tenant_id","source_entity_id","relation_type");--> statement-breakpoint
CREATE INDEX "technical_assets_created_idx" ON "technical_assets" ("tenant_id","created_at","id");--> statement-breakpoint
CREATE INDEX "technical_assets_updated_idx" ON "technical_assets" ("tenant_id","updated_at","id");--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_tenant_id_tenants_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "idempotency_keys" ADD CONSTRAINT "idempotency_keys_tenant_id_tenants_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "outbox_events" ADD CONSTRAINT "outbox_events_tenant_id_tenants_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "outbox_events" ADD CONSTRAINT "outbox_events_entity_fk" FOREIGN KEY ("tenant_id","entity_id") REFERENCES "entity_registry"("tenant_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "resource_revisions" ADD CONSTRAINT "resource_revisions_tenant_id_tenants_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "tenant_event_counters" ADD CONSTRAINT "tenant_event_counters_tenant_id_tenants_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_tenant_id_tenants_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_subscription_fk" FOREIGN KEY ("tenant_id","subscription_id") REFERENCES "webhook_subscriptions"("tenant_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_event_fk" FOREIGN KEY ("tenant_id","event_id") REFERENCES "outbox_events"("tenant_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "webhook_subscriptions" ADD CONSTRAINT "webhook_subscriptions_tenant_id_tenants_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_inviter_id_user_id_fkey" FOREIGN KEY ("inviter_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_tenant_id_tenants_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_registry_fk" FOREIGN KEY ("tenant_id","id","kind") REFERENCES "entity_registry"("tenant_id","id","kind") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_instance_fk" FOREIGN KEY ("tenant_id","instance_id") REFERENCES "instances"("tenant_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_principal_fk" FOREIGN KEY ("tenant_id","principal_id","principal_kind") REFERENCES "entity_registry"("tenant_id","id","kind") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_tenant_id_tenants_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_registry_fk" FOREIGN KEY ("tenant_id","id","kind") REFERENCES "entity_registry"("tenant_id","id","kind") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_product_fk" FOREIGN KEY ("tenant_id","product_id") REFERENCES "products"("tenant_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "entity_registry" ADD CONSTRAINT "entity_registry_tenant_id_tenants_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_tenant_id_tenants_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_registry_fk" FOREIGN KEY ("tenant_id","id","kind") REFERENCES "entity_registry"("tenant_id","id","kind") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "instances" ADD CONSTRAINT "instances_tenant_id_tenants_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "instances" ADD CONSTRAINT "instances_registry_fk" FOREIGN KEY ("tenant_id","id","kind") REFERENCES "entity_registry"("tenant_id","id","kind") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "instances" ADD CONSTRAINT "instances_application_fk" FOREIGN KEY ("tenant_id","application_id") REFERENCES "applications"("tenant_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "instances" ADD CONSTRAINT "instances_product_fk" FOREIGN KEY ("tenant_id","product_id") REFERENCES "products"("tenant_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "instances" ADD CONSTRAINT "instances_application_product_fk" FOREIGN KEY ("tenant_id","application_id","product_id") REFERENCES "applications"("tenant_id","id","product_id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_tenant_id_tenants_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_group_fk" FOREIGN KEY ("tenant_id","group_id") REFERENCES "groups"("tenant_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_member_fk" FOREIGN KEY ("tenant_id","member_id","member_kind") REFERENCES "entity_registry"("tenant_id","id","kind") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "ownerships" ADD CONSTRAINT "ownerships_tenant_id_tenants_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "ownerships" ADD CONSTRAINT "ownerships_entity_fk" FOREIGN KEY ("tenant_id","entity_id") REFERENCES "entity_registry"("tenant_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "ownerships" ADD CONSTRAINT "ownerships_owner_fk" FOREIGN KEY ("tenant_id","owner_id","owner_kind") REFERENCES "entity_registry"("tenant_id","id","kind") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "people" ADD CONSTRAINT "people_tenant_id_tenants_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "people" ADD CONSTRAINT "people_registry_fk" FOREIGN KEY ("tenant_id","id","kind") REFERENCES "entity_registry"("tenant_id","id","kind") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "people" ADD CONSTRAINT "people_manager_fk" FOREIGN KEY ("tenant_id","manager_person_id") REFERENCES "people"("tenant_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_tenant_id_tenants_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_registry_fk" FOREIGN KEY ("tenant_id","id","kind") REFERENCES "entity_registry"("tenant_id","id","kind") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_vendor_fk" FOREIGN KEY ("tenant_id","vendor_id") REFERENCES "vendors"("tenant_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_parent_fk" FOREIGN KEY ("tenant_id","parent_product_id") REFERENCES "products"("tenant_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "service_principals" ADD CONSTRAINT "service_principals_tenant_id_tenants_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "service_principals" ADD CONSTRAINT "service_principals_registry_fk" FOREIGN KEY ("tenant_id","id","kind") REFERENCES "entity_registry"("tenant_id","id","kind") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_tenant_id_tenants_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_registry_fk" FOREIGN KEY ("tenant_id","id","kind") REFERENCES "entity_registry"("tenant_id","id","kind") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_tenant_id_tenants_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_registry_fk" FOREIGN KEY ("tenant_id","id","kind") REFERENCES "entity_registry"("tenant_id","id","kind") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_supplier_fk" FOREIGN KEY ("tenant_id","supplier_vendor_id") REFERENCES "vendors"("tenant_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_buyer_fk" FOREIGN KEY ("tenant_id","buying_entity_group_id","buyer_group_type") REFERENCES "groups"("tenant_id","id","group_type") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_parent_fk" FOREIGN KEY ("tenant_id","parent_contract_id") REFERENCES "contracts"("tenant_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_supersedes_fk" FOREIGN KEY ("tenant_id","supersedes_contract_id") REFERENCES "contracts"("tenant_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_renews_fk" FOREIGN KEY ("tenant_id","renews_contract_id") REFERENCES "contracts"("tenant_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "entitlement_instances" ADD CONSTRAINT "entitlement_instances_tenant_id_tenants_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "entitlement_instances" ADD CONSTRAINT "entitlement_instances_entitlement_fk" FOREIGN KEY ("tenant_id","entitlement_id") REFERENCES "entitlements"("tenant_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "entitlement_instances" ADD CONSTRAINT "entitlement_instances_instance_fk" FOREIGN KEY ("tenant_id","instance_id") REFERENCES "instances"("tenant_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_tenant_id_tenants_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_registry_fk" FOREIGN KEY ("tenant_id","id","kind") REFERENCES "entity_registry"("tenant_id","id","kind") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_subscription_fk" FOREIGN KEY ("tenant_id","subscription_id") REFERENCES "subscriptions"("tenant_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "license_assignments" ADD CONSTRAINT "license_assignments_tenant_id_tenants_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "license_assignments" ADD CONSTRAINT "license_assignments_account_fk" FOREIGN KEY ("tenant_id","account_id") REFERENCES "accounts"("tenant_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "license_assignments" ADD CONSTRAINT "license_assignments_entitlement_fk" FOREIGN KEY ("tenant_id","entitlement_id") REFERENCES "entitlements"("tenant_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "metric_definitions" ADD CONSTRAINT "metric_definitions_tenant_id_tenants_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "spend_allocations" ADD CONSTRAINT "spend_allocations_tenant_id_tenants_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "spend_allocations" ADD CONSTRAINT "spend_allocations_spend_record_fk" FOREIGN KEY ("tenant_id","spend_record_id","currency") REFERENCES "spend_records"("tenant_id","id","currency") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "spend_allocations" ADD CONSTRAINT "spend_allocations_application_fk" FOREIGN KEY ("tenant_id","application_id") REFERENCES "applications"("tenant_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "spend_allocations" ADD CONSTRAINT "spend_allocations_cost_center_fk" FOREIGN KEY ("tenant_id","cost_center_group_id","cost_center_type") REFERENCES "groups"("tenant_id","id","group_type") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "spend_records" ADD CONSTRAINT "spend_records_tenant_id_tenants_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "spend_records" ADD CONSTRAINT "spend_records_supplier_fk" FOREIGN KEY ("tenant_id","supplier_vendor_id") REFERENCES "vendors"("tenant_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "spend_records" ADD CONSTRAINT "spend_records_subscription_fk" FOREIGN KEY ("tenant_id","subscription_id") REFERENCES "subscriptions"("tenant_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "spend_records" ADD CONSTRAINT "spend_records_connection_fk" FOREIGN KEY ("tenant_id","connection_id") REFERENCES "connections"("tenant_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "spend_records" ADD CONSTRAINT "spend_records_canonical_record_fk" FOREIGN KEY ("tenant_id","canonical_record_id","basis","currency") REFERENCES "spend_records"("tenant_id","id","basis","currency") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "subscription_applications" ADD CONSTRAINT "subscription_applications_tenant_id_tenants_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "subscription_applications" ADD CONSTRAINT "subscription_applications_subscription_fk" FOREIGN KEY ("tenant_id","subscription_id") REFERENCES "subscriptions"("tenant_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "subscription_applications" ADD CONSTRAINT "subscription_applications_application_fk" FOREIGN KEY ("tenant_id","application_id") REFERENCES "applications"("tenant_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_tenant_id_tenants_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_registry_fk" FOREIGN KEY ("tenant_id","id","kind") REFERENCES "entity_registry"("tenant_id","id","kind") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_contract_fk" FOREIGN KEY ("tenant_id","contract_id") REFERENCES "contracts"("tenant_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_supersedes_fk" FOREIGN KEY ("tenant_id","supersedes_subscription_id") REFERENCES "subscriptions"("tenant_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_renews_fk" FOREIGN KEY ("tenant_id","renews_subscription_id") REFERENCES "subscriptions"("tenant_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "usage_records" ADD CONSTRAINT "usage_records_tenant_id_tenants_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "usage_records" ADD CONSTRAINT "usage_records_instance_fk" FOREIGN KEY ("tenant_id","instance_id") REFERENCES "instances"("tenant_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "usage_records" ADD CONSTRAINT "usage_records_account_fk" FOREIGN KEY ("tenant_id","account_id","instance_id") REFERENCES "accounts"("tenant_id","id","instance_id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "usage_records" ADD CONSTRAINT "usage_records_metric_fk" FOREIGN KEY ("tenant_id","metric_definition_id") REFERENCES "metric_definitions"("tenant_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "usage_records" ADD CONSTRAINT "usage_records_canonical_record_fk" FOREIGN KEY ("tenant_id","canonical_record_id") REFERENCES "usage_records"("tenant_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "account_observations" ADD CONSTRAINT "account_observations_tenant_id_tenants_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "account_observations" ADD CONSTRAINT "account_observations_record_fk" FOREIGN KEY ("tenant_id","account_id") REFERENCES "accounts"("tenant_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "account_observations" ADD CONSTRAINT "account_observations_observation_fk" FOREIGN KEY ("tenant_id","observation_id") REFERENCES "observations"("tenant_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "assignment_observations" ADD CONSTRAINT "assignment_observations_tenant_id_tenants_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "assignment_observations" ADD CONSTRAINT "assignment_observations_record_fk" FOREIGN KEY ("tenant_id","assignment_id") REFERENCES "license_assignments"("tenant_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "assignment_observations" ADD CONSTRAINT "assignment_observations_observation_fk" FOREIGN KEY ("tenant_id","observation_id") REFERENCES "observations"("tenant_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "field_overrides" ADD CONSTRAINT "field_overrides_tenant_id_tenants_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "field_overrides" ADD CONSTRAINT "field_overrides_entity_fk" FOREIGN KEY ("tenant_id","entity_id") REFERENCES "entity_registry"("tenant_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "field_provenance" ADD CONSTRAINT "field_provenance_tenant_id_tenants_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "field_provenance" ADD CONSTRAINT "field_provenance_entity_fk" FOREIGN KEY ("tenant_id","entity_id") REFERENCES "entity_registry"("tenant_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "field_provenance" ADD CONSTRAINT "field_provenance_connection_fk" FOREIGN KEY ("tenant_id","connection_id") REFERENCES "connections"("tenant_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "field_provenance" ADD CONSTRAINT "field_provenance_winning_observation_fk" FOREIGN KEY ("tenant_id","winning_observation_id","connection_id") REFERENCES "observations"("tenant_id","id","connection_id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "field_provenance" ADD CONSTRAINT "field_provenance_override_fk" FOREIGN KEY ("tenant_id","override_id","entity_id","field_path") REFERENCES "field_overrides"("tenant_id","id","entity_id","field_path") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "ingestion_batches" ADD CONSTRAINT "ingestion_batches_tenant_id_tenants_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "ingestion_batches" ADD CONSTRAINT "ingestion_batches_connection_fk" FOREIGN KEY ("tenant_id","connection_id") REFERENCES "connections"("tenant_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "ingestion_items" ADD CONSTRAINT "ingestion_items_tenant_id_tenants_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "ingestion_items" ADD CONSTRAINT "ingestion_items_batch_fk" FOREIGN KEY ("tenant_id","batch_id") REFERENCES "ingestion_batches"("tenant_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "ingestion_items" ADD CONSTRAINT "ingestion_items_observation_fk" FOREIGN KEY ("tenant_id","observation_id") REFERENCES "observations"("tenant_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "observation_resolutions" ADD CONSTRAINT "observation_resolutions_tenant_id_tenants_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "observation_resolutions" ADD CONSTRAINT "observation_resolutions_observation_fk" FOREIGN KEY ("tenant_id","observation_id") REFERENCES "observations"("tenant_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "observation_resolutions" ADD CONSTRAINT "observation_resolutions_canonical_entity_fk" FOREIGN KEY ("tenant_id","canonical_entity_id") REFERENCES "entity_registry"("tenant_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "observations" ADD CONSTRAINT "observations_tenant_id_tenants_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "observations" ADD CONSTRAINT "observations_connection_fk" FOREIGN KEY ("tenant_id","connection_id") REFERENCES "connections"("tenant_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "provenance_conflicts" ADD CONSTRAINT "provenance_conflicts_tenant_id_tenants_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "provenance_conflicts" ADD CONSTRAINT "provenance_conflicts_field_fk" FOREIGN KEY ("tenant_id","field_provenance_id") REFERENCES "field_provenance"("tenant_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "provenance_conflicts" ADD CONSTRAINT "provenance_conflicts_observation_fk" FOREIGN KEY ("tenant_id","observation_id") REFERENCES "observations"("tenant_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "spend_observations" ADD CONSTRAINT "spend_observations_tenant_id_tenants_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "spend_observations" ADD CONSTRAINT "spend_observations_record_fk" FOREIGN KEY ("tenant_id","spend_record_id") REFERENCES "spend_records"("tenant_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "spend_observations" ADD CONSTRAINT "spend_observations_observation_fk" FOREIGN KEY ("tenant_id","observation_id") REFERENCES "observations"("tenant_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "sync_runs" ADD CONSTRAINT "sync_runs_tenant_id_tenants_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "sync_runs" ADD CONSTRAINT "sync_runs_connection_fk" FOREIGN KEY ("tenant_id","connection_id") REFERENCES "connections"("tenant_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "usage_observations" ADD CONSTRAINT "usage_observations_tenant_id_tenants_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "usage_observations" ADD CONSTRAINT "usage_observations_record_fk" FOREIGN KEY ("tenant_id","usage_record_id") REFERENCES "usage_records"("tenant_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "usage_observations" ADD CONSTRAINT "usage_observations_observation_fk" FOREIGN KEY ("tenant_id","observation_id") REFERENCES "observations"("tenant_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "connections" ADD CONSTRAINT "connections_tenant_id_tenants_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "external_object_links" ADD CONSTRAINT "external_object_links_tenant_id_tenants_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "external_object_links" ADD CONSTRAINT "external_object_links_connection_fk" FOREIGN KEY ("tenant_id","connection_id") REFERENCES "connections"("tenant_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "external_object_links" ADD CONSTRAINT "external_object_links_canonical_entity_fk" FOREIGN KEY ("tenant_id","canonical_entity_id","canonical_entity_kind") REFERENCES "entity_registry"("tenant_id","id","kind") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "organization_tenant" ADD CONSTRAINT "organization_tenant_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "organization_tenant" ADD CONSTRAINT "organization_tenant_tenant_id_tenants_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "relationships" ADD CONSTRAINT "relationships_tenant_id_tenants_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "relationships" ADD CONSTRAINT "relationships_source_fk" FOREIGN KEY ("tenant_id","source_entity_id") REFERENCES "entity_registry"("tenant_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "relationships" ADD CONSTRAINT "relationships_target_fk" FOREIGN KEY ("tenant_id","target_entity_id") REFERENCES "entity_registry"("tenant_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "technical_assets" ADD CONSTRAINT "technical_assets_tenant_id_tenants_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "technical_assets" ADD CONSTRAINT "technical_assets_registry_fk" FOREIGN KEY ("tenant_id","id","kind") REFERENCES "entity_registry"("tenant_id","id","kind") ON DELETE RESTRICT;--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "audit_events" AS PERMISSIVE FOR ALL TO public USING ("audit_events"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK ("audit_events"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "idempotency_keys" AS PERMISSIVE FOR ALL TO public USING ("idempotency_keys"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK ("idempotency_keys"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "outbox_events" AS PERMISSIVE FOR ALL TO public USING ("outbox_events"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK ("outbox_events"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "resource_revisions" AS PERMISSIVE FOR ALL TO public USING ("resource_revisions"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK ("resource_revisions"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "tenant_event_counters" AS PERMISSIVE FOR ALL TO public USING ("tenant_event_counters"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK ("tenant_event_counters"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "webhook_deliveries" AS PERMISSIVE FOR ALL TO public USING ("webhook_deliveries"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK ("webhook_deliveries"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "webhook_subscriptions" AS PERMISSIVE FOR ALL TO public USING ("webhook_subscriptions"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK ("webhook_subscriptions"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "accounts" AS PERMISSIVE FOR ALL TO public USING ("accounts"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK ("accounts"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "applications" AS PERMISSIVE FOR ALL TO public USING ("applications"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK ("applications"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "entity_registry" AS PERMISSIVE FOR ALL TO public USING ("entity_registry"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK ("entity_registry"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "groups" AS PERMISSIVE FOR ALL TO public USING ("groups"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK ("groups"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "instances" AS PERMISSIVE FOR ALL TO public USING ("instances"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK ("instances"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "memberships" AS PERMISSIVE FOR ALL TO public USING ("memberships"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK ("memberships"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "ownerships" AS PERMISSIVE FOR ALL TO public USING ("ownerships"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK ("ownerships"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "people" AS PERMISSIVE FOR ALL TO public USING ("people"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK ("people"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "products" AS PERMISSIVE FOR ALL TO public USING ("products"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK ("products"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "service_principals" AS PERMISSIVE FOR ALL TO public USING ("service_principals"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK ("service_principals"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "vendors" AS PERMISSIVE FOR ALL TO public USING ("vendors"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK ("vendors"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "contracts" AS PERMISSIVE FOR ALL TO public USING ("contracts"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK ("contracts"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "entitlement_instances" AS PERMISSIVE FOR ALL TO public USING ("entitlement_instances"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK ("entitlement_instances"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "entitlements" AS PERMISSIVE FOR ALL TO public USING ("entitlements"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK ("entitlements"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "license_assignments" AS PERMISSIVE FOR ALL TO public USING ("license_assignments"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK ("license_assignments"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "metric_definitions" AS PERMISSIVE FOR ALL TO public USING ("metric_definitions"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK ("metric_definitions"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "spend_allocations" AS PERMISSIVE FOR ALL TO public USING ("spend_allocations"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK ("spend_allocations"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "spend_records" AS PERMISSIVE FOR ALL TO public USING ("spend_records"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK ("spend_records"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "subscription_applications" AS PERMISSIVE FOR ALL TO public USING ("subscription_applications"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK ("subscription_applications"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "subscriptions" AS PERMISSIVE FOR ALL TO public USING ("subscriptions"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK ("subscriptions"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "usage_records" AS PERMISSIVE FOR ALL TO public USING ("usage_records"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK ("usage_records"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "account_observations" AS PERMISSIVE FOR ALL TO public USING ("account_observations"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK ("account_observations"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "assignment_observations" AS PERMISSIVE FOR ALL TO public USING ("assignment_observations"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK ("assignment_observations"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "field_overrides" AS PERMISSIVE FOR ALL TO public USING ("field_overrides"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK ("field_overrides"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "field_provenance" AS PERMISSIVE FOR ALL TO public USING ("field_provenance"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK ("field_provenance"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "ingestion_batches" AS PERMISSIVE FOR ALL TO public USING ("ingestion_batches"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK ("ingestion_batches"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "ingestion_items" AS PERMISSIVE FOR ALL TO public USING ("ingestion_items"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK ("ingestion_items"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "observation_resolutions" AS PERMISSIVE FOR ALL TO public USING ("observation_resolutions"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK ("observation_resolutions"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "observations" AS PERMISSIVE FOR ALL TO public USING ("observations"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK ("observations"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "provenance_conflicts" AS PERMISSIVE FOR ALL TO public USING ("provenance_conflicts"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK ("provenance_conflicts"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "spend_observations" AS PERMISSIVE FOR ALL TO public USING ("spend_observations"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK ("spend_observations"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "sync_runs" AS PERMISSIVE FOR ALL TO public USING ("sync_runs"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK ("sync_runs"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "usage_observations" AS PERMISSIVE FOR ALL TO public USING ("usage_observations"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK ("usage_observations"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "connections" AS PERMISSIVE FOR ALL TO public USING ("connections"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK ("connections"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "external_object_links" AS PERMISSIVE FOR ALL TO public USING ("external_object_links"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK ("external_object_links"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "tenants" AS PERMISSIVE FOR ALL TO public USING ("tenants"."id" = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK ("tenants"."id" = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "relationships" AS PERMISSIVE FOR ALL TO public USING ("relationships"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK ("relationships"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "technical_assets" AS PERMISSIVE FOR ALL TO public USING ("technical_assets"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK ("technical_assets"."tenant_id" = nullif(current_setting('app.tenant_id', true), '')::uuid);