CREATE TABLE "workspace_approvals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"requester_id" uuid NOT NULL,
	"policy_type" varchar(30) DEFAULT 'DATE_POLICY' NOT NULL,
	"target_value" varchar(30) NOT NULL,
	"current_value" varchar(30) NOT NULL,
	"status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"reviewer_id" uuid,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "workspaces" ADD COLUMN "date_policy" varchar(20) DEFAULT 'STRICT_TODAY' NOT NULL;--> statement-breakpoint
ALTER TABLE "workspace_approvals" ADD CONSTRAINT "workspace_approvals_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_approvals" ADD CONSTRAINT "workspace_approvals_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_approvals" ADD CONSTRAINT "workspace_approvals_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "workspace_approvals_ws_status_idx" ON "workspace_approvals" USING btree ("workspace_id","status");--> statement-breakpoint
CREATE INDEX "workspace_approvals_req_idx" ON "workspace_approvals" USING btree ("requester_id");